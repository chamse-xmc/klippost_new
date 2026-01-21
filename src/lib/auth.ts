import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { cookies } from "next/headers";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
    async jwt({ token, user, account }) {
      // On initial sign in, store user ID and mark as OAuth verified
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;
        token.oauthVerified = true;
      }

      // If token doesn't have oauthVerified flag (old credentials sessions), invalidate
      if (token.id && !token.oauthVerified) {
        // Check if user has OAuth account (one-time check)
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: { accounts: { select: { provider: true } } },
        });

        if (!dbUser || dbUser.accounts.length === 0) {
          // Invalidate old credentials-based sessions by marking as invalid
          token.invalidated = true;
          return token;
        }

        // User has OAuth account, mark as verified
        token.oauthVerified = true;
      }

      return token;
    },
    async session({ session, token }) {
      // If token was invalidated, return empty session
      if (token.invalidated || !token.id) {
        return { ...session, user: undefined };
      }

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
