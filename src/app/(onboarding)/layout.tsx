"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
  const { status } = useSession();
  const currentStep = steps.findIndex((s) => s.path === pathname) + 1 || 1;

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading" || status === "authenticated") {
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
        </div>
      </div>

      {/* Brand mark */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
        <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </div>
        klippost
      </div>
    </div>
  );
}
