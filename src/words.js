// The ready-made word list (the same 200 words as the wwordy app: A1-B2, 18 languages).
// Row format in src/data/*.js: [type, germanGrammar, ...18 translations in LANGS order].
import { A1, A2 } from "./data/level-data-a.js";
import { B1, B2 } from "./data/level-data-b.js";

export const LANGS = ["en", "de", "es", "fr", "it", "pt", "nl", "pl", "sv", "tr", "ru", "uk", "uz", "ar", "hi", "zh", "ja", "ko"];
export const LEVELS = ["A1", "A2", "B1", "B2"];
const DATA = { A1, A2, B1, B2 };

const colOf = (code) => 2 + LANGS.indexOf(code);

// Word ids look like "A1.0.3" = level A1, stack 0, row 3. They are short enough for Telegram's 64-byte button data.
const IDS = {};
for (const level of LEVELS) {
  IDS[level] = [];
  DATA[level].forEach((stack, si) => stack.rows.forEach((_, ri) => IDS[level].push(`${level}.${si}.${ri}`)));
}

// "ALL" means every level.
export function idsForLevel(level) {
  if (level === "ALL") return LEVELS.flatMap((l) => IDS[l]);
  return IDS[level] || [];
}

export function levelOf(id) {
  return String(id).split(".")[0];
}

function rowOf(id) {
  const [level, si, ri] = String(id).split(".");
  const stack = DATA[level] && DATA[level][Number(si)];
  return stack && stack.rows[Number(ri)] ? stack.rows[Number(ri)] : null;
}

export const isValidId = (id) => !!rowOf(id);

// What to show for a word: the title (with the article for German nouns), the meaning and, for German only,
// the grammar line (plural / past forms / comparative).
export function describeWord(id, learn, native) {
  const row = rowOf(id);
  if (!row || LANGS.indexOf(learn) < 0 || LANGS.indexOf(native) < 0) return null;
  const [type, gram] = row;
  const parts = String(gram || "").split("|");
  const word = row[colOf(learn)];
  let title = word;
  let extras = "";
  const real = (s) => s && s !== "—" && s !== "-";
  if (learn === "de") {
    if (type === "noun") {
      if (real(parts[0])) title = `${parts[0]} ${word}`;
      if (real(parts[1])) extras = `Pl.: die ${parts[1]}`;
    } else if (type === "verb") {
      const bits = [];
      if (real(parts[0])) bits.push(`Prät.: ${parts[0]}`);
      if (real(parts[1])) bits.push(`Part. II: ${parts[1]}`);
      extras = bits.join(" · ");
    } else if (type === "adj") {
      const bits = [];
      if (real(parts[0])) bits.push(`Komp.: ${parts[0]}`);
      if (real(parts[1])) bits.push(`Sup.: ${parts[1]}`);
      extras = bits.join(" · ");
    }
  }
  return { id, level: levelOf(id), type, title, word, meaning: row[colOf(native)], extras };
}
