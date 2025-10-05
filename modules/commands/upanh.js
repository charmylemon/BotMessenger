const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");

module.exports.config = {
  name: "upanh",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Upload ảnh qua Postimages",
  commandCategory: "Công cụ",
  usages: "[reply ảnh]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, type, messageReply, messageID } = event;

  if (type !== "message_reply" || !messageReply?.attachments?.length)
    return api.sendMessage("⚠️ Reply vào ảnh để upload!", threadID, messageID);

  const att = messageReply.attachments[0];
  const ext = att.type === "photo" ? "jpg" : "png";
  const tmp = __dirname + `/cache/${Date.now()}.${ext}`;

  try {
    const img = await axios.get(att.url, { responseType: "arraybuffer" });
    await fs.writeFile(tmp, img.data);

    const form = new FormData();
    form.append("file", fs.createReadStream(tmp));
    form.append("format", "json");

    const res = await axios.post("https://api.postimages.org/1/upload", form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    await fs.unlink(tmp);

    if (res?.data?.data?.url) {
      return api.sendMessage(res.data.data.url, threadID, messageID);
    } else {
      return api.sendMessage("❌ Upload thất bại!", threadID, messageID);
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Upload thất bại hoàn toàn!", threadID, messageID);
  }
};
