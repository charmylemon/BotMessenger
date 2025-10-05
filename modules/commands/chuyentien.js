module.exports.config = {
    name: "chuyentien",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "GPT",
    description: "Chuyển tiền cho người khác",
    commandCategory: "Kinh tế",
    usages: "/chuyentien (hoặc /ck) @tag <số tiền>",
    cooldowns: 5,
    aliases: ["ck"] // viết tắt
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // Format số đẹp
    function formatNumber(num) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Xác định người nhận
    let targetID;
    if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else if (type === "message_reply") {
        targetID = messageReply.senderID;
    } else {
        return api.sendMessage("⚠️ Bạn phải tag hoặc reply người muốn chuyển tiền.", threadID, messageID);
    }

    // Không cho chuyển cho chính mình
    if (targetID === senderID) {
        return api.sendMessage("❌ Bạn không thể chuyển tiền cho chính mình.", threadID, messageID);
    }

    // Xử lý số tiền
    const amount = parseInt(args[args.length - 1]);
    if (!amount || isNaN(amount) || amount <= 0) {
        return api.sendMessage("⚠️ Vui lòng nhập số tiền hợp lệ.", threadID, messageID);
    }

    // Lấy số dư người gửi
    let senderData = await Currencies.getData(senderID);
    let senderBalance = senderData.money || 0;

    if (senderBalance < amount) {
        return api.sendMessage("❌ Bạn không đủ tiền để thực hiện giao dịch này.", threadID, messageID);
    }

    // Tiến hành giao dịch
    await Currencies.decreaseMoney(senderID, amount);
    await Currencies.increaseMoney(targetID, amount);

    // Lấy lại số dư mới
    let senderNewBalance = (await Currencies.getData(senderID)).money || 0;
    let targetNewBalance = (await Currencies.getData(targetID)).money || 0;

    // Lấy tên
    let senderName = (await Users.getData(senderID)).name;
    let targetName = (await Users.getData(targetID)).name;

    return api.sendMessage(
        `💸 Giao dịch thành công!\n` +
        `👤 ${senderName} ➝ ${targetName}\n` +
        `💰 Số tiền: ${formatNumber(amount)}đ\n\n` +
        `📊 Số dư hiện tại:\n` +
        `   • ${senderName}: ${formatNumber(senderNewBalance)}đ\n` +
        `   • ${targetName}: ${formatNumber(targetNewBalance)}đ`,
        threadID,
        messageID
    );
};
