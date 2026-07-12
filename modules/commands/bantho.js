module.exports.config = {
  name: "bantho",
  version: "1.1.2",
  hasPermssion: 0,
  credits: "By Charmylemon (Fixed by Gemini)",
  description: "Ảnh bàn thờ của đứa tag hoặc reply",
  commandCategory: "Ảnh",
  usages: "[@tag] hoặc [reply tin nhắn]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": ""
  }
};

module.exports.run = async ({ event, api }) => {
  const fs = require("fs-extra");
  const axios = require("axios");
  const Canvas = require("canvas");

  // Tạo đường dẫn file ảnh tạm thời theo ID người gửi để tránh xung đột
  const pathImg = __dirname + `/cache/bantho_${event.senderID}.png`;

  try {
    // --- PHẦN XỬ LÝ ID (QUAN TRỌNG) ---

    // 1. Mặc định là người gửi lệnh
    let targetID = event.senderID; 

    // 2. Nếu có tag người khác -> Lấy ID người được tag đầu tiên
    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } 
    // 3. Nếu đang reply (phản hồi) tin nhắn của ai đó -> Lấy ID người đó
    else if (event.type == "message_reply") {
      targetID = event.messageReply.senderID;
    }

    // ID người gửi lệnh (để dùng cho tính năng phản đòn)
    const senderID = event.senderID;

    // Danh sách ID đặc biệt (Admin/Bot Owner...)
    const specialIDs = ["100056276350068", "100083139662976"];
    let reversed = false;

    // Logic phản đòn: Nếu targetID là admin thì đổi mục tiêu thành người gửi lệnh
    if (specialIDs.includes(targetID)) {
      targetID = senderID;
      reversed = true;
    }
    // ----------------------------------

    // Tải background
    const background = await Canvas.loadImage("https://i.imgur.com/brK0Hbb.jpg");

    // Tải avatar (Sử dụng axios để ổn định hơn)
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    let avatarResponse;
    try {
        avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    } catch (err) {
        // Fallback nếu không lấy được avatar (ví dụ nick die)
        return api.sendMessage("Không thể lấy ảnh đại diện của người này.", event.threadID, event.messageID);
    }

    const avatar = await Canvas.loadImage(avatarResponse.data);

    // Vẽ Canvas
    const canvas = Canvas.createCanvas(960, 634);
    const ctx = canvas.getContext("2d");

    // Vẽ nền
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Vẽ Avatar cắt hình tròn
    ctx.save();
    ctx.beginPath();
    // Tọa độ và kích thước dựa trên code gốc: x=353, y=158, w=205, h=205
    // Tính tâm hình tròn: x + w/2, y + h/2 => 353 + 102.5, 158 + 102.5
    ctx.arc(455.5, 260.5, 102.5, 0, Math.PI * 2, true); 
    ctx.closePath();
    ctx.clip(); // Cắt khung hình tròn
    ctx.drawImage(avatar, 353, 158, 205, 205);
    ctx.restore();

    // Lưu file
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    // Nội dung tin nhắn
    let messageBody = "Ơ kìa bạn khỏe không ?:))";
    if (reversed) {
      messageBody = "Khôn thế em 😼 định tế Admin à?";
    }

    // Gửi tin nhắn
    api.sendMessage(
      {
        body: messageBody,
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => fs.unlinkSync(pathImg), // Xóa file sau khi gửi xong
      event.messageID
    );

  } catch (e) {
    console.error(e);
    api.sendMessage(`Lỗi: ${e.message}`, event.threadID, event.messageID);
  }
};