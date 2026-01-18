"use client";

import { useStockStore } from "@/store/useStockStore";
import { useStockData } from "@/hooks/useStockData";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoritesListProps {
    onSelectStock: (symbol: string) => void;
}

export function FavoritesList({ onSelectStock }: FavoritesListProps) {
    const { favorites, removeFavorite } = useStockStore();
    const { data, loading } = useStockData(favorites, 5000);

    if (favorites.length === 0) {
        return (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    我的收藏
                </h3>
                <div className="text-center p-4 text-sm text-muted-foreground">
                    还没有收藏的股票
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                我的收藏 ({favorites.length})
            </h3>
            <div className="space-y-1">
                {favorites.map((symbol) => {
                    const stock = data[symbol];
                    const isUp = stock?.change ? stock.change >= 0 : false;

                    return (
                        <div
                            key={symbol}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <button
                                onClick={() => onSelectStock(symbol)}
                                className="flex-1 text-left"
                            >
                                <div className="font-medium text-sm">{stock?.name || symbol}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">{symbol}</span>
                                    {stock && (
                                        <span className={cn(
                                            "font-mono",
                                            isUp ? "text-[color:var(--up)]" : "text-[color:var(--down)]"
                                        )}>
                                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => removeFavorite(symbol)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
