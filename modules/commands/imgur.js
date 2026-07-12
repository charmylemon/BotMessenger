const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "upanh", // Bạn có thể đổi thành imgur tùy thích
  version: "2.0.1",
  hasPermssion: 0,
  credits: "Gemini Fixed",
  description: "Upload ảnh/video lên Catbox (Siêu nhanh)",
  commandCategory: "Công cụ",
  usages: "[reply ảnh/video]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageReply, messageID, type } = event;

  // 1. Kiểm tra đầu vào
  if (type !== "message_reply" || !messageReply.attachments?.length) {
    return api.sendMessage("⚠️ Vui lòng reply (phản hồi) vào ảnh hoặc video cần lấy link!", threadID, messageID);
  }

  // Lọc file hợp lệ
  const attachments = messageReply.attachments.filter(att => 
    ["photo", "animated_image", "video", "audio"].includes(att.type)
  );

  if (!attachments.length) {
    return api.sendMessage("❌ Không tìm thấy tệp hợp lệ.", threadID, messageID);
  }

  api.sendMessage(`⏳ Đang upload ${attachments.length} tệp lên Catbox...`, threadID);

  try {
    // 2. Upload song song lên Catbox
    const links = await Promise.all(attachments.map(async (att) => {
      try {
        const formData = new FormData();
        formData.append("reqtype", "fileupload");

        // Tải stream từ Facebook
        const response = await axios.get(att.url, { responseType: "stream" });

        // Đặt tên file ảo để server nhận diện
        const ext = att.type === "video" ? "mp4" : (att.type === "animated_image" ? "gif" : (att.type === "audio" ? "mp3" : "jpg"));
        const filename = `gemini_upload_${Date.now()}.${ext}`;

        formData.append("fileToUpload", response.data, filename);

        // API Catbox (Ổn định hơn anh.moe rất nhiều)
        const res = await axios.post("https://catbox.moe/user/api.php", formData, {
          headers: {
            ...formData.getHeaders(),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });

        // Catbox trả về link trực tiếp luôn (text thuần)
        if (res.data && res.data.startsWith("http")) {
             return res.data;
        }
        return null;

      } catch (err) {
        console.error(`Lỗi upload:`, err.message);
        return `❌ Lỗi: ${err.message}`;
      }
    }));

    // 3. Trả kết quả
    const successLinks = links.filter(link => link && !link.includes("❌"));
    const errorLinks = links.filter(link => link && link.includes("❌"));

    let msg = "";
    if (successLinks.length > 0) msg += successLinks.join("\n");
    if (errorLinks.length > 0) msg += "\n\n" + errorLinks.join("\n");

    if (!msg) msg = "❌ Upload thất bại. Server Catbox đang bảo trì?";

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    return api.sendMessage(`❌ Lỗi hệ thống: ${error.message}`, threadID, messageID);
  }
};