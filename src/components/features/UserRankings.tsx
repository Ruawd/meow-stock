"use client";

import { useEffect, useState } from "react";
import { useStockStore } from "@/store/useStockStore";
import { useUserStore } from "@/store/useUserStore";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRankItem {
    name: string;
    avatar: string;
    totalAssets: number;
}

export function UserRankings() {
    const { balance, holdings } = useStockStore();
    const { user } = useUserStore();
    const [rankings, setRankings] = useState<UserRankItem[]>([]);

    // 1. Calc Total Assets
    const totalAssets = balance + holdings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
    // Note: ideally use current market price, but accessing accurate live prices here is complex. 
    // Using averagePrice (cost) is safe-ish, or better: useStockStore should expose 'totalAssetValue' if connected to quotes.
    // Let's assume for now we use the store's values. If store doesn't update prices in real-time, this is "Book Value".
    // For a better implementation, we'd need live prices. 
    // But let's sync what we have.

    // 2. Sync to Server
    useEffect(() => {
        if (!user) return;

        const sync = async () => {
            try {
                await fetch('/api/rankings/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ totalAssets })
                });
            } catch (e) {
                console.error('Sync rank failed', e);
            }
        };

        // Debounce or sync on interval?
        // Sync on mount and then every minute or when assets change meaningfully?
        // Let's sync on mount and then every 30s.
        sync();
        const timer = setInterval(sync, 30000);
        return () => clearInterval(timer);
    }, [user, totalAssets]);

    // 3. Fetch Leaderboard
    const fetchRankings = async () => {
        try {
            const res = await fetch('/api/rankings/users');
            if (res.ok) {
                setRankings(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchRankings();
        const timer = setInterval(fetchRankings, 10000); // Refresh every 10s
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    财富榜
                </h3>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {rankings.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "w-6 h-6 flex items-center justify-center rounded text-xs font-bold",
                                idx === 0 ? "bg-amber-500 text-white shadow-amber-500/50 shadow-sm" :
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
                        <div className="font-mono font-bold text-amber-500">
                            ¥{(item.totalAssets / 10000).toFixed(2)}万
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
