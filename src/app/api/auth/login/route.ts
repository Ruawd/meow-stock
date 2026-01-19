import { NextResponse } from 'next/server';
import meow from '@/lib/meow';

export async function GET() {
    const redirectUrl = meow.casdoor.getSigninUrl(meow.config.redirectUri);
    console.log('Configs:', meow.config);
    console.log('Redirect URL:', redirectUrl);

    // Debugging: return JSON if URL seems wrong
    if (!redirectUrl || redirectUrl === 'undefined') {
        return NextResponse.json({ error: 'Invalid Redirect URL', url: redirectUrl, config: meow.config });
    }

    return NextResponse.redirect(redirectUrl);
}
