module.exports.config = {

  name: "seg",

  version: "1.4.0",

  hasPermssion: 0,

  credits: "Gemini",

  description: "Random ảnh waifu (Tốn 100k/lần) - Tự hủy sau 10s",

  commandCategory: "Random-Image",

  usages: "",

  cooldowns: 5,

  dependencies: {

    "cheerio": "",

    "axios": ""

  }

};



module.exports.run = async ({ api, event, Currencies }) => {

  const axios = require("axios");

  const cheerio = require("cheerio");

  const fs = require("fs");

  const path = require("path");



  // KHAI BÁO SỐ TIỀN CẦN TRỪ

  const MONEY_COST = 100000;



  try {

    // --- BƯỚC 0: KIỂM TRA VÀ TRỪ TIỀN ---

    const userData = await Currencies.getData(event.senderID);

    const userMoney = userData.money;



    if (userMoney < MONEY_COST) {

        return api.sendMessage(`❌ Bạn nghèo quá! Cần ${MONEY_COST.toLocaleString()}$ để xem "seg".\n💸 Số dư hiện tại: ${userMoney.toLocaleString()}$`, event.threadID, event.messageID);

    }



    await Currencies.decreaseMoney(event.senderID, MONEY_COST);

    // ------------------------------------



    const randomPage = Math.floor(Math.random() * 5) + 1;

    const TARGET_URL = `https://anh.moe/category/nsfw/page/${randomPage}`;



    // BƯỚC 1: Lấy HTML

    const response = await axios.get(TARGET_URL, {

        headers: {

            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

        }

    });



    // BƯỚC 2: Load HTML vào Cheerio

    const $ = cheerio.load(response.data);



    // BƯỚC 3: Lọc lấy link ảnh

    let imageList = [];



    $("div.container img, div.content img, article img").each((index, element) => {

        let src = $(element).attr("src") || $(element).attr("data-src");

        if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {

            if (src.startsWith("/")) {

                src = "https://anh.moe" + src;

            }

            imageList.push(src);

        }

    });



    // Fallback

    if (imageList.length === 0) {

        $("img").each((index, element) => {

            let src = $(element).attr("src");

            if (src && src.startsWith("http") && (src.includes("jpg") || src.includes("png"))) {

                 imageList.push(src);

            }

        });

    }



    if (imageList.length === 0) {

      await Currencies.increaseMoney(event.senderID, MONEY_COST);

      return api.sendMessage("❌ Lỗi web không tìm thấy ảnh. Đã hoàn lại tiền cho bạn.", event.threadID, event.messageID);

    }



    const randomLink = imageList[Math.floor(Math.random() * imageList.length)];

    const ext = path.extname(randomLink).split('?')[0] || ".jpg";

    const filePath = __dirname + `/cache/seg${ext}`;



    // BƯỚC 4: Tải ảnh về

    const download = await axios({

        method: 'get',

        url: randomLink,

        responseType: 'stream'

    });



    download.data.pipe(fs.createWriteStream(filePath)).on('finish', () => {

        // Gửi tin nhắn

        api.sendMessage({

            body: `Seg của bạn đây (Page ${randomPage}) 🌚\n💸 Đã trừ: -${MONEY_COST.toLocaleString()}$\n⚠️ Ảnh sẽ tự động thu hồi sau 10s!`,

            attachment: fs.createReadStream(filePath)

        }, event.threadID, (err, info) => {

            // Xóa file trong cache ngay lập tức sau khi gửi xong để tiết kiệm bộ nhớ

            fs.unlinkSync(filePath);



            if (err) return console.log(err);



            // LOGIC THU HỒI TIN NHẮN SAU 10 GIÂY

            setTimeout(() => {

                api.unsendMessage(info.messageID);

            }, 10000); 



        }, event.messageID);

    });



  } catch (e) {

    console.log(e);

    return api.sendMessage(`❌ Có lỗi xảy ra: ${e.message}`, event.threadID, event.messageID);

  }

};
