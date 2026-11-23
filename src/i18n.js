// All bot texts, written in Wizzy's voice (the wwordy word wizard). UI languages: en, ru, uz.
// The Uzbek texts should be checked by a native speaker before you advertise the bot.
// HTML tags (<b>, <i>) are allowed: Telegram parse_mode is HTML. {name} placeholders are filled by tr().

export const UI_LANGS = ["en", "ru", "uz"];

// Telegram's language_code -> the bot's interface language (until the user picks a native language).
export function uiFromTelegram(code) {
  const c = String(code || "").toLowerCase();
  if (c.startsWith("ru")) return "ru";
  if (c.startsWith("uz")) return "uz";
  return "en";
}

// The interface follows the language the user translates INTO (their own language).
export const uiFor = (nativeCode) => (nativeCode === "ru" ? "ru" : nativeCode === "uz" ? "uz" : "en");

export const FLAGS = { en: "🇬🇧", de: "🇩🇪", es: "🇪🇸", fr: "🇫🇷", it: "🇮🇹", pt: "🇧🇷", nl: "🇳🇱", pl: "🇵🇱", sv: "🇸🇪", tr: "🇹🇷", ru: "🇷🇺", uk: "🇺🇦", uz: "🇺🇿", ar: "🇸🇦", hi: "🇮🇳", zh: "🇨🇳", ja: "🇯🇵", ko: "🇰🇷" };

const NAMES = {
  en: { en: "English", de: "German", es: "Spanish", fr: "French", it: "Italian", pt: "Portuguese", nl: "Dutch", pl: "Polish", sv: "Swedish", tr: "Turkish", ru: "Russian", uk: "Ukrainian", uz: "Uzbek", ar: "Arabic", hi: "Hindi", zh: "Chinese", ja: "Japanese", ko: "Korean" },
  ru: { en: "Английский", de: "Немецкий", es: "Испанский", fr: "Французский", it: "Итальянский", pt: "Португальский", nl: "Нидерландский", pl: "Польский", sv: "Шведский", tr: "Турецкий", ru: "Русский", uk: "Украинский", uz: "Узбекский", ar: "Арабский", hi: "Хинди", zh: "Китайский", ja: "Японский", ko: "Корейский" },
  uz: { en: "Ingliz", de: "Nemis", es: "Ispan", fr: "Fransuz", it: "Italyan", pt: "Portugal", nl: "Golland", pl: "Polyak", sv: "Shved", tr: "Turk", ru: "Rus", uk: "Ukrain", uz: "O'zbek", ar: "Arab", hi: "Hind", zh: "Xitoy", ja: "Yapon", ko: "Koreys" },
};

export const langName = (ui, code) => (NAMES[ui] || NAMES.en)[code] || code;

