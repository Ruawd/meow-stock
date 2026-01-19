"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useStockData } from '@/hooks/useStockData';

interface StockChartProps {
    symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastCloseRef = useRef<number | null>(null);

    // Poll for real-time updates
    const { data: realTimeData, error: dataError } = useStockData([symbol], 3000);

    // Fetch Historical Data
    useEffect(() => {
        const fetchHistory = async () => {
            if (!chartRef.current || !candlestickSeriesRef.current) {
                // Chart not initialized yet, wait for next run
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Scale 5 = 5 Minute Candles
                const res = await fetch(`/api/kline?code=${symbol}&scale=5&datalen=242`);

                if (!res.ok) {
                    throw new Error('Failed to fetch chart data');
                }

                const history = await res.json();

                if (history.error) {
                    setError(history.error);
                    setLoading(false);
                    return;
                }

                if (Array.isArray(history) && history.length > 0) {
                    candlestickSeriesRef.current.setData(history);

                    // Store the last close price for continuity
                    const lastCandle = history[history.length - 1];
                    lastCloseRef.current = lastCandle.close;

                    // Generate volume data (if available from historical data)
                    // For now, we'll add volume in real-time updates

                    setLoading(false);
                } else {
                    // Empty data means invalid stock code
                    setError('股票代码无效或不存在');
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to load chart history", e);
                setError('无法加载股票数据');
                setLoading(false);
            }
        };

        // Only fetch if chart is already initialized
        if (chartRef.current && candlestickSeriesRef.current) {
            fetchHistory();
        }
    }, [symbol]);

    // Update with Real-time Data
    useEffect(() => {
        const stock = realTimeData[symbol];
        if (stock && candlestickSeriesRef.current) {
            try {
                let timestamp;

                if (symbol.toLowerCase().includes('test888')) {
                    const dateTimeStr = `${stock.date} ${stock.time}`;
                    timestamp = new Date(dateTimeStr).getTime() / 1000;
                } else {
                    const dateTimeStr = `${stock.date} ${stock.time}`;
                    timestamp = new Date(dateTimeStr).getTime() / 1000;
                }

                // Construct proper K-line candle
                // The open should be the previous candle's close (for continuity)
                // But for real-time updates, we use the stock's actual open price from API
                const currentCandle: CandlestickData = {
                    time: timestamp as any,
                    open: stock.open,
                    high: stock.high,
                    low: stock.low,
                    close: stock.price,
                };

                candlestickSeriesRef.current.update(currentCandle);

                // Update volume if we have volume series
                if (volumeSeriesRef.current && stock.volume) {
                    const volumeColor = stock.price >= stock.open ? '#ef4444' : '#10b981';
                    volumeSeriesRef.current.update({
                        time: timestamp as any,
                        value: stock.volume,
                        color: volumeColor,
                    });
                }

                // Update last close for next candle
                lastCloseRef.current = stock.price;
            } catch (err) {
                console.warn("Chart update failed:", err);
            }
        }
    }, [realTimeData, symbol]);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
                horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: 'rgba(156, 163, 175, 0.2)',
            },
            rightPriceScale: {
                borderColor: 'rgba(156, 163, 175, 0.2)',
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Add Candlestick Series with CORRECT COLORS
        // Red (ef4444) = UP (close > open) = Bullish
        // Green (10b981) = DOWN (close < open) = Bearish
        // @ts-ignore - lightweight-charts type definition issue in production build
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#ef4444',        // Red for up
            downColor: '#10b981',      // Green for down
            borderUpColor: '#ef4444',
            borderDownColor: '#10b981',
            wickUpColor: '#ef4444',
            wickDownColor: '#10b981',
        });

        // Add Volume Histogram Series
        // @ts-ignore - lightweight-charts type definition issue in production build
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Create separate price scale for volume
        });

        // Position volume at bottom
        chart.priceScale('').applyOptions({
            scaleMargins: {
                top: 0.7, // Volume takes bottom 30%
                bottom: 0,
            },
        });

        // Position candlestick at top
        candlestickSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.1,
                bottom: 0.4, // Leave room for volume
            },
        });

        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;
        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, []); // Only run once on mount

    // Show error state
    if (error) {
        return (
            <div className="relative w-full h-[400px] bg-card/50 rounded-xl border overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <svg className="w-12 h-12 text-destructive/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-medium">{error}</p>
                    <p className="text-xs">请检查股票代码是否正确</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[400px] bg-card/50 rounded-xl border overflow-hidden backdrop-blur-sm">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 transition-opacity">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    );
}
