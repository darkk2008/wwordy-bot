// Connects the bot to your Netlify site and sets its name, descriptions, commands and Mini App button.
//   npm run webhook           set everything up
//   npm run webhook:delete    disconnect the webhook
// Reads TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, SITE_URL and WEBAPP_URL from .env (see .env.example).
import { createTelegram } from "../src/telegram.js";
import { BOT_PROFILE, UI_LANGS } from "../src/i18n.js";

const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, SITE_URL, WEBAPP_URL } = process.env;
const fail = (m) => {
  console.error(`✖ ${m}`);
  process.exit(1);
};

if (!token) fail("TELEGRAM_BOT_TOKEN is empty. Put the token from @BotFather into .env (copy .env.example to .env first).");
const tg = createTelegram(token);

if (process.argv.includes("--delete")) {
  await tg.call("deleteWebhook", { drop_pending_updates: true });
  console.log("✔ Webhook removed. The bot is now silent until you run `npm run webhook` or `npm run local`.");
  process.exit(0);
}

if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  fail("TELEGRAM_WEBHOOK_SECRET must be 1-256 characters: letters, digits, _ or -. Make one with: openssl rand -hex 24");
}
if (!SITE_URL || !/^https:\/\//i.test(SITE_URL)) fail("SITE_URL must be the https address of your bot's Netlify site, for example https://wwordy-bot.netlify.app");

const url = `${SITE_URL.replace(/\/+$/, "")}/.netlify/functions/telegram`;
await tg.call("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
console.log(`✔ Webhook set: ${url}`);

await tg.call("setMyName", { name: "wwordy" });
for (const ui of UI_LANGS) {
  const p = BOT_PROFILE[ui];
  const lang = ui === "en" ? {} : { language_code: ui };
  const commands = p.commands.map(([command, description]) => ({ command, description }));
  await tg.call("setMyCommands", { commands, ...lang });
  await tg.call("setMyDescription", { description: p.description, ...lang });
  await tg.call("setMyShortDescription", { short_description: p.shortDescription, ...lang });
  if (ui === "en") {
    // English texts are also the default for every other language
    await tg.call("setMyCommands", { commands, language_code: "en" });
    await tg.call("setMyDescription", { description: p.description, language_code: "en" });
    await tg.call("setMyShortDescription", { short_description: p.shortDescription, language_code: "en" });
  }
}
console.log("✔ Name, descriptions and command lists set (English, Russian, Uzbek).");

if (WEBAPP_URL && /^https:\/\//i.test(WEBAPP_URL)) {
  await tg.call("setChatMenuButton", { menu_button: { type: "web_app", text: "wwordy", web_app: { url: WEBAPP_URL } } });
  console.log(`✔ Menu button "wwordy" opens the Mini App: ${WEBAPP_URL}`);
} else {
  await tg.call("setChatMenuButton", { menu_button: { type: "commands" } });
  console.log("• WEBAPP_URL not set (or not https): the menu button shows the command list instead.");
}

const info = await tg.call("getWebhookInfo");
console.log(`\nTelegram says: url=${info.url} pending=${info.pending_update_count}${info.last_error_message ? ` last_error="${info.last_error_message}"` : ""}`);
console.log("Now open your bot in Telegram and send /start.");
