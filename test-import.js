try {
    const sdk = require('meow-sdk');
    console.log('Success:', typeof sdk);
} catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
}
