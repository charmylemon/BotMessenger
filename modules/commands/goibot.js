const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports.config = {
  name: "admin_auto",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "GPT-5 mod by CallmeSun",
  description: "Tự động gửi video khi ai chat có chữ admin",
  commandCategory: "no prefix",
  usages: "",
  cooldowns: 0,
};

module.exports.handleEvent = async ({ api, event }) => {
  try {
    const message = event.body?.toLowerCase();
    if (!message) return;

    // Nếu trong tin nhắn có chữ "admin"
    if (message.includes("admin")) {
      // Danh sách link GoFile
      const links = [
        "https://gofile.io/d/2yuwsh",
        "https://gofile.io/d/UUs43v",
      ];

      // Random 1 link trong danh sách
      const chosen = links[Math.floor(Math.random() * links.length)];
      const fileId = chosen.split("/d/")[1];
      const videoPath = __dirname + "/cache/admin_auto.mp4";

      // Gọi API GoFile để lấy link tải trực tiếp
      const res = await axios.get(`https://api.gofile.io/getContent?contentId=${fileId}`);
      if (!res.data || !res.data.data) {
        return api.sendMessage("❌ Không thể lấy link video từ GoFile!", event.threadID);
      }

      // Lấy link download đầu tiên
      const fileUrl = Object.values(res.data.data.contents)[0].link;

      // Tải video về thư mục cache
      const file = fs.createWriteStream(videoPath);
      request(fileUrl)
        .pipe(file)
        .on("close", () => {
          api.sendMessage(
            {
              body: `🎬 Video admin random (nguồn GoFile)\n🌐 Link gốc: ${chosen}`,
              attachment: fs.createReadStream(videoPath),
            },
            event.threadID,
            () => fs.unlinkSync(videoPath)
          );
        });
    }
  } catch (error) {
    console.error("Lỗi admin_auto:", error);
  }
};

// Không cần lệnh gọi thủ công
module.exports.run = () => {};
