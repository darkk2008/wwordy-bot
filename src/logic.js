// Pure bot logic (no network, no storage), so it is easy to test.
// A user record:
//   { v, id, ui, step: "learn"|"native"|"level"|"ready", lang, native, level, cur, recent, lu, books }
// books[lang] = { p: { [wordId]: "k" (known) | "u" (don't know yet) }, saved: [wordId, ...] }
// Progress is kept per learned language, so switching language never mixes up what you know.
import { idsForLevel } from "./words.js";

export const RECENT_SIZE = 5;
const WEIGHT_NEW = 4; // words you have not seen yet
const WEIGHT_UNKNOWN = 2; // words you said you don't know: they come back, a bit less often than new ones

export function newUser(id, ui = "en") {
  return { v: 1, id, ui, step: "learn", lang: null, native: null, level: "A1", cur: null, recent: [], lu: 0, books: {} };
}

export function getBook(user) {
  if (!user.books) user.books = {};
  const key = user.lang || "_";
  if (!user.books[key]) user.books[key] = { p: {}, saved: [] };
  return user.books[key];
}

// Picks the next word: new words first, then the ones you don't know yet; known words are not shown.
// Avoids the current card and the last few cards when there is anything else to show.
// Returns null when every word of the level is known.
export function pickNext(user, rng = Math.random) {
  const book = getBook(user);
  const cands = [];
  for (const id of idsForLevel(user.level)) {
    const st = book.p[id];
    if (st === "k") continue;
    cands.push([id, st === "u" ? WEIGHT_UNKNOWN : WEIGHT_NEW]);
  }
  if (!cands.length) return null;
  const avoid = new Set([user.cur, ...(user.recent || [])].filter(Boolean));
  let pool = cands.filter(([id]) => !avoid.has(id));
  if (!pool.length) pool = cands.filter(([id]) => id !== user.cur);
  if (!pool.length) pool = cands;
  const total = pool.reduce((n, [, w]) => n + w, 0);
  let r = rng() * total;
  for (const [id, w] of pool) {
    r -= w;
    if (r < 0) return id;
  }
  return pool[pool.length - 1][0];
}

export function showCard(user, id) {
  user.cur = id;
  user.recent = [id, ...(user.recent || []).filter((x) => x !== id)].slice(0, RECENT_SIZE);
}

// kind: "k" (I know) or "u" (don't know). Ends the current card.
export function answer(user, id, kind) {
  getBook(user).p[id] = kind === "k" ? "k" : "u";
  user.cur = null;
}

// Returns true when the word is saved after the call.
export function toggleSave(user, id) {
  const book = getBook(user);
  const i = book.saved.indexOf(id);
  if (i >= 0) {
    book.saved.splice(i, 1);
    return false;
  }
  book.saved.push(id);
  return true;
}

export const isSaved = (user, id) => getBook(user).saved.includes(id);

export function removeSaved(user, id) {
  const book = getBook(user);
  book.saved = book.saved.filter((x) => x !== id);
}

// "Review everything": forget which words of the current level you knew.
export function resetLevel(user) {
  const book = getBook(user);
  for (const id of idsForLevel(user.level)) delete book.p[id];
  user.cur = null;
  user.recent = [];
}

export function statsFor(user) {
  const book = getBook(user);
  const ids = idsForLevel(user.level);
  let k = 0;
  let u = 0;
  for (const id of ids) {
    if (book.p[id] === "k") k++;
    else if (book.p[id] === "u") u++;
  }
  return { k, u, n: ids.length - k - u, s: book.saved.length, total: ids.length };
}
