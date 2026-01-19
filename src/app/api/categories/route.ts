import { NextResponse } from 'next/server';

// Category icon mapping based on keywords
const getCategoryIcon = (name: string): string => {
    if (name.includes('新能源') || name.includes('电力') || name.includes('光伏') || name.includes('风电')) return '⚡';
    if (name.includes('汽车') || name.includes('车') || name.includes('整车')) return '🚗';
    if (name.includes('半导体') || name.includes('芯片') || name.includes('集成电路')) return '💻';
    if (name.includes('医药') || name.includes('医疗') || name.includes('生物')) return '💊';
    if (name.includes('银行') || name.includes('金融') || name.includes('证券') || name.includes('保险')) return '🏦';
    if (name.includes('房地产') || name.includes('地产') || name.includes('建筑')) return '🏢';
    if (name.includes('食品') || name.includes('饮料') || name.includes('白酒') || name.includes('消费')) return '🛒';
    if (name.includes('通信') || name.includes('5G') || name.includes('电信')) return '📡';
    if (name.includes('软件') || name.includes('互联网') || name.includes('科技')) return '💻';
    if (name.includes('化工') || name.includes('化学')) return '🧪';
    if (name.includes('机械') || name.includes('制造') || name.includes('工业')) return '🏭';
    if (name.includes('钢铁') || name.includes('有色') || name.includes('金属')) return '⚙️';
    if (name.includes('煤炭') || name.includes('石油') || name.includes('能源')) return '⛽';
    if (name.includes('纺织') || name.includes('服装')) return '👔';
    if (name.includes('航空') || name.includes('运输') || name.includes('物流')) return '✈️';
    if (name.includes('旅游') || name.includes('酒店') || name.includes('餐饮')) return '🏨';
    if (name.includes('传媒') || name.includes('影视') || name.includes('文化')) return '📺';
    if (name.includes('教育')) return '📚';
    if (name.includes('农业') || name.includes('种植') || name.includes('养殖')) return '🌾';
    return '📊'; // Default icon
};

export async function GET() {
    try {
        // East Money API endpoint for industry sectors
        // fs=m:90+t:2 means industry classification
        const url = 'http://push2.eastmoney.com/api/qt/clist/get?cb=&pn=1&pz=100&po=1&np=1&ut=&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f12,f14,f2,f3,f62,f128,f136';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'http://quote.eastmoney.com/'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        if (!data.data || !data.data.diff) {
            return NextResponse.json({
                success: false,
                error: 'Invalid data format from API'
            }, { status: 500 });
        }

        // Transform the data
        const categories = data.data.diff.map((item: any) => ({
            id: item.f12,              // Board code (e.g., BK0447)
            name: item.f14,            // Board name
            price: item.f2 || 0,       // Current price/index
            change: item.f3 || 0,      // Change percentage
            count: item.f62 || 0,      // Number of stocks
            icon: getCategoryIcon(item.f14 || '')
        }));

        // Filter out invalid entries and sort by change percentage
        const validCategories = categories
            .filter((cat: any) => cat.name && cat.id)
            .sort((a: any, b: any) => (b.change || 0) - (a.change || 0));

        return NextResponse.json({
            success: true,
            categories: validCategories,
            timestamp: Date.now()
        });

    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch categories'
        }, { status: 500 });
    }
}
