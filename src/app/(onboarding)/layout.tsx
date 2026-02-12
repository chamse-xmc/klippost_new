"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const steps = [
  { path: "/onboarding", label: "1" },
  { path: "/onboarding/goals", label: "2" },
  { path: "/onboarding/challenges", label: "3" },
  { path: "/onboarding/potential", label: "4" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentStep = steps.findIndex((s) => s.path === pathname) + 1 || 1;

  // Redirect logged-in users to dashboard (only if they have a valid user ID)
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.id) {
        // Valid session - redirect to dashboard
        router.replace("/app");
      } else {
        // Corrupted session - sign out
        signOut({ redirect: false });
      }
    }
  }, [status, session, router]);

  // Show loading while checking auth, or if authenticated with valid user (redirecting)
  if (status === "loading" || (status === "authenticated" && session?.user?.id)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {children}

          {/* Crawlable links for SEO */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">·</span>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <span className="mx-2">·</span>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
