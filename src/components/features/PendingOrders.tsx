"use client";

import { useStockStore } from "@/store/useStockStore";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PendingOrders() {
    const { pendingOrders, cancelOrder } = useStockStore();
    const { data } = useStockData(
        pendingOrders.map(o => o.symbol),
        3000
    );

    if (pendingOrders.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                挂单列表 ({pendingOrders.length})
            </h3>
            <div className="space-y-2">
                {pendingOrders.map((order) => {
                    const currentPrice = data[order.symbol]?.price || 0;
                    const priceGap = currentPrice - order.targetPrice;
                    const percentGap = currentPrice > 0 ? (priceGap / currentPrice) * 100 : 0;

                    return (
                        <div
                            key={order.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold",
                                            order.type === 'BUY'
                                                ? "bg-up/20 text-[color:var(--up)]"
                                                : "bg-down/20 text-[color:var(--down)]"
                                        )}
                                    >
                                        {order.type}
                                    </span>
                                    <span className="font-medium">{order.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {order.symbol}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-3">
                                    <span>目标: ¥{order.targetPrice.toFixed(2)}</span>
                                    <span>•</span>
                                    <span>当前: ¥{currentPrice.toFixed(2)}</span>
                                    <span>•</span>
                                    <span className={cn(
                                        "font-medium",
                                        (order.type === 'BUY' && priceGap < 0) || (order.type === 'SELL' && priceGap > 0)
                                            ? "text-yellow-500"
                                            : "text-muted-foreground"
                                    )}>
                                        {Math.abs(percentGap).toFixed(2)}% {order.type === 'BUY' ? '高于' : '低于'}
                                    </span>
                                    <span>•</span>
                                    <span>{order.quantity} 股</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelOrder(order.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Need to import useStockData at the top
import { useStockData } from "@/hooks/useStockData";
