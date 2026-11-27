// == Cockpit Unlocker & Probe ==
(function(){
  if (window.__r52_cockpitUnlocker) return;
  window.__r52_cockpitUnlocker = true;

  console.log("[Mod] Cockpit Unlocker loading...");

  // 1. Force Premium features to be unlocked
  const unlockPremium = () => {
    if (typeof window.premiumFromCustom === 'function') {
      window.premiumFromCustom = function() { return true; };
    }
    if (typeof window.customFree === 'function') {
      window.customFree = function() { return true; };
    }
    if (typeof window.premiumExpiryCheck === 'function') {
      window.premiumExpiryCheck = function() { return true; };
    }
    
    // Try to unlock the UI button if it exists
    const premBtn = document.getElementById('bPrem');
    if (premBtn) {
      premBtn.style.display = 'none'; // Hide the "Buy Premium" button
    }
  };

  unlockPremium();
  setInterval(unlockPremium, 1000); // Keep enforcing it in case the game resets it

  // 2. Probe the 3D functions to see what they do
  // This will print to the console when you change parts in the menu
  const hookFn = (name) => {
    if (typeof window[name] === 'function') {
      const orig = window[name];
      window[name] = function(...args) {
        console.log(`[Probe] ${name} called with:`, args);
        return orig.apply(this, args);
      };
      console.log(`[Mod] Hooked ${name}`);
    }
  };

  setTimeout(() => {
    hookFn('ckCabinSet');
    hookFn('ckWheelMesh');
    hookFn('ckKnobParts');
    hookFn('ckHelmetGeo');
  }, 2000);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['cockpit_unlocker'] = function() {
    delete window.__r52_cockpitUnlocker;
    console.log("[Mod] Cockpit Unlocker disabled.");
  };
})();