"use client";

import { useEffect, useState } from "react";
import { useStockStore } from "@/store/useStockStore";
import { useUserStore } from "@/store/useUserStore";
import { Trophy, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRankItem {
    name: string;
    avatar: string;
    totalProfit: number;
}

interface UserRankingsProps {
    type?: 'profit' | 'loss';
    title?: string;
}

export function UserRankings({ type = 'profit', title }: UserRankingsProps) {
    const { transactions } = useStockStore();
    const { user } = useUserStore();
    const [rankings, setRankings] = useState<UserRankItem[]>([]);

    // 1. Calc Total Realized Profit/Loss separately
    const totalProfit = transactions.reduce((sum, t) => {
        if (t.type === 'SELL' && t.realizedPnL !== undefined) {
            return sum + t.realizedPnL;
        }
        return sum;
    }, 0);

    // 2. Sync to Server (Only needs to happen once per component mount really, but we need to ensure we sync the LATEST logic)
    // To avoid double syncing if we render two components, we could lift this up or just let it race (it's idempotent-ish).
    // Or better: ensure we only sync if we have a valid user and value.
    useEffect(() => {
        if (!user) return;

        const sync = async () => {
            try {
                await fetch('/api/rankings/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ totalProfit })
                });
            } catch (e) {
                console.error('Sync rank failed', e);
            }
        };

        sync();
        const timer = setInterval(sync, 60000); // Sync every minute
        return () => clearInterval(timer);
    }, [user, totalProfit]);

    // 3. Fetch Leaderboard
    const fetchRankings = async () => {
        try {
            const res = await fetch('/api/rankings/users');
            if (res.ok) {
                const data: UserRankItem[] = await res.json();

                // Filter and Sort based on type
                let filtered = [];
                if (type === 'profit') {
                    // Start from > 0, sort desc
                    filtered = data.filter(i => i.totalProfit > 0).sort((a, b) => b.totalProfit - a.totalProfit);
                } else {
                    // Start from < 0, sort asc (biggest loser first)
                    filtered = data.filter(i => i.totalProfit < 0).sort((a, b) => a.totalProfit - b.totalProfit);
                }
                setRankings(filtered);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchRankings();
        const timer = setInterval(fetchRankings, 10000); // Refresh every 10s
        return () => clearInterval(timer);
    }, [type]); // Re-fetch/sort if type changes

    const displayTitle = title || (type === 'profit' ? '全服财富榜' : '全服破烂榜');
    const Icon = type === 'profit' ? Trophy : TrendingDown; // Import TrendingDown if not present

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon className={cn("w-5 h-5", type === 'profit' ? "text-amber-500" : "text-green-500")} />
                    {displayTitle}
                </h3>
            </div>
            {rankings.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                    {type === 'profit' ? '还没有人盈利' : '还没有人亏损'}
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {rankings.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "w-6 h-6 flex items-center justify-center rounded text-xs font-bold",
                                    idx === 0 ? (type === 'profit' ? "bg-amber-500 text-white shadow-amber-500/50" : "bg-green-600 text-white shadow-green-600/50") :
                                        idx === 1 ? "bg-gray-400 text-white" :
                                            idx === 2 ? "bg-orange-700 text-white" :
                                                "bg-muted text-muted-foreground"
                                )}>
                                    {idx + 1}
                                </span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.avatar || '/placeholder-avatar.png'} alt={item.name} className="w-8 h-8 rounded-full bg-muted border border-border" />
                                <div className="font-medium text-sm">{item.name}</div>
                            </div>
                            <div className={cn(
                                "font-mono font-bold",
                                type === 'profit' ? "text-red-500" : "text-green-500"
                            )}>
                                {type === 'profit' ? '+' : ''}¥{item.totalProfit.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
