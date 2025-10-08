const imgur = require("imgur");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { downloadFile } = require("../../utils/index");

module.exports.config = {
  name: "imgur",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "mod + GPT-5",
  description: "Upload ảnh lên Imgur, video lên Gofile (tự động direct link)",
  commandCategory: "Công cụ",
  usages: "[reply ảnh hoặc video]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, type, messageReply, messageID } = event;
  const ClientID = "f20bdcf02b2f89e";
  if (type !== "message_reply" || !messageReply.attachments?.length)
    return api.sendMessage("Vui lòng reply ảnh hoặc video!", threadID, messageID);

  imgur.setClientId(ClientID);
  const cacheDir = path.join(__dirname, "cache/gofile");
  fs.ensureDirSync(cacheDir);

  let msg = "";

  for (const [index, data] of messageReply.attachments.entries()) {
    const { url, type } = data;

    try {
      // === ẢNH ===
      if (type === "photo" || type === "animated_image") {
        const upload = await imgur.uploadUrl(url);
        const id = upload.id;
        const ext = type === "animated_image" ? "gif" : "jpg";
        msg += `📷 https://i.imgur.com/${id}.${ext}\n`;

      // === VIDEO (Gofile API mới) ===
      } else if (type === "video") {
        const tempPath = path.join(cacheDir, `video_${index}.mp4`);
        await downloadFile(url, tempPath);

        // Lấy server khả dụng
        const getServer = await axios.get("https://api.gofile.io/servers");
        const server = getServer.data.data.servers[0].name;

        // Upload lên Gofile
        const form = new FormData();
        form.append("file", fs.createReadStream(tempPath));

        const upload = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
          headers: form.getHeaders()
        });

        if (upload.data.status !== "ok") throw new Error("Upload thất bại.");

        const { fileId, directLink } = upload.data.data;
        msg += `🎥 ${directLink || `https://gofile.io/d/${fileId}`}\n`;

        fs.unlinkSync(tempPath);

      } else {
        msg += `⚠️ Không hỗ trợ loại tệp: ${type}\n`;
      }

    } catch (err) {
      msg += `❌ Lỗi upload ${type}: ${err.message}\n`;
    }
  }

  return api.sendMessage(msg || "Không thể upload file nào!", threadID, messageID);
};
