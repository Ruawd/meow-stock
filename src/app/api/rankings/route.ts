export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Eastmoney API for stock rankings
        // Market type: m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23 (A股)
        const timestamp = Date.now();

        // Top gainers (sorted by pctChg DESC, limit 10)
        const gainersUrl = `http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f15,f16,f17,f18&_=${timestamp}`;

        // Top losers (sorted by pctChg ASC, limit 10)
        const losersUrl = `http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=0&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f15,f16,f17,f18&_=${timestamp}`;

        const [gainersRes, losersRes] = await Promise.all([
            fetch(gainersUrl, {
                headers: { 'Referer': 'http://quote.eastmoney.com' },
                cache: 'no-store',
            }),
            fetch(losersUrl, {
                headers: { 'Referer': 'http://quote.eastmoney.com' },
                cache: 'no-store',
            })
        ]);

        if (!gainersRes.ok || !losersRes.ok) {
            throw new Error('Failed to fetch rankings');
        }

        const gainersData = await gainersRes.json();
        const losersData = await losersRes.json();

        // Parse response
        const parseStocks = (data: any) => {
            if (!data?.data?.diff) return [];
            return data.data.diff.map((item: any) => ({
                code: item.f12, // 股票代码
                name: item.f14, // 股票名称
                price: item.f2 ? (item.f2 / 100).toFixed(2) : '0.00', // 最新价
                changePercent: item.f3 ? (item.f3 / 100).toFixed(2) : '0.00', // 涨跌幅
                change: item.f4 ? (item.f4 / 100).toFixed(2) : '0.00', // 涨跌额
                high: item.f15 ? (item.f15 / 100).toFixed(2) : '0.00', // 最高
                low: item.f16 ? (item.f16 / 100).toFixed(2) : '0.00', // 最低
                volume: item.f5 || 0, // 成交量
                amount: item.f6 || 0, // 成交额
            }));
        };

        const gainers = parseStocks(gainersData);
        const losers = parseStocks(losersData);

        return Response.json({
            gainers,
            losers,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Rankings API error:', error);
        return Response.json({
            error: 'Failed to fetch rankings',
            gainers: [],
            losers: []
        }, { status: 500 });
    }
}
