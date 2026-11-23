// A small wrapper around the Telegram Bot API (plain fetch, no dependencies).
export function createTelegram(token, fetchImpl = fetch) {
  const call = async (method, params = {}) => {
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      const why = (data && data.description) || `HTTP ${res.status}`;
      if (/message is not modified/i.test(why)) return null; // pressing the same button twice: harmless
      throw new Error(`Telegram ${method}: ${why}`); // never include the URL: it contains the token
    }
    return data.result;
  };
  const base = { parse_mode: "HTML", link_preview_options: { is_disabled: true } };
  return {
    call,
    sendMessage: (chat_id, text, extra = {}) => call("sendMessage", { chat_id, text, ...base, ...extra }),
    editMessageText: (chat_id, message_id, text, extra = {}) => call("editMessageText", { chat_id, message_id, text, ...base, ...extra }),
    editMessageReplyMarkup: (chat_id, message_id, reply_markup) => call("editMessageReplyMarkup", { chat_id, message_id, reply_markup }),
    answerCallbackQuery: (id, text) => call("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) }),
  };
}
