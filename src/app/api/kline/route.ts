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

    // 2. Real Stock History
    try {
        const datalen = searchParams.get('datalen') || '242';
        const url = `http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=${scale}&ma=no&datalen=${datalen}`;

        const response = await fetch(url, {
            headers: { 'Referer': 'https://finance.sina.com.cn' },
            next: { revalidate: 30 }
        });

        if (!response.ok) throw new Error(`Sina API error: ${response.status}`);

        const data = await response.json();

        const chartData = data.map((item: any) => {
            let timestamp;
            const dateStr = item.day;
            if (dateStr.length === 10) {
                timestamp = new Date(dateStr + "T00:00:00").getTime() / 1000;
            } else {
                timestamp = new Date(dateStr).getTime() / 1000;
            }

            return {
                time: timestamp,
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
            };
        });

        return NextResponse.json(chartData);

    } catch (error) {
        console.error("K-line proxy error:", error);
        return NextResponse.json({ error: 'Failed to fetch k-line data' }, { status: 500 });
    }
}
