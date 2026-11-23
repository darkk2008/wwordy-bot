import { describe, it, expect } from "vitest";
import { setup } from "./helpers.js";

describe("setup flow", () => {
  it("/start greets as Wizzy and asks which language to learn (18 buttons)", async () => {
    const t = setup();
    await t.say("/start");
    const m = t.tg.last("send");
    expect(m.text).toContain("Wizzy");
    expect(m.text).toContain("learn");
    expect(t.buttons(m).length).toBe(18);
    expect(t.buttons(m).every((b) => /^L:[a-z]{2}$/.test(b.callback_data))).toBe(true);
  });

  it("uses Telegram's language for the first message (ru, uz, otherwise en)", async () => {
    for (const [code, word] of [["ru", "Привет"], ["uz", "Salom"], ["de", "Hi,"]]) {
      const t = setup();
      await t.say("/start", { id: 42, is_bot: false, language_code: code });
      expect(t.tg.last("send").text).toContain(word);
    }
  });

  it("learn -> native -> level -> first card, then the interface follows the native language", async () => {
    const t = setup();
    await t.say("/start");
    await t.press("L:de");
    let e = t.tg.last("edit");
    expect(t.buttons(e).length).toBe(17); // the learned language is not offered again
    expect(t.buttons(e).some((b) => b.callback_data === "N:de")).toBe(false);
    await t.press("N:ru");
    e = t.tg.last("edit");
    expect(e.text).toContain("уровень");
    expect(t.buttons(e).map((b) => b.callback_data)).toEqual(["V:A1", "V:A2", "V:B1", "V:B2", "V:ALL"]);
    await t.press("V:A1");
    expect(t.tg.last("edit").text).toContain("Немецкий → Русский");
    const card = t.tg.last("send");
    expect(card.text).toContain("<tg-spoiler>");
    expect(t.buttons(card).map((b) => b.text)).toEqual(["✅ Знаю", "❌ Не знаю", "⭐ Сохранить"]);
    const u = await t.user();
    expect(u).toMatchObject({ step: "ready", lang: "de", native: "ru", level: "A1", ui: "ru" });
  });

  it("refuses to translate into the language you are learning", async () => {
    const t = setup();
    await t.say("/start");
    await t.press("L:de");
    await t.press("N:de");
    expect((await t.user()).step).toBe("native");
  });

  it("asks you to set up first when you use a command too early", async () => {
    const t = setup();
    await t.say("/word");
    expect(t.tg.last("send").text).toContain("set things up");
    expect(t.buttons(t.tg.last("send")).length).toBe(18);
  });
});

