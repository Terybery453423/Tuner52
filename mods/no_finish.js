// == No Finish (for multiplayer) ==
// The finish is index based in the game (car.idx vs finIdx) and ends through finish(),
// so this blocks finish() and also pushes the car back before it can reach the line.
(function () {
  if (window.__r52_nofinish) return;
  window.__r52_nofinish = true;

  const PUSH_MARGIN = 6;  // push back when the car is this many road points from the finish
  const PUSH_BACK = 36;   // ...and put it this many road points before the finish
  const COOLDOWN = 1200;  // ms between pushes

  // tiny red dot in the bottom-left corner (no text, doesn't block any controls)
  const dot = document.createElement('div');
  dot.style.cssText = 'position:fixed; left:calc(5px + env(safe-area-inset-left, 0px)); bottom:calc(5px + env(safe-area-inset-bottom, 0px)); width:8px; height:8px; border-radius:50%; background:#ef4444; box-shadow:0 0 0 2px rgba(0,0,0,.35); opacity:.85; pointer-events:none; z-index:9999;';
  document.body.appendChild(dot);

  // 1) block the game's finish() while this mod is on
  let origFinish = null;
  try {
    if (typeof finish === 'function' && !finish.__r52nf) {
      origFinish = finish;
      const guard = function () {
        if (window.__r52_nofinish) return;
        return origFinish.apply(this, arguments);
      };
      guard.__r52nf = true;
      finish = guard;
    }
  } catch (e) {}

  // 2) push the car back before it gets to the line
  let last = 0;
  const timer = setInterval(function () {
    try {
      if (typeof state === 'undefined' || typeof car === 'undefined' || typeof finIdx === 'undefined' || !car) return;
      if (state === 'finish') state = 'race'; // failsafe, finish() is blocked so this should not happen
      if (state !== 'race') return;
      if (car.idx >= finIdx - PUSH_MARGIN) {
        const now = performance.now();
        if (now - last < COOLDOWN) return;
        last = now;
        car.idx = Math.max(0, finIdx - PUSH_BACK);
        resetToRoad(); // the game's own "back on the road": snaps to the road at car.idx and stops the car
      }
    } catch (e) {}
  }, 30);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['no_finish'] = function () {
    clearInterval(timer);
    try { if (origFinish) finish = origFinish; } catch (e) {}
    if (dot.parentNode) dot.parentNode.removeChild(dot);
    delete window.__r52_nofinish;
    console.log('[Mod] No Finish disabled.');
  };
})();
