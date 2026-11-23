import { describe, it, expect } from "vitest";
import { answer, getBook, newUser, pickNext, resetLevel, showCard, statsFor, toggleSave } from "../src/logic.js";
import { idsForLevel } from "../src/words.js";

const ready = () => {
  const u = newUser(1, "en");
  Object.assign(u, { lang: "de", native: "ru", level: "A1", step: "ready" });
  return u;
};

describe("pickNext", () => {
  it("never shows a known word", () => {
    const u = ready();
    const ids = idsForLevel("A1");
    for (const id of ids.slice(0, 49)) answer(u, id, "k");
    for (let i = 0; i < 20; i++) expect(pickNext(u, Math.random)).toBe(ids[49]);
  });

  it("returns null when every word of the level is known", () => {
    const u = ready();
    for (const id of idsForLevel("A1")) answer(u, id, "k");
    expect(pickNext(u)).toBeNull();
  });

  it("does not repeat the current card or the last few cards", () => {
    const u = ready();
    const first = pickNext(u, () => 0);
    showCard(u, first);
    const seen = new Set([first]);
    for (let i = 0; i < 4; i++) {
      const next = pickNext(u, Math.random);
      expect(seen.has(next)).toBe(false);
      seen.add(next);
      showCard(u, next);
    }
  });

  it("brings back words marked as not known, less often than new ones", () => {
    const u = ready();
    const ids = idsForLevel("A1");
    for (const id of ids.slice(0, 5)) answer(u, id, "u");
    let unknownHits = 0;
    const runs = 4000;
    for (let i = 0; i < runs; i++) if (ids.slice(0, 5).includes(pickNext(u, Math.random))) unknownHits++;
    // 5 words with weight 2 against 45 words with weight 4 -> about 5.3 %
    expect(unknownHits / runs).toBeGreaterThan(0.02);
    expect(unknownHits / runs).toBeLessThan(0.1);
  });

  it("works with a single word left, even if it is the current card", () => {
    const u = ready();
    const ids = idsForLevel("A1");
    for (const id of ids.slice(0, 49)) answer(u, id, "k");
    showCard(u, ids[49]);
    expect(pickNext(u)).toBe(ids[49]);
  });
});

describe("progress", () => {
  it("keeps progress and saved words separate per learned language", () => {
    const u = ready();
    answer(u, "A1.0.0", "k");
    toggleSave(u, "A1.0.0");
    u.lang = "es";
    expect(getBook(u).p["A1.0.0"]).toBeUndefined();
    expect(getBook(u).saved).toEqual([]);
    u.lang = "de";
    expect(getBook(u).p["A1.0.0"]).toBe("k");
    expect(getBook(u).saved).toEqual(["A1.0.0"]);
  });

  it("toggleSave saves and unsaves", () => {
    const u = ready();
    expect(toggleSave(u, "A1.0.1")).toBe(true);
    expect(toggleSave(u, "A1.0.1")).toBe(false);
    expect(getBook(u).saved).toEqual([]);
  });

  it("statsFor counts known, learning, new and saved", () => {
    const u = ready();
    answer(u, "A1.0.0", "k");
    answer(u, "A1.0.1", "u");
    toggleSave(u, "A1.0.1");
    expect(statsFor(u)).toEqual({ k: 1, u: 1, n: 48, s: 1, total: 50 });
  });

  it("resetLevel forgets known words but keeps saved ones", () => {
    const u = ready();
    answer(u, "A1.0.0", "k");
    toggleSave(u, "A1.0.0");
    resetLevel(u);
    expect(statsFor(u)).toMatchObject({ k: 0, u: 0, n: 50, s: 1 });
  });
});
