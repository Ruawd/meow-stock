const fs = require('fs');
const casdoor = require('casdoor-nodejs-sdk');
const { SDK } = casdoor;

const log = (msg) => {
    fs.appendFileSync('sdk-debug.log', msg + '\n');
};

log('Casdoor exports: ' + JSON.stringify(Object.keys(casdoor)));

if (SDK) {
    const instance = new SDK({
        endpoint: 'https://example.com',
        clientId: 'id',
        clientSecret: 'secret',
        certificate: 'cert',
        orgName: 'meow',
        appName: 'app'
    });

    log('Instance keys: ' + JSON.stringify(Object.keys(instance)));
    log('Instance prototype methods: ' + JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(instance))));

    // Check if getSigninUrl exists anywhere
    log('getSigninUrl type: ' + typeof instance.getSigninUrl);
}
