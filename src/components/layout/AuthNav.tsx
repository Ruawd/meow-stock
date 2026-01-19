'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStockStore } from "@/store/useStockStore";
import { Button } from '@/components/ui/button';
import { ExchangeModal } from '@/components/economy/ExchangeModal';

export function AuthNav() {
    const { user, isLoading, fetchUser, logout } = useUserStore();
    const { balance } = useStockStore();
    const [showExchange, setShowExchange] = useState(false);
    const [exchangeTab, setExchangeTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const openExchange = (tab: 'DEPOSIT' | 'WITHDRAW') => {
        setExchangeTab(tab);
        setShowExchange(true);
    };

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
    <div className="flex items-center gap-6">
        {/* Currency Bar */}
        <div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-900/50 border border-white/10 rounded-full">
            {/* Meow Coin */}
            <div className="flex flex-col items-end border-r border-white/10 pr-4">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Meow Coin</span>
                <span className="text-sm font-bold text-amber-500 font-mono">
                    {user.credit?.availableBalance?.toLocaleString() ?? 0}
                </span>
            </div>

            {/* Game Capital */}
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Game Capital</span>
                <span className="text-sm font-bold text-emerald-500 font-mono">
                    ¥{balance.toLocaleString()}
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pl-2 border-l border-white/10">
                <button
                    onClick={() => openExchange('DEPOSIT')}
                    className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md transition-colors"
                >
                    入金
                </button>
                <button
                    onClick={() => openExchange('WITHDRAW')}
                    className="text-xs px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                >
                    出金
                </button>
            </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
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

        <ExchangeModal
            isOpen={showExchange}
            onClose={() => setShowExchange(false)}
            initialTab={exchangeTab}
        />
    </div>
    );
}
