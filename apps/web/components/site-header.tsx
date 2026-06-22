import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight">智学谷</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="/courses" className="transition-colors hover:text-foreground/80">课程</Link>
          <Link href="/dashboard" className="transition-colors hover:text-foreground/80">学习中心</Link>
          <Link href="/community" className="transition-colors hover:text-foreground/80">社区</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium hover:underline">登录</Link>
        </div>
      </div>
    </header>
  );
}
