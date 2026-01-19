'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStockStore } from '@/store/useStockStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'DEPOSIT' | 'WITHDRAW';
}

export function ExchangeModal({ isOpen, onClose, initialTab = 'DEPOSIT' }: ExchangeModalProps) {
    const { user, fetchUser, updateBalance } = useUserStore();
    const { balance, depositCapital, withdrawCapital } = useStockStore();
    const [action, setAction] = useState<'DEPOSIT' | 'WITHDRAW'>(initialTab);
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Update action when modal opens or initialTab changes
    useEffect(() => {
        if (isOpen) {
            setAction(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    const EXCHANGE_RATE = 10000; // 1 Coin = 10000 Capital

    const handleExchange = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast.error('请输入有效的金额');
            return;
        }

        setIsLoading(true);
        try {
            if (action === 'DEPOSIT') {
                // Deposit: Coin -> Capital
                // Input is Coin amount
                if (user?.credit && val > user.credit.availableBalance) {
                    toast.error('Meow Coin 余额不足');
                    setIsLoading(false);
                    return;
                }

                const res = await depositCapital(val);
                if (res.success) {
                    toast.success(`充值成功：${val} Meow Coin 兑换 ${(val * EXCHANGE_RATE).toLocaleString()} 资金`);
                    if (res.newMeowBalance !== undefined) {
                        updateBalance(res.newMeowBalance);
                    } else {
                        await fetchUser();
                    }
                    onClose();
                    setAmount('');
                } else {
                    toast.error(res.message || '充值失败');
                }

            } else {
                // Withdraw: Capital -> Coin
                // Input is Capital amount
                if (val > balance) {
                    toast.error('账户资金不足');
                    setIsLoading(false);
                    return;
                }

                // Check minimum withdrawal (1 Coin = 10000 Capital)
                const coinVal = val / EXCHANGE_RATE;
                if (coinVal < 0.01) {
                    toast.error(`最低提现金额为 ${EXCHANGE_RATE * 0.01} 资金`);
                    setIsLoading(false);
                    return;
                }

                const res = await withdrawCapital(val);
                if (res.success) {
                    toast.success(`提现成功：${val.toLocaleString()} 资金 兑换 ${coinVal} Meow Coin`);
                    if (res.newMeowBalance !== undefined) {
                        updateBalance(res.newMeowBalance);
                    } else {
                        await fetchUser();
                    }
                    onClose();
                    setAmount('');
                } else {
                    toast.error(res.message || '提现失败');
                }
            }
        } catch (e) {
            toast.error('交易失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">资金划转</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">✕</button>
                </div>

                <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <button
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${action === 'DEPOSIT' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                        onClick={() => setAction('DEPOSIT')}
                    >
                        入金 (充值)
                    </button>
                    <button
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${action === 'WITHDRAW' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                        onClick={() => setAction('WITHDRAW')}
                    >
                        出金 (提现)
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm text-zinc-500">
                        <span>当前汇率:</span>
                        <span>1 Meow Coin ≈ 10,000 资金</span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Meow Coin 余额:</span>
                            <span className="font-mono font-medium">{Number(user?.credit?.availableBalance ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">账户资金:</span>
                            <span className="font-mono font-medium">¥{balance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {action === 'DEPOSIT' ? '入金金额 (Meow Coin)' : '出金金额 (账户资金)'}
                        </label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={action === 'DEPOSIT' ? "输入入金数量..." : "输入出金数量..."}
                            min="0"
                        />
                        {amount && !isNaN(parseFloat(amount)) && (
                            <div className="text-xs text-right text-zinc-500">
                                {action === 'DEPOSIT'
                                    ? `≈ ¥ ${(parseFloat(amount) * EXCHANGE_RATE).toLocaleString()} 资金`
                                    : `≈ ${(parseFloat(amount) / EXCHANGE_RATE).toFixed(4)} Meow Coins`
                                }
                            </div>
                        )}
                    </div>
                </div>

                <Button className="w-full" onClick={handleExchange} disabled={isLoading || !amount}>
                    {isLoading ? '处理中...' : (action === 'DEPOSIT' ? '确认入金' : '确认出金')}
                </Button>
            </div>
        </div>
    );
}
