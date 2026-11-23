// User storage. The bot only needs get(id) / set(id, user).
// - Netlify Blobs in production (survives cold starts, free tier is plenty)
// - an in-memory store for tests, and a JSON file store for `npm run local`
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export function createBlobUserStore(getStore) {
  const store = () => getStore({ name: "bot-users", consistency: "strong" });
  return {
    async get(id) {
      return (await store().get(`u:${id}`, { type: "json" })) || null;
    },
    async set(id, user) {
      await store().setJSON(`u:${id}`, user);
    },
  };
}

export function createMemoryStore() {
  const m = new Map();
  return {
    async get(id) {
      const v = m.get(String(id));
      return v ? structuredClone(v) : null;
    },
    async set(id, user) {
      m.set(String(id), structuredClone(user));
    },
    _all: m,
  };
}

export function createFileStore(path) {
  const load = () => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {});
  return {
    async get(id) {
      return load()[String(id)] || null;
    },
    async set(id, user) {
      const all = load();
      all[String(id)] = user;
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(all));
    },
  };
}
