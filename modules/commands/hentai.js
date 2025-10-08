const fs = require("fs-extra");
const request = require("request");
const axios = require("axios");

module.exports.config = {
  name: "mhuang_auto",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "lmh fix by GPT-5",
  description: "Tự động gửi ảnh khi có chữ mhuang",
  commandCategory: "no prefix",
  usages: "",
  cooldowns: 0
};

// chạy khi có tin nhắn
module.exports.handleEvent = async function({ api, event }) {
  try {
    // kiểm tra tin nhắn có chữ "mhuang" không
    const msg = event.body?.toLowerCase() || "";
    if (!msg.includes("mhuang")) return;

    // nếu có, chọn ngẫu nhiên 1 link từ danh sách
    const links = [
      "https://store9.gofile.io/download/HgjdZ4/mhuang.jpg", // link direct hoặc file từ Gofile
      "https://store9.gofile.io/download/HgjdZ4/vid1.mp4"
    ];
    const chosen = links[Math.floor(Math.random() * links.length)];
    const ext = chosen.split(".").pop();

    const path = __dirname + `/cache/mhuang.${ext}`;

    // tải file về cache
    const callback = () => {
      api.sendMessage(
        {
          body: `Ảnh/Video mhuang nè 😏`,
          attachment: fs.createReadStream(path)
        },
        event.threadID,
        () => fs.unlinkSync(path),
        event.messageID
      );
    };

    request(encodeURI(chosen))
      .pipe(fs.createWriteStream(path))
      .on("close", callback);

  } catch (e) {
    console.log(e);
  }
};

module.exports.run = async function() {};
