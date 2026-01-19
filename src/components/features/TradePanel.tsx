"use client";

import { useState } from "react";
import { useStockStore } from "@/store/useStockStore";
import { useStockData } from "@/hooks/useStockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface TradePanelProps {
    symbol: string;
}

export function TradePanel({ symbol }: TradePanelProps) {
    const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
    const [quantity, setQuantity] = useState<string>('100');
    const [targetPrice, setTargetPrice] = useState<string>('');
    const { balance, buyStock, sellStock, holdings, createLimitOrder } = useStockStore();
    const { data, loading } = useStockData([symbol], 3000);

    const stock = data[symbol];
    const price = stock?.price || 0;
    const qty = parseInt(quantity) || 0;
    const totalCost = price * qty;
    const target = parseFloat(targetPrice) || 0;

    const holding = holdings.find(h => h.symbol === symbol);
    const ownedQty = holding?.quantity || 0;

    const canBuy = mode === 'BUY' && balance >= totalCost && qty > 0;
    const canSell = mode === 'SELL' && ownedQty >= qty && qty > 0;
    const isReady = !loading && !!stock && price > 0;

    const handleTrade = () => {
        if (!isReady) {
            toast.error("等待实时数据...");
            return;
        }

        if (qty <= 0) {
            toast.error("请输入有效数量");
            return;
        }
        if (qty % 100 !== 0) {
            toast.error("必须以100股为单位交易");
            return;
        }

        // Limit Order Logic
        if (orderType === 'LIMIT') {
            if (target <= 0) {
                toast.error("请输入有效目标价格");
                return;
            }

            if (mode === 'BUY' && target >= price) {
                toast.error("限价买入价必须低于当前价", {
                    description: `当前: ¥${price.toFixed(2)}`
                });
                return;
            }
            if (mode === 'SELL' && target <= price) {
                toast.error("限价卖出价必须高于当前价", {
                    description: `当前: ¥${price.toFixed(2)}`
                });
                return;
            }

            const estimatedCost = target * qty;
            if (mode === 'BUY' && balance < estimatedCost) {
                toast.error("资金不足，无法设置限价单");
                return;
            }
            if (mode === 'SELL' && ownedQty < qty) {
                toast.error("持股不足");
                return;
            }

            createLimitOrder({
                symbol,
                name: stock!.name,
                type: mode,
                targetPrice: target,
                quantity: qty,
            });

            toast.success(`限价${mode === 'BUY' ? '买入' : '卖出'}单已创建`, {
                description: `${qty} 股 @ ¥${target.toFixed(2)}`
            });
            setTargetPrice('');
            return;
        }

        // Market Order Logic (instant)
        if (mode === 'BUY') {
            if (balance < totalCost) {
                toast.error("资金不足");
                return;
            }
            buyStock(symbol, stock?.name || symbol, price, qty);
            toast.success(`已买入 ${qty} 股`, { description: `@ ¥${price.toFixed(2)}` });
        } else {
            if (ownedQty < qty) {
                toast.error("持股不足");
                return;
            }
            sellStock(symbol, stock?.name || symbol, price, qty);
            toast.success(`已卖出 ${qty} 股`, { description: `@ ¥${price.toFixed(2)}` });
        }
    };

    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm min-h-[400px]">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">交易</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="w-4 h-4" />
                        <span>¥{balance.toLocaleString()}</span>
                    </div>
                </div>
                {stock && (
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{stock.name}</span>
                        <span className="mx-1.5">·</span>
                        <span className="uppercase">{symbol}</span>
                    </div>
                )}
                {!loading && !stock && (
                    <div className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>股票数据无效</span>
                    </div>
                )}
            </div>

            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-muted rounded-lg">
                <button
                    onClick={() => setMode('BUY')}
                    className={cn(
                        "py-2 text-sm font-medium rounded-md transition-all",
                        mode === 'BUY' ? "bg-up text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ backgroundColor: mode === 'BUY' ? 'var(--up)' : 'transparent' }}
                >
                    买入
                </button>
                <button
                    onClick={() => setMode('SELL')}
                    className={cn(
                        "py-2 text-sm font-medium rounded-md transition-all",
                        mode === 'SELL' ? "bg-down text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ backgroundColor: mode === 'SELL' ? 'var(--down)' : 'transparent' }}
                >
                    卖出
                </button>
            </div>

            {/* Market/Limit Order Type Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted/50 rounded-lg">
                <button
                    onClick={() => setOrderType('MARKET')}
                    className={cn(
                        "py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1",
                        orderType === 'MARKET' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                >
                    <TrendingUp className="w-3 h-3" />
                    市价单
                </button>
                <button
                    onClick={() => setOrderType('LIMIT')}
                    className={cn(
                        "py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1",
                        orderType === 'LIMIT' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                >
                    <TrendingDown className="w-3 h-3" />
                    限价单
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">当前价格</span>
                    <span className={cn("font-medium", (stock?.change || 0) >= 0 ? "text-[color:var(--up)]" : "text-[color:var(--down)]")}>
                        {loading || !stock ? (
                            <span className="animate-pulse text-muted-foreground opacity-70">获取中...</span>
                        ) : (
                            `¥${price.toFixed(2)}`
                        )}
                    </span>
                </div>

                {/* Show target price input for limit orders */}
                {orderType === 'LIMIT' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">目标价格</label>
                        <Input
                            type="number"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder={`e.g. ${(price * (mode === 'BUY' ? 0.97 : 1.03)).toFixed(2)}`}
                            step="0.01"
                            className="font-mono"
                            disabled={loading}
                        />
                        <div className="text-xs text-muted-foreground">
                            {mode === 'BUY' ? '💡 设置低于当前价' : '💡 设置高于当前价'}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">数量（每手100股）</label>
                    <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        step="100"
                        min="100"
                        className="font-mono"
                        disabled={loading}
                    />
                    {mode === 'SELL' && (
                        <div className="text-xs text-muted-foreground text-right">
                            持有: {ownedQty}
                        </div>
                    )}
                </div>

                <div className="flex justify-between text-sm py-2 border-t border-dashed">
                    <span className="text-muted-foreground">
                        {orderType === 'LIMIT' ? '预估总额' : '总金额'}
                    </span>
                    <span className="font-bold">
                        {(loading || !stock) ? "-" : `¥${(orderType === 'LIMIT' ? target * qty : totalCost).toFixed(2)}`}
                    </span>
                </div>

                <Button
                    className="w-full font-bold transition-all duration-300"
                    size="lg"
                    onClick={handleTrade}
                    disabled={!isReady || (orderType === 'MARKET' ? (mode === 'BUY' ? !canBuy : !canSell) : false)}
                    style={{
                        backgroundColor: (mode === 'BUY' ? 'var(--up)' : 'var(--down)'),
                        opacity: (!isReady || (orderType === 'MARKET' && (mode === 'BUY' ? !canBuy : !canSell))) ? 0.5 : 1
                    }}
                >
                    {loading ? "连接中..." : `${orderType === 'LIMIT' ? '设置' : mode === 'BUY' ? '买入' : '卖出'} ${stock?.name || symbol}`}
                </Button>

                {mode === 'BUY' && orderType === 'MARKET' && !loading && !canBuy && totalCost > 0 && isReady && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 justify-center animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        资金不足
                    </div>
                )}
            </div>
        </div>
    );
}
