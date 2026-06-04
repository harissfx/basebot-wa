const config = require('../config');
const dummyThumbnail = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const fakeOrder = {
key: {
participant: '0@s.whatsapp.net',
},

'message': {
	"interactiveMessage": {
						"header": {
						
							"hasMediaAttachment": [],
							"jpegThumbnail": Buffer.from(dummyThumbnail, 'base64'),
													},
						"nativeFlowMessage": {
							"buttons": [
								{
									"name": "review_and_pay",
									"buttonParamsJson": "{\"currency\":\"IDR\",\"external_payment_configurations\":[{\"uri\":\"\",\"type\":\"payment_instruction\",\"payment_instruction\":\"hey ini test\"}],\"payment_configuration\":\"\",\"payment_type\":\"\",\"total_amount\":{\"value\":100000,\"offset\":100},\"reference_id\":\"4MX98934S0D\",\"type\":\"physical-goods\",\"order\":{\"status\":\"pending\",\"description\":\"\",\"subtotal\":{\"value\":100000,\"offset\":100},\"items\":[{\"retailer_id\":\"60135576635\",\"product_id\":\"60135576635\",\"name\":\"𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝐵𝑦 𝐻𝑎𝑛𝑧 𝑂𝑓𝑐\",\"amount\":{\"value\":100000,\"offset\":100},\"quantity\":1111111}]}}"
								}
							]
			}
}}}

module.exports = { fakeOrder };