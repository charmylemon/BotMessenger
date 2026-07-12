const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "admin_auto",
  version: "1.1.3",
  hasPermssion: 0,
  credits: "lmh mod by GPT-5",
  description: "Tự động gửi video khi có chữ 'admin' và tag admin",
  commandCategory: "no prefix",
  usages: "",
  cooldowns: 0,
};

module.exports.handleEvent = async ({ api, event }) => {
  const message = event.body?.toLowerCase();
  if (!message || !message.includes("admin")) return;

  try {
    const videoDir = path.join(__dirname, "videoadmin");
    const files = fs.readdirSync(videoDir).filter(file => file.endsWith(".mp4"));
    if (files.length === 0) return;

    // Random video
    const randomVideo = files[Math.floor(Math.random() * files.length)];
    const videoPath = path.join(videoDir, randomVideo);

    const bodyText = `°(\\ (\\       
(„• ֊ •„) 
━O━O━━━━━━━━━━━
𝙉𝙖𝙢𝙚: 𝙇𝙚 𝙈𝙞𝙣𝙝 𝙃𝙪𝙖𝙣𝙜
𝘽𝙞𝙧𝙩𝙝𝙙𝙖𝙮: 𝟮𝟲/𝟬𝟰/𝟮𝟬𝟭𝟬 
𝙇𝙞𝙫𝙚 𝙞𝙣: 𝙩𝘰̂̀𝙣 𝙩𝙖̣𝙞 𝙫𝙪̛𝙟𝙣𝙜 𝙦𝙪𝙤̂́𝙘 𝙧𝙖𝙪 𝙢𝙖́
</>𝘾𝙝𝙖𝙧𝙢𝙮𝙡𝙚𝙢𝙤𝙣</>
━━━━━━━━━━━━━━━`;

    api.sendMessage(
      {
        body: bodyText,
        attachment: fs.createReadStream(videoPath)
      },
      event.threadID,
      (err, info) => {
        if (err) return;

        // reply và tag trực tiếp
        const tagName = "@Le Minh Huang";
        api.sendMessage(
          {
            body: `👋 ${tagName} đã được triệu hồi!`,
            mentions: [
              {
                tag: tagName,
                id: "100056276350068"
              }
            ]
          },
          event.threadID,
          event.messageID
        );
      },
      event.messageID
    );
  } catch (err) {
    // im lặng, không báo lỗi
  }
};

module.exports.run = () => {};
