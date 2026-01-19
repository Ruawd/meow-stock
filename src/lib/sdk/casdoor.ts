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
        const token = await this.sdk.getAuthToken(code);
        const user = this.sdk.parseJwtToken(token);
        return { token, user };
    }
}
