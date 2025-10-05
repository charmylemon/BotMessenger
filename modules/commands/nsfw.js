module.exports.config = {
  name: "nsfw",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Hercules",
  description: "Bật hoặc tắt quyền sử dụng NSFW trong nhóm",
  commandCategory: "Quản trị nhóm",
  usages: "[on/off]",
  cooldowns: 5
};

module.exports.run = async ({ event, args, Threads, api }) => {
  const threadID = event.threadID;
  const data = (await Threads.getData(threadID)).data || {};

  if (args[0] === "on") {
      data.NSFW = true;
      global.data.threadAllowNSFW.set(threadID, true);
      await Threads.setData(threadID, { data });
      return api.sendMessage("✅ Đã bật NSFW cho nhóm này!", threadID);
  }
  else if (args[0] === "off") {
      data.NSFW = false;
      global.data.threadAllowNSFW.delete(threadID);
      await Threads.setData(threadID, { data });
      return api.sendMessage("🚫 Đã tắt NSFW cho nhóm này!", threadID);
  }
  else {
      return api.sendMessage("❗ Sai cú pháp, dùng: /nsfw [on/off]", threadID);
  }
};
