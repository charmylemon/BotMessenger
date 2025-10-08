const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");
const { downloadFile } = require("./../../utils/index");

module.exports.config = {
  name: "gofile",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "lmh mod fix by GPT-5",
  description: "Upload file lên Gofile và trả về link trực tiếp + link file thực tế từ trang gofile",
  commandCategory: "Tiện ích",
  usages: "[reply ảnh/video]",
  cooldowns: 5,
};

function sanitizeFilename(name = "") {
  return name.replace(/[/\\?%*:|"<>]/g, "_");
}

function findStoreLinksInHtml(html = "") {
  // Tìm mọi link dạng storeX.gofile.io/download/...
  const re = /https?:\/\/store\d+\.gofile\.io\/download\/[^\s"'<>]+/g;
  const matches = html.match(re) || [];
  return Array.from(new Set(matches)); // unique
}

async function tryGetDirectFromContentApi(fileId, token = "") {
  try {
    const url = `https://api.gofile.io/contents/${fileId}`;
    const res = await axios.get(url, { params: token ? { token } : {} , timeout: 10000 });
    if (res.data && res.data.status === "ok" && res.data.data) {
      const str = JSON.stringify(res.data.data);
      const matches = str.match(/https?:\/\/store\d+\.gofile\.io\/download\/[^\s"'<>\\}]+/g) || [];
      if (matches.length) return matches[0];
    }
  } catch (e) {
    // ignore
  }
  return null;
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageReply, type, messageID } = event;
  if (type !== "message_reply" || !messageReply.attachments?.length)
    return api.sendMessage("⚠️ Vui lòng reply vào ảnh hoặc video để upload.", threadID, messageID);

  const GOFILE_TOKEN = ""; // nếu có token (tùy chọn)
  const attachmentSend = [];

  // tạo folder cache nếu chưa có
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  // tải file về, giữ tên gốc nếu có
  for (let i = 0; i < messageReply.attachments.length; i++) {
    const att = messageReply.attachments[i];
    // cố gắng lấy tên gốc từ attachment, fallback lấy từ URL
    const origNameFromAtt = att.filename || att.name || path.basename((att.url || "").split("?")[0] || `file_${i}`);
    const origNameSan = sanitizeFilename(origNameFromAtt);
    const filePath = path.join(cacheDir, `${Date.now()}_${i}_${origNameSan}`);
    await downloadFile(att.url, filePath);
    attachmentSend.push({ path: filePath, originalName: origNameSan, attachment: att });
  }

  let msg = "", err = 0;

  for (const file of attachmentSend) {
    try {
      // Lấy server upload (cách gốc vẫn hoạt động)
      const serverRes = await axios.get("https://api.gofile.io/servers");
      const server = serverRes.data.data.servers[0].name;

      // Upload file
      const form = new FormData();
      form.append("file", fs.createReadStream(file.path));

      const uploadRes = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
        headers: form.getHeaders(),
        params: GOFILE_TOKEN ? { token: GOFILE_TOKEN } : {},
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (uploadRes.data && uploadRes.data.status === "ok") {
        const data = uploadRes.data.data;
        // downloadPage dạng: https://gofile.io/d/XXXXX  (hoặc data.directLink)
        const fileUrl = data.downloadPage || data.directLink || data.downloadLink || data.link;

        msg += `✅ ${fileUrl}\n`;

        // TH1: cố gắng truy cập trang download và tìm link store trực tiếp trong HTML
        let directAsset = null;
        if (fileUrl) {
          try {
            const pageRes = await axios.get(fileUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                Referer: "https://gofile.io/",
              },
              timeout: 10000,
            });
            const html = pageRes.data + "";

            // tìm mọi store link
            const matches = findStoreLinksInHtml(html);
            if (matches.length) {
              // chọn link khớp tên gốc nếu có, hoặc chọn link đầu tiên
              const byName = matches.find(m => {
                try {
                  return decodeURIComponent(m).endsWith(`/${file.originalName}`);
                } catch (e) { return m.endsWith(`/${file.originalName}`); }
              });
              directAsset = byName || matches[0];
            }
          } catch (e) {
            // nếu lỗi fetch html, bỏ qua để thử API fallback
          }
        }

        // TH2 (fallback): thử gọi API contents/{fileId} để tìm link trực tiếp
        if (!directAsset) {
          // lấy ID từ downloadPage: /d/xxxxx
          const match = (fileUrl || "").match(/\/d\/([^/?#]+)/);
          const fileId = match ? match[1] : null;
          if (fileId) {
            const apiLink = await tryGetDirectFromContentApi(fileId, GOFILE_TOKEN);
            if (apiLink) directAsset = apiLink;
          }
        }

        // TH3 (fallback cuối): nếu response upload có directLink field dùng nó
        if (!directAsset && data.directLink) directAsset = data.directLink;

        if (directAsset) {
          msg += `🔗 ${directAsset}\n`;
        } else {
          msg += `⚠️ Không tìm được link trực tiếp (store) cho file: ${file.originalName}\n`;
        }
      } else {
        err++;
      }
    } catch (e) {
      console.log("UPLOAD ERROR:", e && e.message ? e.message : e);
      err++;
    } finally {
      // xóa file tạm
      try { fs.unlinkSync(file.path); } catch (e) {}
    }
  }

  if (!msg) msg = "❌ Upload thất bại.";
  if (err > 0) msg += `\n⚠️ ${err} file bị lỗi.`;

  return api.sendMessage(msg, threadID);
};
