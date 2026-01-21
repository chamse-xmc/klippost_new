"use client";

import { useState, useEffect } from "react";

interface Stats {
  pageViews: {
    lastHour: number;
    last12Hours: number;
    last24Hours: number;
    last7Days: number;
  };
  users: {
    total: number;
    new24h: number;
    new7d: number;
    subscriptions: {
      FREE: number;
      PRO: number;
      UNLIMITED: number;
    };
  };
  recentUsers: {
    id: string;
    email: string;
    name: string | null;
    subscription: string;
    createdAt: string;
    videosAnalyzed: number;
  }[];
  topPages: {
    path: string;
    views: number;
  }[];
  topCountries: {
    country: string;
    views: number;
  }[];
  recentVisitors: {
    id: string;
    country: string | null;
    city: string | null;
    firstSeen: string;
    pageCount: number;
    pages: { path: string; time: string }[];
  }[];
}

// Country code to flag emoji
function countryToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);

  // Check if password is stored in session
  useEffect(() => {
    const storedPassword = sessionStorage.getItem("admin_password");
    if (storedPassword) {
      setPassword(storedPassword);
      fetchStats(storedPassword);
    }
  }, []);

  const fetchStats = async (pwd: string) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid password");
          setIsAuthenticated(false);
          sessionStorage.removeItem("admin_password");
        } else {
          setError("Failed to fetch stats");
        }
        return;
      }

      const data = await res.json();
      setStats(data);
      setIsAuthenticated(true);
      setLastRefresh(new Date());
      sessionStorage.setItem("admin_password", pwd);
      localStorage.setItem("is_admin", "true"); // Exclude from tracking
    } catch {
      setError("Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(password);
  };

  const handleRefresh = () => {
    fetchStats(password);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStats(null);
    setPassword("");
    sessionStorage.removeItem("admin_password");
  };

  // Auto-refresh every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchStats(password), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, password]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-gray-400 text-sm mt-1">Enter password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Checking..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {lastRefresh && (
              <p className="text-gray-400 text-sm">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? "..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {stats && (
          <div className="space-y-6">
            {/* Page Views */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Last Hour"
                value={stats.pageViews.lastHour}
                sublabel="page views"
              />
              <StatCard
                label="Last 12 Hours"
                value={stats.pageViews.last12Hours}
                sublabel="page views"
              />
              <StatCard
                label="Last 24 Hours"
                value={stats.pageViews.last24Hours}
                sublabel="page views"
              />
              <StatCard
                label="Last 7 Days"
                value={stats.pageViews.last7Days}
                sublabel="page views"
              />
            </div>

            {/* Users */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Users"
                value={stats.users.total}
                accent="blue"
              />
              <StatCard
                label="New (24h)"
                value={stats.users.new24h}
                accent="green"
              />
              <StatCard
                label="New (7d)"
                value={stats.users.new7d}
                accent="purple"
              />
              <StatCard
                label="Videos Analyzed"
                value={stats.recentUsers.reduce((sum, u) => sum + u.videosAnalyzed, 0)}
                sublabel="by recent users"
                accent="orange"
              />
            </div>

            {/* Subscriptions */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gray-500/20">
                  <div className="text-3xl font-bold">{stats.users.subscriptions.FREE}</div>
                  <div className="text-gray-400 text-sm mt-1">Free</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-500/20">
                  <div className="text-3xl font-bold text-blue-400">{stats.users.subscriptions.PRO}</div>
                  <div className="text-gray-400 text-sm mt-1">Pro ($9/mo)</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-500/20">
                  <div className="text-3xl font-bold text-purple-400">{stats.users.subscriptions.UNLIMITED}</div>
                  <div className="text-gray-400 text-sm mt-1">Unlimited ($29/mo)</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                MRR: ${(stats.users.subscriptions.PRO * 9) + (stats.users.subscriptions.UNLIMITED * 29)}/mo
              </div>
            </div>

            {/* Top Pages & Countries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Top Pages */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <h2 className="text-lg font-semibold mb-4">Top Pages (24h)</h2>
                <div className="space-y-2">
                  {stats.topPages.map((page, i) => (
                    <div key={page.path} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
                        <span className="font-mono text-sm">{page.path}</span>
                      </div>
                      <span className="text-gray-400">{page.views}</span>
                    </div>
                  ))}
                  {stats.topPages.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No page views yet</p>
                  )}
                </div>
              </div>

              {/* Top Countries */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <h2 className="text-lg font-semibold mb-4">Top Countries (24h)</h2>
                <div className="space-y-2">
                  {stats.topCountries.map((country, i) => (
                    <div key={country.country} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
                        <span className="text-lg">{countryToFlag(country.country)}</span>
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <span className="text-gray-400">{country.views}</span>
                    </div>
                  ))}
                  {stats.topCountries.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No location data yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Visitors */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h2 className="text-lg font-semibold">Recent Visitors</h2>
              </div>
              <div className="divide-y divide-white/5">
                {stats.recentVisitors.map((visitor) => (
                  <div key={visitor.id}>
                    <button
                      onClick={() => setExpandedVisitor(expandedVisitor === visitor.id ? null : visitor.id)}
                      className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{countryToFlag(visitor.country || "")}</span>
                        <div>
                          <span className="text-sm">
                            {visitor.city && visitor.country
                              ? `${visitor.city}, ${visitor.country}`
                              : visitor.country || "Unknown"}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">
                            {visitor.pageCount} page{visitor.pageCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">
                          {new Date(visitor.firstSeen).toLocaleTimeString()}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedVisitor === visitor.id ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedVisitor === visitor.id && (
                      <div className="px-5 pb-3 pl-12 space-y-1">
                        {visitor.pages.map((page, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1">
                            <span className="font-mono text-gray-400">{page.path}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(page.time).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {stats.recentVisitors.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-6">No visitors yet</p>
                )}
              </div>
            </div>

            {/* Recent Users */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h2 className="text-lg font-semibold">Recent Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Videos</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-5 py-3">
                          <div>
                            <div className="font-medium">{user.name || "—"}</div>
                            <div className="text-gray-500 text-xs">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.subscription === "UNLIMITED"
                              ? "bg-purple-500/20 text-purple-400"
                              : user.subscription === "PRO"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {user.subscription}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400">{user.videosAnalyzed}</td>
                        <td className="px-5 py-3 text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: number;
  sublabel?: string;
  accent?: "blue" | "green" | "purple" | "orange";
}) {
  const accentColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className={`text-3xl font-bold ${accent ? accentColors[accent] : "text-white"}`}>
        {value.toLocaleString()}
      </div>
      {sublabel && <div className="text-gray-500 text-xs mt-1">{sublabel}</div>}
    </div>
  );
}
