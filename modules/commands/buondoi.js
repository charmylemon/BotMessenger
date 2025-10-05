const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
  name: "autobuon",
  version: "1.0.0",
  eventType: ["message"],
  credits: "ChatGPT",
  description: "Tự động gửi video khi có chữ 'buồn'"
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;
  const msg = event.body.toLowerCase();

  // Nếu tin nhắn có chữ "buồn"
  if (msg.includes("buồn")) {
    const links = [
      "https://files.catbox.moe/o9hhlz.mp4",
      "https://files.catbox.moe/o9hhlz.mp4",
      "https://files.catbox.moe/o9hhlz.mp4"
    ];

    const link = links[Math.floor(Math.random() * links.length)];
    const path = __dirname + "/cache/buon.mp4";

    let callback = () => api.sendMessage(
      { attachment: fs.createReadStream(path) },
      event.threadID,
      () => fs.unlinkSync(path),
      event.messageID
    );

    return request(encodeURI(link))
      .pipe(fs.createWriteStream(path))
      .on("close", callback);
  }
};

// bắt buộc phải có để tránh lỗi load
module.exports.run = function () {};
