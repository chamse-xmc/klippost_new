import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F3EE]/80 backdrop-blur-sm">
        <nav className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">klippost</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/onboarding"
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
