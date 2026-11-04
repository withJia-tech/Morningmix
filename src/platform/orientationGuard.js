export function screenSnapshot(win) {
  return { type: win.screen.orientation?.type ?? null,
    angle: Number.isFinite(win.screen.orientation?.angle) ? win.screen.orientation.angle : Number.isFinite(win.orientation) ? win.orientation : null,
    width: win.innerWidth, height: win.innerHeight };
}
export function isPortrait(s) {
  if (s.type) return s.type === 'portrait-primary';
  if (Number.isFinite(s.angle)) return ((s.angle % 360) + 360) % 360 === 0;
  return s.width <= s.height;
}
export function screenChanged(a,b) {
  return (Number.isFinite(a.angle) && Number.isFinite(b.angle) && a.angle !== b.angle) ||
    (!!a.type && !!b.type && a.type !== b.type) || Math.abs(a.width - b.width) > 80;
}
export function createOrientationGuard(onRotation, win = window) {
  let armed = false, baseline = null;
  const mobile = win.navigator.maxTouchPoints > 0;
  const disarm = () => { armed = false; baseline = null; };
  const check = (native = false) => {
    if (!armed) return true;
    if (native || screenChanged(baseline,screenSnapshot(win))) { disarm(); onRotation('rotated'); return false; }
    return true;
  };
  const rotate = () => check(true), resize = () => check(false);
  win.addEventListener('orientationchange',rotate); win.addEventListener('resize',resize);
  win.screen.orientation?.addEventListener('change',rotate); win.visualViewport?.addEventListener('resize',resize);
  return Object.freeze({
    arm() { if (mobile && !isPortrait(screenSnapshot(win))) return false; baseline = screenSnapshot(win); armed = true; return true; },
    disarm, check,
    dispose() { disarm(); win.removeEventListener('orientationchange',rotate); win.removeEventListener('resize',resize);
      win.screen.orientation?.removeEventListener('change',rotate); win.visualViewport?.removeEventListener('resize',resize); }
  });
}
