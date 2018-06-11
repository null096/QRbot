const request					= require('request');
const TelegramBot				= require('node-telegram-bot-api');
const token						= process.env.TELEGRAM_TOKEN;
const bot						= new TelegramBot(token, { polling: true });
const minImageSize				= 350;
const safeTextSizeForEncoding	= 1200;
const maxTextSizeForEncoding	= 3000;


bot.on("message", async function(msg) {
	if ( msg.message_id == 1 ) return;

	var userId	= msg.from.id;
	var chatId	= msg.chat.id;
	var text	= msg.text;
	var photos	= msg.photo;

	if ( !(text || photos) ) {
		bot.sendMessage(userId, 'Wrong data');
		return;
	}

	if ( text ) {
		encodeText(userId, chatId, text);
	} else if ( photos ) {
		decodePhoto(userId, photos[photos.length - 1]);
	}
});


bot.onText(/^\/start$/, function(msg) {
	if ( msg.message_id != 1 ) return;
	var userId 		= msg.from.id;
	var userName	= msg.from.username;
	bot.sendMessage(userId, `Hello, ${ userName }\nSend me the text, and I will convert it to QR-code!\nSend me the QR-code and I will convert it into text!`);
});


async function encodeText(userId, chatId, text) {
	if ( text.length > maxTextSizeForEncoding ) {
		bot.sendMessage(userId, `Very large text, should be less than ${ maxTextSizeForEncoding } characters`);
		return;
	}
	if ( text.length > safeTextSizeForEncoding ) {
		await bot.sendMessage(userId, `Warning: Large text, may not work`);
	}

	try {
		bot.sendPhoto(chatId, getQrImageUrl(text));
	}
	catch(e) {
		bot.sendMessage(userId, `Something went wrong`);
	}
}


async function decodePhoto(userId, photo) {
	try {
		var textUrl			= await getTextUrl(photo);
		var JSONresponse	= (await getJsonFrom(textUrl))[0].symbol[0];
		bot.sendMessage(userId, JSONresponse.error || JSONresponse.data);
	}
	catch(e) {
		bot.sendMessage(userId, `Something went wrong${ typeof e == 'number' ? `(${ e })` : '' }`);
	}
}


function getQrImageUrl(text) {
	var imageSize = minImageSize + (~~(text.length / 300) * 50);
	return `http://api.qrserver.com/v1/create-qr-code/?data=${ encodeURIComponent(text) }&size=${ imageSize }x${ imageSize }&qzone=1`;
}


async function getTextUrl(photo) {
	var photoUrl = await bot.getFileLink(photo.file_id);
	return `http://api.qrserver.com/v1/read-qr-code/?fileurl=${ photoUrl }`;
}


function getJsonFrom(url) {
	return new Promise((resolve, reject) =>
		request(url, function(error, response, body) {
			if ( !error && response.statusCode == 200 ) {
				resolve(JSON.parse(body));
			} else {
				reject(response.statusCode);
			}
		})
	);
}