import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json();

    // Get IP and user agent from headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Log the page view (fire and forget, don't await)
    db.pageView.create({
      data: {
        path: path || "/",
        ip,
        userAgent,
        referrer: referrer || undefined,
      },
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Silent fail for tracking
  }
}
