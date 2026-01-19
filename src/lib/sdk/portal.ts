import axios from 'axios';

export class PortalHelper {
    portalUrl: string;
    apiKey?: string;

    constructor(portalUrl: string, apiKey?: string) {
        this.portalUrl = portalUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
    }

    async getUserStats(username: string) {
        try {
            const url = `${this.portalUrl}/api/external/users/${encodeURIComponent(username)}`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const headers: any = this.apiKey ? { 'X-Api-Key': this.apiKey } : {};
            const res = await axios.get(url, { headers });
            return res.data;
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('[MeowSDK] Failed to fetch portal stats:', error.message);
            return null;
        }
    }
}
