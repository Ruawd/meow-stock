import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SessionData, sessionOptions } from '@/lib/session';
import meow from '@/lib/meow';

const EXCHANGE_RATE = 10000; // 1 Meow Coin = 10,000 Game Capital

export async function POST(request: Request) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, amount } = await request.json();
        const user = session.user;
        const username = user.name;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if (type === 'DEPOSIT') {
            // Deposit: Meow Coin -> Game Capital
            // 1. Deduct Meow Coin
            const coinAmount = amount;
            const capitalAmount = amount * EXCHANGE_RATE;

            await meow.portal.deductCredit(username, coinAmount, 'MeowStock Deposit');

            // 2. Refresh session stats to reflect new balance
            const stats = await meow.portal.getUserStats(username);
            session.user.credit = stats.credit;
            session.user.trustLevel = stats.trustLevel;
            await session.save();

            return NextResponse.json({
                success: true,
                capitalDelta: capitalAmount,
                newCoinBalance: stats.credit?.availableBalance
            });

        } else if (type === 'WITHDRAW') {
            // Withdraw: Game Capital -> Meow Coin
            // 1. Award Meow Coin
            const capitalAmount = amount; // Frontend sends capital amount
            const coinAmount = capitalAmount / EXCHANGE_RATE;

            if (coinAmount <= 0) {
                return NextResponse.json({ error: 'Amount too small for exchange' }, { status: 400 });
            }

            await meow.portal.awardCredit(username, coinAmount, 'MeowStock Withdraw');

            // 2. Refresh session stats
            const stats = await meow.portal.getUserStats(username);
            session.user.credit = stats.credit;
            session.user.trustLevel = stats.trustLevel;
            await session.save();

            return NextResponse.json({
                success: true,
                capitalDelta: -capitalAmount,
                newCoinBalance: stats.credit?.availableBalance
            });
        } else {
            return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Transaction error:', error);
        return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
    }
}
