module.exports.config = {
  name: "sodu",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "GPT",
  description: "Xem số dư của bản thân hoặc người khác",
  commandCategory: "Kinh tế",
  usages: "[tag/reply] | để trống để xem số dư bản thân",
  cooldowns: 5
};

module.exports.run = async function ({ event, api, Currencies, Users }) {
  const { threadID, messageID, senderID, messageReply, mentions } = event;

  let targetID;
  if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0]; // check theo tag
  } else if (event.type === "message_reply") {
      targetID = messageReply.senderID; // check theo reply
  } else {
      targetID = senderID; // check bản thân
  }

  let balance = (await Currencies.getData(targetID)).money || 0;
  let name = (await Users.getData(targetID)).name;

  return api.sendMessage(`[SỐ DƯ] 💰 ${name} hiện đang có: ${balance}$`, threadID, messageID);
};
