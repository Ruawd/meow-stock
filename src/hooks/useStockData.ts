import { useState, useEffect, useCallback, useRef } from 'react';

export interface StockData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    open: number;
    prevClose: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
    date: string;
    time: string;
}

export function useStockData(codes: string[], interval = 3000) {
    const [data, setData] = useState<Record<string, StockData>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    // Stabilize codes array to prevent unnecessary re-fetches
    const codesKey = codes.join(',');
    const stableCodesRef = useRef<string>(codesKey);

    // Only update if codes actually changed
    if (stableCodesRef.current !== codesKey) {
        stableCodesRef.current = codesKey;
    }

    const fetchQuotes = useCallback(async () => {
        const query = stableCodesRef.current;
        if (!query) return;

        try {
            const res = await fetch(`/api/quote?code=${query}`);

            if (!res.ok) {
                throw new Error('Failed to fetch quotes');
            }

            const rawData = await res.json();

            // Normalize keys to lowercase
            const normalizedData: Record<string, StockData> = {};
            Object.keys(rawData).forEach(key => {
                normalizedData[key.toLowerCase()] = rawData[key];
            });

            if (mountedRef.current) {
                setData(normalizedData);
                setLoading(false);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                console.error(err);
                setError('Failed to load market data');
                setLoading(false);
            }
        }
    }, []); // No dependencies - uses ref

    useEffect(() => {
        mountedRef.current = true;
        setLoading(true);
        fetchQuotes();

        const timer = setInterval(fetchQuotes, interval);

        return () => {
            mountedRef.current = false;
            clearInterval(timer);
        };
    }, [codesKey, interval, fetchQuotes]); // codesKey instead of codes

    return { data, loading, error };
}
