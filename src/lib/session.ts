import { SessionOptions } from 'iron-session';

export interface SessionData {
    user?: {
        name: string;
        displayName: string;
        email: string;
        avatar: string;
        trustLevel?: number;
        credit?: {
            availableBalance: number;
            communityBalance: number;
            payScore: number;
        };
        [key: string]: any;
    };
    meowStats?: any;
}

export const sessionOptions: SessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long_and_secure',
    cookieName: 'meow_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};
