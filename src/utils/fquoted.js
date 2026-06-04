const config = require('../config');

const fakeOrder = ({ pushname = '', salam = '' } = {}) => ({
    key: {
        participant: '0@s.whatsapp.net',
    },
    message: {
        requestPaymentMessage: {
            currencyCodeIso4217: 'USD',
            amount1000: '1000000000',
            requestFrom: '6285731811079@s.whatsapp.net',
            noteMessage: {
                extendedTextMessage: {
                    text: `Hay Kak ${pushname} 👋 Selamat ${salam}`,
                }
            },
            expiryTimestamp: '0',
            amount: { value: '1000000000', offset: 1000, currencyCode: 'USD' }
        }
    }
});

module.exports = { fakeOrder };