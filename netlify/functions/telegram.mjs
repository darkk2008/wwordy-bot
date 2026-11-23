// Telegram webhook. Telegram POSTs every update here, with the secret token we gave it in setWebhook.
import { timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { createBot } from "../../src/bot.js";
import { createBlobUserStore } from "../../src/store.js";
import { createTelegram } from "../../src/telegram.js";

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async (req) => {
  if (req.method !== "POST") return new Response("wwordy bot is running", { status: 200 });
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !token || !same(req.headers.get("x-telegram-bot-api-secret-token") || "", secret)) {
    return new Response("forbidden", { status: 403 });
  }
  let update;
  try {
    update = await req.json();
  } catch (e) {
    return new Response("bad request", { status: 400 });
  }
  const bot = createBot({
    store: createBlobUserStore(getStore),
    tg: createTelegram(token),
    env: { WEBAPP_URL: process.env.WEBAPP_URL },
  });
  try {
    await bot.handleUpdate(update);
  } catch (e) {
    // Always answer 200: if we returned an error Telegram would resend the same update again and again.
    console.error("update failed:", e && e.message);
  }
  return new Response("ok", { status: 200 });
};
