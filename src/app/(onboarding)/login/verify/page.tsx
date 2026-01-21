"use client";

import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">klippost</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm">
          We sent a sign-in link to your email address. Click the link to continue.
        </p>
      </div>

      {/* Info */}
      <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-2">
        <p>The link will expire in 24 hours.</p>
        <p>Make sure to check your spam folder if you don't see the email.</p>
      </div>

      {/* Back link */}
      <Link
        href="/login"
        className="block w-full py-4 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all text-center"
      >
        Back to login
      </Link>
    </div>
  );
}
