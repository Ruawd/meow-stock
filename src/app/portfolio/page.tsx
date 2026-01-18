"use client";

import { Portfolio } from "@/components/features/Portfolio";
import { useStockStore } from "@/store/useStockStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";



export default function PortfolioPage() {
    const { transactions } = useStockStore();

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">我的持仓</h1>
                <p className="text-muted-foreground">管理您的持仓和查看交易历史</p>
            </div>

            <Portfolio />

            <div className="rounded-xl border bg-card shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">交易记录</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>股票</TableHead>
                            <TableHead className="text-right">价格</TableHead>
                            <TableHead className="text-right">数量</TableHead>
                            <TableHead className="text-right">总额</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    暂无交易记录
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {new Date(tx.date).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className={tx.type === 'BUY' ? 'text-up font-bold' : 'text-down font-bold'}>
                                            {tx.type === 'BUY' ? '买入' : '卖出'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div>{tx.name}</div>
                                        <div className="text-xs text-muted-foreground">{tx.symbol}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">¥{tx.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                                    <TableCell className="text-right font-mono">¥{(tx.price * tx.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
