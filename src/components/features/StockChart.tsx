"use client";

import { useEffect, useRef, memo } from 'react';

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

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

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

        containerRef.current.appendChild(script);

    }, [symbol]);

    return (
        <div className="w-full h-[500px] bg-card rounded-xl border overflow-hidden relative" ref={containerRef}>
            {/* Widget Container - strictly handled by TradingView script */}
            <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
                <div className="tradingview-widget-copyright">
                    <a href="https://cn.tradingview.com/" rel="noopener nofollow" target="_blank">
                        <span className="blue-text">Track all markets on TradingView</span>
                    </a>
                </div>
            </div>
        </div>
    );
});
