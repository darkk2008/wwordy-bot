// Try the bot on your own computer, no deployment needed (long polling).
//   npm run local
// It removes the webhook first (Telegram allows only one way of receiving updates). Run `npm run webhook`
// afterwards to switch the deployed bot back on. Progress is saved in .data/users.json.
import { createBot } from "../src/bot.js";
import { createFileStore } from "../src/store.js";
import { createTelegram } from "../src/telegram.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("✖ TELEGRAM_BOT_TOKEN is empty. Put the token from @BotFather into .env (copy .env.example to .env first).");
  process.exit(1);
}
const tg = createTelegram(token);
const bot = createBot({ store: createFileStore(".data/users.json"), tg, env: { WEBAPP_URL: process.env.WEBAPP_URL } });

await tg.call("deleteWebhook", {});
const me = await tg.call("getMe");
console.log(`✔ Running as @${me.username}. Open https://t.me/${me.username} and send /start. Stop with Ctrl+C.`);

let offset = 0;
for (;;) {
  try {
    const updates = await tg.call("getUpdates", { timeout: 30, offset, allowed_updates: ["message", "callback_query"] });
    for (const u of updates) {
      offset = u.update_id + 1;
      await bot.handleUpdate(u).catch((e) => console.error("update failed:", e.message));
    }
  } catch (e) {
    console.error("polling error:", e.message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
