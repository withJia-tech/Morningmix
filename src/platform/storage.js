// This testing phase uses memory only. Never access legacy browser storage.
export function createEphemeralStore() {
  let entries = [];
  return Object.freeze({
    read: () => structuredClone(entries),
    replace: value => { entries = structuredClone(value); }
  });
}
