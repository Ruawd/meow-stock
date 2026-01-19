"use client";

import { useStockData } from "@/hooks/useStockData";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";

const INDICES = ['sh000001', 'sz399001'];
// sh000001 = Shanghai Composite
// sz399001 = Shenzhen Component

export function MarketOverview() {
    const { data, loading } = useStockData(INDICES, 5000);

    if (loading && Object.keys(data).length === 0) {
        return (
            <div className="grid grid-cols-2 gap-4 animate-pulse">
                <div className="h-20 rounded-xl bg-muted/50"></div>
                <div className="h-20 rounded-xl bg-muted/50"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INDICES.map((code) => {
                const stock = data[code];
                if (!stock) return null;

                const isUp = stock.change >= 0;
                const ColorClass = isUp ? "text-up" : "text-down";
                // Note: Using CSS variables --up and --down requires generic config, 
                // but Tailwind v4 needs classes. I added vars but usage in className needs mapped utilities or arbitrary values.
                // Let's use arbitrary values or style prop for precise colors from vars.
                // Actually, simpler to use the hex specific classes if Tailwind config didn't map them to utilities?
                // I added --up/--down vars but didn't map them to `text-up` utility in tailwind config unless I use `text-[var(--up)]`.

                return (
                    <div key={code} className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-sidebar-primary/20 group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">{stock.name}</h3>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className={cn("text-2xl font-bold tracking-tight", isUp ? "text-[color:var(--up)]" : "text-[color:var(--down)]")}>
                                        {(stock.price || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <div className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", isUp ? "bg-[color:var(--up)]/10 text-[color:var(--up)]" : "bg-[color:var(--down)]/10 text-[color:var(--down)]")}>
                                {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                <span>{(stock.changePercent || 0).toFixed(2)}%</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                );
            })}
        </div>
    );
}
