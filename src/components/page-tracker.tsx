"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking if admin (flag set on admin login)
    if (localStorage.getItem("is_admin") === "true") {
      return;
    }

    // Track page view
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {}); // Silent fail
  }, [pathname]);

  return null;
}
