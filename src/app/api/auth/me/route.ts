import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SessionData, sessionOptions } from '@/lib/session';

export async function GET() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (session.user) {
        return NextResponse.json({
            ...session.user,
            isLoggedIn: true,
        });
    } else {
        return NextResponse.json({
            isLoggedIn: false,
        });
    }
}
