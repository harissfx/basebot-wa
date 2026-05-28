// Fake quoted message — pesan tampil seolah reply ke notifikasi Order WA
const fakeOrder = {
    key: {
        remoteJid: '13135550002@s.whatsapp.net',
        fromMe: false,
        id: 'quoted-order',
    },
    message: {
        orderMessage: {
            orderId: '1234567890',
            itemCount: 9999999999,
            status: 1,
            surface: 1,
            message: '',
            orderTitle: '',
            sellerJid: '13135550002@s.whatsapp.net',
            token: '',
        }
    }
};

module.exports = { fakeOrder };