import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
    }

    const codes = code.split(',').map(c => c.trim()).join(',');
    const data: Record<string, any> = {};

    // 1. Handle Virtual Stock (TEST888) - Stateless Deterministic Logic
    // Check case-insensitive
    if (codes.toUpperCase().includes('TEST888')) {
        const now = Date.now();
        // Use Sine wave to generate a price that moves over time but is deterministic
        // Update only every 5 seconds to reduce volatility speed as requested
        const step = 5000;
        const timeValue = Math.floor(now / step) * step;
        const timeFactor = timeValue / 1000;

        const basePrice = 100.00;
        const oscillation = Math.sin(timeFactor) * 5;
        const noise = Math.cos(timeFactor * 5) * 0.5;

        let currentPrice = basePrice + oscillation + noise;

        // Calculate "Previous Close" (Yesterday)
        const prevClose = 100.00;

        const change = currentPrice - prevClose;
        const changePercent = (change / prevClose) * 100;

        // Use symbol from query or default to TEST888
        // If code search was lowercase, we should try to return key in case requested?
        // But app normalizes to lowercase now. So key 'TEST888' is fine.

        // Format Date/Time to China Standard Time (UTC+8)
        const nowObj = new Date();
        const chinaDate = new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(nowObj).replace(/\//g, '-'); // 2023-01-01

        const chinaTime = new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(nowObj);

        data['TEST888'] = {
            symbol: 'TEST888',
            name: '虚拟测试股',
            open: 100.00,
            prevClose: prevClose,
            price: parseFloat(currentPrice.toFixed(2)),
            high: parseFloat((currentPrice * 1.02).toFixed(2)),
            low: parseFloat((currentPrice * 0.98).toFixed(2)),
            volume: 10000 + Math.floor(Math.abs(oscillation) * 1000),
            amount: 1000000,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            date: chinaDate,
            time: chinaTime,
        };
    }

    // 2. Handle Real Stocks (Sina Proxy)
    const realCodes = codes.split(',').filter(c => c.toUpperCase() !== 'TEST888').join(',');

    if (realCodes) {
        try {
            // Use Tencent API (Free & Realtime)
            const response = await fetch(`http://qt.gtimg.cn/q=${realCodes}`, {
                cache: 'no-store',
            });

            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const text = new TextDecoder('gbk').decode(buffer);
                const lines = text.split('\n');

                lines.forEach(line => {
                    // v_sz000001="51~Name~Code~Price~PrevClose~Open~Vol~..."
                    const matches = line.match(/v_(\w+)="([^"]+)";/);
                    if (matches) {
                        const symbol = matches[1]; // sz000001
                        const content = matches[2];

                        if (!content || content.trim() === '') return;

                        const parts = content.split('~');

                        // Tencent Field Mapping:
                        // 1: Name
                        // 2: Code
                        // 3: Current Price
                        // 4: Prev Close
                        // 5: Open
                        // 6: Volume (Lots / Hand) -> * 100 for Shares
                        // 33: High
                        // 34: Low
                        // 37: Amount (Wan / 10k) -> * 10000 for standard unit
                        // 30: Timestamp (YYYYMMDDHHMMSS)

                        if (parts.length > 30) {
                            const price = parseFloat(parts[3]);
                            const prevClose = parseFloat(parts[4]);
                            const change = price - prevClose;
                            const changePercent = prevClose === 0 ? 0 : (change / prevClose) * 100;

                            // Parse Date/Time
                            const rawTime = parts[30]; // 20230101120000
                            let dateStr = '';
                            let timeStr = '';
                            if (rawTime && rawTime.length === 14) {
                                dateStr = `${rawTime.substring(0, 4)}-${rawTime.substring(4, 6)}-${rawTime.substring(6, 8)}`;
                                timeStr = `${rawTime.substring(8, 10)}:${rawTime.substring(10, 12)}:${rawTime.substring(12, 14)}`;
                            }

                            data[symbol] = {
                                symbol: symbol,
                                name: parts[1],
                                open: parseFloat(parts[5]),
                                prevClose: prevClose,
                                price: price,
                                high: parseFloat(parts[33]),
                                low: parseFloat(parts[34]),
                                volume: parseFloat(parts[6]) * 100, // Lots to Shares
                                amount: parseFloat(parts[37]) * 10000, // Wan to Unit
                                change: parseFloat(change.toFixed(2)),
                                changePercent: parseFloat(changePercent.toFixed(2)),
                                date: dateStr,
                                time: timeStr,
                            };
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Proxy error:", error);
        }
    }

    return NextResponse.json(data);
}
