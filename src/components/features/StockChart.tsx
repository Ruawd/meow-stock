"use client";

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode } from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { Clock, Activity, Settings, Plus, Camera, Search, ChevronDown, MousePointer2, Move, Pencil, Type, Ruler, RefreshCw } from 'lucide-react';
import { calculateSMA, calculateMACD, calculateRSI } from '@/lib/indicators';

interface StockChartProps {
    symbol: string;
}

type Interval = 'D' | '1' | '5' | '15' | '30' | '60';

const INTERVALS: { label: string; value: Interval }[] = [
    { label: '分时', value: '1' },
    { label: '5分', value: '5' },
    { label: '15分', value: '15' },
    { label: '30分', value: '30' },
    { label: '1小时', value: '60' },
    { label: '日K', value: 'D' },
];

export const StockChart = memo(function StockChart({ symbol }: StockChartProps) {
    const mainChartContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);

    const mainChartRef = useRef<any>(null);
    const macdChartRef = useRef<any>(null);
    const rsiChartRef = useRef<any>(null);

    // Data Refs
    const candlestickSeriesRef = useRef<any>(null);
    const volumeSeriesRef = useRef<any>(null);
    const ma5SeriesRef = useRef<any>(null);
    const ma10SeriesRef = useRef<any>(null);
    const ma20SeriesRef = useRef<any>(null);

    // Indicator Refs
    const macdDiffSeriesRef = useRef<any>(null);
    const macdDeaSeriesRef = useRef<any>(null);
    const macdHistSeriesRef = useRef<any>(null);
    const rsiSeriesRef = useRef<any>(null);
    const rsiOverboughtRef = useRef<any>(null);
    const rsiOversoldRef = useRef<any>(null);

    // State
    const [interval, setInterval] = useState<Interval>('15');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMACD, setShowMACD] = useState(true);
    const [showRSI, setShowRSI] = useState(true);
    const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);

    // Sync Helper - simplified for lightweight-charts v5
    const syncCharts = useCallback(() => {
        const charts = [mainChartRef.current, macdChartRef.current, rsiChartRef.current].filter(Boolean);

        charts.forEach((chart, index) => {
            if (!chart) return;
            // Sync visible range across charts
            chart.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
                charts.forEach((otherChart, otherIndex) => {
                    if (index !== otherIndex && otherChart) {
                        try {
                            otherChart.timeScale().setVisibleLogicalRange(range);
                        } catch (e) {
                            // Ignore sync errors
                        }
                    }
                });
            });
        });
    }, []);

    // Initialize Charts
    useEffect(() => {
        if (!mainChartContainerRef.current) return;

        const commonOptions = {
            layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
            grid: { vertLines: { color: 'rgba(42, 46, 57, 0.4)' }, horzLines: { color: 'rgba(42, 46, 57, 0.4)' } },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: 'rgba(156, 163, 175, 0.2)',
            },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(156, 163, 175, 0.2)' },
        };

        // Main Chart
        if (!mainChartRef.current) {
            const chart = createChart(mainChartContainerRef.current, {
                ...commonOptions,
                height: 400,
            });

            candlestickSeriesRef.current = chart.addSeries(CandlestickSeries, {
                upColor: '#089981', downColor: '#f23645', borderUpColor: '#089981', borderDownColor: '#f23645', wickUpColor: '#089981', wickDownColor: '#f23645',
            });
            ma5SeriesRef.current = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1 });
            ma10SeriesRef.current = chart.addSeries(LineSeries, { color: '#B71C1C', lineWidth: 1 });
            ma20SeriesRef.current = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 1 });
            volumeSeriesRef.current = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' }); // Overlay scale

            chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
            mainChartRef.current = chart;
        }

        // MACD Chart
        if (!macdChartRef.current && macdContainerRef.current) {
            const chart = createChart(macdContainerRef.current, {
                ...commonOptions,
                height: 150,
                timeScale: { visible: false }, // Hide time scale for sub charts
            });
            macdDiffSeriesRef.current = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1 });
            macdDeaSeriesRef.current = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 1 });
            macdHistSeriesRef.current = chart.addSeries(HistogramSeries, { color: '#26a69a' });
            macdChartRef.current = chart;
        }

        // RSI Chart
        if (!rsiChartRef.current && rsiContainerRef.current) {
            const chart = createChart(rsiContainerRef.current, {
                ...commonOptions,
                height: 100,
                timeScale: { visible: false },
            });
            rsiSeriesRef.current = chart.addSeries(LineSeries, { color: '#9d75eb', lineWidth: 1 });

            // RSI Bands (Overbought/Oversold manually simulated with lines if needed, or simple horizontal lines)
            // Lightweight charts doesn't have "horizontal line" primitive other than PriceLine, but PriceLine is attached to series.
            // We can just imply it or use grid lines. For now simple RSI line.
            rsiChartRef.current = chart;
        }

        syncCharts();

        // Resize
        const handleResize = () => {
            if (mainChartContainerRef.current) mainChartRef.current?.applyOptions({ width: mainChartContainerRef.current.clientWidth });
            if (macdContainerRef.current) macdChartRef.current?.applyOptions({ width: macdContainerRef.current.clientWidth });
            if (rsiContainerRef.current) rsiChartRef.current?.applyOptions({ width: rsiContainerRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, [syncCharts, showMACD, showRSI]); // Re-run if pane visibility changes might need re-init but refs prevent duplicate

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                let scaleParam = '15';
                if (interval === '1') scaleParam = '1';
                if (interval === '5') scaleParam = '5';
                if (interval === '15') scaleParam = '15';
                if (interval === '30') scaleParam = '30';
                if (interval === '60') scaleParam = '60';
                if (interval === 'D') scaleParam = '101';

                const res = await fetch(`/api/kline?code=${symbol}&scale=${scaleParam}&datalen=500`);
                if (!res.ok) throw new Error('Data fetch failed');
                const data = await res.json();

                if (!Array.isArray(data) || data.length === 0) throw new Error('No Data');

                // Main Chart
                candlestickSeriesRef.current.setData(data);
                volumeSeriesRef.current.setData(data.map((d: any) => ({
                    time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(8, 153, 129, 0.3)' : 'rgba(242, 54, 69, 0.3)'
                })));

                // MA
                ma5SeriesRef.current.setData(calculateSMA(data, 5));
                ma10SeriesRef.current.setData(calculateSMA(data, 10));
                ma20SeriesRef.current.setData(calculateSMA(data, 20));

                // Indicators
                if (showMACD && macdDiffSeriesRef.current) {
                    const macd = calculateMACD(data);
                    macdDiffSeriesRef.current.setData(macd.diff);
                    macdDeaSeriesRef.current.setData(macd.dea);
                    macdHistSeriesRef.current.setData(macd.hist);
                }

                if (showRSI && rsiSeriesRef.current) {
                    const rsi = calculateRSI(data);
                    rsiSeriesRef.current.setData(rsi);
                }

            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLastUpdate(new Date());
            }
        };
        loadData();
    }, [symbol, interval, showMACD, showRSI]);

    const handleManualRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="flex w-full bg-[#131722] rounded-xl border border-gray-800 overflow-hidden shadow-2xl h-[700px]">
            {/* Left Toolbar (Visual Only) */}
            <div className="w-12 border-r border-[#2a2e39] flex flex-col items-center py-4 gap-6 bg-[#1e222d] text-gray-400">
                <MousePointer2 className="w-5 h-5 hover:text-[#2962FF] cursor-pointer" />
                <div className="w-8 h-px bg-[#2a2e39]" />
                <Move className="w-5 h-5 hover:text-[#2962FF] cursor-pointer" />
                <Pencil className="w-5 h-5 hover:text-[#2962FF] cursor-pointer" />
                <Type className="w-5 h-5 hover:text-[#2962FF] cursor-pointer" />
                <div className="w-8 h-px bg-[#2a2e39]" />
                <Ruler className="w-5 h-5 hover:text-[#2962FF] cursor-pointer" />
            </div>

            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39] bg-[#131722]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[#d1d4dc] font-bold">
                            <Search className="w-4 h-4 text-gray-500" />
                            <span>{symbol}</span>
                        </div>
                        <div className="w-px h-5 bg-[#2a2e39]" />
                        <div className="flex gap-1">
                            {INTERVALS.map(i => (
                                <button
                                    key={i.value}
                                    onClick={() => setInterval(i.value)}
                                    className={cn("px-2 py-1 text-sm rounded hover:bg-[#2a2e39] transition", interval === i.value ? "text-[#2962FF]" : "text-[#b2b5be]")}
                                >
                                    {i.label}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-5 bg-[#2a2e39]" />
                        <div className="relative">
                            <button
                                onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
                                className="flex items-center gap-1 text-[#b2b5be] hover:text-[#2962FF] text-sm font-medium"
                            >
                                <Activity className="w-4 h-4" />
                                <span>指标</span>
                            </button>
                            {/* Indicator Menu */}
                            {showIndicatorsMenu && (
                                <div className="absolute top-8 left-0 w-48 bg-[#1e222d] border border-[#2a2e39] rounded shadow-xl z-50 p-2">
                                    <div
                                        onClick={() => setShowMACD(!showMACD)}
                                        className={cn("flex items-center justify-between p-2 rounded cursor-pointer hover:bg-[#2a2e39]", showMACD ? "text-[#2962FF]" : "text-gray-400")}
                                    >
                                        <span>MACD</span>
                                        {showMACD && <div className="w-2 h-2 bg-[#2962FF] rounded-full" />}
                                    </div>
                                    <div
                                        onClick={() => setShowRSI(!showRSI)}
                                        className={cn("flex items-center justify-between p-2 rounded cursor-pointer hover:bg-[#2a2e39]", showRSI ? "text-[#2962FF]" : "text-gray-400")}
                                    >
                                        <span>RSI (相对强弱)</span>
                                        {showRSI && <div className="w-2 h-2 bg-[#2962FF] rounded-full" />}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">
                            更新: {lastUpdate.toLocaleTimeString('zh-CN')}
                        </span>
                        <button
                            onClick={handleManualRefresh}
                            disabled={loading || refreshing}
                            className="p-1.5 text-gray-400 hover:text-[#2962FF] rounded transition-colors disabled:opacity-50"
                            title="刷新数据"
                        >
                            <RefreshCw className={cn("w-4 h-4", (loading || refreshing) && "animate-spin")} />
                        </button>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/80 z-50 backdrop-blur-sm">
                            <span className="loading loading-spinner text-primary"></span>
                        </div>
                    )}

                    {/* Main Chart */}
                    <div className="flex-1 relative border-b border-[#2a2e39]">
                        <div ref={mainChartContainerRef} className="w-full h-full" />
                        {/* Legend Overlay */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 text-xs select-none pointer-events-none">
                            <div className="flex gap-2">
                                <span className="text-green-500">开=...</span>
                                <span className="text-red-500">收=...</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-[#2962FF]">MA5</span>
                                <span className="text-[#B71C1C]">MA10</span>
                                <span className="text-[#FF6D00]">MA20</span>
                            </div>
                        </div>
                    </div>

                    {/* MACD Pane */}
                    {showMACD && (
                        <div className="h-[150px] border-b border-[#2a2e39] relative">
                            <div className="absolute top-1 left-1 text-[10px] text-gray-500 z-10 font-bold">MACD (12, 26, 9)</div>
                            <div ref={macdContainerRef} className="w-full h-full" />
                        </div>
                    )}

                    {/* RSI Pane */}
                    {showRSI && (
                        <div className="h-[100px] relative">
                            <div className="absolute top-1 left-1 text-[10px] text-[#9d75eb] z-10 font-bold">RSI (14)</div>
                            <div ref={rsiContainerRef} className="w-full h-full" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
