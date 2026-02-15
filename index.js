const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
app.use(express.json());

const bot = new TelegramBot("8568335725:AAHDXu505k8j1bZJtCEs0pJlthjyhXrGS38", { polling: true });

console.log("Bot running...");

let keys = {};

function generateKey(){
    return "AppAimlock-Kayros-" + Math.random().toString(36).substring(2,10).toUpperCase();
}

function createKey(days, deviceLimit, type){

    const key = generateKey();
    const expire = days ? Date.now() + days * 24 * 60 * 60 * 1000 : null;

    keys[key] = {
        expire: expire,
        devices: [],
        deviceLimit: deviceLimit,
        type: type
    };

    return key;
}

bot.onText(/\/key(\d+)thietbi (.+)/, (msg, match) => {

    const chatId = msg.chat.id;

    const deviceLimit = parseInt(match[1]);
    const durationType = match[2];

    if(deviceLimit < 1 || deviceLimit > 50){
        bot.sendMessage(chatId, "Giới hạn thiết bị phải từ 1 đến 50");
        return;
    }

    let days = null;
    let type = "";

    if(durationType === "1d"){
        days = 1;
        type = "1 DAY";
    }
    else if(durationType === "7d"){
        days = 7;
        type = "7 DAYS";
    }
    else if(durationType === "30d"){
        days = 30;
        type = "30 DAYS";
    }
    else if(durationType === "per"){
        days = null;
        type = "PERMANENT";
    }
    else{
        bot.sendMessage(chatId, "Sai định dạng. Dùng: 1d | 7d | 30d | per");
        return;
    }

    const key = createKey(days, deviceLimit, type);

    bot.sendMessage(chatId,
        "🔑 KEY TẠO THÀNH CÔNG\n\n" +
        "Key: " + key + "\n" +
        "Thiết bị tối đa: " + deviceLimit + "\n" +
        "Loại: " + type
    );

});

app.post("/check-key", (req, res) => {

    const { key, device } = req.body;

    if(!keys[key]){
        return res.json({ status:false, message:"Key không tồn tại" });
    }

    const keyData = keys[key];

    if(keyData.expire && Date.now() > keyData.expire){
        delete keys[key];
        return res.json({ status:false, message:"Key đã hết hạn" });
    }

    if(!keyData.devices.includes(device)){

        if(keyData.devices.length >= keyData.deviceLimit){
            return res.json({
                status:false,
                message:"Đã đạt giới hạn thiết bị"
            });
        }

        keyData.devices.push(device);
    }

    return res.json({
        status:true,
        type:keyData.type,
        expire:keyData.expire
    });

});

app.listen(process.env.PORT || 3000, () => {
    console.log("API running...");
});