// One executor. UI receives engine snapshots, not intent events it can treat as truth.
export function createIntentBus(execute) {
  if (typeof execute !== 'function') throw new TypeError('An engine executor is required');
  return Object.freeze({ publish(intent) {
    if (!intent || typeof intent !== 'object') return { accepted: false, reason: 'invalid_intent' };
    return execute(Object.freeze({ ...intent }));
  } });
}
