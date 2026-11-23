import { describe, it, expect } from "vitest";
import { createTelegram } from "../src/telegram.js";

const reply = (body, status = 200) => async () => ({ status, json: async () => body });

describe("Telegram client", () => {
  it("posts JSON to the right method and returns result", async () => {
    let seen;
    const tg = createTelegram("123:SECRETTOKEN", async (url, init) => {
      seen = { url, init };
      return { status: 200, json: async () => ({ ok: true, result: { message_id: 5 } }) };
    });
    const r = await tg.sendMessage(7, "hi", { reply_markup: { inline_keyboard: [] } });
    expect(r).toEqual({ message_id: 5 });
    expect(seen.url).toBe("https://api.telegram.org/bot123:SECRETTOKEN/sendMessage");
    const body = JSON.parse(seen.init.body);
    expect(body).toMatchObject({ chat_id: 7, text: "hi", parse_mode: "HTML" });
    expect(body.link_preview_options).toEqual({ is_disabled: true });
  });

  it("ignores 'message is not modified'", async () => {
    const tg = createTelegram("t", reply({ ok: false, description: "Bad Request: message is not modified: ..." }, 400));
    expect(await tg.editMessageText(1, 2, "same")).toBeNull();
  });

  it("throws on other errors and never leaks the token", async () => {
    const tg = createTelegram("123:SECRETTOKEN", reply({ ok: false, description: "Forbidden: bot was blocked by the user" }, 403));
    const err = await tg.sendMessage(1, "x").catch((e) => e);
    expect(err.message).toContain("blocked by the user");
    expect(err.message).not.toContain("SECRETTOKEN");
  });

  it("handles a response that is not JSON", async () => {
    const tg = createTelegram("t", async () => ({ status: 502, json: async () => { throw new Error("html"); } }));
    await expect(tg.sendMessage(1, "x")).rejects.toThrow("HTTP 502");
  });

  it("only adds the toast text when there is one", async () => {
    let body;
    const tg = createTelegram("t", async (u, init) => {
      body = JSON.parse(init.body);
      return { status: 200, json: async () => ({ ok: true, result: true }) };
    });
    await tg.answerCallbackQuery("abc");
    expect(body).toEqual({ callback_query_id: "abc" });
    await tg.answerCallbackQuery("abc", "Saved");
    expect(body).toEqual({ callback_query_id: "abc", text: "Saved" });
  });
});
