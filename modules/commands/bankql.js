const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "bankql",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "GPT-5",
  description: "Quản lý ngân hàng (chỉ admin)",
  commandCategory: "Kinh tế",
  usages: "/bankql",
  cooldowns: 5,
};

const ADMIN_ID = "100056276350068";
const bankPath = path.join(__dirname, "data", "bank.json");

function formatMoney(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports.run = async function({ api, event, Users }) {
  const senderID = event.senderID;
  if (senderID !== ADMIN_ID)
    return api.sendMessage("❌ Lệnh này chỉ dành cho ADMIN.", event.threadID, event.messageID);

  if (!fs.existsSync(bankPath))
    return api.sendMessage("⚠️ Không tìm thấy dữ liệu ngân hàng!", event.threadID, event.messageID);

  const data = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  if (data.length === 0)
    return api.sendMessage("📭 Chưa có ai đăng ký tài khoản ngân hàng.", event.threadID, event.messageID);

  // Sắp xếp giảm dần theo số dư
  const sorted = data.sort((a, b) => Number(b.money) - Number(a.money));

  let msg = "=====🏦 DANH SÁCH NGÂN HÀNG (TOP GIÀU NHẤT) 🏦=====\n\n";
  let i = 1;

  for (const acc of sorted) {
    const userInfo = await Users.getNameUser(acc.senderID) || "Không rõ";
    const time = new Date(acc.lastInterestTime || Date.now());
    const date = time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " +
                 time.toLocaleDateString("vi-VN");
    msg += `${i}. UID: ${acc.senderID}\n👤 ${userInfo}\n💰 ${formatMoney(acc.money)}$\n🕒 ${date}\n\n`;
    i++;
  }

  msg += "💬 Trả lời STT để chỉnh sửa tài khoản tương ứng.";

  return api.sendMessage(msg, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID,
      type: "chooseUser",
      sorted
    });
  });
};

module.exports.handleReply = async function({ api, event, handleReply, Users }) {
  const { author, type, sorted } = handleReply;
  if (event.senderID !== author) return;
  const { threadID, messageID, body } = event;

  const data = JSON.parse(fs.readFileSync(bankPath, "utf8"));

  switch (type) {
    case "chooseUser": {
      const index = parseInt(body.trim());
      if (isNaN(index) || index < 1 || index > sorted.length)
        return api.sendMessage("⚠️ STT không hợp lệ.", threadID, messageID);

      const chosen = sorted[index - 1];
      const userInfo = await Users.getNameUser(chosen.senderID) || "Không rõ";

      const msg = `👤 ${userInfo}\nUID: ${chosen.senderID}\n💰 Số dư hiện tại: ${formatMoney(chosen.money)}$\n\n➡️ Nhập lệnh:\n- cộng <số tiền>\n- trừ <số tiền>\n- reset`;
      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author,
          type: "editMoney",
          userID: chosen.senderID
        });
      });
    }

    case "editMoney": {
      const [action, amountRaw] = body.trim().split(/\s+/);
      const userID = handleReply.userID;
      const accIndex = data.findIndex(acc => acc.senderID === userID);

      if (accIndex === -1)
        return api.sendMessage("❌ Không tìm thấy tài khoản.", threadID, messageID);

      if (action === "reset") {
        data[accIndex].money = "0";
        fs.writeFileSync(bankPath, JSON.stringify(data, null, 2));
        return api.sendMessage(`✅ Đã reset tài khoản UID ${userID} về 0$.`, threadID, messageID);
      }

      if (!["cộng", "trừ"].includes(action))
        return api.sendMessage("⚠️ Lệnh không hợp lệ. Dùng: cộng <số tiền> hoặc trừ <số tiền> hoặc reset", threadID, messageID);

      const amount = parseInt(amountRaw);
      if (isNaN(amount) || amount <= 0)
        return api.sendMessage("⚠️ Số tiền không hợp lệ.", threadID, messageID);

      if (action === "cộng") data[accIndex].money = String(Number(data[accIndex].money) + amount);
      else if (action === "trừ") data[accIndex].money = String(Math.max(0, Number(data[accIndex].money) - amount));

      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2));

      const newBal = formatMoney(data[accIndex].money);
      return api.sendMessage(`✅ Đã ${action} ${formatMoney(amount)}$ cho UID ${userID}.\n💰 Số dư mới: ${newBal}$`, threadID, messageID);
    }
  }
};
