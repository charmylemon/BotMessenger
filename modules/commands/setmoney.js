module.exports.config = {
    name: "bank",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "GPT",
    description: "Chuyển tiền hoặc kiểm tra số dư",
    commandCategory: "Kinh tế",
    usages: "[tag/reply] [số tiền] | để trống để check số dư",
    cooldowns: 5
};

module.exports.run = async function ({ event, api, Currencies, args, Users }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    // Nếu chỉ gõ /bank -> check số dư bản thân
    if (args.length === 0) {
        let balance = (await Currencies.getData(senderID)).money || 0;
        return api.sendMessage(`[BANK] 💰 Số dư của bạn: ${balance}$`, threadID, messageID);
    }

    // Nếu có tag hoặc reply
    let recipientID;
    if (Object.keys(mentions).length > 0) {
        recipientID = Object.keys(mentions)[0];
    } else if (event.type === "message_reply") {
        recipientID = messageReply.senderID;
    }

    // Nếu có người được chỉ định nhưng không nhập số -> check số dư người đó
    if (recipientID && args.length === 1) {
        let balance = (await Currencies.getData(recipientID)).money || 0;
        let name = (await Users.getData(recipientID)).name;
        return api.sendMessage(`[BANK] 💰 Số dư của ${name}: ${balance}$`, threadID, messageID);
    }

    // Nếu có người được chỉ định và có số tiền -> chuyển tiền
    if (recipientID && args.length >= 2) {
        const amount = parseInt(args[args.length - 1]);
        if (isNaN(amount) || amount <= 0) {
            return api.sendMessage(`[BANK] ❌ Số tiền không hợp lệ.`, threadID, messageID);
        }

        // Kiểm tra số dư người gửi
        let senderData = await Currencies.getData(senderID);
        let senderBalance = senderData.money || 0;

        if (senderBalance < amount) {
            return api.sendMessage(`[BANK] ❌ Bạn không đủ ${amount}$ để chuyển.`, threadID, messageID);
        }

        // Trừ tiền người gửi, cộng tiền người nhận
        await Currencies.decreaseMoney(senderID, amount);
        await Currencies.increaseMoney(recipientID, amount);

        let senderName = (await Users.getData(senderID)).name;
        let recipientName = (await Users.getData(recipientID)).name;

        return api.sendMessage(
            `[BANK] ✅ ${senderName} đã chuyển ${amount}$ cho ${recipientName}\n💰 Số dư còn lại của bạn: ${senderBalance - amount}$`,
            threadID,
            messageID
        );
    }

    // Nếu không hợp lệ
    return api.sendMessage(`[BANK] Sai cú pháp.`, threadID, messageID);
};
