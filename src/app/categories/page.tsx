"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Stock Categories Data
const STOCK_CATEGORIES = {
    technology: {
        name: "科技股",
        icon: "💻",
        stocks: [
            { code: "sz300750", name: "宁德时代" },
            { code: "sz002594", name: "比亚迪" },
            { code: "sh688981", name: "中芯国际" },
            { code: "sz000063", name: "中兴通讯" },
            { code: "sz002415", name: "海康威视" },
            { code: "sh600570", name: "恒生电子" },
            { code: "sz000725", name: "京东方A" },
            { code: "sz300782", name: "卓胜微" },
        ],
    },
    finance: {
        name: "金融股",
        icon: "🏦",
        stocks: [
            { code: "sh601318", name: "中国平安" },
            { code: "sh600036", name: "招商银行" },
            { code: "sz000001", name: "平安银行" },
            { code: "sh600016", name: "民生银行" },
            { code: "sh601398", name: "工商银行" },
            { code: "sh601288", name: "农业银行" },
            { code: "sh601939", name: "建设银行" },
            { code: "sh600030", name: "中信证券" },
        ],
    },
    consumer: {
        name: "消费零售",
        icon: "🛒",
        stocks: [
            { code: "sh600519", name: "贵州茅台" },
            { code: "sz000858", name: "五粮液" },
            { code: "sh603288", name: "海天味业" },
            { code: "sz000333", name: "美的集团" },
            { code: "sz000651", name: "格力电器" },
            { code: "sh600887", name: "伊利股份" },
            { code: "sz002352", name: "顺丰控股" },
            { code: "sh601888", name: "中国中免" },
        ],
    },
    healthcare: {
        name: "医药健康",
        icon: "💊",
        stocks: [
            { code: "sz300760", name: "迈瑞医疗" },
            { code: "sh600276", name: "恒瑞医药" },
            { code: "sz000661", name: "长春高新" },
            { code: "sh603259", name: "药明康德" },
            { code: "sz300347", name: "泰格医药" },
            { code: "sz002821", name: "凯莱英" },
            { code: "sz300015", name: "爱尔眼科" },
            { code: "sz002230", name: "科大讯飞" },
        ],
    },
    energy: {
        name: "能源电力",
        icon: "⚡",
        stocks: [
            { code: "sh600900", name: "长江电力" },
            { code: "sh601012", name: "隆基绿能" },
            { code: "sh688599", name: "天合光能" },
            { code: "sh601088", name: "中国神华" },
            { code: "sh600019", name: "宝钢股份" },
            { code: "sh600028", name: "中国石化" },
            { code: "sh601857", name: "中国石油" },
            { code: "sh601225", name: "陕西煤业" },
        ],
    },
    industrial: {
        name: "工业制造",
        icon: "🏭",
        stocks: [
            { code: "sh600031", name: "三一重工" },
            { code: "sz000333", name: "美的集团" },
            { code: "sh601766", name: "中国中车" },
            { code: "sh600585", name: "海螺水泥" },
            { code: "sh600703", name: "三安光电" },
            { code: "sz002460", name: "赣锋锂业" },
            { code: "sh688111", name: "金山办公" },
            { code: "sz300059", name: "东方财富" },
        ],
    },
    realestate: {
        name: "房地产",
        icon: "🏢",
        stocks: [
            { code: "sz000002", name: "万科A" },
            { code: "sh600048", name: "保利发展" },
            { code: "sz001979", name: "招商蛇口" },
            { code: "sh600340", name: "华夏幸福" },
            { code: "sz000069", name: "华侨城A" },
            { code: "sh600606", name: "绿地控股" },
            { code: "sh600383", name: "金地集团" },
            { code: "sz000656", name: "金科股份" },
        ],
    },
    telecom: {
        name: "通信",
        icon: "📡",
        stocks: [
            { code: "sh600050", name: "中国联通" },
            { code: "sh600941", name: "中国移动" },
            { code: "sh601728", name: "中国电信" },
            { code: "sz000063", name: "中兴通讯" },
            { code: "sh600198", name: "大唐电信" },
            { code: "sh600485", name: "信威集团" },
            { code: "sz002313", name: "日海智能" },
            { code: "sz300628", name: "亿联网络" },
        ],
    },
};

type CategoryKey = keyof typeof STOCK_CATEGORIES;

export default function CategoriesPage() {
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const handleStockClick = (code: string) => {
        // Navigate to home page with the stock loaded
        router.push(`/?stock=${code}`);
    };

    // Filter stocks based on search query
    const getFilteredStocks = () => {
        if (!selectedCategory) return [];

        const stocks = STOCK_CATEGORIES[selectedCategory].stocks;
        if (!searchQuery) return stocks;

        return stocks.filter(stock =>
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredStocks = getFilteredStocks();

    return (
        <div className="container mx-auto p-4 space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">自选股票</h1>
                <p className="text-muted-foreground">按行业分类浏览A股上市公司</p>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-3">
                {(Object.keys(STOCK_CATEGORIES) as CategoryKey[]).map((key) => {
                    const category = STOCK_CATEGORIES[key];
                    const isSelected = selectedCategory === key;

                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={cn(
                                "px-4 py-2.5 rounded-lg border-2 transition-all font-medium text-sm flex items-center gap-2",
                                isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                            )}
                        >
                            <span className="text-lg">{category.icon}</span>
                            <span>{category.name}</span>
                            <span className="text-xs opacity-70">({category.stocks.length})</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar (only show when category is selected) */}
            {selectedCategory && (
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索股票名称或代码..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {searchQuery && (
                        <Button
                            variant="outline"
                            onClick={() => setSearchQuery("")}
                        >
                            清除
                        </Button>
                    )}
                </div>
            )}

            {/* Stock List */}
            {selectedCategory ? (
                <div className="bg-card border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">
                            {STOCK_CATEGORIES[selectedCategory].name}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            ({filteredStocks.length} 只股票)
                        </span>
                    </div>

                    {filteredStocks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {
                                filteredStocks.map((stock) => (
                                    <button
                                        key={stock.code}
                                        onClick={() => handleStockClick(stock.code)}
                                        className="p-4 rounded-lg border bg-background hover:bg-muted transition-all hover:border-primary/50 hover:shadow-md text-left group"
                                    >
                                        <div className="font-medium group-hover:text-primary transition-colors">
                                            {stock.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1 uppercase">
                                            {stock.code}
                                        </div>
                                    </button>
                                ))
                            }
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>未找到匹配的股票</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card/50 border border-dashed rounded-xl p-12 text-center">
                    <div className="text-muted-foreground">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">选择一个行业分类</p>
                        <p className="text-sm">点击上方的行业标签查看该类别的股票</p>
                    </div>
                </div>
            )
            }
        </div >
    );
}
