"use client";

import { useStockStore } from "@/store/useStockStore";
import { Trophy, TrendingDown, DollarSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRankings } from "@/components/features/UserRankings";

export default function LeaderboardPage() {
    const { transactions } = useStockStore();

    // Calculate realized P/L by stock symbol
    const calculateRealizedPnLByStock = () => {
        const pnlMap: Record<string, { name: string; total: number }> = {};

        transactions.forEach((tx) => {
            if (tx.type === 'SELL' && tx.realizedPnL !== undefined) {
                if (!pnlMap[tx.symbol]) {
                    pnlMap[tx.symbol] = { name: tx.name, total: 0 };
                }
                pnlMap[tx.symbol].total += tx.realizedPnL;
            }
        });

        return Object.entries(pnlMap).map(([symbol, data]) => ({
            symbol,
            name: data.name,
            realizedPnL: data.total,
        }));
    };

    const stockPnL = calculateRealizedPnLByStock();

    // 财富榜: Top gainers (profitable stocks)
    const wealthRanking = stockPnL
        .filter((s) => s.realizedPnL > 0)
        .sort((a, b) => b.realizedPnL - a.realizedPnL)
        .slice(0, 10);

    // 破烂榜: Top losers (loss-making stocks)
    const lossRanking = stockPnL
        .filter((s) => s.realizedPnL < 0)
        .sort((a, b) => a.realizedPnL - b.realizedPnL)
        .slice(0, 10);

    // Total realized P/L
    const totalRealized = stockPnL.reduce((sum, s) => sum + s.realizedPnL, 0);

    const RankingCard = ({
        title,
        stocks,
        type,
        icon: Icon
    }: {
        title: string;
        stocks: typeof wealthRanking;
        type: 'profit' | 'loss';
        icon: any;
    }) => (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Icon className={cn(
                    "w-6 h-6",
                    type === 'profit' ? "text-yellow-500" : "text-gray-500"
                )} />
                {title}
            </h3>
            {stocks.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                    还没有{type === 'profit' ? '盈利' : '亏损'}记录
                </div>
            ) : (
                <div className="space-y-3">
                    {stocks.map((stock, idx) => (
                        <div
                            key={stock.symbol}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                                    idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                                        idx === 1 ? "bg-gray-400/20 text-gray-600" :
                                            idx === 2 ? "bg-orange-500/20 text-orange-600" :
                                                "bg-muted text-muted-foreground"
                                )}>
                                    {idx + 1}
                                </span>
                                <div>
                                    <div className="font-medium">{stock.name}</div>
                                    <div className="text-xs text-muted-foreground">{stock.symbol}</div>
                                </div>
                            </div>
                            <div className={cn(
                                "text-right font-mono font-bold text-lg",
                                type === 'profit' ? "text-[color:var(--up)]" : "text-[color:var(--down)]"
                            )}>
                                {type === 'profit' ? '+' : ''}¥{stock.realizedPnL.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">交易排行榜</h1>
                <p className="text-muted-foreground">已实现盈亏统计（仅计算已卖出股票）</p>
            </div>

            {/* Total Summary */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-primary" />
                        <div>
                            <div className="text-sm text-muted-foreground">总已实现盈亏</div>
                            <div className={cn(
                                "text-3xl font-bold font-mono",
                                totalRealized >= 0 ? "text-[color:var(--up)]" : "text-[color:var(--down)]"
                            )}>
                                {totalRealized >= 0 ? '+' : ''}¥{totalRealized.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                        <div>卖出交易: {transactions.filter(t => t.type === 'SELL').length} 笔</div>
                        <div>涉及股票: {stockPnL.length} 只</div>
                    </div>
                </div>
            </div>

            {/* Global User Rankings */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    全服排行榜
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UserRankings type="profit" title="全服财富榜 (盈利)" />
                    <UserRankings type="loss" title="全服破烂榜 (亏损)" />
                </div>
            </div>

            {/* Personal Performance */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">我的交易表现</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RankingCard
                        title="财富榜 (个股盈利)"
                        stocks={wealthRanking}
                        type="profit"
                        icon={Trophy}
                    />
                    <RankingCard
                        title="破烂榜 (个股亏损)"
                        stocks={lossRanking}
                        type="loss"
                        icon={TrendingDown}
                    />
                </div>
            </div>
        </div>
    );
}
