import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type') || 'min'; // min, daily, weekly, monthly

    if (!code) {
        return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
    }

    try {
        let url = '';
        // Tencent API Parameters
        // min: http://web.ifzq.gtimg.cn/appstock/app/minute/query?code=sh600519
        // daily: http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,320,qfq
        // weekly: param=...,week,,,320,qfq
        // monthly: param=...,month,,,320,qfq

        if (type === 'min') {
            // Use mkline for 1-minute K-line data
            // http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sh600519,m1,,640
            url = `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m1,,320`;
        } else {
            const periodMap: Record<string, string> = {
                'daily': 'day',
                'weekly': 'week',
                'monthly': 'month'
            };
            const period = periodMap[type] || 'day';
            url = `http://ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},${period},,,320,qfq`;
        }

        const response = await fetch(url, {
            headers: {
                'Referer': 'https://gu.qq.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Upstream API error: ${response.status}`);
        }

        const data = await response.json();

        // Parse Logic
        let result: any[] = [];
        const stockData = data.data?.[code];

        if (!stockData) {
            return NextResponse.json({ data: [] });
        }

        if (type === 'min') {
            // Parse 1-Min K-line Data
            // Structure: data[code].m1 = [["202301010930", "10.0", "10.1", "10.2", "9.9", "1000"], ...]
            // [Time(YYYYMMDDHHMM), Open, Close, High, Low, Volume, ...]

            const m1Data = stockData.m1;

            if (m1Data && Array.isArray(m1Data)) {
                result = m1Data.map((item: string[]) => {
                    const timeStr = item[0]; // 202301010930
                    const year = parseInt(timeStr.substring(0, 4));
                    const month = parseInt(timeStr.substring(4, 6)) - 1;
                    const day = parseInt(timeStr.substring(6, 8));
                    const hour = parseInt(timeStr.substring(8, 10));
                    const minute = parseInt(timeStr.substring(10, 12));

                    // Convert to unix timestamp (seconds)
                    // Treat as Beijing Time (UTC+8) -> UTC
                    const time = new Date(Date.UTC(year, month, day, hour - 8, minute)).getTime() / 1000;

                    return {
                        time: time,
                        open: parseFloat(item[1]),
                        close: parseFloat(item[2]),
                        high: parseFloat(item[3]),
                        low: parseFloat(item[4]),
                        volume: parseFloat(item[5]) * 100 // Lots to shares if needed, usually m1 vol is lots too
                    };
                });
            }

        } else {
            // Parse K-line Data (Day/Week/Month)
            // Structure: stockData.day = [["2023-01-01", "10.0", "11.0", "9.0", "10.5", "1000"], ...]
            // [Date, Open, Close, High, Low, Volume, ...]

            const periodMap: Record<string, string> = {
                'daily': 'day',
                'weekly': 'week',
                'monthly': 'month'
            };
            const key = periodMap[type] || 'day';
            const klineData = stockData[key];

            if (klineData && Array.isArray(klineData)) {
                result = klineData.map((item: string[]) => {
                    // Item: [Date, Open, Close, High, Low, Volume, ...]
                    return {
                        time: item[0], // YYYY-MM-DD
                        open: parseFloat(item[1]),
                        close: parseFloat(item[2]),
                        high: parseFloat(item[3]),
                        low: parseFloat(item[4]),
                        volume: parseFloat(item[5]) * 100 // Lots to shares
                    };
                });
            }
        }

        return NextResponse.json({ data: result });

    } catch (error: any) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
