module.exports.config = {
    name: "money",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "GPT",
    description: "Xem hoặc chỉnh sửa số dư tiền",
    commandCategory: "Kinh tế",
    usages: "[add/reset] [số tiền] [tag/reply]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // ID admin
    const adminIDs = ["100056276350068", "100083139662976"];

    // Format số đẹp
    function formatNumber(num) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Xác định target
    let targetID;
    if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else if (type === "message_reply") {
        targetID = messageReply.senderID;
    } else {
        targetID = senderID;
    }

    // Trường hợp admin muốn add hoặc reset
    if (["add", "reset"].includes(args[0])) {
        if (!adminIDs.includes(senderID)) {
            return api.sendMessage("❌ Bạn không có quyền dùng lệnh này.", threadID, messageID);
        }

        if (args[0] === "reset") {
            await Currencies.setData(targetID, { money: 0 });
            let name = (await Users.getData(targetID)).name;
            return api.sendMessage(`🔄 Đã reset số dư của ${name} về 0đ`, threadID, messageID);
        }

        if (args[0] === "add") {
            if (!args[1] || isNaN(args[1])) {
                return api.sendMessage("⚠️ Vui lòng nhập số tiền hợp lệ.", threadID, messageID);
            }
            let amount = parseInt(args[1]);
            await Currencies.increaseMoney(targetID, amount);

            let name = (await Users.getData(targetID)).name;
            let balance = (await Currencies.getData(targetID)).money || 0;
            return api.sendMessage(
                `✅ Đã cộng ${formatNumber(amount)}đ cho ${name}\n💰 Số dư mới: ${formatNumber(balance)}đ`,
                threadID,
                messageID
            );
        }
    }

    // Nếu chỉ check số dư
    let name = (await Users.getData(targetID)).name;
    let balance = (await Currencies.getData(targetID)).money || 0;
    return api.sendMessage(`💳 Số dư của ${name} là: ${formatNumber(balance)}đ`, threadID, messageID);
};