const STR = {
  en: {
    welcome: "Hi, I'm <b>Wizzy</b> ✨ — the word wizard from wwordy.\n\nI show you a word, you tell me if you know it. I bring back the tricky ones and leave the easy ones behind.\n\nLet's set things up first.",
    welcomeBack: "Welcome back! Here's your next word ✨",
    changeIntro: "Let's change your language.",
    needSetup: "Let's set things up first 👇",
    pickLearn: "🌍 Which language do you want to <b>learn</b>?",
    pickNative: "💬 Which language should I <b>translate into</b>? (your own language)",
    pickLevel: "📚 Pick a <b>level</b>.\nA1 is the very beginning, B2 is upper-intermediate.",
    levelAll: "All levels",
    ready: "All set! <b>{learn} → {native}</b>, {level}.\nHere comes your first word ✨",
    know: "✅ I know",
    dont: "❌ Don't know",
    save: "⭐ Save",
    saved: "⭐ Saved",
    statusKnow: "✅ You know this one.",
    statusDont: "❌ Not yet — I'll bring it back.",
    savedBadge: "⭐ saved",
    allDone: "🎉 You know every word at this level!\nChange level or language with /language, or review everything again.",
    again: "🔄 Review everything",
    savedTitle: "⭐ <b>Saved words</b> ({n})",
    savedEmpty: "No saved words yet. Tap ⭐ Save on a card and the word will show up here.",
    savedToast: "Saved ⭐",
    unsavedToast: "Removed from saved",
    page: "{p}/{t}",
    statsTitle: "📊 <b>{learn} → {native}</b> · {level}",
    statsBody: "✅ Known: {k}\n🔁 Still learning: {u}\n🆕 New: {n}\n⭐ Saved: {s}",
    help: "<b>Wizzy's commands</b>\n/word — next word\n/saved — your saved words\n/stats — your progress\n/language — change language or level\n/app — open wwordy\n/help — this message",
    app: "Practise with games, flashcards and more in the wwordy app ✨",
    appButton: "Open wwordy",
    appMissing: "The app link isn't set up yet.",
    already: "Already answered ✔",
    unknown: "I only understand commands. Try /word or /help.",
  },
  ru: {
    welcome: "Привет, я <b>Wizzy</b> ✨ — волшебник слов из wwordy.\n\nЯ показываю слово, а ты говоришь, знаешь ли его. Сложные слова я возвращаю, а лёгкие оставляю позади.\n\nСначала немного настроим.",
    welcomeBack: "С возвращением! Вот следующее слово ✨",
    changeIntro: "Давай сменим язык.",
    needSetup: "Сначала настроим язык 👇",
    pickLearn: "🌍 Какой язык ты хочешь <b>учить</b>?",
    pickNative: "💬 На какой язык мне <b>переводить</b>? (твой родной)",
    pickLevel: "📚 Выбери <b>уровень</b>.\nA1 — самое начало, B2 — выше среднего.",
    levelAll: "Все уровни",
    ready: "Готово! <b>{learn} → {native}</b>, {level}.\nВот твоё первое слово ✨",
    know: "✅ Знаю",
    dont: "❌ Не знаю",
    save: "⭐ Сохранить",
    saved: "⭐ Сохранено",
    statusKnow: "✅ Это ты знаешь.",
    statusDont: "❌ Пока нет — я верну это слово.",
    savedBadge: "⭐ сохранено",
    allDone: "🎉 Ты знаешь все слова этого уровня!\nСмени уровень или язык командой /language или повтори всё заново.",
    again: "🔄 Повторить всё",
    savedTitle: "⭐ <b>Сохранённые слова</b> ({n})",
    savedEmpty: "Сохранённых слов пока нет. Нажми ⭐ Сохранить на карточке, и слово появится здесь.",
    savedToast: "Сохранено ⭐",
    unsavedToast: "Удалено из сохранённых",
    page: "{p}/{t}",
    statsTitle: "📊 <b>{learn} → {native}</b> · {level}",
    statsBody: "✅ Знаю: {k}\n🔁 Учу: {u}\n🆕 Новые: {n}\n⭐ Сохранено: {s}",
    help: "<b>Команды Wizzy</b>\n/word — следующее слово\n/saved — сохранённые слова\n/stats — мой прогресс\n/language — сменить язык или уровень\n/app — открыть wwordy\n/help — это сообщение",
    app: "Играй, повторяй карточки и учись дальше в приложении wwordy ✨",
    appButton: "Открыть wwordy",
    appMissing: "Ссылка на приложение пока не настроена.",
    already: "Уже отвечено ✔",
    unknown: "Я понимаю только команды. Попробуй /word или /help.",
  },
  uz: {
    welcome: "Salom, men <b>Wizzy</b> ✨ — wwordy'ning so'z sehrgari.\n\nMen so'z ko'rsataman, siz uni bilasizmi yoki yo'qligini aytasiz. Qiyin so'zlarni qaytaraman, osonlarini esa qoldiraman.\n\nAvval sozlab olamiz.",
    welcomeBack: "Qaytganingiz bilan! Mana keyingi so'z ✨",
    changeIntro: "Tilni o'zgartiramiz.",
    needSetup: "Avval tilni sozlaymiz 👇",
    pickLearn: "🌍 Qaysi tilni <b>o'rganmoqchisiz</b>?",
    pickNative: "💬 Qaysi tilga <b>tarjima qilay</b>? (o'zingizning tilingiz)",
    pickLevel: "📚 <b>Darajani</b> tanlang.\nA1 — eng boshlanish, B2 — o'rtadan yuqori.",
    levelAll: "Barcha darajalar",
    ready: "Tayyor! <b>{learn} → {native}</b>, {level}.\nMana birinchi so'zingiz ✨",
    know: "✅ Bilaman",
    dont: "❌ Bilmayman",
    save: "⭐ Saqlash",
    saved: "⭐ Saqlandi",
    statusKnow: "✅ Buni bilasiz.",
    statusDont: "❌ Hozircha yo'q — bu so'zni qaytaraman.",
    savedBadge: "⭐ saqlandi",
    allDone: "🎉 Siz bu darajadagi barcha so'zlarni bilasiz!\nDarajani yoki tilni /language orqali o'zgartiring yoki hammasini qaytadan takrorlang.",
    again: "🔄 Hammasini takrorlash",
    savedTitle: "⭐ <b>Saqlangan so'zlar</b> ({n})",
    savedEmpty: "Hali saqlangan so'zlar yo'q. Kartochkadagi ⭐ Saqlash tugmasini bossangiz, so'z shu yerda paydo bo'ladi.",
    savedToast: "Saqlandi ⭐",
    unsavedToast: "Saqlanganlardan olib tashlandi",
    page: "{p}/{t}",
    statsTitle: "📊 <b>{learn} → {native}</b> · {level}",
    statsBody: "✅ Bilaman: {k}\n🔁 O'rganyapman: {u}\n🆕 Yangi: {n}\n⭐ Saqlangan: {s}",
    help: "<b>Wizzy buyruqlari</b>\n/word — keyingi so'z\n/saved — saqlangan so'zlar\n/stats — mening natijam\n/language — til yoki darajani o'zgartirish\n/app — wwordy'ni ochish\n/help — shu xabar",
    app: "O'yinlar, kartochkalar va boshqa mashqlar wwordy ilovasida ✨",
    appButton: "wwordy'ni ochish",
    appMissing: "Ilova havolasi hali sozlanmagan.",
    already: "Allaqachon javob berilgan ✔",
    unknown: "Men faqat buyruqlarni tushunaman. /word yoki /help ni sinab ko'ring.",
  },
};

