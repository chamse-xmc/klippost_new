import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // Test credentials provider - for development only
    CredentialsProvider({
      name: "Test Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Find or create user
        let user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "not-configured",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "not-configured",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  events: {
    async createUser({ user }) {
      // Handle referral code on new user creation
      try {
        const cookieStore = await cookies();
        const referralCode = cookieStore.get("referral_code")?.value;

        if (referralCode && user.id) {
          // Verify the referral code exists
          const referrer = await db.user.findUnique({
            where: { referralCode },
          });

          if (referrer && referrer.id !== user.id) {
            // Update new user with referral info
            await db.user.update({
              where: { id: user.id },
              data: { referredBy: referralCode },
            });

            // Grant +5 bonus analyses to the referrer
            await db.user.update({
              where: { id: referrer.id },
              data: { bonusAnalyses: { increment: 5 } },
            });
          }
        }
      } catch (error) {
        console.error("Error processing referral:", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
