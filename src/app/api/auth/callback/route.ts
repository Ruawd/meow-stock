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

        // 3. Save to session (Filtered to avoid cookie size limits)
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        session.user = {
            name: user.name,
            displayName: user.displayName,
            email: user.email,
            avatar: user.avatar,
            id: user.id,
            // Add portal stats
            trustLevel: stats.trustLevel,
            credit: stats.credit
        };
        await session.save();
        // Use the configured public URL origin if available, otherwise fallback to request origin
        let baseUrl = new URL(request.url).origin;
        try {
            if (meow.config.redirectUri) {
                baseUrl = new URL(meow.config.redirectUri).origin;
            }
        } catch (e) {
            console.warn('Failed to parse redirectUri for base URL, using request origin');
        }

        return NextResponse.redirect(new URL('/', baseUrl));
    } catch (error: any) {
        console.error('Login error detail:', error);
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return NextResponse.json({
            error: 'Authentication failed',
            message: error.message,
            details: error.response?.data || 'No additional details'
        }, { status: 500 });
    }
}
