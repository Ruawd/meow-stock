import { useEffect, useRef } from 'react';
import { useStockStore } from '@/store/useStockStore';
import { useStockData } from '@/hooks/useStockData';
import { toast } from 'sonner';

/**
 * Hook to monitor and auto-execute limit orders when price conditions are met
 */
export function useOrderMonitor() {
    const { pendingOrders, executeLimitOrder } = useStockStore();
    const symbols = pendingOrders.map(o => o.symbol);
    const { data } = useStockData(symbols, 3000);

    // Track which orders have been notified to avoid spam
    const notifiedOrders = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (pendingOrders.length === 0) return;

        pendingOrders.forEach(order => {
            const currentPrice = data[order.symbol]?.price;
            if (!currentPrice) return;

            let shouldExecute = false;

            // Check execution conditions
            if (order.type === 'BUY' && currentPrice <= order.targetPrice) {
                shouldExecute = true;
            } else if (order.type === 'SELL' && currentPrice >= order.targetPrice) {
                shouldExecute = true;
            }

            if (shouldExecute && !notifiedOrders.current.has(order.id)) {
                // Mark as notified
                notifiedOrders.current.add(order.id);

                // Execute the order
                executeLimitOrder(order.id, currentPrice);

                // Show success notification
                toast.success(`Limit ${order.type} Order Executed! 🎯`, {
                    description: `${order.quantity} shares of ${order.name} @ ¥${currentPrice.toFixed(2)}`,
                    duration: 5000,
                });
            }
        });

        // Clean up notified orders that are no longer pending
        const pendingIds = new Set(pendingOrders.map(o => o.id));
        notifiedOrders.current.forEach(id => {
            if (!pendingIds.has(id)) {
                notifiedOrders.current.delete(id);
            }
        });
    }, [data, pendingOrders, executeLimitOrder]);
}
