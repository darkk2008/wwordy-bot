import { describe, it, expect, beforeEach } from "vitest";
import handler from "../netlify/functions/telegram.mjs";

const post = (headers = {}, body = "{}") => handler(new Request("https://bot.example/.netlify/functions/telegram", { method: "POST", headers, body }));

describe("webhook function", () => {
  beforeEach(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET = "s3cret-_ok";
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
  });

  it("answers a plain GET with a status line", async () => {
    const r = await handler(new Request("https://bot.example/.netlify/functions/telegram"));
    expect(r.status).toBe(200);
  });

  it("rejects requests without the secret token", async () => {
    expect((await post()).status).toBe(403);
    expect((await post({ "x-telegram-bot-api-secret-token": "wrong" })).status).toBe(403);
    expect((await post({ "x-telegram-bot-api-secret-token": "s3cret-_ok-extra" })).status).toBe(403);
  });

  it("rejects everything when the secret is not configured", async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    expect((await post({ "x-telegram-bot-api-secret-token": "" })).status).toBe(403);
  });

  it("accepts a valid request and returns 200 even for updates it ignores", async () => {
    const r = await post({ "x-telegram-bot-api-secret-token": "s3cret-_ok" }, JSON.stringify({ update_id: 1 }));
    expect(r.status).toBe(200);
  });

  it("returns 400 for a body that is not JSON", async () => {
    expect((await post({ "x-telegram-bot-api-secret-token": "s3cret-_ok" }, "not json")).status).toBe(400);
  });
});
