// @ts-ignore
import { SDK } from 'casdoor-nodejs-sdk';

export class CasdoorHelper {
    sdk: any;
    constructor(config: any) {
        this.sdk = new SDK(config);
    }

    getSigninUrl(redirectUri: string) {
        return this.sdk.getSignInUrl(redirectUri);
    }

    async getUser(code: string) {
        try {
            console.log('Exchanging code for token:', code);
            const token = await this.sdk.getAuthToken(code);
            console.log('Token received:', token ? (typeof token === 'string' ? token.substring(0, 20) + '...' : typeof token) : 'null/undefined');

            if (!token || typeof token !== 'string') {
                throw new Error(`Invalid token received from Casdoor: ${JSON.stringify(token)}`);
            }

            const user = this.sdk.parseJwtToken(token);
            return { token, user };
        } catch (error) {
            console.error('CasdoorHelper.getUser error:', error);
            throw error;
        }
    }
}