describe("cards and buttons", () => {
  it("has three buttons: know, don't know, save, and hides the translation in a spoiler", async () => {
    const t = setup();
    await t.onboard("de", "en", "A1");
    const card = t.tg.last("send");
    expect(t.buttons(card).map((b) => b.text)).toEqual(["✅ I know", "❌ Don't know", "⭐ Save"]);
    expect(card.text).toMatch(/<b>.+<\/b>\n<tg-spoiler>.+<\/tg-spoiler>/);
    expect(card.parse_mode).toBeUndefined(); // set by the Telegram wrapper, not the bot
  });

  it("'I know' reveals the answer, removes the buttons and sends the next card", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    const card = t.tg.last("send");
    const [know] = t.buttons(card);
    const sendsBefore = t.tg.all("send").length;
    await t.press(know.callback_data, 200);
    const e = t.tg.last("edit");
    expect(e.text).not.toContain("<tg-spoiler>");
    expect(e.text).toContain("You know this one");
    expect(e.reply_markup.inline_keyboard).toEqual([]);
    expect(t.tg.all("send").length).toBe(sendsBefore + 1);
    const u = await t.user();
    expect(Object.values(u.books.de.p)).toEqual(["k"]);
  });

  it("'Don't know' reveals the answer and keeps the word in the learning pile", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    const dont = t.buttons(t.tg.last("send"))[1];
    await t.press(dont.callback_data);
    expect(t.tg.last("edit").text).toContain("Not yet");
    expect(Object.values((await t.user()).books.de.p)).toEqual(["u"]);
  });

  it("'Save' keeps the card, toggles the star and shows a toast", async () => {
    const t = setup();
    await t.onboard("de", "en", "A1");
    const save = t.buttons(t.tg.last("send"))[2];
    const sends = t.tg.all("send").length;
    await t.press(save.callback_data);
    expect(t.tg.last("ack").text).toBe("Saved ⭐");
    expect(t.buttons(t.tg.last("editMarkup"))[2].text).toBe("⭐ Saved");
    expect(t.tg.all("send").length).toBe(sends); // no new card yet
    await t.press(save.callback_data);
    expect(t.tg.last("ack").text).toBe("Removed from saved");
    expect(t.buttons(t.tg.last("editMarkup"))[2].text).toBe("⭐ Save");
  });

  it("a saved word shows ⭐ saved on the revealed card", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    const [know, , save] = t.buttons(t.tg.last("send"));
    await t.press(save.callback_data);
    await t.press(know.callback_data);
    expect(t.tg.last("edit").text).toContain("⭐ saved");
  });

  it("double taps and old buttons are ignored", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    const [know] = t.buttons(t.tg.last("send"));
    await t.press(know.callback_data);
    const sends = t.tg.all("send").length;
    await t.press(know.callback_data);
    expect(t.tg.last("ack").text).toBe("Already answered ✔");
    expect(t.tg.all("send").length).toBe(sends);
    expect(Object.keys((await t.user()).books.de.p).length).toBe(1);
  });

  it("/word sends the next card", async () => {
    const t = setup();
    await t.onboard();
    const sends = t.tg.all("send").length;
    await t.say("/word");
    expect(t.tg.all("send").length).toBe(sends + 1);
  });

  it("says congratulations when every word of the level is known, and 'Review everything' restarts", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    for (let i = 0; i < 50; i++) {
      const [know] = t.buttons(t.tg.last("send"));
      await t.press(know.callback_data);
    }
    const done = t.tg.last("send");
    expect(done.text).toContain("every word");
    await t.press("again", 300);
    expect(t.tg.last("send").text).toContain("<tg-spoiler>");
    expect((await t.user()).books.de.p).toEqual({});
  });
});

describe("/saved", () => {
  const saveFirstN = async (t, n) => {
    for (let i = 0; i < n; i++) {
      const [know, , save] = t.buttons(t.tg.last("send"));
      await t.press(save.callback_data);
      await t.press(know.callback_data);
    }
  };

  it("says so when nothing is saved", async () => {
    const t = setup();
    await t.onboard("de", "en", "A1");
    await t.say("/saved");
    expect(t.tg.last("send").text).toContain("No saved words");
  });

  it("lists saved words with their meaning and a delete button for each", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    await saveFirstN(t, 3);
    await t.say("/saved");
    const m = t.tg.last("send");
    expect(m.text).toContain("Saved words</b> (3)");
    expect(m.text.split("\n").filter((l) => /^\d\./.test(l)).length).toBe(3);
    expect(t.buttons(m).filter((b) => b.callback_data.startsWith("rm:")).length).toBe(3);
  });

  it("pages through more than 10 saved words and deletes one", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    await saveFirstN(t, 12);
    await t.say("/saved");
    const m = t.tg.last("send");
    expect(m.text.split("\n").filter((l) => /^\d+\./.test(l)).length).toBe(10);
    const next = t.buttons(m).find((b) => b.text === "➡️");
    await t.press(next.callback_data, 500);
    const page2 = t.tg.last("edit");
    expect(page2.text.split("\n").filter((l) => /^\d+\./.test(l)).length).toBe(2);
    const rm = t.buttons(page2).find((b) => b.callback_data.startsWith("rm:"));
    await t.press(rm.callback_data, 500);
    expect(t.tg.last("edit").text).toContain("(11)");
  });

  it("shows the empty text after the last word is removed", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    await saveFirstN(t, 1);
    await t.say("/saved");
    const rm = t.buttons(t.tg.last("send")).find((b) => b.callback_data.startsWith("rm:"));
    await t.press(rm.callback_data, 600);
    expect(t.tg.last("edit").text).toContain("No saved words");
  });
});

