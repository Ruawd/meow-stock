"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries } from 'lightweight-charts';
import { useStockData } from '@/hooks/useStockData';

interface StockChartProps {
    symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const [loading, setLoading] = useState(true);

    // Poll for real-time updates to append to chart
    const { data: realTimeData } = useStockData([symbol], 2000); // 2s polling to catch 5s updates

    // Fetch Historical Data
    useEffect(() => {
        const fetchHistory = async () => {
            if (!chartRef.current) return;
            setLoading(true);
            try {
                // Scale 5 = 5 Minute Candles
                const res = await fetch(`/api/kline?code=${symbol}&scale=5&datalen=242`);
                const history = await res.json();

                if (Array.isArray(history) && seriesRef.current) {
                    seriesRef.current.setData(history);
                }
            } catch (e) {
                console.error("Failed to load chart history", e);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [symbol]);

    // Update with Real-time Data
    useEffect(() => {
        const stock = realTimeData[symbol];
        if (stock && seriesRef.current) {
            try {
                // Real-time update logic
                // PREVIOUS BUG: We used Date.now() which forced candles to "now" even if market closed (Sunday).
                // FIX: Use the actual date/time string from the API.
                // stock.date = "2023-10-27", stock.time = "10:35:00"

                let timestamp;

                if (symbol.toLowerCase().includes('test888')) {
                    // For TEST888, we trust the API or just use current time for smooth animation if desired
                    // But API sends synced time now.
                    const dateTimeStr = `${stock.date} ${stock.time}`;
                    timestamp = new Date(dateTimeStr).getTime() / 1000;
                } else {
                    // For Real Stocks, standard parsing
                    // Note: Sina returns time as "15:00:00" for close.
                    const dateTimeStr = `${stock.date} ${stock.time}`;
                    timestamp = new Date(dateTimeStr).getTime() / 1000;
                }

                // Align to minute (optional, but LWC handles it if secondsVisible=true)
                // If we want 5-minute ticks? 
                // Let's passed exact timestamp if secondsVisible is true.

                // Construct candle
                const currentCandle = {
                    time: timestamp as any,
                    open: stock.open,
                    high: stock.high,
                    low: stock.low,
                    close: stock.price,
                };

                seriesRef.current.update(currentCandle);
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
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',
            downColor: '#10b981',
            borderUpColor: '#ef4444',
            borderDownColor: '#10b981',
            wickUpColor: '#ef4444',
            wickDownColor: '#10b981',
        });

        seriesRef.current = candlestickSeries;
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
        };
    }, []);

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
