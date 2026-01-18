"use client";

import { MarketOverview } from "@/components/features/MarketOverview";
import { StockRankings } from "@/components/features/StockRankings";

export default function MarketPage() {
    return (
        <div className="container mx-auto p-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">市场概览</h1>
                <p className="text-muted-foreground">主要指数和市场趋势</p>
            </div>

            <MarketOverview />

            <StockRankings />
        </div>
    );
}
