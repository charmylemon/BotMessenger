module.exports.config = {
  name: "loli",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Charmylemon",
  description: "Xem ảnh random (trừ 1.000.000)",
  commandCategory: "Random-img",
  usages: "/loli",
  cooldowns: 30
};


module.exports.run = async ({ api, event, Currencies }) => {
  const axios = require('axios');
  const request = require('request');
  const fs = require("fs");

  // Load danh sách ảnh từ file json
  const imgs = require('./../../img/vip.json');

  // Check tiền
  const userMoney = (await Currencies.getData(event.senderID)).money;
  if (userMoney < 1000000) {
    return api.sendMessage("⚠️ Bạn không đủ 1.000.000 để dùng lệnh này!", event.threadID, event.messageID);
  }
  await Currencies.setData(event.senderID, { money: userMoney - 1000000 });

  // Random 4 ảnh
  var image1 = imgs[Math.floor(Math.random() * imgs.length)].trim();
  var image2 = imgs[Math.floor(Math.random() * imgs.length)].trim();
  var image3 = imgs[Math.floor(Math.random() * imgs.length)].trim();
  var image4 = imgs[Math.floor(Math.random() * imgs.length)].trim();

  function downloadAndSendImage(image, fileName, callback) {
    request(image).pipe(fs.createWriteStream(__dirname + `/${fileName}`)).on("close", callback);
  }

  let callback = function () {
    return api.sendMessage({
      body: `📷 Ảnh random\n💸 Đã trừ 1.000.000\n💰 Số dư còn lại: ${(userMoney - 1000000).toLocaleString()} VNĐ`,
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

  downloadAndSendImage(image1, '1.png', () => {
    downloadAndSendImage(image2, '2.png', () => {
      downloadAndSendImage(image3, '3.png', () => {
        downloadAndSendImage(image4, '4.png', callback);
      })
    })
  });
}
