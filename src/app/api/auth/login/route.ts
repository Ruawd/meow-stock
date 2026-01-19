import { NextResponse } from 'next/server';
import meow from '@/lib/meow';

export async function GET() {
    const redirectUrl = meow.casdoor.getSigninUrl(meow.config.redirectUri);
    return NextResponse.redirect(redirectUrl);
}
