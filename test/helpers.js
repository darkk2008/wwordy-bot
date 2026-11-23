import { createBot } from "../src/bot.js";
import { createMemoryStore } from "../src/store.js";

// A fake Telegram client that records everything the bot sends.
export function fakeTg() {
  const calls = [];
  let n = 100;
  const rec = (type, o) => {
    calls.push({ type, ...o });
    return Promise.resolve({ message_id: ++n });
  };
  return {
    calls,
    sendMessage: (chat_id, text, extra = {}) => rec("send", { chat_id, text, ...extra }),
    editMessageText: (chat_id, message_id, text, extra = {}) => rec("edit", { chat_id, message_id, text, ...extra }),
    editMessageReplyMarkup: (chat_id, message_id, reply_markup) => rec("editMarkup", { chat_id, message_id, reply_markup }),
    answerCallbackQuery: (id, text) => rec("ack", { id, text }),
    last: (type) => [...calls].reverse().find((c) => c.type === type),
    all: (type) => calls.filter((c) => c.type === type),
  };
}

export function setup({ env = {}, rng } = {}) {
  const store = createMemoryStore();
  const tg = fakeTg();
  const bot = createBot({ store, tg, env, rng: rng || (() => 0) });
  let updateId = 0;
  const from = { id: 42, is_bot: false, language_code: "en" };
  const say = (text, f = from) => bot.handleUpdate({ update_id: ++updateId, message: { message_id: 1, from: f, chat: { id: f.id, type: "private" }, text } });
  const press = (data, messageId = 200, f = from) =>
    bot.handleUpdate({ update_id: ++updateId, callback_query: { id: `cb${updateId}`, from: f, data, message: { message_id: messageId, chat: { id: f.id, type: "private" } } } });
  const buttons = (msg) => (msg.reply_markup ? msg.reply_markup.inline_keyboard.flat() : []);
  const user = () => store.get(42);
  // /start -> German, Russian, A1: leaves the bot showing the first card
  const onboard = async (learn = "de", native = "ru", level = "A1") => {
    await say("/start");
    await press(`L:${learn}`);
    await press(`N:${native}`);
    await press(`V:${level}`);
  };
  return { store, tg, bot, say, press, buttons, user, onboard, nextId: () => ++updateId };
}
