import { createEphemeralStore } from '../platform/storage.js';
export function createSessionHistory(store = createEphemeralStore()) {
  return Object.freeze({
    read: () => store.read(),
    record(round) {
      const entries = store.read().filter(r => r.id !== round.id);
      entries.push({ id: round.id, mode: round.mode, finished: round.finished,
        attempts: round.attempts.map(a => ({ amount: a.amount, score: a.score, won: a.won })) });
      store.replace(entries.slice(-50));
    }
  });
}
