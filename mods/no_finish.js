// No-Finish
(function(){
  if (window.__r52_endless) return;
  window.__r52_endless = true;

  console.log("[Mod] Endless Drive active. Finish line disabled.");

  // Create a small UI indicator
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

  // 1. Hide the visual finish line object
  const hideInterval = setInterval(() => {
    const sc = getScene();
    if (!sc) return;

    sc.traverse(obj => {
      if (!obj.name) return;
      const name = obj.name.toLowerCase();
      
      // Hide anything named finish, gate, end, or banner
      if (name.includes('finish') || name.includes('gate') || name.includes('end') || name.includes('banner')) {
        obj.visible = false;
      }
    });
  }, 1000);

  // 2. Intercept the finish state
  const stateInterval = setInterval(() => {
    if (typeof state !== 'undefined' && state === 'finish') {
      
      // Force game back to racing
      window.state = 'race'; 
      
      // Push the car backward so they don't get stuck in the trigger zone
      if (typeof car !== 'undefined' && car) {
        
        // We don't know if the track goes along X or Z, so we push back based on heading.
        // If they are moving forward, we reverse their position slightly.
        if (car.vf > 0) {
           car.x -= (Math.sin(car.h) * 5);
           car.z -= (Math.cos(car.h) * 5);
        }
        
        // Stop their speed so they don't instantly hit it again
        car.vf = 0; 
      }
      
      console.log("[Mod] Finish blocked! Pushed player back.");
    }
  }, 50);

  // Cleanup
  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['endless_drive'] = function() {
    clearInterval(hideInterval);
    clearInterval(stateInterval);
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    delete window.__r52_endless;
    console.log("[Mod] Endless Drive disabled.");
  };
})();