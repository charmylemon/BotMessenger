const fs = require("fs");

module.exports.config = {
  name: "phatloc",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "GPT-5 mod by LMH",
  description: "Phát lộc cho ai reply tin nhắn!",
  commandCategory: "Kinh tế",
  usages: "/phatloc <số tiền> <thời gian giây>",
  cooldowns: 10,
  aliases: ["pl"]
};

let activePhatLoc = {};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;

  // Format số
  const format = num => Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Kiểm tra đối số
  const amount = parseInt(args[0]);
  const time = parseInt(args[1]) || 30; // mặc định 30s

  if (!amount || isNaN(amount) || amount <= 0)
    return api.sendMessage("⚠️ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);

  // Lấy tiền người phát
  let senderData = await Currencies.getData(senderID);
  let senderBalance = senderData.money || 0;

  if (senderBalance < amount)
    return api.sendMessage("❌ Bạn không đủ tiền để phát lộc!", threadID, messageID);

  // Trừ tiền người phát
  await Currencies.decreaseMoney(senderID, amount);
  const senderName = (await Users.getData(senderID)).name;

  api.sendMessage(
    `🧧 ${senderName} vừa phát lộc ${format(amount)}đ!\n💬 Ai muốn nhận hãy reply tin nhắn này trong ${time} giây để có cơ hội nhận lộc 💸`,
    threadID,
    async (err, info) => {
      if (err) return;

      activePhatLoc[info.messageID] = {
        threadID,
        senderID,
        total: amount,
        reacted: [],
        time
      };

      // Gắn reply handler
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });

      // Sau <time> giây kết thúc
      setTimeout(async () => {
        const session = activePhatLoc[info.messageID];
        if (!session) return;
        delete activePhatLoc[info.messageID];

        const { reacted, total, senderID } = session;

        // Thu hồi tin nhắn phát lộc
        api.unsendMessage(info.messageID);

        if (reacted.length === 0)
          return api.sendMessage("⏰ Hết thời gian! Không ai nhận được lộc 😿", threadID);

        // Chia tiền ngẫu nhiên
        const senderName = (await Users.getData(senderID)).name;
        const receivers = reacted;
        const result = [];
        let remaining = total;

        for (let i = 0; i < receivers.length; i++) {
          const uid = receivers[i];
          let amountShare;
          if (i === receivers.length - 1) {
            amountShare = remaining;
          } else {
            amountShare = Math.floor(Math.random() * (remaining / (receivers.length - i)) + 1);
            remaining -= amountShare;
          }

          await Currencies.increaseMoney(uid, amountShare);
          const name = (await Users.getData(uid)).name;
          result.push({ id: uid, name, money: amountShare });
        }

        // Sắp xếp top theo tiền
        result.sort((a, b) => b.money - a.money);

        // Hiển thị bảng
        let text = `🎉 Kết quả phát lộc của ${senderName} (${format(total)}đ):\n\n`;
        let mentions = [];

        result.forEach((p, i) => {
          text += `${i + 1}. ${p.name}: +${format(p.money)}đ\n`;
          mentions.push({ tag: p.name, id: p.id });
        });

        // Số dư còn lại của người phát
        let senderNewBalance = (await Currencies.getData(senderID)).money || 0;

        text += `\n💰 Tổng tiền đã phát: ${format(total)}đ`;
        text += `\n🏦 Số dư còn lại của ${senderName}: ${format(senderNewBalance)}đ`;

        api.sendMessage({ body: text, mentions }, threadID);

        // Báo riêng cho người phát
        api.sendMessage(
          `💸 Bạn đã phát thành công ${format(total)}đ!\nSố dư còn lại: ${format(senderNewBalance)}đ.`,
          senderID
        );
      }, time * 1000);
    }
  );
};

// Khi có người reply tin phát lộc
module.exports.handleReply = async function ({ api, event }) {
  const { messageID, senderID, threadID, messageReply } = event;
  if (!messageReply) return;

  const replyTo = messageReply.messageID;
  const session = activePhatLoc[replyTo];
  if (!session) return;

  if (session.reacted.includes(senderID)) return; // tránh trùng
  session.reacted.push(senderID);

  const name = (await global.utils.getNameUser(senderID)) || "Người chơi";
  api.sendMessage(`🎁 ${name} đã nhận lộc!`, threadID);
};
