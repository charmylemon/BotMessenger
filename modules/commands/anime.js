module.exports.config = {
  name: "anime",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Vtuan - mod by GPT",
  description: "Xem ảnh nhưng tốn tiền",
  commandCategory: "Random-img",
  usages: "anime",
  cooldowns: 30
};

module.exports.run = async ({ api, event, Users, Currencies }) => {
  const axios = require('axios');
  const request = require('request');
  const fs = require("fs");

  const COST = 500000000; // phí mỗi lần dùng

  // Lấy số dư
  let userData = await Currencies.getData(event.senderID);
  let money = userData.money || 0;

  if (money < COST) {
    return api.sendMessage(`❌ Bạn không đủ tiền (cần ${COST.toLocaleString()}đ).`, event.threadID, event.messageID);
  }

  // Trừ tiền
  await Currencies.decreaseMoney(event.senderID, COST);

  // Lấy ảnh từ file json
  const anh = require('./../../img/anime1.json');
  var image1 = anh[Math.floor(Math.random() * anh.length)].trim();
  var image2 = anh[Math.floor(Math.random() * anh.length)].trim();
  var image3 = anh[Math.floor(Math.random() * anh.length)].trim();
  var image4 = anh[Math.floor(Math.random() * anh.length)].trim();

  function downloadAndSendImage(image, fileName, callback) {
    request(image).pipe(fs.createWriteStream(__dirname + `/` + fileName)).on("close", callback);
  }

  let callback = function () {
    return api.sendMessage({
      body: `📸 Anime nè!\n💸 Bạn đã bị trừ ${COST.toLocaleString()}đ.`,
      attachment: [
        fs.createReadStream(__dirname + `/1.png`),
        fs.createReadStream(__dirname + `/2.png`),
        fs.createReadStream(__dirname + `/3.png`),
        fs.createReadStream(__dirname + `/4.png`)
      ]
    }, event.threadID, () => {
      fs.unlinkSync(__dirname + `/1.png`);
      fs.unlinkSync(__dirname + `/2.png`);
      fs.unlinkSync(__dirname + `/3.png`);
      fs.unlinkSync(__dirname + `/4.png`);
    }, event.messageID);
  };

  // Gửi ảnh
  downloadAndSendImage(image1, '1.png', () => {
    downloadAndSendImage(image2, '2.png', () => {
      downloadAndSendImage(image3, '3.png', () => {
        downloadAndSendImage(image4, '4.png', callback)
      })
    })
  });
};
