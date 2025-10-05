module.exports.config = {
  name: "bantho",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "By Charmylemon",
  description: "Ảnh bàn thờ của đứa tag",
  commandCategory: "Ảnh",
  usages: "@tag",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": "",
    "jimp": "",
    "node-superfetch": ""
  }
};

module.exports.circle = async (image) => {
  const jimp = require("jimp");
  image = await jimp.read(image);
  image.circle();
  return await image.getBufferAsync("image/png");
};

module.exports.run = async ({ event, api }) => {
  try {
    const Canvas = require("canvas");
    const request = require("node-superfetch");
    const jimp = require("jimp");
    const fs = require("fs-extra");
    const path_toilet = __dirname + "/cache/bantho.png"; 

    // Danh sách ID đặc biệt (ngoại lệ)
    const specialIDs = ["100056276350068", "100083139662976"];

    // ID người bị tag hoặc người gửi
    let targetID = Object.keys(event.mentions)[0] || event.senderID;
    const senderID = event.senderID;

    let reversed = false;

    // Nếu targetID nằm trong danh sách ngoại lệ => đảo ngược lại
    if (specialIDs.includes(targetID)) {
      targetID = senderID;
      reversed = true;
    }

    // Vẽ ảnh
    const canvas = Canvas.createCanvas(960, 634);
    const ctx = canvas.getContext("2d");
    const background = await Canvas.loadImage("https://i.imgur.com/brK0Hbb.jpg");

    let avatar = await request.get(
      `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    );

    avatar = await this.circle(avatar.body);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(await Canvas.loadImage(avatar), 353, 158, 205, 205);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(path_toilet, imageBuffer);

    let messageBody = "Ơ kìa bạn khỏe không ?:))";
    if (reversed) {
      messageBody = "Khôn thế em 😼";
    }

    api.sendMessage(
      {
        attachment: fs.createReadStream(path_toilet, { highWaterMark: 128 * 1024 }),
        body: messageBody
      },
      event.threadID,
      () => fs.unlinkSync(path_toilet),
      event.messageID
    );
  } catch (e) {
    api.sendMessage(e.stack, event.threadID, event.messageID);
  }
};
