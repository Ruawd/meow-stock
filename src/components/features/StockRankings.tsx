"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";


interface RankingStock {
    code: string;
    name: string;
    price: string;
    changePercent: string;
    change: string;
}

export function StockRankings() {
    const [gainers, setGainers] = useState<RankingStock[]>([]);
    const [losers, setLosers] = useState<RankingStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRankings = async () => {
        try {
            const res = await fetch('/api/rankings');
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setGainers(data.gainers || []);
            setLosers(data.losers || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
        const interval = setInterval(fetchRankings, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
                        <div className="h-6 bg-muted rounded w-32 mb-4" />
                        {[...Array(5)].map((_, j) => (
                            <div key={j} className="h-12 bg-muted/50 rounded mb-2" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                {error}
                <button onClick={() => fetchRankings()} className="ml-2 text-primary underline">
                    重试
                </button>
            </div>
        );
    }

    const RankingCard = ({ title, stocks, type }: { title: string; stocks: RankingStock[]; type: 'gainer' | 'loser' }) => (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {type === 'gainer' ? (
                        <TrendingUp className="w-5 h-5 text-up" />
                    ) : (
                        <TrendingDown className="w-5 h-5 text-down" />
                    )}
                    {title}
                </h3>
                <RefreshCw
                    className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={() => fetchRankings()}
                />
            </div>
            <div className="space-y-2">
                {stocks.map((stock, idx) => {
                    const isGainer = type === 'gainer';
                    return (
                        <div
                            key={stock.code}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <span className={cn(
                                    "w-6 h-6 flex items-center justify-center rounded text-xs font-bold",
                                    idx < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    {idx + 1}
                                </span>
                                <div>
                                    <div className="font-medium">{stock.name}</div>
                                    <div className="text-xs text-muted-foreground">{stock.code}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono">¥{stock.price}</div>
                                <div className={cn(
                                    "text-sm font-bold",
                                    isGainer ? "text-[color:var(--up)]" : "text-[color:var(--down)]"
                                )}>
                                    {isGainer ? '+' : ''}{stock.changePercent}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RankingCard title="涨幅榜" stocks={gainers} type="gainer" />
            <RankingCard title="跌幅榜" stocks={losers} type="loser" />
        </div>
    );
}
