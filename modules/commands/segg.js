module.exports.config = {
 name:"vdsex",
  verison:"1.0.0",
  hasPremssion: 2,
  credit: "",
  description: "Video gái",
  commandCategory: "Video",
  usages: "seg",
  cooldowns: 0
};
module.exports.run = async ({ api, event }) => {
  const permission = ["100056276350068","100056276350068"];
  if (!permission.includes(event.senderID)) return api.sendMessage("Xin hộ cái tuổi cái?", event.threadID, event.messageID);
  const moment = require("moment-timezone");
 var gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
 var thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
  const axios = require('axios');
  const request = require('request');
  const fs = require("fs");
  if (thu == 'Sunday') thu = '𝗖𝗵𝘂̉ 𝗻𝗵𝗮̣̂𝘁'
  if (thu == 'Monday') thu = '𝗧𝗵𝘂̛́ 𝗵𝗮𝗶'
  if (thu == 'Tuesday') thu = '𝗧𝗵𝘂̛́ 𝗯𝗮'
  if (thu == 'Wednesday') thu = '𝗧𝗵𝘂̛́ 𝘁𝘂̛'
  if (thu == "Thursday") thu = '𝗧𝗵𝘂̛́ 𝗻𝗮̆𝗺'
  if (thu == 'Friday') thu = '𝗧𝗵𝘂̛́ 𝗦𝗮́𝘂'
  if (thu == 'Saturday') thu = '𝗧𝗵𝘂̛́ 𝗯𝗮̉𝘆'
  axios.get('https://random.sadboyyeu.repl.co/video/sex').then(res => {
    let ext = res.data.data.substring(res.data.data.lastIndexOf(".") + 1);
  let callback = function () {
     let
  s = process.uptime(),u = [s/3600<<0, s/60%60<<0, s%60<<0].map(el => el < 10?'0'+el: el);
          api.sendMessage({
             body: `===== 『 𝐕𝐈𝐃𝐄𝐎 🦋 』 =====\n◆━━━━━━━━━━━━━◆\n➢『🧸』 𝐒𝐨̂́ 𝐯𝐢𝐝𝐞𝐨 𝐡𝐢𝐞̣̂𝐧 𝐜𝐨́ 𝐥𝐚̀: ${res.data.count}\n➢『⏰️』𝐇𝐨̂𝐦 𝐧𝐚𝐲 𝐥𝐚̀ ${thu}\n➢『🌐』𝐔𝐩𝐭𝐢𝐦𝐞: ${u.join(':')}\n➢『💿』𝐋𝐢𝐧𝐤: ${res.data.data}\n➢『⏳』 𝐁𝐚̂𝐲 𝐠𝐢𝐨̛̀ 𝐥𝐚̀:\n⏰= [ ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY")} ] =⏰\n━━━━━━━━━━━━━━━━━\n`,
            attachment: fs.createReadStream(__dirname + `/cache/dạ.${ext}`)
          }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/dạ.${ext}`), event.messageID);
        };
        request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/dạ.${ext}`)).on("close", callback);
      })
}
