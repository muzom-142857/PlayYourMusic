import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";
import Apple from "next-auth/providers/apple";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization:
        "https://accounts.spotify.com/authorize?scope=streaming,user-read-email,user-read-private,playlist-read-private",
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
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
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        // Auto-generate username from email for OAuth sign-ins
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existingUser && user.name && user.email) {
          const baseUsername = user.email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
          let username = baseUsername;
          let suffix = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${suffix++}`;
          }
          await prisma.user.update({
            where: { email: user.email },
            data: { username },
          }).catch(() => null);
        }
      }
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
