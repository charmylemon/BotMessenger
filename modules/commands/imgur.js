const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");
const imgur = require("imgur");

module.exports.config = {
  name: "imgur",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ChatGPT (Imgur + Postimages fallback)",
  description: "Upload ảnh hoặc video lên Imgur, nếu lỗi thì chuyển sang Postimages",
  commandCategory: "Công cụ",
  usages: "[reply ảnh hoặc video]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, type, messageReply, messageID } = event;
  const ClientID = "f20bdcf02b2f89e";
  imgur.setClientId(ClientID);

  if (type !== "message_reply" || !messageReply.attachments?.length)
    return api.sendMessage("⚠️ Hãy reply vào **1 ảnh hoặc video** để upload!", threadID, messageID);

  const links = [];

  for (const att of messageReply.attachments) {
    const type = att.type;
    if (!["photo", "animated_image", "video"].includes(type)) continue;

    const ext = type === "photo" ? "jpg" : type === "video" ? "mp4" : "gif";
    const path = __dirname + `/cache/${Date.now()}.${ext}`;

    try {
      // tải file tạm
      const res = await axios.get(att.url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, res.data);

      // --- Upload lên Imgur ---
      try {
        const uploaded = await imgur.uploadFile(path);
        if (uploaded?.link) {
          links.push(uploaded.link);
          fs.unlinkSync(path);
          continue;
        }
      } catch (err) {
        console.log("⚠️ Imgur lỗi, chuyển sang Postimages:", err.message);
      }

      // --- Upload fallback qua Postimages ---
      const form = new FormData();
      form.append("file", fs.createReadStream(path));
      form.append("format", "json");
      const uploadPost = await axios.post("https://api.postimages.org/1/upload", form, {
        headers: form.getHeaders()
      });

      fs.unlinkSync(path);

      if (uploadPost.data?.data?.direct_link) {
        links.push(uploadPost.data.data.direct_link);
      } else {
        links.push("❌ Upload thất bại!");
      }

    } catch (err) {
      console.error("❌ Upload toàn phần lỗi:", err.message);
      if (fs.existsSync(path)) fs.unlinkSync(path);
      links.push("❌ Upload thất bại!");
    }
  }

  if (links.length === 0)
    return api.sendMessage("❌ Upload thất bại hoàn toàn!", threadID, messageID);
  else
    return api.sendMessage(links.join("\n"), threadID, messageID);
};
