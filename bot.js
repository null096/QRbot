const request			= require('request');
const TelegramBot		= require('node-telegram-bot-api');
const token				= process.env.TELEGRAM_TOKEN;
const bot				= new TelegramBot(token, { polling: true });
const minPicSize		= 350;
const safePicSizeLimit	= 1000;


bot.on("message", async function(msg, match) {
	var userId		= msg.from.id;
	var chatId		= msg.chat.id;
	var response	= msg.text;
	var photos		= msg.photo;

	if ( msg.message_id == 1 ) return;
	if ( !response && !photos ) {
		bot.sendMessage(userId, 'Wrong data');
		return;
	}

	if ( response ) {
		encodeText(userId, chatId, response);
	} else if ( photos ) {
		decodePhoto(userId, chatId, photos[photos.length - 1]);
	}
});


bot.onText(/^\/start$/, function(msg, match) {
	if ( msg.message_id != 1 ) return;
	var userId 		= msg.from.id;
	var userName	= msg.from.username;
	bot.sendMessage(userId, 
		`Hello, ${ userName }\nSend me the text, and I will convert it to QR-code!\nSend me the QR-code and I will convert it into text!`);
});


async function encodeText(userId, chatId, response) {
	var picSize		= minPicSize + (~~(response.length / 300) * 50);
	var picURL		= `http://api.qrserver.com/v1/create-qr-code/?data=${ response }&size=${ picSize }x${ picSize }&qzone=1`;
	if ( response.length > safePicSizeLimit ) {
		await bot.sendMessage(userId, `Warning: Large text, may not work`);
	}
	bot.sendPhoto(chatId, picURL);
}


async function decodePhoto(userId, chatId, photo) {
	var fileURL = await bot.getFileLink(photo.file_id);
	var URL		= `http://api.qrserver.com/v1/read-qr-code/?fileurl=${ fileURL }`;

	try {
		var JSONresponse = (await getJSONFrom(URL))[0].symbol[0];
		bot.sendMessage(userId, JSONresponse.error || JSONresponse.data);
	}
	catch(e) {
		if ( typeof e == 'string' ) {
			bot.sendMessage(userId, e);
		} else {
			throw e;
		}
	}
}


function getJSONFrom(URL) {
	return new Promise((resolve, reject) =>
		request(URL, function(error, response, body) {
			if ( !error && response.statusCode == 200 ) {
				resolve(JSON.parse(body));
			} else {
				reject(`Something went wrong(${ response.statusCode })`);
			}
		})
	);
}