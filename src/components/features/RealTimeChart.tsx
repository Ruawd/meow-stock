"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { RefreshCcw } from 'lucide-react';

interface RealTimeChartProps {
    symbol: string;
    type: 'min' | 'daily' | 'weekly' | 'monthly';
}

export default function RealTimeChart({ symbol, type }: RealTimeChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    // Fetch Data
    const fetchData = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/stock/history?code=${symbol}&type=${type}`);
            const json = await res.json();

            if (json.data && Array.isArray(json.data) && chartRef.current) {
                const data = json.data;

                // Update Charts
                if (type === 'min') {
                    // Minute Chart: Area + Volume
                    if (areaSeriesRef.current) {
                        areaSeriesRef.current.setData(data.map((d: any) => ({
                            time: d.time as Time,
                            value: d.value
                        })));
                    }
                    if (volumeSeriesRef.current) {
                        volumeSeriesRef.current.setData(data.map((d: any) => ({
                            time: d.time as Time,
                            value: d.volume,
                            color: d.value >= (d.open || d.value) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)' // Simple color logic
                        })));
                    }
                    // Fit Content
                    chartRef.current.timeScale().fitContent();

                } else {
                    // K-line Chart: Candlestick + Volume
                    if (candlestickSeriesRef.current) {
                        candlestickSeriesRef.current.setData(data.map((d: any) => ({
                            time: d.time,
                            // lightweight-charts v5 might be strict about open/high/low/close types
                            open: Number(d.open),
                            high: Number(d.high),
                            low: Number(d.low),
                            close: Number(d.close)
                        })));
                    }
                    if (volumeSeriesRef.current) {
                        volumeSeriesRef.current.setData(data.map((d: any) => ({
                            time: d.time,
                            value: Number(d.volume),
                            color: d.close >= d.open ? 'rgba(239, 83, 80, 0.5)' : 'rgba(38, 166, 154, 0.5)' // Red Up, Green Down (CN Style)
                        })));
                    }

                    // Fit Content initially or load
                    // chartRef.current.timeScale().fitContent(); 
                    // Better to set valid range or let user scroll
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLastUpdate(Date.now());
        }
    }, [symbol, type]);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#D9D9D9',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: 'rgba(42, 46, 57, 0.2)',
            },
            rightPriceScale: {
                borderColor: 'rgba(42, 46, 57, 0.2)',
            }
        });

        chartRef.current = chart;

        // Resize Observer
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
            const newRect = entries[0].contentRect;
            chart.applyOptions({ height: newRect.height, width: newRect.width });
        });

        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    // Manage Series and Data when Type Changes
    useEffect(() => {
        if (!chartRef.current) return;

        // Clean up old series
        if (candlestickSeriesRef.current) {
            chartRef.current.removeSeries(candlestickSeriesRef.current);
            candlestickSeriesRef.current = null;
        }
        if (areaSeriesRef.current) {
            chartRef.current.removeSeries(areaSeriesRef.current);
            areaSeriesRef.current = null;
        }
        if (volumeSeriesRef.current) {
            chartRef.current.removeSeries(volumeSeriesRef.current);
            volumeSeriesRef.current = null;
        }

        // Create new series
        // Now ALL types use CandlestickSeries, including 'min' (1-minute K-line)
        // CN Colors: Up=Red, Down=Green
        const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
            upColor: '#ef5350',
            downColor: '#26a69a',
            borderVisible: false,
            wickUpColor: '#ef5350',
            wickDownColor: '#26a69a',
        });
        candlestickSeriesRef.current = candlestickSeries;

        // 2. Volume Series (Common)
        const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Overlay
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Place at bottom 20%
                bottom: 0,
            },
        });
        volumeSeriesRef.current = volumeSeries;

        // Fetch initial data
        fetchData();

        // Setup Auto Refresh (3s as requested for faster updates)
        const timer = setInterval(fetchData, 3000);

        return () => clearInterval(timer);

    }, [type, symbol, fetchData]);

    return (
        <div className="w-full h-full relative group">
            <div ref={chartContainerRef} className="w-full h-full" />

            {/* Loading / Status Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}
                <span>Last: {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>

            {/* No Data Overlay */}
            {!loading && (!candlestickSeriesRef.current?.data().length) && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
                    暂无数据 (No Data)
                </div>
            )}
        </div>
    );
}
