import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { cookies } from "next/headers";
import { db } from "./db";
import { sendEmail } from "@/services/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: {}, // We use custom sendVerificationRequest
      from: process.env.MAILGUN_FROM_EMAIL || 'klippost <noreply@mail.klippost.co>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const result = await sendEmail({
          to: email,
          subject: 'Sign in to klippost',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 40px 20px;">
              <div style="max-width: 400px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #111111; border-radius: 12px; margin-bottom: 16px;">
                    <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  </div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111111;">Sign in to klippost</h1>
                </div>

                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                  Click the button below to sign in. This link expires in 24 hours.
                </p>

                <a href="${url}" style="display: block; background: #111111; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; margin-bottom: 24px;">
                  Sign in to klippost
                </a>

                <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </div>

              <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 24px;">
                klippost - AI Video Analysis
              </p>
            </body>
            </html>
          `,
          text: `Sign in to klippost\n\nClick this link to sign in: ${url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`,
        });

        if (!result.success) {
          throw new Error(`Failed to send verification email: ${result.error}`);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
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
      // On initial sign in, store user ID
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
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
    verifyRequest: "/login/verify",
    error: "/login",
  },
};
