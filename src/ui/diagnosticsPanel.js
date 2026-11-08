// Development-only motion diagnostics. Off unless the page URL carries ?diagnostics=1.
// Read-only: it renders a frozen snapshot and holds no reference to the engine, bus or sensors.
// It does not record history, persist anything or send data anywhere.

export function diagnosticsRequested(search) {
  return new URLSearchParams(search ?? '').get('diagnostics') === '1';
}

const signed = value => Number.isFinite(value) ? `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}°` : '—';

// Pure formatting so it can be tested without a browser.
export function formatDiagnostics(d) {
  const action = d.lastAction
    ? `${d.lastAction.type}${d.lastAction.detail ? ` ${d.lastAction.detail}` : ''} · ${d.lastAction.accepted ? 'accepted' : `rejected (${d.lastAction.reason ?? 'unknown'})`}`
    : '—';
  return [
    ['Permission', d.permission],
    ['State', `${d.state} (${d.motion})`],
    ['Tilt from grip', d.tiltFromGrip ? `${signed(d.tiltFromGrip.pitch)} pitch · ${signed(d.tiltFromGrip.roll)} roll` : '—'],
    ['Filtered pitch', signed(d.filteredPitch)],
    ['Pour intensity', `${Math.round(d.flow * 100)}%`],
    ['Last action', action],
    ['Cup', d.amount === null ? '—' : `${d.amount} · ${d.triesLeft} tries left`]
  ];
}

export function createDiagnosticsPanel(doc) {
  const panel = doc.createElement('aside');
  panel.className = 'diagnostics-panel';
  panel.setAttribute('aria-label','Motion diagnostics (development)');
  const title = doc.createElement('strong');
  title.textContent = 'Motion diagnostics · dev';
  const list = doc.createElement('dl');
  panel.append(title,list);
  doc.body.append(panel);
  let last = '';
  return Object.freeze({
    render(d) {
      const rows = formatDiagnostics(d), key = JSON.stringify(rows);
      if (key === last) return;
      last = key;
      list.replaceChildren(...rows.flatMap(([label,value]) => {
        const dt = doc.createElement('dt'), dd = doc.createElement('dd');
        dt.textContent = label; dd.textContent = value;
        return [dt,dd];
      }));
    }
  });
}
