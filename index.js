const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");
const express = require('express');
const path = require('path');
const chalk = require('chalkercli');
const chalk1 = require('chalk');
const CFonts = require('cfonts');
const app = express();

// ✅ Dùng port động (fix lỗi EADDRINUSE)
const PORT = process.env.PORT || 5000;

// Time setup
const moment = require("moment-timezone");
let gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
let thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
if (thu == 'Sunday') thu = '𝐂𝐡𝐮̉ 𝐍𝐡𝐚̣̂𝐭'
if (thu == 'Monday') thu = '𝐓𝐡𝐮̛́ 𝐇𝐚𝐢'
if (thu == 'Tuesday') thu = '𝐓𝐡𝐮̛́ 𝐁𝐚'
if (thu == 'Wednesday') thu = '𝐓𝐡𝐮̛́ 𝐓𝐮̛'
if (thu == 'Thursday') thu = '𝐓𝐡𝐮̛́ 𝐍𝐚̆𝐦'
if (thu == 'Friday') thu = '𝐓𝐡𝐮̛́ 𝐒𝐚́𝐮'
if (thu == 'Saturday') thu = '𝐓𝐡𝐮̛́ 𝐁𝐚̉𝐲'

console.log(`\nㅤㅤㅤㅤ𝐇𝐨̂𝐦 𝐧𝐚𝐲 𝐥𝐚̀: ${thu} | 𝐂𝐡𝐮́𝐜 𝐛𝐚̣𝐧 𝐜𝐨́ 𝐦𝐨̣̂𝐭 𝐧𝐠𝐚̀𝐲 𝐯𝐮𝐢 𝐯𝐞̉\n`);

// Route chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

// ✅ Lắng nghe cổng an toàn, có log, chống trùng port
const server = app.listen(PORT, () => {
  console.log(`✅ Máy chủ khởi động tại: http://localhost:${PORT}`);
  console.log("🕒 Thời gian:", gio, "\n");
}).on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`⚠️ Cổng ${PORT} đã được sử dụng!`);
    console.error("👉 Bạn có thể đổi PORT hoặc dừng tiến trình cũ.");
  } else {
    console.error("❌ Lỗi khởi động máy chủ:", err);
  }
});

// ====== PHẦN BOT ======
logger("𝐋𝐢𝐞̂𝐧 𝐡𝐞̣̂ 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: https://www.facebook.com/charmylemon", "𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤");

const rainbow = chalk.rainbow(`\nㅤㅤㅤㅤㅤㅤ『=== </>𝘾𝙝𝙖𝙧𝙢𝙮𝙡𝙚𝙢𝙤𝙣</> ===』\n`).stop();
rainbow.render();
console.log(rainbow.frame());
logger("Phiên bản hiện tại là bản mới nhất!", "UPDATE");

// ====== HÀM KHỞI ĐỘNG BOT ======
function startBot(message) {
  if (message) logger(message, "BOT ĐANG KHỞI ĐỘNG");

  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", async (codeExit) => {
    if (codeExit == 1) return startBot("BOT RESTARTING!!!");
    else if (`${codeExit}`.startsWith('2')) {
      await new Promise(resolve => setTimeout(resolve, parseInt(`${codeExit}`.slice(1)) * 1000));
      startBot("Bot has been activated please wait a moment!!!");
    }
  });

  child.on("error", err => {
    logger("An error occurred: " + JSON.stringify(err), "[ Starting ]");
  });
}

axios.get("https://raw.githubusercontent.com/tandung1/Bot12/main/package.json").catch(() => {});
setTimeout(() => {
  rainbow.render();
  console.log(rainbow.frame());
  logger('𝐁𝐚̆́𝐭 𝐝𝐚̂̀𝐮 𝐥𝐨𝐚𝐝 𝐬𝐨𝐮𝐫𝐜𝐞 𝐜𝐨𝐝𝐞', 'LOAD');
  startBot();
}, 70);
