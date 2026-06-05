import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ── Field mapping helpers ────────────────────────────────────────────────────
// Our schema uses `avatarUrl` instead of Auth.js's expected `image` field.
// PrismaAdapter would pass `image` to Prisma.user.create/update and throw.
// We build a minimal hand-rolled adapter that handles the mapping correctly.

async function generateUsername(email: string): Promise<string> {
  const base = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || "user";
  let username = base;
  let n = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${n++}`;
  }
  return username;
}

type RawUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  updatedAt: Date;
  createdAt: Date;
  username: string;
  bio: string | null;
};

function toAdapterUser(u: RawUser) {
  return { id: u.id, name: u.name, email: u.email, emailVerified: null, image: u.avatarUrl };
}

// Minimal adapter — only the methods Auth.js actually calls
const adapter: Adapter = {
  async createUser(data) {
    const username = await generateUsername(data.email ?? "user");
    const u = await prisma.user.create({
      data: {
        name: data.name ?? data.email.split("@")[0],
        email: data.email,
        username,
        avatarUrl: data.image ?? null,
      },
    });
    return toAdapterUser(u as RawUser);
  },
  async getUser(id) {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toAdapterUser(u as RawUser) : null;
  },
  async getUserByEmail(email) {
    const u = await prisma.user.findUnique({ where: { email } });
    return u ? toAdapterUser(u as RawUser) : null;
  },
  async updateUser({ id, image, name, email }) {
    const u = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name ?? undefined }),
        ...(email !== undefined && { email }),
        ...(image !== undefined && { avatarUrl: image }),
      },
    });
    return toAdapterUser(u as RawUser);
  },
  async deleteUser(id) {
    await prisma.user.delete({ where: { id } });
  },
  async linkAccount(account) {
    await prisma.account.create({ data: account });
  },
  async unlinkAccount({ provider, providerAccountId }) {
    await prisma.account.delete({ where: { provider_providerAccountId: { provider, providerAccountId } } });
  },
  async createSession(data) {
    return prisma.session.create({ data });
  },
  async getSessionAndUser(sessionToken) {
    const row = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!row) return null;
    const { user, ...session } = row;
    return { session, user: toAdapterUser(user as RawUser) };
  },
  async updateSession({ sessionToken, ...data }) {
    return prisma.session.update({ where: { sessionToken }, data });
  },
  async deleteSession(sessionToken) {
    await prisma.session.delete({ where: { sessionToken } });
  },
  async getUserByAccount({ provider, providerAccountId }) {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });
    return account ? toAdapterUser(account.user as RawUser) : null;
  },
  async createVerificationToken(data) {
    return prisma.verificationToken.create({ data });
  },
  async useVerificationToken({ identifier, token }) {
    return prisma.verificationToken
      .delete({ where: { identifier_token: { identifier, token } } })
      .catch(() => null);
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            include: { accounts: true },
          });
          if (!user) return null;

          const credAccount = user.accounts.find((a) => a.provider === "credentials");
          if (!credAccount?.access_token) return null;

          const valid = await bcrypt.compare(parsed.data.password, credAccount.access_token);
          if (!valid) return null;

          return { id: user.id, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
  ],
  // JWT strategy: avoids database session writes which are buggy
  // with credentials provider in next-auth v5 beta.
  // OAuth user data (accounts, users) is still persisted via the adapter.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On sign-in, persist user id + OAuth provider into the token
      if (user?.id) token.id = user.id;
      if (account?.provider) token.provider = account.provider;
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