export function tr(ui, key, vars = {}) {
  const s = (STR[ui] && STR[ui][key]) || STR.en[key] || key;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));
}

export const STRING_KEYS = Object.keys(STR.en);
export const STRINGS = STR;

// Texts for BotFather-level settings (used by scripts/set-webhook.mjs)
export const BOT_PROFILE = {
  en: {
    shortDescription: "Learn words with Wizzy, the wwordy word wizard.",
    description: "Wizzy shows you a word and you tell him if you know it. Tricky words come back, saved words wait for you in /saved. 18 languages, levels A1-B2.",
    commands: [["word", "Next word"], ["saved", "Saved words"], ["stats", "My progress"], ["language", "Change language or level"], ["app", "Open wwordy"], ["help", "Help"]],
  },
  ru: {
    shortDescription: "Учи слова с Wizzy, волшебником слов из wwordy.",
    description: "Wizzy показывает слово, а ты говоришь, знаешь ли его. Сложные слова возвращаются, а сохранённые ждут тебя в /saved. 18 языков, уровни A1-B2.",
    commands: [["word", "Следующее слово"], ["saved", "Сохранённые слова"], ["stats", "Мой прогресс"], ["language", "Сменить язык или уровень"], ["app", "Открыть wwordy"], ["help", "Помощь"]],
  },
  uz: {
    shortDescription: "wwordy so'z sehrgari Wizzy bilan so'z o'rganing.",
    description: "Wizzy so'z ko'rsatadi, siz uni bilasizmi yoki yo'qligini aytasiz. Qiyin so'zlar qaytadi, saqlanganlari /saved da kutadi. 18 til, A1-B2 darajalar.",
    commands: [["word", "Keyingi so'z"], ["saved", "Saqlangan so'zlar"], ["stats", "Mening natijam"], ["language", "Til yoki darajani o'zgartirish"], ["app", "wwordy'ni ochish"], ["help", "Yordam"]],
  },
};
