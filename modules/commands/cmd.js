module.exports.config = {
  name: "cmd",
  version: "1.0.1",
  hasPermssion: 3,
  credits: "Mirai Team (fixed by ChatGPT)",
  description: "Quản lý/Kiểm soát toàn bộ module của bot",
  commandCategory: "Hệ Thống",
  usages: "[load/unload/loadAll/unloadAll/info/count] [tên module]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "child_process": "",
    "path": ""
  }
};

const loadCommand = function ({ moduleList, threadID, messageID }) {
  const { execSync } = global.nodemodule["child_process"];
  const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule["fs-extra"];
  const { join } = global.nodemodule["path"];
  const { configPath, mainPath, api } = global.client;
  const logger = require(mainPath + "/utils/log");

  let errorList = [];

  // Xóa cache config cũ
  delete require.cache[require.resolve(configPath)];
  let configValue = require(configPath);

  writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 2), "utf8");

  for (const nameModule of moduleList) {
    try {
      const dirModule = join(__dirname, nameModule + ".js");
      delete require.cache[require.resolve(dirModule)];

      const command = require(dirModule);

      global.client.commands.delete(nameModule);

      if (!command.config || !command.run || !command.config.commandCategory) {
        throw new Error("Module không đúng định dạng!");
      }

      global.client.eventRegistered = global.client.eventRegistered.filter(
        info => info !== command.config.name
      );

      // Xử lý dependencies
      if (command.config.dependencies && typeof command.config.dependencies === "object") {
        const listPackage = JSON.parse(readFileSync("./package.json")).dependencies;
        const builtin = require("module").builtinModules;

        for (const packageName in command.config.dependencies) {
          let loadSuccess = false, error;

          const moduleDir = join(global.client.mainPath, "node_modules", packageName);

          try {
            if (listPackage.hasOwnProperty(packageName) || builtin.includes(packageName)) {
              global.nodemodule[packageName] = require(packageName);
            } else {
              global.nodemodule[packageName] = require(moduleDir);
            }
          } catch {
            logger.loader(
              "Không tìm thấy package " + packageName + " cho lệnh " + command.config.name + ", tiến hành cài đặt...",
              "warn"
            );

            execSync(
              `npm install ${packageName}${command.config.dependencies[packageName] ? "@" + command.config.dependencies[packageName] : ""}`,
              { stdio: "inherit", cwd: join(global.client.mainPath, "node_modules"), shell: true }
            );

            try {
              global.nodemodule[packageName] = require(moduleDir);
              loadSuccess = true;
            } catch (err) {
              error = err;
            }

            if (!loadSuccess) throw "Không thể tải package " + packageName + ": " + error?.stack;
          }
        }
      }

      // Xử lý envConfig
      if (command.config.envConfig && typeof command.config.envConfig === "object") {
        if (typeof global.configModule[command.config.name] === "undefined")
          global.configModule[command.config.name] = {};
        if (typeof configValue[command.config.name] === "undefined")
          configValue[command.config.name] = {};

        for (const [key, value] of Object.entries(command.config.envConfig)) {
          global.configModule[command.config.name][key] =
            configValue[command.config.name][key] !== undefined
              ? configValue[command.config.name][key]
              : value;
          configValue[command.config.name][key] =
            configValue[command.config.name][key] !== undefined
              ? configValue[command.config.name][key]
              : value;
        }
        logger.loader("Loaded config cho " + command.config.name);
      }

      if (command.onLoad) command.onLoad({ configValue });

      if (command.handleEvent) global.client.eventRegistered.push(command.config.name);

      global.client.commands.set(command.config.name, command);

      logger.loader("Loaded command " + command.config.name + "!");
    } catch (error) {
      errorList.push(`- ${nameModule} reason: ${error}`);
    }
  }

  if (errorList.length > 0) {
    api.sendMessage("» Những lệnh bị lỗi: " + errorList.join("\n"), threadID, messageID);
  }
  api.sendMessage("» Vừa tải thành công " + (moduleList.length - errorList.length) + " lệnh 💕", threadID, messageID);

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
  unlinkSync(configPath + ".temp");
};

const unloadModule = function ({ moduleList, threadID, messageID }) {
  const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
  const { configPath, mainPath, api } = global.client;
  const logger = require(mainPath + "/utils/log").loader;

  delete require.cache[require.resolve(configPath)];
  let configValue = require(configPath);

  writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

  for (const nameModule of moduleList) {
    global.client.commands.delete(nameModule);
    global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
    configValue.commandDisabled.push(`${nameModule}.js`);
    global.config.commandDisabled.push(`${nameModule}.js`);
    logger(`Unloaded command ${nameModule}!`);
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
  unlinkSync(configPath + ".temp");

  return api.sendMessage(`» Thành công hủy ${moduleList.length} lệnh ✨`, threadID, messageID);
};

module.exports.run = function ({ event, args, api }) {
  if (!global.config.ADMINBOT.includes(event.senderID.toString())) {
    return api.sendMessage("» Bạn không có quyền", event.threadID, event.messageID);
  }

  const { readdirSync } = global.nodemodule["fs-extra"];
  const { threadID, messageID } = event;

  let moduleList = args.slice(1);

  switch (args[0]) {
    case "count": {
      let commands = global.client.commands.values();
      api.sendMessage("» Hiện tại có " + global.client.commands.size + " lệnh khả dụng 💌", threadID, messageID);
      break;
    }
    case "load": {
      if (moduleList.length === 0) return api.sendMessage("» Thiếu tên module ⚠️", threadID, messageID);
      else return loadCommand({ moduleList, threadID, messageID });
    }
    case "unload": {
      if (moduleList.length === 0) return api.sendMessage("» Thiếu tên module ⚠️", threadID, messageID);
      else return unloadModule({ moduleList, threadID, messageID });
    }
    case "loadAll": {
      moduleList = readdirSync(__dirname).filter(f => f.endsWith(".js") && !f.includes("example"));
      moduleList = moduleList.map(item => item.replace(/\.js$/, ""));
      return loadCommand({ moduleList, threadID, messageID });
    }
    case "unloadAll": {
      moduleList = readdirSync(__dirname).filter(f => f.endsWith(".js") && !f.includes("example") && !f.includes("cmd"));
      moduleList = moduleList.map(item => item.replace(/\.js$/, ""));
      return unloadModule({ moduleList, threadID, messageID });
    }
    case "info": {
      const command = global.client.commands.get(moduleList.join("") || "");
      if (!command) return api.sendMessage("» Module không tồn tại ⚠️", threadID, messageID);

      const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;
      return api.sendMessage(
        `=== ${name.toUpperCase()} ===\n` +
          `- Code bởi: ${credits}\n` +
          `- Phiên bản: ${version}\n` +
          `- Quyền hạn: ${hasPermssion === 0 ? "Người dùng" : hasPermssion === 1 ? "Quản trị viên" : "Admin bot"}\n` +
          `- Cooldown: ${cooldowns} giây\n` +
          `- Dependencies: ${Object.keys(dependencies || {}).join(", ") || "Không có"}`,
        threadID,
        messageID
      );
    }
    default: {
      return api.sendMessage("Sai cú pháp!", threadID, messageID);
    }
  }
};
