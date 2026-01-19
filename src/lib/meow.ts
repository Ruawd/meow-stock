import { CasdoorHelper } from './sdk/casdoor';
import { PortalHelper } from './sdk/portal';

const config = {
    endpoint: process.env.CASDOOR_ENDPOINT || 'https://casdoor.ruawd.de',
    clientId: process.env.CASDOOR_CLIENT_ID || 'client_id_placeholder',
    clientSecret: process.env.CASDOOR_CLIENT_SECRET || 'client_secret_placeholder',
    certificate: process.env.CASDOOR_CERTIFICATE || './cert.pem',
    orgName: process.env.CASDOOR_ORG_NAME || 'meow',
    appName: process.env.CASDOOR_APP_NAME || 'meowstock',
    redirectPath: '/api/auth/callback',
    redirectUri: process.env.CASDOOR_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',

    portalUrl: process.env.PORTAL_URL || 'https://meow-portal.ruawd.de',
    apiKey: process.env.PORTAL_API_KEY,
    alwaysFetchStats: true
};

const meow = {
    config,
    casdoor: new CasdoorHelper(config),
    portal: new PortalHelper(config.portalUrl, config.apiKey)
};

export default meow;
