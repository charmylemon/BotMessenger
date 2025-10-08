const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "bietdanh",
    version: "2.1.0",
    hasPermssion: 2,
    credits: "GPT-5 mod by lmh",
    description: "Tự động đồng bộ biệt danh bot theo config.json trên tất cả box",
    commandCategory: "Hệ thống",
    usages: "/bietdanh (hoặc /bietdanh all)",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
    try {
        const configPath = path.join(__dirname, "../../config.json");
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const expectedName = config.BOTNAME || "Chưa đặt";

        const botID = api.getCurrentUserID();
        const userInfo = await api.getUserInfo(botID);
        const actualName = userInfo[botID]?.name || "Không lấy được tên";

        if (args[0] === "all") {
            const threadList = await api.getThreadList(1000, null, ["INBOX"]);
            const groupThreads = threadList.filter(t => t.isGroup);

            for (const thread of groupThreads) {
                try {
                    await api.changeNickname(expectedName, thread.threadID, botID);
                } catch {}
            }

            return api.sendMessage("✅ Đã Hoàn tất!", event.threadID, event.messageID);
        }

        // Kiểm tra và đổi trong box hiện tại
        if (actualName.trim() !== expectedName.trim()) {
            await api.changeNickname(expectedName, event.threadID, botID);
        }

        return api.sendMessage("✅ Đã Hoàn tất!", event.threadID, event.messageID);
    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Lỗi khi đồng bộ biệt danh bot!", event.threadID, event.messageID);
    }
};
