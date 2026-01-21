import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Fetch location from IP using free ip-api.com service
async function getLocation(ip: string): Promise<{ country?: string; city?: string }> {
  try {
    // Skip localhost/private IPs
    if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return {};
    }

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      signal: AbortSignal.timeout(2000), // 2s timeout
    });

    if (!res.ok) return {};

    const data = await res.json();
    if (data.status === "success") {
      return {
        country: data.countryCode || undefined,
        city: data.city || undefined,
      };
    }
  } catch {
    // Silent fail
  }
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json();

    // Get IP and user agent from headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Fetch location and log page view (fire and forget)
    getLocation(ip).then((location) => {
      db.pageView.create({
        data: {
          path: path || "/",
          ip,
          userAgent,
          referrer: referrer || undefined,
          country: location.country,
          city: location.city,
        },
      }).catch(console.error);
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Silent fail for tracking
  }
}
