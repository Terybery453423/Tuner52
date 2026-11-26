// == Dust Changer (Custom Textures) ==
(function(){
  if (window.__r52_dustchanger) return;
  window.__r52_dustchanger = true;

  const ID = 'dust_changer';
  const texLoader = new THREE.TextureLoader();
  let currentTexture = null;
  let currentUrl = "";

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
      size: num(raw.size, 100, 10, 300),
      texture: typeof raw.texture === 'string' ? raw.texture : ''
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

  function loadTex(url) {
    if (url === currentUrl) return;
    currentUrl = url;
    if (!url) {
      currentTexture = null;
      return;
    }
    // Load the Base64 image into a Three.js texture
    texLoader.load(url, (tex) => {
      tex.magFilter = THREE.NearestFilter; // Keeps pixel art crisp
      tex.minFilter = THREE.NearestFilter;
      currentTexture = tex;
    });
  }

  function apply() {
    if (cfg.texture !== currentUrl) loadTex(cfg.texture);

    const sc = findScene();
    if (!sc) return;

    const targetColor = new THREE.Color(cfg.color);
    const opacityMult = Math.max(0, 1 - (cfg.transparency / 100));
    const sizeMult = cfg.size / 100;

    sc.traverse(obj => {
      // 1. Gravel Particles
      if (obj.isPoints && obj.material && obj.material.type === 'PointsMaterial') {
        if (obj.userData.r52_baseSize === undefined) {
          obj.userData.r52_baseSize = obj.material.size || 1;
          obj.userData.r52_baseOpacity = obj.material.opacity;
        }
        
        obj.material.color.copy(targetColor);
        obj.material.opacity = obj.userData.r52_baseOpacity * opacityMult;
        obj.material.size = obj.userData.r52_baseSize * sizeMult;
        
        // Apply custom texture
        if (obj.material.map !== currentTexture) {
          obj.material.map = currentTexture;
          obj.material.alphaTest = currentTexture ? 0.1 : 0; // Fix transparent PNGs
          obj.material.needsUpdate = true;
        }
      }

      // 2. Dust Puffs
      if (obj.isMesh && obj.geometry && obj.geometry.type === 'LatheGeometry') {
        if (obj.userData.r52_baseScale === undefined) {
          obj.userData.r52_baseScale = obj.scale.x || 1;
          obj.userData.r52_baseOpacity = obj.material.opacity || 1;
        }

        obj.material.color.copy(targetColor);
        obj.material.opacity = obj.userData.r52_baseOpacity * opacityMult;
        
        const s = obj.userData.r52_baseScale * sizeMult;
        obj.scale.set(s, s, s);

        // Apply custom texture (MeshBasicMaterial uses `map`)
        if (obj.material.map !== currentTexture) {
          obj.material.map = currentTexture;
          obj.material.alphaTest = currentTexture ? 0.1 : 0;
          obj.material.needsUpdate = true;
        }
      }
    });
  }

  function onCfg(e) {
    const d = e && e.detail;
    if (!d || d.id !== ID) return;
    cfg = clean(d.cfg);
    apply();
  }
  window.addEventListener('r52_cfg', onCfg);

  const timer = setInterval(apply, 100);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup[ID] = function() {
    clearInterval(timer);
    window.removeEventListener('r52_cfg', onCfg);
    if (currentTexture) { currentTexture.dispose(); currentTexture = null; }
    delete window.__r52_dustchanger;
    
    const sc = findScene();
    if (sc) {
      sc.traverse(obj => {
        if (obj.isPoints && obj.userData.r52_baseSize !== undefined) {
          obj.material.size = obj.userData.r52_baseSize;
          obj.material.opacity = obj.userData.r52_baseOpacity;
          obj.material.color.setHex(0xffffff);
          obj.material.map = null;
          obj.material.alphaTest = 0;
          obj.material.needsUpdate = true;
        }
        if (obj.isMesh && obj.userData.r52_baseScale !== undefined) {
          obj.material.opacity = obj.userData.r52_baseOpacity;
          obj.scale.setScalar(obj.userData.r52_baseScale);
          obj.material.color.setHex(0xffffff);
          obj.material.map = null;
          obj.material.alphaTest = 0;
          obj.material.needsUpdate = true;
        }
      });
    }
  };
})();