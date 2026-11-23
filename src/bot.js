// The wwordy bot (Wizzy). createBot() gets its storage and Telegram client injected, so the same code runs
// in the Netlify function, in `npm run local` (long polling) and in the tests.
import { LANGS, LEVELS, describeWord, isValidId } from "./words.js";
import { FLAGS, langName, tr, uiFor, uiFromTelegram } from "./i18n.js";
import { answer, getBook, isSaved, newUser, pickNext, removeSaved, resetLevel, showCard, statsFor, toggleSave } from "./logic.js";

const PAGE = 10;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const kb = (rows) => ({ inline_keyboard: rows });
const btn = (text, data) => ({ text, callback_data: data });
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const levelLabel = (ui, level) => (level === "ALL" ? tr(ui, "levelAll") : level);

export function createBot({ store, tg, env = {}, rng = Math.random }) {
  // ---------- keyboards and texts ----------
  const pickerKb = (kind, ui, exclude) =>
    kb(chunk(LANGS.filter((c) => c !== exclude).map((c) => btn(`${FLAGS[c]} ${langName(ui, c)}`, `${kind}:${c}`)), 3));

  const levelKb = (ui) =>
    kb([[btn("A1", "V:A1"), btn("A2", "V:A2")], [btn("B1", "V:B1"), btn("B2", "V:B2")], [btn(tr(ui, "levelAll"), "V:ALL")]]);

  const cardKb = (user, id) =>
    kb([
      [btn(tr(user.ui, "know"), `k:${id}`), btn(tr(user.ui, "dont"), `u:${id}`)],
      [btn(tr(user.ui, isSaved(user, id) ? "saved" : "save"), `s:${id}`)],
    ]);

  function cardText(user, id, { hidden, status } = {}) {
    const w = describeWord(id, user.lang, user.native);
    const extra = w.extras ? `\n${esc(w.extras)}` : "";
    const secret = hidden ? `<tg-spoiler>${esc(w.meaning)}${extra}</tg-spoiler>` : `${esc(w.meaning)}${w.extras ? `\n<i>${esc(w.extras)}</i>` : ""}`;
    const lines = [`${FLAGS[user.lang] || ""} <b>${esc(w.title)}</b>`, secret, `<i>${w.level}</i>`];
    if (status) lines.push(status + (isSaved(user, id) ? `  ${tr(user.ui, "savedBadge")}` : ""));
    return lines.join("\n");
  }

  function readyText(user) {
    return tr(user.ui, "ready", { learn: langName(user.ui, user.lang), native: langName(user.ui, user.native), level: levelLabel(user.ui, user.level) });
  }

  function savedView(user, page) {
    const ui = user.ui;
    const ids = [...getBook(user).saved].reverse().filter(isValidId); // newest first
    if (!ids.length) return { text: tr(ui, "savedEmpty"), markup: kb([]) };
    const pages = Math.ceil(ids.length / PAGE);
    const p = Math.min(Math.max(1, Number(page) || 1), pages);
    const slice = ids.slice((p - 1) * PAGE, p * PAGE);
    const lines = slice.map((id, i) => {
      const w = describeWord(id, user.lang, user.native);
      return `${(p - 1) * PAGE + i + 1}. <b>${esc(w.title)}</b> — ${esc(w.meaning)}`;
    });
    const rows = chunk(slice.map((id, i) => btn(`🗑 ${(p - 1) * PAGE + i + 1}`, `rm:${id}:${p}`)), 5);
    if (pages > 1) {
      const nav = [];
      if (p > 1) nav.push(btn("⬅️", `sv:${p - 1}`));
      nav.push(btn(tr(ui, "page", { p, t: pages }), "noop"));
      if (p < pages) nav.push(btn("➡️", `sv:${p + 1}`));
      rows.push(nav);
    }
    return { text: `${tr(ui, "savedTitle", { n: ids.length })}\n\n${lines.join("\n")}`, markup: kb(rows) };
  }

  // ---------- actions ----------
  async function sendCard({ user, chatId }) {
    const id = pickNext(user, rng);
    if (!id) {
      await tg.sendMessage(chatId, tr(user.ui, "allDone"), { reply_markup: kb([[btn(tr(user.ui, "again"), "again")]]) });
      return;
    }
    showCard(user, id);
    await tg.sendMessage(chatId, cardText(user, id, { hidden: true }), { reply_markup: cardKb(user, id) });
  }

  async function startSetup({ user, chatId }, intro) {
    user.step = "learn";
    user.cur = null;
    await tg.sendMessage(chatId, `${intro}\n\n${tr(user.ui, "pickLearn")}`, { reply_markup: pickerKb("L", user.ui) });
  }

  async function sendApp({ user, chatId }) {
    const url = String(env.WEBAPP_URL || "");
    if (!/^https:\/\//i.test(url)) {
      await tg.sendMessage(chatId, tr(user.ui, "appMissing"));
      return;
    }
    await tg.sendMessage(chatId, tr(user.ui, "app"), { reply_markup: kb([[{ text: tr(user.ui, "appButton"), web_app: { url } }]]) });
  }

  // ---------- messages ----------
  async function onText(ctx, text) {
    const { user, chatId } = ctx;
    const m = /^\/([A-Za-z_]+)(?:@\w+)?(?:\s|$)/.exec(String(text).trim());
    const cmd = m ? m[1].toLowerCase() : null;
    if (cmd === "start") {
      if (user.step === "ready") {
        await tg.sendMessage(chatId, tr(user.ui, "welcomeBack"));
        return sendCard(ctx);
      }
      return startSetup(ctx, tr(user.ui, "welcome"));
    }
    if (cmd === "help") return tg.sendMessage(chatId, tr(user.ui, "help"));
    if (cmd === "app") return sendApp(ctx);
    if (cmd === "language") return startSetup(ctx, tr(user.ui, "changeIntro"));
    if (user.step !== "ready") return startSetup(ctx, tr(user.ui, "needSetup"));
    if (cmd === "word" || cmd === "next") return sendCard(ctx);
    if (cmd === "saved") {
      const v = savedView(user, 1);
      return tg.sendMessage(chatId, v.text, { reply_markup: v.markup });
    }
    if (cmd === "stats") {
      const s = statsFor(user);
      const head = tr(user.ui, "statsTitle", { learn: langName(user.ui, user.lang), native: langName(user.ui, user.native), level: levelLabel(user.ui, user.level) });
      return tg.sendMessage(chatId, `${head}\n\n${tr(user.ui, "statsBody", s)}`);
    }
    return tg.sendMessage(chatId, tr(user.ui, "unknown"));
  }

  // ---------- button presses ----------
  async function onCallback(ctx, cb) {
    const { user, chatId } = ctx;
    const msgId = cb.message.message_id;
    const [a, b, c] = String(cb.data || "").split(":");
    const ack = (t) => tg.answerCallbackQuery(cb.id, t);
    const edit = (text, markup) => tg.editMessageText(chatId, msgId, text, { reply_markup: markup || kb([]) });

    if (a === "L" && LANGS.includes(b)) {
      user.lang = b;
      if (user.native === b) user.native = null;
      user.step = "native";
      await ack();
      return edit(tr(user.ui, "pickNative"), pickerKb("N", user.ui, b));
    }
    if (a === "N" && LANGS.includes(b) && b !== user.lang && user.lang) {
      user.native = b;
      user.ui = uiFor(b);
      user.step = "level";
      await ack();
      return edit(tr(user.ui, "pickLevel"), levelKb(user.ui));
    }
    if (a === "V" && (LEVELS.includes(b) || b === "ALL") && user.lang && user.native) {
      user.level = b;
      user.step = "ready";
      user.cur = null;
      user.recent = [];
      await ack();
      await edit(readyText(user));
      return sendCard(ctx);
    }
    if ((a === "k" || a === "u") && isValidId(b)) {
      if (user.step !== "ready" || user.cur !== b) return ack(tr(user.ui, "already"));
      answer(user, b, a);
      await ack();
      await edit(cardText(user, b, { hidden: false, status: tr(user.ui, a === "k" ? "statusKnow" : "statusDont") }));
      return sendCard(ctx);
    }
    if (a === "s" && isValidId(b)) {
      if (user.step !== "ready" || user.cur !== b) return ack(tr(user.ui, "already"));
      const nowSaved = toggleSave(user, b);
      await ack(tr(user.ui, nowSaved ? "savedToast" : "unsavedToast"));
      return tg.editMessageReplyMarkup(chatId, msgId, cardKb(user, b));
    }
    if (a === "sv") {
      await ack();
      const v = savedView(user, b);
      return edit(v.text, v.markup);
    }
    if (a === "rm" && isValidId(b)) {
      removeSaved(user, b);
      await ack(tr(user.ui, "unsavedToast"));
      const v = savedView(user, c);
      return edit(v.text, v.markup);
    }
    if (a === "again" && user.step === "ready") {
      resetLevel(user);
      await ack();
      await edit(readyText(user));
      return sendCard(ctx);
    }
    return ack(); // "noop", old buttons, unknown data
  }

  // ---------- entry point ----------
  async function handleUpdate(update) {
    const cb = update && update.callback_query;
    const msg = update && update.message;
    const from = cb ? cb.from : msg && msg.from;
    if (!from || from.is_bot) return;
    const chat = cb ? cb.message && cb.message.chat : msg && msg.chat;
    if (!chat || chat.type !== "private") return; // the bot works in private chats only
    if (!cb && !(msg && typeof msg.text === "string")) return;

    const user = (await store.get(from.id)) || newUser(from.id, uiFromTelegram(from.language_code));
    if (typeof update.update_id === "number") {
      if (update.update_id <= (user.lu || 0)) return; // Telegram re-sent an update we already handled
      user.lu = update.update_id;
    }
    const ctx = { user, chatId: chat.id };
    try {
      if (cb) await onCallback(ctx, cb);
      else await onText(ctx, msg.text);
    } finally {
      await store.set(from.id, user);
    }
  }

  return { handleUpdate };
}
