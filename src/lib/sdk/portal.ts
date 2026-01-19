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
            const response = await axios.get(`${this.portalUrl}/api/external/users/${username}`, {
                headers: { 'X-API-Key': this.apiKey }
            });
            // Adapt to the expected format
            const credit = response.data.credit || { availableBalance: 0, communityBalance: 0, payScore: 0 };
            return {
                meowStats: response.data,
                trustLevel: response.data.trustLevel || 0,
                credit
            };
        } catch (error) {
            console.error('PortalHelper.getUserStats error:', error);
            // Return defaults on error to not block login
            return {
                meowStats: {},
                trustLevel: 0,
                credit: { availableBalance: 0, communityBalance: 0, payScore: 0 }
            };
        }
    }

    async deductCredit(username: string, amount: number, reason: string) {
        try {
            const url = `${this.portalUrl}/api/external/users/${username}/credit`;
            const payload = {
                balanceChange: -Math.abs(amount),
                reason: reason
            };
            const response = await axios.post(url, payload, {
                headers: { 'X-API-Key': this.apiKey }
            });
            return response.data;
        } catch (error: any) {
            console.error('PortalHelper.deductCredit error:', error.response?.data || error.message);
            throw error;
        }
    }

    async awardCredit(username: string, amount: number, reason: string) {
        try {
            const url = `${this.portalUrl}/api/external/users/${username}/credit`;
            const payload = {
                balanceChange: Math.abs(amount),
                reason: reason
            };
            const response = await axios.post(url, payload, {
                headers: { 'X-API-Key': this.apiKey }
            });
            return response.data;
        } catch (error: any) {
            console.error('PortalHelper.awardCredit error:', error.response?.data || error.message);
            throw error;
        }
    }
}
