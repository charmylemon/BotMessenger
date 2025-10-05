module.exports.config = {
  name: "vdcosplay",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "mod by ChatGPT",
  description: "Random video cosplay (trừ tiền)",
  commandCategory: "Video",
  usages: "/vdcosplay",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async({ api, event, Currencies }) => {
  const request = require("request");
  const fs = require("fs-extra");

  // danh sách video
  var link = [
    "https://duongkum999.tech/cos/01enm1R.mp4",
    "https://i.imgur.com/p5uRDAk.mp4",
    "https://i.imgur.com/p5uRDAk.mp4",
    "https://i.imgur.com/pmNL7UM.mp4",
    "https://i.imgur.com/ClPn2su.mp4",
    "https://i.imgur.com/LrHrT5i.mp4",
    "https://i.imgur.com/uO8EH4f.mp4",
    "https://i.imgur.com/Sc4NRL7.mp4",
    "https://i.imgur.com/pvTBBNV.mp4",
    "https://i.imgur.com/TMZRsZU.mp4",
    "https://i.imgur.com/KuJbmuY.mp4",
    "https://files.catbox.moe/ywgq4r.mp4",
    "https://files.catbox.moe/7nuvj7.mp4",
    "https://files.catbox.moe/vpfjff.mp4",
    "https://files.catbox.moe/3lgvl9.mp4",
    "https://files.catbox.moe/1o25ow.mp4",
    "https://files.catbox.moe/1o25ow.mp4"
  ];

  var data = await Currencies.getData(event.senderID);
  var money = data.money;

  // phí dùng lệnh
  const cost = 100000000;

  if (money < cost) {
    return api.sendMessage(
      `⚠️ Bạn cần ${cost.toLocaleString()} đô để xem video!\n💰 Số dư hiện tại: ${money.toLocaleString()} đô`,
      event.threadID,
      event.messageID
    );
  } else {
    await Currencies.setData(event.senderID, { money: money - cost });

    var callback = () => api.sendMessage({
      body: `🎬 Video cosplay random!\n💸 Đã trừ ${cost.toLocaleString()} đô\n💰 Số dư còn lại: ${(money - cost).toLocaleString()} đô`,
      attachment: fs.createReadStream(__dirname + "/cache/vdcosplay.mp4")
    }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/vdcosplay.mp4"));

    return request(encodeURI(link[Math.floor(Math.random() * link.length)]))
      .pipe(fs.createWriteStream(__dirname + "/cache/vdcosplay.mp4"))
      .on("close", () => callback());
  }
};
