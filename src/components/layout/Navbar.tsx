import Link from 'next/link';
import { LineChart } from 'lucide-react';
import { AuthNav } from './AuthNav';

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
            <div className="container mx-auto flex h-full items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <LineChart className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                        虚拟市场交易
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        交易
                    </Link>
                    <Link href="/portfolio" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        持仓组合
                    </Link>
                    <Link href="/market" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        市场
                    </Link>
                    <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        排行榜
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <AuthNav />
                </div>
            </div>
        </nav>
    );
}
