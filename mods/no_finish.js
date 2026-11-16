// == Endless Drive (Multiplayer No-Finish) ==
(function(){
  if (window.__r52_endless) return;
  window.__r52_endless = true;

  console.log("[Mod] Endless Drive active. Hunting down finish triggers...");

  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; left:20px; background:rgba(0,0,0,0.7); color:#4ade80; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #4ade80;';
  ui.textContent = '∞ ENDLESS DRIVE ACTIVE';
  document.body.appendChild(ui);

  function getScene(){
    if (window.__r52sceneCached && window.__r52sceneCached.type === "Scene") return window.__r52sceneCached;
    try { if (typeof cam !== "undefined" && cam) { var p = cam; while (p.parent) p = p.parent; if (p.type === "Scene") { window.__r52sceneCached = p; return p; } } } catch(e){}
    try { if (typeof sky !== "undefined" && sky) { var p2 = sky; while (p2.parent) p2 = p2.parent; if (p2.type === "Scene") { window.__r52sceneCached = p2; return p2; } } } catch(e){}
    return null;
  }

  const interval = setInterval(() => {
    const sc = getScene();
    if (!sc) return;

    // 1. Destroy/Hide the finish line object so the game never detects it
    sc.traverse(obj => {
      if (!obj.name && !obj.userData) return;
      const name = (obj.name || "").toLowerCase();
      
      // Look for typical finish line names or userData
      if (name.includes('finish') || name.includes('gate') || name.includes('trigger') || name.includes('end')) {
        if (obj.visible) {
          obj.visible = false;
          // Sometimes removing it completely stops the game from triggering it
          if (obj.parent) obj.parent.remove(obj); 
          console.log("[Mod] Destroyed finish trigger object.");
        }
      }
    });

    // 2. Failsafe: If the game uses a hardcoded Z/X coordinate, we stop the car just before it
    // (Only if the state somehow still changes to 'finish')
    if (typeof state !== 'undefined' && state === 'finish') {
      window.state = 'race'; // Force race state back
      
      // Stop the car dead in its tracks
      if (typeof car !== 'undefined' && car) {
        car.vf = 0; 
        // Instantly teleport back to the start line if they cross
        if (window.__r52TrackStart) {
            car.x = window.__r52TrackStart.x;
            car.z = window.__r52TrackStart.z;
        }
      }
    }
  }, 100);

  // Save the starting position so we can teleport them back if they somehow finish
  setTimeout(() => {
    if (typeof car !== 'undefined' && car) {
      window.__r52TrackStart = { x: car.x, z: car.z, h: car.h };
      console.log("[Mod] Saved track start position.");
    }
  }, 2000);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['endless_drive'] = function() {
    clearInterval(interval);
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    delete window.__r52_endless;
    delete window.__r52TrackStart;
    console.log("[Mod] Endless Drive disabled.");
  };
})();