import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('code');
    const scale = searchParams.get('scale') || '5';

    if (!symbol) {
        return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
    }

    // 1. Virtual Stock History (Stateless)
    if (symbol.toUpperCase() === 'TEST888') {
        const history = [];
        const bars = 200;
        const nowSec = Math.floor(Date.now() / 1000);
        // Snap to nearest 5 minutes if scale is 5? Or just minutes.
        // Let's generate minute bars.

        for (let i = bars; i >= 0; i--) {
            // Time for this bar
            const time = nowSec - (i * 60); // 1 minute steps

            // Replicate the Sine wave logic from Quote API to ensure continuity
            const timeFactor = time;
            const basePrice = 100.00;
            // Matches Quote logic: sin(t) * 5 + cos(t*5) * 0.5
            // But we need Open/High/Low/Close for a specific minute range.
            // Simplified: Use the value at the *end* of the minute as Close.

            const val = (t: number) => basePrice + Math.sin(t) * 5 + Math.cos(t * 5) * 0.5;

            const open = val(time - 60);
            const close = val(time);
            const high = Math.max(open, close) + 0.2;
            const low = Math.min(open, close) - 0.2;

            history.push({
                time: time,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
            });
        }
        return NextResponse.json(history);
    }

    // 2. Real Stock History (East Money API)
    try {
        const datalen = searchParams.get('datalen') || '200';

        // Map symbol to East Money secid
        // sh600519 -> 1.600519
        // sz000001 -> 0.000001
        let secid = '';
        const cleanSymbol = symbol.toLowerCase().replace(/^(sh|sz|bj)/, '');
        if (symbol.toLowerCase().startsWith('sh')) {
            secid = `1.${cleanSymbol}`;
        } else if (symbol.toLowerCase().startsWith('sz')) {
            secid = `0.${cleanSymbol}`;
        } else if (symbol.toLowerCase().startsWith('bj')) {
            secid = `0.${cleanSymbol}`; // Basic BSE support
        } else {
            // Fallback inference
            secid = (cleanSymbol.startsWith('6') ? '1.' : '0.') + cleanSymbol;
        }

        // klt: 101=Day, 102=Week, 103=Month, 1=1min, 5=5min, 15=15min, 30=30min, 60=60min
        let klt = '101'; // Default Daily
        if (scale === '1') klt = '1';
        if (scale === '5') klt = '5';
        if (scale === '15') klt = '15';
        if (scale === '30') klt = '30';
        if (scale === '60') klt = '60';

        const url = `http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=${klt}&fqt=1&lmt=${datalen}&end=20500000&iscca=1&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56`;

        const response = await fetch(url, {
            headers: {
                'Referer': 'http://quote.eastmoney.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 10 } // Short cache for minute data
        });

        if (!response.ok) throw new Error(`EastMoney API error: ${response.status}`);

        const json = await response.json();

        if (!json.data || !json.data.klines) {
            return NextResponse.json([]);
        }

        const chartData = json.data.klines.map((item: string) => {
            const parts = item.split(',');
            // Format: "2024-03-20 15:00,10.5,10.6,10.8,10.4,1000"
            // Date, Open, Close, High, Low, Volume
            const dateStr = parts[0];
            const open = parseFloat(parts[1]);
            const close = parseFloat(parts[2]);
            const high = parseFloat(parts[3]);
            const low = parseFloat(parts[4]);
            const volume = parseFloat(parts[5]);

            let timestamp;
            // lighthouse-charts interprets all timestamps as UTC
            // East Money returns China local time, so we need to offset by +8 hours
            // to make UTC interpretation show correct local time
            const CHINA_OFFSET = 8 * 60 * 60; // 8 hours in seconds

            if (dateStr.includes(' ')) {
                // Minute data: "2024-03-20 15:00"
                const date = new Date(dateStr.replace(' ', 'T') + ':00');
                timestamp = Math.floor(date.getTime() / 1000) + CHINA_OFFSET;
            } else {
                // Daily data: "2024-03-20"
                const date = new Date(dateStr + 'T00:00:00');
                timestamp = Math.floor(date.getTime() / 1000) + CHINA_OFFSET;
            }

            return {
                time: timestamp,
                open,
                high,
                low,
                close,
                volume
            };
        });

        return NextResponse.json(chartData);

    } catch (error) {
        console.error("K-line proxy error:", error);
        return NextResponse.json({ error: 'Failed to fetch k-line data' }, { status: 500 });
    }
}
