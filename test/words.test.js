import { describe, it, expect } from "vitest";
import { LANGS, LEVELS, describeWord, idsForLevel, isValidId } from "../src/words.js";

describe("word list", () => {
  it("has 50 words per level and 200 in total", () => {
    for (const l of LEVELS) expect(idsForLevel(l).length).toBe(50);
    expect(idsForLevel("ALL").length).toBe(200);
  });

  it("has a non-empty word in every one of the 18 languages", () => {
    for (const id of idsForLevel("ALL")) {
      for (const lang of LANGS) {
        const w = describeWord(id, lang, "en");
        expect(w.word, `${id} ${lang}`).toBeTruthy();
      }
    }
  });

  it("ids are short enough for Telegram button data (64 bytes)", () => {
    for (const id of idsForLevel("ALL")) expect(`rm:${id}:99`.length).toBeLessThan(64);
  });

  it("shows German nouns with the article and the plural", () => {
    const id = idsForLevel("A1").find((i) => describeWord(i, "de", "en").title === "die Mutter");
    const w = describeWord(id, "de", "ru");
    expect(w.title).toBe("die Mutter");
    expect(w.meaning).toBe("мама");
    expect(w.extras).toBe("Pl.: die Mütter");
  });

  it("does not add German grammar to other languages", () => {
    const id = idsForLevel("A1").find((i) => describeWord(i, "de", "en").title === "die Mutter");
    const w = describeWord(id, "es", "ru");
    expect(w.title).toBe("madre");
    expect(w.extras).toBe("");
  });

  it("rejects unknown ids and languages", () => {
    expect(isValidId("A1.0.0")).toBe(true);
    expect(isValidId("A1.9.9")).toBe(false);
    expect(isValidId("nonsense")).toBe(false);
    expect(describeWord("A1.0.0", "xx", "en")).toBeNull();
  });
});
