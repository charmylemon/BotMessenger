const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");

module.exports.config = {
  name: "uplink",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Upload file reply lên Pixeldrain và trả direct link",
  commandCategory: "Tiện ích",
  usages: "[reply ảnh/video]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  if (!event.messageReply || !event.messageReply.attachments) {
    return api.sendMessage("⚠️ Hãy reply vào ảnh/video để upload!", event.threadID, event.messageID);
  }

  const att = event.messageReply.attachments[0]; 
  const url = att.url;
  const ext = url.split(".").pop().split("?")[0];
  const path = __dirname + `/cache/uplink.${ext}`;

  // tải file về cache
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(path, Buffer.from(res.data, "binary"));

  // upload lên Pixeldrain
  const form = new FormData();
  form.append("file", fs.createReadStream(path));

  const upload = await axios.post("https://pixeldrain.com/api/file", form, {
    headers: form.getHeaders()
  });

  fs.unlinkSync(path);

  if (upload.data && upload.data.id) {
    const fileId = upload.data.id;
    const link = `https://pixeldrain.com/u/${fileId}`;
    const direct = `https://pixeldrain.com/api/file/${fileId}`;
    return api.sendMessage(`📤 Upload thành công!\n🌍 Link xem: ${link}\n🔗 Link trực tiếp: ${direct}`, event.threadID, event.messageID);
  } else {
    return api.sendMessage("❌ Upload thất bại!", event.threadID, event.messageID);
  }
};
