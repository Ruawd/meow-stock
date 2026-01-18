"use client";

import { useState } from "react";
import { MarketOverview } from "@/components/features/MarketOverview";
import { StockChart } from "@/components/features/StockChart";
import { TradePanel } from "@/components/features/TradePanel";
import { Portfolio } from "@/components/features/Portfolio";
import { FavoritesList } from "@/components/features/FavoritesList";
import { PendingOrders } from "@/components/features/PendingOrders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrderMonitor } from "@/hooks/useOrderMonitor";
import { useStockStore } from "@/store/useStockStore";

const POPULAR_STOCKS = [
  { code: 'sh600519', name: '贵州茅台' },
  { code: 'sz000858', name: '五粮液' },
  { code: 'sz300750', name: '宁德时代' },
  { code: 'sz002594', name: '比亚迪' },
  { code: 'sh601318', name: '中国平安' },
  { code: 'sh600036', name: '招商银行' },
  { code: 'sz000001', name: '平安银行' },
  { code: 'sh601888', name: '中国中免' },
];

export default function Home() {
  const [symbol, setSymbol] = useState("sh600519"); // Default: Moutai
  const [searchInput, setSearchInput] = useState("");
  const { addFavorite, removeFavorite, isFavorite } = useStockStore();

  // Enable automatic limit order execution
  useOrderMonitor();

  const isFav = isFavorite(symbol);

  const toggleFavorite = () => {
    if (isFav) {
      removeFavorite(symbol);
      toast.success("已取消收藏");
    } else {
      addFavorite(symbol);
      toast.success("已加入收藏");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      let code = searchInput.trim().toLowerCase();
      // Allow pure numbers, auto-prefix based on first digit
      if (/^\d{6}$/.test(code)) {
        if (code.startsWith('6')) code = 'sh' + code;
        else if (code.startsWith('0') || code.startsWith('3')) code = 'sz' + code;
        else if (code.startsWith('4') || code.startsWith('8')) code = 'bj' + code; // Basic BJ support
      }
      setSymbol(code);
      setSearchInput(""); // Clear input on search
      toast.success(`Loaded Stock: ${code.toUpperCase()}`);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      {/* Search & Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">交易看板</h1>
            <p className="text-muted-foreground">A股实时模拟交易</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="股票代码（如 600519）"
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoComplete="off"
                name="stock-search"
              />
            </div>
            <Button type="submit">加载</Button>
          </form>
        </div>

        {/* Popular Stocks Chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground py-1.5 min-w-fit">热门股票:</span>
          {POPULAR_STOCKS.map((s) => (
            <button
              key={s.code}
              onClick={() => setSymbol(s.code)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                symbol === s.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
              )}
            >
              {s.name} <span className="opacity-70">({s.code.replace(/[a-z]+/i, '')})</span>
            </button>
          ))}
        </div>
      </div>

      <MarketOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-primary rounded-full" />
                <h2 className="text-lg font-semibold uppercase">{symbol} 走势图</h2>
              </div>
              <button
                onClick={toggleFavorite}
                className={cn(
                  "p-2 rounded-lg transition-all hover:bg-muted",
                  isFav ? "text-yellow-500" : "text-muted-foreground"
                )}
                title={isFav ? "取消收藏" : "加入收藏"}
              >
                <Star className={cn("w-5 h-5", isFav && "fill-current")} />
              </button>
            </div>
            <StockChart symbol={symbol} />
          </div>

          <PendingOrders />
          <Portfolio />
        </div>

        {/* Sidebar: Trade Panel */}
        <div className="space-y-6">
          <TradePanel symbol={symbol} />

          <FavoritesList onSelectStock={(code) => setSymbol(code)} />

          {/* Instruction Card */}
          <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground border border-dashed">
            <h3 className="font-medium text-foreground mb-2">使用说明</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>价格来自新浪财经实时数据</li>
              <li><strong className="text-up">红色</strong>代表上涨，<strong className="text-down">绿色</strong>代表下跌</li>
              <li>初始资金：¥1,000,000</li>
              <li>24/7全天候模拟交易</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
