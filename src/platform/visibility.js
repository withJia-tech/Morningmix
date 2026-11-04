export function observeVisibility(stop, doc = document, win = window) {
  const hidden = () => { if (doc.visibilityState !== 'visible') stop('background'); };
  const inactive = () => stop('background');
  doc.addEventListener('visibilitychange',hidden);
  win.addEventListener('pagehide',inactive);
  // A native permission prompt may blur the window without hiding the page.
  // Do not cancel that request merely because focus moved to the browser prompt.
  return () => { doc.removeEventListener('visibilitychange',hidden); win.removeEventListener('pagehide',inactive); };
}
