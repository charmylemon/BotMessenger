module.exports.config = {
  name: "vdseg",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Gemini",
  description: "Random video NSFW (Smart Debug Mode)",
  commandCategory: "Random-Image",
  usages: "",
  cooldowns: 10,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "cheerio": ""
  }
};

module.exports.run = async ({ api, event, Currencies }) => {
  const axios = require("axios");
  const fs = require("fs-extra");
  const cheerio = require("cheerio");

  // --- CẤU HÌNH ---
  const MONEY_COST = 100000;
  const MAX_SIZE_MB = 45; // Giới hạn dung lượng (MB) để gửi được qua FB

  // Fake User-Agent xịn để tránh bị chặn
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://anh.moe/' 
  };

  try {
    // --- BƯỚC 1: TRỪ TIỀN ---
    const userData = await Currencies.getData(event.senderID);
    if (userData.money < MONEY_COST) {
      return api.sendMessage(`❌ Cần ${MONEY_COST.toLocaleString()}$ nhé!`, event.threadID, event.messageID);
    }
    await Currencies.decreaseMoney(event.senderID, MONEY_COST);
    api.sendMessage(`💸 Đang tìm video (Đã lọc file nặng >${MAX_SIZE_MB}MB)...`, event.threadID, event.messageID);

    // --- BƯỚC 2: QUÉT VIDEO ---
    let videoUrl = "";
    let found = false;
    let attempts = 0;

    // Thử tối đa 15 lần tìm link
    while (!found && attempts < 15) {
      attempts++;
      console.log(`[VDSEG] Lần thử: ${attempts}`);

      try {
        // Random page 1-10
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const listUrl = `https://anh.moe/category/video-nsfw/page/${randomPage}/?list=images&sort=likes_desc`;

        // 2.1 Lấy HTML trang danh sách
        const resList = await axios.get(listUrl, { headers: HEADERS });
        const $list = cheerio.load(resList.data);

        // Lấy tất cả link /view/
        let viewLinks = [];
        $("a[href*='/view/']").each((i, el) => {
            viewLinks.push($(el).attr("href"));
        });

        if (viewLinks.length === 0) {
            console.log("[VDSEG] Không tìm thấy link view nào ở page " + randomPage);
            continue;
        }

        // Chọn bừa 1 link view
        const randomViewLink = viewLinks[Math.floor(Math.random() * viewLinks.length)];
        console.log(`[VDSEG] Đang check link: ${randomViewLink}`);

        // 2.2 Vào trang View lấy link video gốc
        const resView = await axios.get(randomViewLink, { headers: HEADERS });
        const $view = cheerio.load(resView.data);

        // Ưu tiên 1: Lấy từ meta tag og:video (Chuẩn nhất)
        let directLink = $view("meta[property='og:video']").attr("content");

        // Ưu tiên 2: Lấy từ source tag
        if (!directLink) directLink = $view("source[src*='.mp4']").attr("src");

        // Ưu tiên 3: Quét Regex trong script
        if (!directLink) {
            const match = resView.data.match(/(https?:\/\/[^"']+\.mp4)/);
            if (match) directLink = match[1];
        }

        if (!directLink) {
            console.log("[VDSEG] Link này không có file mp4 (Có thể là stream hoặc ảnh)");
            continue;
        }

        // 2.3 KIỂM TRA DUNG LƯỢNG (HEAD REQUEST)
        // Bước này cực quan trọng để tránh lỗi gửi tin nhắn
        try {
            const headCheck = await axios.head(directLink, { headers: HEADERS });
            const fileSize = headCheck.headers['content-length'];
            const sizeInMB = fileSize / (1024 * 1024);

            console.log(`[VDSEG] Tìm thấy video: ${sizeInMB.toFixed(2)} MB`);

            if (sizeInMB > MAX_SIZE_MB) {
                console.log("[VDSEG] >> Bỏ qua vì quá nặng");
                continue;
            }
            if (sizeInMB < 0.5) {
                console.log("[VDSEG] >> Bỏ qua vì quá nhẹ (chắc là lỗi)");
                continue;
            }

            // Nếu ổn áp thì chốt
            videoUrl = directLink;
            found = true;

        } catch (headErr) {
            console.log("[VDSEG] Lỗi khi check size: " + headErr.message);
            // Vẫn thử tải nếu không check được size, hên xui
            videoUrl = directLink;
            found = true;
        }

      } catch (e) {
        console.log(`[VDSEG] Lỗi vòng lặp: ${e.message}`);
        // Nếu dính Cloudflare 403
        if (e.response && e.response.status === 403) {
             await Currencies.increaseMoney(event.senderID, MONEY_COST);
             return api.sendMessage("❌ Server bot bị Cloudflare chặn IP. Không thể lấy video lúc này.", event.threadID);
        }
      }
    }

    if (!found) {
        await Currencies.increaseMoney(event.senderID, MONEY_COST);
        return api.sendMessage("❌ Đã quét 15 bài nhưng không tìm được video nào phù hợp (hoặc toàn file quá nặng). Đã hoàn tiền.", event.threadID, event.messageID);
    }

    // --- BƯỚC 3: TẢI VÀ GỬI ---
    const filePath = __dirname + `/cache/vdseg_${Date.now()}.mp4`;
    const dl = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
        headers: HEADERS
    });

    dl.data.pipe(fs.createWriteStream(filePath)).on("finish", () => {
        api.sendMessage({
            body: `Video hàng tuyển (Check size OK) 🌚\n- URL: ${videoUrl.substring(0, 30)}...\n- Tự hủy sau 30s`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, (err, info) => {
            fs.unlinkSync(filePath);
            if (err) return api.sendMessage(`❌ Lỗi API Facebook: Video có thể định dạng sai hoặc bị chặn.`, event.threadID);

            setTimeout(() => api.unsendMessage(info.messageID), 30000);
        }, event.messageID);
    });

  } catch (e) {
    return api.sendMessage(`Lỗi hệ thống: ${e.message}`, event.threadID);
  }
};