const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
  name: "tx",
  version: "0.0.2",
  hasPermssion: 0,
  credits: "hahh",
  description: "Chơi tài xỉu dùng ảnh local",
  commandCategory: "Trò Chơi",
  usages: "tx tài/xỉu số tiền",
  cooldowns: 10
};

var tilethang = 1;
var tilethangb3dn = 5;
var tilethangb2dn = 3;
var timedelay = 2;
var haisogiong = 2;
var basogiong = 2;
var motsogiong = 1;

function replace(int) {
  return int.toString().replace(/(.)(?=(\d{3})+$)/g, '$1,');
}

function getImagePath(number) {
  return path.join(__dirname, "data", "taixiu", `${number}.jpeg`);
}

function getRATE(tong) {
  return (tong >= 4 && tong <= 17) ? 20 : 0;
}

module.exports.run = async function ({ event, api, Currencies, Users, args }) {
  try {
    const { increaseMoney, decreaseMoney } = Currencies;
    const { threadID, messageID, senderID } = event;
    const { sendMessage } = api;
    const name = await Users.getNameUser(senderID);
    const money = (await Currencies.getData(senderID)).money;
    const bet = parseInt((args[1] === "all" ? money : args[1]));
    const input = args[0];
    const tong = parseInt(args[2]);

    if (!input) return sendMessage("❌ Bạn chưa nhập tài/xỉu/b3gn/b2gn/cuoctong/cuocso", threadID, messageID);
    if (!bet || isNaN(bet) || bet < 1000) return sendMessage("❌ Tiền cược phải từ 1000 trở lên", threadID, messageID);
    if (bet > money) return sendMessage("❌ Bạn không đủ tiền để cược", threadID, messageID);

    const inputMap = {
      "tài": "tài", "Tài": "tài", "-t": "tài",
      "xỉu": "xỉu", "Xỉu": "xỉu", "-x": "xỉu",
      "b3gn": "b3gn", "bbgn": "b3gn", "btgn": "b3gn",
      "b2gn": "b2gn", "bdgn": "b2gn", "bhgn": "b2gn",
      "cuoctong": "cuoctong", "ct": "cuoctong",
      "cuocso": "cuocso", "cs": "cuocso"
    };

    const choose = inputMap[input];
    if (!choose) return sendMessage("❌ Sai tag", threadID, messageID);
    if (choose === 'cuoctong' && (tong < 4 || tong > 17)) return sendMessage("❌ Tổng cược không hợp lệ", threadID, messageID);
    if (choose === 'cuocso' && (tong < 1 || tong > 6)) return sendMessage("❌ Số chọn không hợp lệ", threadID, messageID);

    const number = [];
    const img = [];

    for (let i = 0; i < 3; i++) {
      const n = Math.floor(Math.random() * 6 + 1);
      number.push(n);

      const imagePath = getImagePath(n);
      if (fs.existsSync(imagePath)) {
        img.push(fs.createReadStream(imagePath));
      }
    }

    const total = number.reduce((a, b) => a + b, 0);
    let ans, result, mn, mne;

    if (choose === 'cuocso') {
      const count = number.filter(n => n === tong).length;
      if (count === 3) {
        result = 'win'; mn = bet * basogiong;
      } else if (count === 2) {
        result = 'win'; mn = bet * haisogiong;
      } else if (count === 1) {
        result = 'win'; mn = bet * motsogiong;
      } else {
        result = 'lose'; mn = bet;
      }
      ans = tong;
    } else if (choose === 'cuoctong') {
      if (total === tong) {
        result = 'win'; mn = bet * getRATE(tong);
      } else {
        result = 'lose'; mn = bet;
      }
      ans = total;
    } else if (choose === 'b3gn') {
      if (number[0] === number[1] && number[1] === number[2]) {
        result = 'win'; mn = bet * tilethangb3dn;
        ans = "bộ ba đồng nhất";
      } else {
        result = 'lose'; mn = bet;
        ans = (total >= 11) ? "tài" : "xỉu";
      }
    } else if (choose === 'b2gn') {
      const isB2 = number[0] === number[1] || number[1] === number[2] || number[0] === number[2];
      if (isB2) {
        result = 'win'; mn = bet * tilethangb2dn;
        ans = "bộ hai đồng nhất";
      } else {
        result = 'lose'; mn = bet;
        ans = (total >= 11) ? "tài" : "xỉu";
      }
    } else {
      const isTriple = number[0] === number[1] && number[1] === number[2];
      ans = isTriple ? "bộ ba đồng nhất" : (total >= 11 ? "tài" : "xỉu");
      if (isTriple || ans !== choose) {
        result = 'lose'; mn = bet;
      } else {
        result = 'win'; mn = Math.floor(bet * tilethang);
      }
    }

    mne = (result === 'win') ? money + mn : money - mn;
    if (result === 'win') increaseMoney(senderID, mn);
    else decreaseMoney(senderID, mn);

    const msg = `🎲 𝗧𝗔̀𝗜 𝗫𝗜̉𝗨 🎲
[👤] Người chơi: ${name}
[🎯] Chọn: ${choose}
[🎲] Tổng: ${total} (${ans})
[💵] Đặt cược: ${replace(bet)}$
[📊] Kết quả: ${result === 'win' ? 'Thắng' : 'Thua'}
[💰] Số dư hiện tại: ${replace(mne)}$`;

    return sendMessage({ body: msg, attachment: img }, threadID, messageID);

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ Đã xảy ra lỗi", event.threadID, event.messageID);
  }
};
