import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SessionData, sessionOptions } from '@/lib/session';

// Helper to call external Meow Portal/Credit Master API
async function updateExternalCredit(username: string, amount: number, reason: string) {
    const API_BASE_URL = process.env.PORTAL_URL || 'https://meow-portal.ruawd.de';
    // Use the correctly configured env var
    const API_KEY = process.env.PORTAL_API_KEY;

    if (!API_KEY) {
        throw new Error('PORTAL_API_KEY is not configured');
    }

    // Using Endpoint #4: Update Credit Balance from API_DOC.md
    // POST /api/external/users/{username}/credit
    const url = `${API_BASE_URL}/api/external/users/${username}/credit`;

    // Note: The API doc says "balanceChange": number (positive or negative)
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        body: JSON.stringify({
            balanceChange: amount,
            reason: reason
        })
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`External API error: ${res.status} ${errorText}`);
    }

    return await res.json();
}

export async function POST(request: Request) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.user || !session.user.name) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, amount } = await request.json();
        const username = session.user.name;

        if (!type || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const EXCHANGE_RATE = 10000; // 1 Meow Coin = 10000 Game Capital

        if (type === 'DEPOSIT') {
            // DEPOSIT: Meow Coin -> Game Capital
            // 1. DEDUCT Meow Coin (amount is positive input, so we send negative change)
            try {
                await updateExternalCredit(username, -amount, `Deposit to Stock Market`);
            } catch (error: any) {
                console.error("Failed to deduct Meow Coin:", error);
                return NextResponse.json({ error: 'Failed to update Meow Coin balance: ' + error.message }, { status: 400 });
            }

            // 2. Add Game Capital (Handled by frontend state for now, but ideally should be persisted in DB if there was one)
            // Since this is a lightweight app with local storage persistence for stock data, 
            // the server confirms the "Meow Coin" part, and tells frontend to update "Capital".

            const capitalDelta = amount * EXCHANGE_RATE;

            return NextResponse.json({
                success: true,
                capitalDelta: capitalDelta
            });

        } else if (type === 'WITHDRAW') {
            // WITHDRAW: Game Capital -> Meow Coin
            // 1. ADD Meow Coin (amount is Game Capital input? No, wait.)

            // Re-reading logic from ExchangeModal.tsx:
            // For WITHDRAW: const res = await withdrawCapital(val); where val is CAPITAL amount.
            // const coinVal = val / EXCHANGE_RATE;

            const capitalAmount = amount;
            const coinAmount = capitalAmount / EXCHANGE_RATE;

            // 2. Add Meow Coin
            try {
                await updateExternalCredit(username, coinAmount, `Withdraw from Stock Market`);
            } catch (error: any) {
                console.error("Failed to add Meow Coin:", error);
                return NextResponse.json({ error: 'Failed to update Meow Coin balance: ' + error.message }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                capitalDelta: -capitalAmount
            });
        }

        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });

    } catch (error: any) {
        console.error('Transaction error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
