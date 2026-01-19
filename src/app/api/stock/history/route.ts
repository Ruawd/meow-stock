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
            url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${code}`;
        } else {
            const periodMap: Record<string, string> = {
                'daily': 'day',
                'weekly': 'week',
                'monthly': 'month'
            };
            const period = periodMap[type] || 'day';
            url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},${period},,,320,qfq`;
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
            // Parse Minute Data
            // Structure: data[code].data.data = ["0930 1381.00 13054", ...] (Time Price Volume)
            // Or data[code].data.data might be different, let's look at previous test output
            // Minute Sample: "0930 1381.90 4172 1382.00 5767424" -> Time, Price, Volume(Sales), AvgPrice, Amount?

            const minData = stockData.data?.data;
            // Also need the date from stockData.data.date usually, to construct full timestamp
            const dateStr = stockData.data?.date; // 20230101

            if (minData && Array.isArray(minData) && dateStr) {
                const year = parseInt(dateStr.substring(0, 4));
                const month = parseInt(dateStr.substring(4, 6)) - 1;
                const day = parseInt(dateStr.substring(6, 8));

                result = minData.map((item: string) => {
                    const parts = item.split(' ');
                    const timeStr = parts[0]; // 0930
                    const price = parseFloat(parts[1]);
                    const volume = parseInt(parts[2]);

                    const hour = parseInt(timeStr.substring(0, 2));
                    const minute = parseInt(timeStr.substring(2, 4));

                    const date = new Date(year, month, day, hour, minute);
                    // Adjust for timezone if server is not in China, but easier to return timestamp
                    // Lightweight charts expects unix timestamp (seconds)
                    // Note: This assumes server is in correct timezone or handling UTC. 
                    // Best to force Beijing time construction.
                    const beijingTime = new Date(Date.UTC(year, month, day, hour - 8, minute)).getTime() / 1000;

                    return {
                        time: beijingTime,
                        value: price,
                        volume: volume * 100 // Lots to shares
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
