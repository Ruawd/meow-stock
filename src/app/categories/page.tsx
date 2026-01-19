"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrendingUp, Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category {
    id: string;
    name: string;
    icon: string;
    count: number;
    change: number;
}

interface Stock {
    code: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingStocks, setLoadingStocks] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();

            if (data.success) {
                setCategories(data.categories);
            } else {
                setError(data.error || '获取行业分类失败');
            }
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            setError('网络错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    // Fetch stocks when category is selected
    useEffect(() => {
        if (selectedCategory) {
            fetchStocks(selectedCategory);
        } else {
            setStocks([]);
        }
    }, [selectedCategory]);

    const fetchStocks = async (categoryId: string) => {
        setLoadingStocks(true);
        try {
            const response = await fetch(`/api/category-stocks?id=${categoryId}`);
            const data = await response.json();

            if (data.success) {
                setStocks(data.stocks);
            } else {
                setStocks([]);
            }
        } catch (err: any) {
            console.error('Error fetching stocks:', err);
            setStocks([]);
        } finally {
            setLoadingStocks(false);
        }
    };

    const handleStockClick = (code: string) => {
        router.push(`/?stock=${code}`);
    };

    const getFilteredStocks = () => {
        if (!searchQuery) return stocks;

        return stocks.filter(stock =>
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredStocks = getFilteredStocks();
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto p-4 space-y-6 pb-20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">行业板块</h1>
                    <p className="text-muted-foreground">按行业分类浏览A股上市公司</p>
                </div>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">正在加载行业分类...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto p-4 space-y-6 pb-20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">行业板块</h1>
                    <p className="text-muted-foreground">按行业分类浏览A股上市公司</p>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                    <p className="text-lg font-medium mb-2">{error}</p>
                    <Button onClick={fetchCategories} variant="outline" className="mt-4">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重新加载
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">行业板块</h1>
                    <p className="text-muted-foreground">
                        实时行业分类数据 · 共 {categories.length} 个板块
                    </p>
                </div>
                <Button onClick={fetchCategories} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    刷新
                </Button>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-3">
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    const isUp = category.change >= 0;

                    return (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                                "px-4 py-2.5 rounded-lg border-2 transition-all font-medium text-sm flex items-center gap-2",
                                isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                            )}
                        >
                            <span className="text-lg">{category.icon}</span>
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <span>{category.name}</span>
                                    <span className="text-xs opacity-70">({category.count})</span>
                                </div>
                                <div className={cn(
                                    "text-xs font-mono",
                                    isUp ? "text-[color:var(--up)]" : "text-[color:var(--down)]"
                                )}>
                                    {isUp ? '+' : ''}{category.change.toFixed(2)}%
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
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
                            {selectedCategoryData?.name || '加载中...'}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            ({filteredStocks.length} 只股票)
                        </span>
                    </div>

                    {loadingStocks ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="ml-3 text-muted-foreground">正在加载股票数据...</span>
                        </div>
                    ) : filteredStocks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredStocks.map((stock) => {
                                const isUp = stock.changePercent >= 0;
                                return (
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
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-mono">
                                                ¥{(stock.price || 0).toFixed(2)}
                                            </span>
                                            <span className={cn(
                                                "text-xs font-mono font-semibold",
                                                isUp ? "text-[color:var(--up)]" : "text-[color:var(--down)]"
                                            )}>
                                                {isUp ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
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
                        <p className="text-lg font-medium mb-2">选择一个行业板块</p>
                        <p className="text-sm">点击上方的板块标签查看该行业的股票</p>
                    </div>
                </div>
            )}
        </div>
    );
}
