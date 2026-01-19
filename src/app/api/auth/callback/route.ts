import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SessionData, sessionOptions } from '@/lib/session';
import meow from '@/lib/meow';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        // 1. Exchange code for user info
        const { user } = await meow.casdoor.getUser(code);

        // 2. Fetch extra stats from Portal
        const stats = await meow.portal.getUserStats(user.name);

        // 3. Save to session
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.user = { ...user, ...stats };
        await session.save();

        return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
