const request			= require('request');
const TelegramBot		= require('node-telegram-bot-api');
const token				= process.env.TELEGRAM_TOKEN;
const bot				= new TelegramBot(token, { polling: true });
const minPicSize		= 350;
const safePicSizeLimit	= 1500;

bot.onText(/.+/, async function(msg, match) {
	if (msg.message_id == 1) return;
	var response	= match[0];
	var userId		= msg.from.id;
	var chatId		= msg.chat.id;
	var picSize		= minPicSize + (~~(response.length / 300) * 50);
	var picUrl		= `http://api.qrserver.com/v1/create-qr-code/?data=${ response }&size=${ picSize }x${ picSize }&qzone=1`;
	await bot.sendMessage(userId, `Wait... ${ response.length > safePicSizeLimit ? 'Warning: Large text, may not work' : ''}`);
	bot.sendPhoto(chatId, picUrl);
});

bot.onText(/^\/start$/, function(msg, match) {
	if (msg.message_id != 1) return;
	var userId 		= msg.from.id;
	var userName	= msg.from.username;
	bot.sendMessage(userId, `Hello, ${ userName }, send me the text, and I convert it to QR-code!`);
});