module.exports.config = {
  name: "vdmc",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "mod by charmylemon",
  description: "Xem video từ secretVideo/moc (trừ tiền tùy biến)",
  commandCategory: "Random-video",
  usages: "/vdmc",
  cooldowns: 30
};

const fs = require("fs");
const path = require("path");

// ----- Khai báo số tiền cần trừ -----
const tienPhaiTra = 100000000000; // 100 tỷ VNĐ

// ----- Hàm helper trừ tiền -----
async function truTien(Currencies, userID, soTien) {
  const moneyData = await Currencies.getData(userID);
  const userMoney = moneyData.money || 0;
  if (userMoney < soTien) return { success: false, remaining: userMoney };
  await Currencies.setData(userID, { money: userMoney - soTien });
  return { success: true, remaining: userMoney - soTien };
}

module.exports.run = async ({ api, event, Currencies }) => {
  try {
    const userID = event.senderID;

    // Trừ tiền
    const result = await truTien(Currencies, userID, tienPhaiTra);
    if (!result.success) {
      return api.sendMessage(
        `⚠️ Bạn không đủ ${tienPhaiTra.toLocaleString()} VNĐ để xem video!\n💰 Số dư hiện tại: ${result.remaining.toLocaleString()} VNĐ`,
        event.threadID,
        event.messageID
      );
    }

    // Lấy video trong modules/commands/secretVideo/moc
    const videoDir = path.join(__dirname, "secretVideo", "moc");
    if (!fs.existsSync(videoDir)) {
      return api.sendMessage("❗ Không tìm thấy thư mục video.", event.threadID, event.messageID);
    }

    const files = fs.readdirSync(videoDir).filter(file => [".mp4", ".mkv", ".mov", ".webm"].includes(path.extname(file).toLowerCase()));
    if (!files.length) {
      return api.sendMessage("❗ Không có video nào trong thư mục.", event.threadID, event.messageID);
    }

    // Chọn 1 video duy nhất ngẫu nhiên
    const randomVideo = files[Math.floor(Math.random() * files.length)];
    const videoPath = path.join(videoDir, randomVideo);

    // Gửi video + thông báo
    return api.sendMessage({
      body: `😍 Video đặc biệt nè 😍\n💸 Đã trừ: ${tienPhaiTra.toLocaleString()} VNĐ\n💰 Số dư còn lại: ${result.remaining.toLocaleString()} VNĐ`,
      attachment: fs.createReadStream(videoPath)
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý yêu cầu.", event.threadID, event.messageID);
  }
};
