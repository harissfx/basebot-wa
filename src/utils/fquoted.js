const config = require('../config');
const fakeOrder = {
    key: {
        participant: '0@s.whatsapp.net',
    },
    message: {
        requestPaymentMessage:
        {
            currencyCodeIso4217: 'USD',
            amount1000: '1000000000',
            requestFrom: '999999999999@s.whatsapp.net',
            noteMessage: {
                extendedTextMessage: {
                    text: `*${config.botName}*`,
                }
            },
            expiryTimestamp: '0',
            amount: { value: '1000000000', offset: 1000, currencyCode: 'USD' }
        }
    }
};

module.exports = { fakeOrder };