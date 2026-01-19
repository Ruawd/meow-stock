import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('id');

        if (!categoryId) {
            return NextResponse.json({
                success: false,
                error: 'Category ID is required'
            }, { status: 400 });
        }

        // East Money API for stocks in a specific sector
        const url = `http://push2.eastmoney.com/api/qt/clist/get?cb=&pn=1&pz=200&po=1&np=1&ut=&fltt=2&invt=2&fid=f3&fs=b:${categoryId}&fields=f12,f14,f2,f3,f4,f5`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'http://quote.eastmoney.com/'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch stocks: ${response.status}`);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        if (!data.data || !data.data.diff) {
            return NextResponse.json({
                success: false,
                error: 'No stocks found for this category'
            }, { status: 404 });
        }

        // Transform stock data
        const stocks = data.data.diff.map((item: any) => {
            const rawCode = item.f12;

            // Infer market from code pattern
            let code = rawCode;
            if (/^(6|5)/.test(rawCode)) {
                code = 'sh' + rawCode;
            } else if (/^(0|3|2)/.test(rawCode)) {
                code = 'sz' + rawCode;
            } else if (/^(4|8)/.test(rawCode)) {
                code = 'bj' + rawCode;
            }

            return {
                code: code.toLowerCase(),
                name: item.f14,
                price: item.f2 || 0,
                change: item.f4 || 0,
                changePercent: item.f3 || 0,
                volume: item.f5 || 0
            };
        });

        // Filter out invalid entries
        const validStocks = stocks.filter((stock: any) =>
            stock.code && stock.name && stock.code.length >= 8
        );

        return NextResponse.json({
            success: true,
            categoryId,
            stocks: validStocks,
            total: validStocks.length,
            timestamp: Date.now()
        });

    } catch (error: any) {
        console.error('Error fetching category stocks:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch stocks'
        }, { status: 500 });
    }
}
