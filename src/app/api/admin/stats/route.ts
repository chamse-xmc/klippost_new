import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Page views in parallel
    const [
      pageViews1h,
      pageViews12h,
      pageViews24h,
      pageViews7d,
      totalUsers,
      newUsers24h,
      newUsers7d,
      subscriptionBreakdown,
      recentUsers,
      topPages24h,
      topCountries24h,
      recentVisitors,
    ] = await Promise.all([
      // Page views last hour
      db.pageView.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),
      // Page views last 12 hours
      db.pageView.count({
        where: { createdAt: { gte: twelveHoursAgo } },
      }),
      // Page views last 24 hours
      db.pageView.count({
        where: { createdAt: { gte: twentyFourHoursAgo } },
      }),
      // Page views last 7 days
      db.pageView.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      // Total users
      db.user.count(),
      // New users last 24 hours
      db.user.count({
        where: { createdAt: { gte: twentyFourHoursAgo } },
      }),
      // New users last 7 days
      db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      // Subscription breakdown
      db.user.groupBy({
        by: ["subscription"],
        _count: { subscription: true },
      }),
      // Recent users (last 20)
      db.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          subscription: true,
          createdAt: true,
          videosAnalyzed: true,
        },
      }),
      // Top pages last 24 hours
      db.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: twentyFourHoursAgo } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      // Top countries last 24 hours (exclude admin's location)
      db.pageView.groupBy({
        by: ["country"],
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          country: { not: null },
          city: { not: "Grenå" },
        },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
      // Recent visitors with location (exclude admin's location)
      db.pageView.findMany({
        take: 20,
        where: {
          NOT: [
            { city: "Grenå" },
            { country: null, city: null },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          path: true,
          country: true,
          city: true,
          createdAt: true,
        },
      }),
    ]);

    // Format subscription breakdown
    const subscriptions = {
      FREE: 0,
      PRO: 0,
      UNLIMITED: 0,
    };
    subscriptionBreakdown.forEach((item) => {
      subscriptions[item.subscription] = item._count.subscription;
    });

    return NextResponse.json({
      pageViews: {
        lastHour: pageViews1h,
        last12Hours: pageViews12h,
        last24Hours: pageViews24h,
        last7Days: pageViews7d,
      },
      users: {
        total: totalUsers,
        new24h: newUsers24h,
        new7d: newUsers7d,
        subscriptions,
      },
      recentUsers,
      topPages: topPages24h.map((p) => ({
        path: p.path,
        views: p._count.path,
      })),
      topCountries: topCountries24h.map((c) => ({
        country: c.country,
        views: c._count.country,
      })),
      recentVisitors: recentVisitors.map((v) => ({
        id: v.id,
        path: v.path,
        country: v.country,
        city: v.city,
        createdAt: v.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
