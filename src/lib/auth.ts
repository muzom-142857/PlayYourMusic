import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
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

async function generateUsername(email: string): Promise<string> {
  const base = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || "user";
  let username = base;
  let n = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${n++}`;
  }
  return username;
}

// Wrap PrismaAdapter to auto-generate username (required field unknown to Auth.js)
const baseAdapter = PrismaAdapter(prisma) as Adapter;
const adapter: Adapter = {
  ...baseAdapter,
  async createUser(user: AdapterUser) {
    const username = await generateUsername(user.email ?? "user");
    return baseAdapter.createUser!({ ...user, username } as AdapterUser);
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Spotify({
    //   clientId: process.env.SPOTIFY_CLIENT_ID!,
    //   clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    //   authorization:
    //   "https://accounts.spotify.com/authorize?scope=streaming,user-read-email,user-read-private,playlist-read-private",
    // }),
    // Apple({
    //  clientId: process.env.APPLE_CLIENT_ID!,
    //  clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { accounts: { where: { provider: "credentials" } } },
        });

        if (!user) return null;

        const credentialsAccount = user.accounts[0];
        if (!credentialsAccount?.access_token) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          credentialsAccount.access_token
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (user && session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn() {
      return true;
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
