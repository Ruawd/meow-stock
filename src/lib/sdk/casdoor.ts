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
            console.log('Token received type:', typeof token);

            let accessToken = token;
            if (token && typeof token === 'object' && token.access_token) {
                accessToken = token.access_token;
            }

            if (!accessToken || typeof accessToken !== 'string') {
                throw new Error(`Invalid access token format: ${JSON.stringify(token)}`);
            }

            const user = this.sdk.parseJwtToken(accessToken);
            return { token: accessToken, user };
        } catch (error) {
            console.error('CasdoorHelper.getUser error:', error);
            throw error;
        }
    }
}
