// == Dust Changer ==
// Changes the size, colour, and transparency of the game's dust and gravel particles.
(function(){
  if (window.__r52_dustchanger) return;
  window.__r52_dustchanger = true;

  const ID = 'dust_changer';

  function clean(raw) {
    raw = raw || {};
    const num = (v, d, min, max) => {
      v = Number(v);
      return isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
    };
    let col = typeof raw.color === 'string' ? raw.color.trim().toLowerCase() : '#ffffff';
    if (!/^#[0-9a-f]{6}$/.test(col)) col = '#ffffff';
    return { 
      color: col, 
      transparency: num(raw.transparency, 0, 0, 100),
      size: num(raw.size, 100, 10, 300)
    };
  }

  let cfg;
  try { cfg = clean(JSON.parse(localStorage.getItem('r52_cfg_' + ID) || '{}')); } catch (e) { cfg = clean({}); }

  function findScene() {
    const getters = [function () { return cam; }, function () { return sky; }];
    for (let i = 0; i < getters.length; i++) {
      try {
        let o = getters[i]();
        while (o && o.parent) o = o.parent;
        if (o && o.isScene) return o;
      } catch (e) {}
    }
    return null;
  }

  function apply() {
    const sc = findScene();
    if (!sc) return;

    // Convert hex to THREE.Color
    const targetColor = new THREE.Color(cfg.color);
    const opacityMult = Math.max(0, 1 - (cfg.transparency / 100));
    const sizeMult = cfg.size / 100;

    sc.traverse(obj => {
      // 1. Gravel Particles (THREE.Points)
      if (obj.isPoints && obj.material && obj.material.type === 'PointsMaterial') {
        // Store original values on first encounter
        if (obj.userData.r52_baseSize === undefined) {
          obj.userData.r52_baseSize = obj.material.size || 1;
          obj.userData.r52_baseOpacity = obj.material.opacity;
        }
        
        obj.material.color.copy(targetColor);
        obj.material.opacity = obj.userData.r52_baseOpacity * opacityMult;
        obj.material.size = obj.userData.r52_baseSize * sizeMult;
        obj.material.needsUpdate = true;
      }

      // 2. Dust Puffs (Mesh with LatheGeometry)
      if (obj.isMesh && obj.geometry && obj.geometry.type === 'LatheGeometry') {
        if (obj.userData.r52_baseScale === undefined) {
          obj.userData.r52_baseScale = obj.scale.x || 1;
          obj.userData.r52_baseOpacity = obj.material.opacity || 1;
        }

        obj.material.color.copy(targetColor);
        obj.material.opacity = obj.userData.r52_baseOpacity * opacityMult;
        
        // Scale the mesh for size
        const s = obj.userData.r52_baseScale * sizeMult;
        obj.scale.set(s, s, s);
      }
    });
  }

  // Listen for live updates from the Hub
  function onCfg(e) {
    const d = e && e.detail;
    if (!d || d.id !== ID) return;
    cfg = clean(d.cfg);
    apply();
  }
  window.addEventListener('r52_cfg', onCfg);

  // Constantly apply because the game recycles and resets these particles every few milliseconds
  const timer = setInterval(apply, 100);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup[ID] = function() {
    clearInterval(timer);
    window.removeEventListener('r52_cfg', onCfg);
    delete window.__r52_dustchanger;
    
    // Attempt to restore defaults
    const sc = findScene();
    if (sc) {
      sc.traverse(obj => {
        if (obj.isPoints && obj.userData.r52_baseSize !== undefined) {
          obj.material.size = obj.userData.r52_baseSize;
          obj.material.opacity = obj.userData.r52_baseOpacity;
          obj.material.color.setHex(0xffffff);
        }
        if (obj.isMesh && obj.userData.r52_baseScale !== undefined) {
          obj.material.opacity = obj.userData.r52_baseOpacity;
          obj.scale.setScalar(obj.userData.r52_baseScale);
          obj.material.color.setHex(0xffffff);
        }
      });
    }
    console.log('[Mod] Dust Changer cleaned up.');
  };
})();