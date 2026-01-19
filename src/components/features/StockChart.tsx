"use client";

import { useEffect, useRef, memo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { LineChart, BarChart3, RefreshCcw } from 'lucide-react';


interface StockChartProps {
    symbol: string;
}

export const StockChart = memo(function StockChart({ symbol }: StockChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Map internal symbol to TradingView symbol
    // sh600519 -> SSE:600519
    // sz000001 -> SZSE:000001
    const getTradingViewSymbol = (code: string) => {
        const cleanCode = code.toLowerCase().trim();
        if (cleanCode.startsWith('sh')) {
            return `SSE:${cleanCode.slice(2)}`;
        }
        if (cleanCode.startsWith('sz')) {
            return `SZSE:${cleanCode.slice(2)}`;
        }
        if (cleanCode.startsWith('bj')) {
            return `BSE:${cleanCode.slice(2)}`; // Beijing Stock Exchange
        }
        return code; // Fallback
    };

    const [viewMode, setViewMode] = useState<'tradingview' | 'realtime'>('tradingview');
    const [chartType, setChartType] = useState<'min' | 'daily' | 'weekly' | 'monthly'>('min');
    const [timestamp, setTimestamp] = useState(Date.now());

    // Auto refresh real-time chart (only for minute chart ideally, but fine for all)
    useEffect(() => {
        if (viewMode === 'realtime') {
            const timer = setInterval(() => {
                setTimestamp(Date.now());
            }, 30000); // Refresh every 30s
            return () => clearInterval(timer);
        }
    }, [viewMode]);

    useEffect(() => {
        if (!containerRef.current || viewMode !== 'tradingview') return;

        // Clear previous widget
        containerRef.current.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = "tradingview-widget-container";
        widgetContainer.style.height = "100%";
        widgetContainer.style.width = "100%";
        containerRef.current.appendChild(widgetContainer);

        const widget = document.createElement('div');
        widget.className = "tradingview-widget-container__widget";
        widget.style.height = "calc(100% - 32px)";
        widget.style.width = "100%";
        widgetContainer.appendChild(widget);

        const tvSymbol = getTradingViewSymbol(symbol);

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Asia/Shanghai",
            "theme": "dark",
            "style": "1",
            "locale": "zh_CN",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "calendar": false,
            "support_host": "https://www.tradingview.com",
            "hide_side_toolbar": false,
            "withdateranges": true,
            "hide_top_toolbar": false,
            "save_image": true,
            "studies": [
                "MACD@tv-basicstudies",
                "RSI@tv-basicstudies",
                "MASimple@tv-basicstudies"
            ],
            // Additional customization to make it look "perfect"
            "backgroundColor": "rgba(0, 0, 0, 1)",
            "gridColor": "rgba(42, 46, 57, 0.06)",
        });

        widgetContainer.appendChild(script);

    }, [symbol, viewMode]);

    return (
        <div className="w-full h-[500px] bg-card rounded-xl border overflow-hidden relative" ref={containerRef}>
            <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button
                    variant={viewMode === 'tradingview' ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setViewMode('tradingview')}
                    className="h-8 gap-2"
                >
                    <BarChart3 className="w-4 h-4" />
                    专业图表
                </Button>
                <Button
                    variant={viewMode === 'realtime' ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setViewMode('realtime')}
                    className="h-8 gap-2"
                >
                    <LineChart className="w-4 h-4" />
                    实时走势
                </Button>
            </div>

            {viewMode === 'tradingview' ? (
                /* Widget Container - strictly handled by TradingView script */
                <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
                    {/* Content injected by useEffect */}
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-black relative">
                    {/* Period Selector */}
                    <div className="absolute top-2 left-2 z-10 flex bg-secondary/50 rounded-lg p-1 gap-1">
                        {(['min', 'daily', 'weekly', 'monthly'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${chartType === type
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                                    }`}
                            >
                                {type === 'min' && '分时'}
                                {type === 'daily' && '日K'}
                                {type === 'weekly' && '周K'}
                                {type === 'monthly' && '月K'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full h-full flex items-center justify-center pt-8">
                        <img
                            src={`https://image.sinajs.cn/newchart/${chartType}/n/${symbol.toLowerCase()}.gif?t=${timestamp}`}
                            alt={`${symbol} ${chartType} Chart`}
                            className="max-w-full max-h-full object-contain filter invert hue-rotate-180 brightness-90 contrast-125"
                        />
                        {/* Note: Sina images are white bg by default. CSS filter helps it blend into dark mode, 
                             though not perfect. But it's free real-time. */}
                    </div>
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
                        <RefreshCcw className="w-3 h-3 animate-spin duration-[3000ms]" />
                        每30秒自动刷新
                    </div>
                </div>
            )}
        </div>
    );
});
