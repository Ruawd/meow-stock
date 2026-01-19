const casdoor = require('casdoor-nodejs-sdk');
const { SDK } = casdoor;

console.log('Casdoor exports:', Object.keys(casdoor));

if (SDK) {
    const instance = new SDK({
        endpoint: 'https://example.com',
        clientId: 'id',
        clientSecret: 'secret',
        certificate: 'cert',
        orgName: 'meow',
        appName: 'app'
    });

    console.log('Instance keys:', Object.keys(instance));
    console.log('Instance prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    console.log('typeof instance.getSigninUrl:', typeof instance.getSigninUrl);
} else {
    console.log('SDK export not found!');
}
