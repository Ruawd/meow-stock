'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/button';

export function AuthNav() {
    const { user, isLoading, fetchUser, logout } = useUserStore();

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (isLoading) {
        return <div className="h-9 w-24 animate-pulse rounded bg-white/5" />;
    }

    if (!user) {
        return (
            <Button asChild variant="outline" size="sm" className="border-red-500/20 hover:bg-red-500/10 hover:text-red-500">
                <a href="/api/auth/login">登录 / 注册</a>
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Meow Coin</span>
                <span className="text-sm font-bold text-amber-500 font-mono">
                    {user.credit?.availableBalance?.toLocaleString() ?? 0}
                </span>
            </div>

            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                {user.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-white/10 bg-white/5" />
                )}
                <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-medium leading-none">{user.displayName || user.name}</span>
                </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => logout()} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500">
                <span className="sr-only">Logout</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            </Button>
        </div>
    );
}
