module.exports.config = {
  name: "tkb",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Xem thời khóa biểu",
  commandCategory: "Tiện ích",
  usages: "tkb a1",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  if (args[0] && args[0].toLowerCase() == "a1") {
    // gửi ảnh thời khóa biểu A1
    const fs = require("fs");
    const path = __dirname + "/cache/tkb_a1.png";

    // tải sẵn ảnh từ link drive hoặc lưu sẵn trong cache
    const axios = require("axios");
    const url = "https://i.imgur.com/xxxxxxx.png"; // link ảnh TKB 10A1, bạn up lên imgur/fb/drive lấy link direct

    const img = (await axios.get(url, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(path, Buffer.from(img, "binary"));

    return api.sendMessage({
      body: "📅 Thời khóa biểu lớp 10A1 (2025-2026):",
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);
  } else {
    return api.sendMessage("❌ Hiện chỉ có thời khóa biểu của lớp A1.\nDùng: tkb a1", event.threadID, event.messageID);
  }
};
