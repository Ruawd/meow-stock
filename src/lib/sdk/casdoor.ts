import axios from 'axios';
// @ts-ignore
import { SDK } from 'casdoor-nodejs-sdk';

export class CasdoorHelper {
    sdk: any;
    config: any;

    constructor(config: any) {
        this.config = config;
        // Keep SDK init for potential other uses, but we use manual flow mostly
        this.sdk = new SDK(config);
    }

    getSigninUrl(redirectUri: string) {
        // Manual construction to match Lottery project and avoid SDK issues
        const { endpoint, clientId, appName } = this.config;
        const scope = 'read';
        const state = appName || 'casdoor-app';
        // Ensure endpoint doesn't have trailing slash for the URL construction if relying on template
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
        return `${baseUrl}/login/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    }

    async getUser(code: string) {
        try {
            console.log('Exchanging code for token (Manual Mode):', code);

            // 1. Get Access Token
            // Use config endpoint directly
            const tokenUrl = `${this.config.endpoint}/api/login/oauth/access_token`;
            const tokenRes = await axios.post(tokenUrl, {
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                code: code
            });

            const accessToken = tokenRes.data.access_token;
            console.log('Access Token received:', accessToken ? 'Yes' : 'No');

            if (!accessToken) {
                throw new Error(`Failed to get access token: ${JSON.stringify(tokenRes.data)}`);
            }

            // 2. Get User Profile
            const userUrl = `${this.config.endpoint}/api/get-account`;
            const userRes = await axios.get(userUrl, {
                params: { accessToken }
            });

            const user = userRes.data.data;
            console.log('User Profile received:', user ? user.name : 'No');

            return { token: accessToken, user };
        } catch (error: any) {
            console.error('CasdoorHelper.getUser error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }
}
