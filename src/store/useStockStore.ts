import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Holding {
    symbol: string;
    name: string;
    quantity: number;
    averagePrice: number;
}

export interface Transaction {
    id: string;
    type: 'BUY' | 'SELL';
    symbol: string;
    name: string;
    price: number;
    quantity: number;
    date: string;
    realizedPnL?: number; // Only for SELL transactions: (sellPrice - avgCost) * quantity
}

export interface LimitOrder {
    id: string;
    symbol: string;
    name: string;
    type: 'BUY' | 'SELL';
    targetPrice: number;
    quantity: number;
    createdAt: number;
    status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
}

interface StockState {
    balance: number;
    holdings: Holding[];
    transactions: Transaction[];
    pendingOrders: LimitOrder[];
    favorites: string[]; // Array of stock codes (symbols)

    // Actions
    buyStock: (symbol: string, name: string, price: number, quantity: number) => void;
    sellStock: (symbol: string, name: string, price: number, quantity: number) => void;
    createLimitOrder: (order: Omit<LimitOrder, 'id' | 'createdAt' | 'status'>) => void;
    cancelOrder: (orderId: string) => void;
    executeLimitOrder: (orderId: string, executionPrice: number) => void;
    checkAndExecuteOrders: (prices: Record<string, number>) => void;
    addFavorite: (symbol: string) => void;
    removeFavorite: (symbol: string) => void;
    isFavorite: (symbol: string) => boolean;
    resetAccount: () => void;
}

export const useStockStore = create<StockState>()(
    persist(
        (set, get) => ({
            balance: 1000000, // Initial balance: 1 Million RMB
            holdings: [],
            transactions: [],
            pendingOrders: [],
            favorites: [],

            buyStock: (symbol, name, price, quantity) => {
                const { balance, holdings, transactions } = get();
                const totalCost = price * quantity;

                if (balance < totalCost) {
                    console.error("Insufficient funds");
                    return;
                }

                const existingHolding = holdings.find((h) => h.symbol === symbol);
                let newHoldings;

                if (existingHolding) {
                    const totalShares = existingHolding.quantity + quantity;
                    const totalValue = existingHolding.averagePrice * existingHolding.quantity + totalCost;
                    const newAvgPrice = totalValue / totalShares;

                    newHoldings = holdings.map((h) =>
                        h.symbol === symbol
                            ? { ...h, quantity: totalShares, averagePrice: newAvgPrice }
                            : h
                    );
                } else {
                    newHoldings = [
                        ...holdings,
                        { symbol, name, quantity, averagePrice: price },
                    ];
                }

                set({
                    balance: balance - totalCost,
                    holdings: newHoldings,
                    transactions: [
                        {
                            id: crypto.randomUUID(),
                            type: 'BUY',
                            symbol,
                            name,
                            price,
                            quantity,
                            date: new Date().toISOString(),
                        },
                        ...transactions,
                    ],
                });
            },

            sellStock: (symbol, name, price, quantity) => {
                const { balance, holdings, transactions } = get();
                const existingHolding = holdings.find((h) => h.symbol === symbol);

                if (!existingHolding || existingHolding.quantity < quantity) {
                    console.error("Insufficient shares");
                    return;
                }

                const totalRevenue = price * quantity;
                let newHoldings;

                if (existingHolding.quantity === quantity) {
                    newHoldings = holdings.filter((h) => h.symbol !== symbol);
                } else {
                    newHoldings = holdings.map((h) =>
                        h.symbol === symbol
                            ? { ...h, quantity: h.quantity - quantity }
                            : h
                    );
                }

                // Calculate realized P/L: (sell price - average cost) * quantity
                const realizedPnL = (price - existingHolding.averagePrice) * quantity;

                set({
                    balance: balance + totalRevenue,
                    holdings: newHoldings,
                    transactions: [
                        {
                            id: crypto.randomUUID(),
                            type: 'SELL',
                            symbol,
                            name,
                            price,
                            quantity,
                            date: new Date().toISOString(),
                            realizedPnL, // Record the actual profit/loss
                        },
                        ...transactions,
                    ],
                });
            },

            createLimitOrder: (order) => {
                const { pendingOrders } = get();
                const newOrder: LimitOrder = {
                    ...order,
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    status: 'PENDING',
                };

                set({
                    pendingOrders: [...pendingOrders, newOrder],
                });
            },

            cancelOrder: (orderId) => {
                const { pendingOrders } = get();
                set({
                    pendingOrders: pendingOrders.map(order =>
                        order.id === orderId
                            ? { ...order, status: 'CANCELLED' as const }
                            : order
                    ).filter(order => order.status !== 'CANCELLED'),
                });
            },

            executeLimitOrder: (orderId, executionPrice) => {
                const { pendingOrders, buyStock, sellStock } = get();
                const order = pendingOrders.find(o => o.id === orderId);

                if (!order || order.status !== 'PENDING') return;

                // Execute the trade
                if (order.type === 'BUY') {
                    buyStock(order.symbol, order.name, executionPrice, order.quantity);
                } else {
                    sellStock(order.symbol, order.name, executionPrice, order.quantity);
                }

                // Mark order as executed and remove
                set({
                    pendingOrders: pendingOrders.filter(o => o.id !== orderId),
                });
            },

            checkAndExecuteOrders: (prices) => {
                const { pendingOrders, executeLimitOrder } = get();

                pendingOrders.forEach(order => {
                    if (order.status !== 'PENDING') return;

                    const currentPrice = prices[order.symbol];
                    if (!currentPrice) return;

                    let shouldExecute = false;
                    if (order.type === 'BUY' && currentPrice <= order.targetPrice) {
                        shouldExecute = true;
                    } else if (order.type === 'SELL' && currentPrice >= order.targetPrice) {
                        shouldExecute = true;
                    }

                    if (shouldExecute) {
                        executeLimitOrder(order.id, currentPrice);
                    }
                });
            },

            addFavorite: (symbol) => {
                const { favorites } = get();
                if (!favorites.includes(symbol)) {
                    set({ favorites: [...favorites, symbol] });
                }
            },

            removeFavorite: (symbol) => {
                const { favorites } = get();
                set({ favorites: favorites.filter((s) => s !== symbol) });
            },

            isFavorite: (symbol) => {
                const { favorites } = get();
                return favorites.includes(symbol);
            },

            resetAccount: () => {
                set({
                    balance: 1000000,
                    holdings: [],
                    transactions: [],
                    pendingOrders: [],
                });
            },
        }),
        {
            name: 'chinastock-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