describe("other commands", () => {
  it("/stats shows the counts", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    const [know] = t.buttons(t.tg.last("send"));
    await t.press(know.callback_data);
    await t.say("/stats");
    const s = t.tg.last("send").text;
    expect(s).toContain("German → English");
    expect(s).toContain("Known: 1");
    expect(s).toContain("New: 49");
  });

  it("/language changes the language and keeps progress per language", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    const [know] = t.buttons(t.tg.last("send"));
    await t.press(know.callback_data);
    await t.say("/language");
    await t.press("L:es");
    await t.press("N:en");
    await t.press("V:A1");
    await t.say("/stats");
    expect(t.tg.last("send").text).toContain("Known: 0");
    await t.say("/language");
    await t.press("L:de");
    await t.press("N:en");
    await t.press("V:A1");
    await t.say("/stats");
    expect(t.tg.last("send").text).toContain("Known: 1");
  });

  it("/start for an existing user goes straight to a word", async () => {
    const t = setup();
    await t.onboard();
    await t.say("/start");
    expect(t.tg.all("send").slice(-2)[0].text).toContain("С возвращением");
    expect(t.tg.last("send").text).toContain("<tg-spoiler>");
  });

  it("/app opens the web app as a Mini App when WEBAPP_URL is set", async () => {
    const t = setup({ env: { WEBAPP_URL: "https://example.com/app/" } });
    await t.say("/app");
    const b = t.buttons(t.tg.last("send"))[0];
    expect(b.web_app).toEqual({ url: "https://example.com/app/" });
  });

  it("/app explains when WEBAPP_URL is missing or not https", async () => {
    for (const env of [{}, { WEBAPP_URL: "http://example.com" }]) {
      const t = setup({ env });
      await t.say("/app");
      expect(t.tg.last("send").text).toContain("isn't set up");
    }
  });

  it("/help lists the commands, also with the @botname suffix", async () => {
    const t = setup();
    await t.say("/help@wwordy_bot");
    expect(t.tg.last("send").text).toContain("/saved");
  });

  it("answers plain text with a hint once set up", async () => {
    const t = setup();
    await t.onboard();
    await t.say("hello");
    expect(t.tg.last("send").text).toContain("/word");
  });
});

describe("safety", () => {
  it("ignores groups, bots and non-text messages", async () => {
    const t = setup();
    await t.bot.handleUpdate({ update_id: 1, message: { from: { id: 1, is_bot: false }, chat: { id: -5, type: "group" }, text: "/start" } });
    await t.bot.handleUpdate({ update_id: 2, message: { from: { id: 2, is_bot: true }, chat: { id: 2, type: "private" }, text: "/start" } });
    await t.bot.handleUpdate({ update_id: 3, message: { from: { id: 3, is_bot: false }, chat: { id: 3, type: "private" }, photo: [] } });
    await t.bot.handleUpdate({});
    await t.bot.handleUpdate({ update_id: 4 });
    expect(t.tg.calls.length).toBe(0);
  });

  it("ignores an update Telegram sends twice", async () => {
    const t = setup();
    const upd = { update_id: 7, message: { from: { id: 42, is_bot: false }, chat: { id: 42, type: "private" }, text: "/start" } };
    await t.bot.handleUpdate(upd);
    await t.bot.handleUpdate(upd);
    expect(t.tg.all("send").length).toBe(1);
  });

  it("ignores invalid button data without crashing", async () => {
    const t = setup();
    await t.onboard();
    for (const data of ["", "x", "L:zz", "N:zz", "V:Z9", "k:nonsense", "rm:../../x:1", "sv:abc", "a:b:c:d"]) {
      await t.press(data);
    }
    expect((await t.user()).step).toBe("ready");
  });

  it("escapes HTML in everything it prints", async () => {
    const t = setup({ rng: Math.random });
    await t.onboard("de", "en", "A1");
    for (const m of t.tg.all("send")) expect(m.text).not.toMatch(/<(?!\/?(b|i|tg-spoiler)>)/);
  });

  it("still saves the user when sending to Telegram fails", async () => {
    const t = setup();
    t.tg.sendMessage = () => Promise.reject(new Error("blocked"));
    await expect(t.say("/start")).rejects.toThrow("blocked");
    expect((await t.user()).step).toBe("learn");
  });
});
