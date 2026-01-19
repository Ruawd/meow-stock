'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStockStore } from '@/store/useStockStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExchangeModal({ isOpen, onClose }: ExchangeModalProps) {
    const { user, fetchUser } = useUserStore();
    const { balance, depositCapital, withdrawCapital } = useStockStore();
    const [action, setAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const EXCHANGE_RATE = 10000; // 1 Coin = 10000 Capital

    const handleExchange = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast.error('Invalid amount');
            return;
        }

        setIsLoading(true);
        try {
            if (action === 'DEPOSIT') {
                // Deposit: Coin -> Capital
                // Input is Coin amount
                if (user?.credit && val > user.credit.availableBalance) {
                    toast.error('Insufficient Meow Coin balance');
                    setIsLoading(false);
                    return;
                }

                const res = await depositCapital(val);
                if (res.success) {
                    toast.success(`Deposited ${val} Coins for ${(val * EXCHANGE_RATE).toLocaleString()} Capital`);
                    await fetchUser(); // Refresh Coin balance
                    onClose();
                    setAmount('');
                } else {
                    toast.error(res.message || 'Deposit failed');
                }

            } else {
                // Withdraw: Capital -> Coin
                // Input is Capital amount
                if (val > balance) {
                    toast.error('Insufficient Game Capital');
                    setIsLoading(false);
                    return;
                }

                // Check minimum withdrawal (1 Coin = 10000 Capital)
                const coinVal = val / EXCHANGE_RATE;
                if (coinVal < 0.01) {
                    toast.error(`Minimum withdrawal is ${EXCHANGE_RATE * 0.01} Capital`);
                    setIsLoading(false);
                    return;
                }

                const res = await withdrawCapital(val);
                if (res.success) {
                    toast.success(`Withdrawn ${val.toLocaleString()} Capital for ${coinVal} Coins`);
                    await fetchUser(); // Refresh Coin balance
                    onClose();
                    setAmount('');
                } else {
                    toast.error(res.message || 'Withdraw failed');
                }
            }
        } catch (e) {
            toast.error('Transaction failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Capital Exchange</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">✕</button>
                </div>

                <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <button
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${action === 'DEPOSIT' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                        onClick={() => setAction('DEPOSIT')}
                    >
                        Deposit (In)
                    </button>
                    <button
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${action === 'WITHDRAW' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                        onClick={() => setAction('WITHDRAW')}
                    >
                        Withdraw (Out)
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm text-zinc-500">
                        <span>Current Rate:</span>
                        <span>1 Meow Coin ≈ 10,000 Capital</span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Meow Coin Balance:</span>
                            <span className="font-mono font-medium">{user?.credit?.availableBalance.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Game Capital:</span>
                            <span className="font-mono font-medium">¥{balance.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {action === 'DEPOSIT' ? 'Amount to Deposit (Meow Coins)' : 'Amount to Withdraw (Game Capital)'}
                        </label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={action === 'DEPOSIT' ? "Enter coins..." : "Enter capital..."}
                            min="0"
                        />
                        {amount && !isNaN(parseFloat(amount)) && (
                            <div className="text-xs text-right text-zinc-500">
                                {action === 'DEPOSIT'
                                    ? `≈ ¥ ${(parseFloat(amount) * EXCHANGE_RATE).toLocaleString()} Capital`
                                    : `≈ ${(parseFloat(amount) / EXCHANGE_RATE).toFixed(4)} Coins`
                                }
                            </div>
                        )}
                    </div>
                </div>

                <Button className="w-full" onClick={handleExchange} disabled={isLoading || !amount}>
                    {isLoading ? 'Processing...' : (action === 'DEPOSIT' ? 'Confirm Deposit' : 'Confirm Withdrawal')}
                </Button>
            </div>
        </div>
    );
}
