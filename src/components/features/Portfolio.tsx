"use client";

import { useStockStore } from "@/store/useStockStore";
import { useStockData } from "@/hooks/useStockData";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Portfolio() {
    const { holdings } = useStockStore();

    // Collect all symbols to fetch real-time prices
    const symbols = holdings.map(h => h.symbol);
    const { data } = useStockData(symbols, 5000);

    const totalMarketValue = holdings.reduce((acc, h) => {
        const price = data[h.symbol]?.price || h.averagePrice; // Fallback so total doesn't jump to 0
        return acc + (price * h.quantity);
    }, 0);

    const totalCost = holdings.reduce((acc, h) => acc + (h.averagePrice * h.quantity), 0);
    const totalPnL = totalMarketValue - totalCost;
    const totalPnLPercent = totalCost === 0 ? 0 : (totalPnL / totalCost) * 100;

    return (
        <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">持仓组合</h2>
                <div className="flex gap-6 mt-4">
                    <div>
                        <div className="text-sm text-muted-foreground">市值</div>
                        <div className="text-2xl font-bold font-mono">¥{totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">总盈亏</div>
                        <div className={cn("text-2xl font-bold font-mono flex items-center gap-1", totalPnL >= 0 ? "text-[color:var(--up)]" : "text-[color:var(--down)]")}>
                            {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-sm font-medium bg-muted/20 px-1.5 py-0.5 rounded">
                                {totalPnLPercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>股票</TableHead>
                            <TableHead className="text-right">价格</TableHead>
                            <TableHead className="text-right">数量</TableHead>
                            <TableHead className="text-right">成本价</TableHead>
                            <TableHead className="text-right">市值</TableHead>
                            <TableHead className="text-right">盈亏</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holdings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    暂无持仓
                                </TableCell>
                            </TableRow>
                        ) : (
                            holdings.map((h) => {
                                const stock = data[h.symbol];
                                const currentPrice = stock?.price || h.averagePrice;
                                const marketValue = currentPrice * h.quantity;
                                const pnl = marketValue - (h.averagePrice * h.quantity);
                                const pnlPercent = (pnl / (h.averagePrice * h.quantity)) * 100;

                                return (
                                    <TableRow key={h.symbol}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{h.name}</div>
                                                <div className="text-xs text-muted-foreground">{h.symbol}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[color:var(--up)]">
                                            ¥{currentPrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{h.quantity}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">¥{h.averagePrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono">¥{marketValue.toLocaleString()}</TableCell>
                                        <TableCell className={cn("text-right font-mono font-medium", pnl >= 0 ? "text-[color:var(--up)]" : "text-[color:var(--down)]")}>
                                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} <br />
                                            <span className="text-xs opacity-70">({pnlPercent.toFixed(2)}%)</span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
