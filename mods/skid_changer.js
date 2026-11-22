// == Skid Mark Changer ==
// Transparency, color (hex) and glow for the game's skid marks.
// Settings come from the hub (r52_cfg_skid_changer) and update live via the 'r52_cfg' event.
(function () {
  if (window.__r52_skidchanger) return;
  window.__r52_skidchanger = true;

  const ID = 'skid_changer';
  const ORIGINAL = '#000000'; // black = keep the game's own mark colors

  function clean(raw) {
    raw = raw || {};
    const num = (v, d) => { v = Number(v); return isFinite(v) ? Math.min(100, Math.max(0, v)) : d; };
    let col = typeof raw.color === 'string' ? raw.color.trim().toLowerCase() : ORIGINAL;
    if (!/^#[0-9a-f]{6}$/.test(col)) col = ORIGINAL;
    return { transparency: num(raw.transparency, 0), color: col, glow: num(raw.glow, 0) };
  }

  let cfg;
  try { cfg = clean(JSON.parse(localStorage.getItem('r52_cfg_' + ID) || '{}')); } catch (e) { cfg = clean({}); }

  let mesh = null, mat = null, saved = null, U = null;
  let lastMsg = '';
  function say(msg) { if (msg !== lastMsg) { lastMsg = msg; console.log('[Mod] Skid Changer: ' + msg); } }

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

  // The skid marks are one dynamic BufferGeometry mesh (the game's `skGeo`)
  function findMesh(scene) {
    let geo = null;
    try { geo = skGeo; } catch (e) {}
    let found = null;
    scene.traverse(function (o) {
      if (found || !o.isMesh || !o.geometry) return;
      if (geo) { if (o.geometry === geo) found = o; return; }
      const p = o.geometry.attributes && o.geometry.attributes.position;
      if (o.material && o.material.isShaderMaterial && o.material.transparent && o.renderOrder === -0.05 && p && p.count === 42000) found = o;
    });
    return found;
  }

  function patch() {
    if (!window.THREE) { say('waiting for THREE'); return false; }
    const sc = findScene();
    if (!sc) { say('waiting for the scene'); return false; }
    const m = findMesh(sc);
    if (!m) { say('skid mesh not found yet'); return false; }
    const mt = m.material;
    if (!mt || !mt.isShaderMaterial || !mt.uniforms || String(mt.fragmentShader || '').indexOf('gl_FragColor') < 0) {
      say('skid shader not patchable (no gl_FragColor)');
      return false;
    }

    mesh = m; mat = mt;
    saved = {
      blending: mt.blending,
      hadCompile: Object.prototype.hasOwnProperty.call(mt, 'onBeforeCompile'), compile: mt.onBeforeCompile,
      hadKey: Object.prototype.hasOwnProperty.call(mt, 'customProgramCacheKey'), key: mt.customProgramCacheKey
    };
    U = {
      tint: { value: new THREE.Vector3(0, 0, 0) },
      mix: { value: 0 },
      alpha: { value: 1 },
      boost: { value: 1 }
    };

    mt.onBeforeCompile = function (shader) {
      shader.uniforms.r52Tint = U.tint;
      shader.uniforms.r52Mix = U.mix;
      shader.uniforms.r52Alpha = U.alpha;
      shader.uniforms.r52Boost = U.boost;
      let fs = shader.fragmentShader;
      const end = fs.lastIndexOf('}');
      if (end < 0 || fs.indexOf('gl_FragColor') < 0) return;
      const decl = 'uniform vec3 r52Tint;\nuniform float r52Mix;\nuniform float r52Alpha;\nuniform float r52Boost;\n';
      const inject = '\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, r52Tint, r52Mix) * r52Boost;\n  gl_FragColor.a = clamp(gl_FragColor.a * r52Alpha, 0.0, 1.0);\n';
      fs = fs.slice(0, end) + inject + fs.slice(end);
      // keep any leading #version / #extension lines on top
      const head = (fs.match(/^(\s*#(?:version|extension)[^\n]*\n)*/) || [''])[0];
      shader.fragmentShader = head + decl + fs.slice(head.length);
    };
    mt.customProgramCacheKey = function () { return 'r52skid'; };
    mt.needsUpdate = true;

    apply();
    say('attached to the skid mesh');
    return true;
  }

  function apply() {
    if (!mat || !U) return;
    const c = cfg.color;
    U.tint.value.set(parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255);
    U.mix.value = c === ORIGINAL ? 0 : 1;
    const g = cfg.glow / 100;
    U.alpha.value = Math.max(0, 1 - cfg.transparency / 100) * (1 + 0.8 * g);
    U.boost.value = 1 + 1.5 * g;
    // Glow: additive blending makes bright colors "light up" the road. Pick a bright color for it.
    mat.blending = g > 0 ? THREE.AdditiveBlending : saved.blending;
  }

  function onCfg(e) {
    const d = e && e.detail;
    if (!d || d.id !== ID) return;
    cfg = clean(d.cfg);
    apply();
  }
  window.addEventListener('r52_cfg', onCfg);

  // (re)attach if the scene loads late or the game rebuilds the mesh
  const timer = setInterval(function () {
    if (mesh && mat && mesh.parent && mesh.material === mat) return;
    mesh = mat = null;
    patch();
  }, 800);
  patch();

  window.__r52skid = { get mesh() { return mesh; }, get mat() { return mat; }, cfg: function () { return cfg; } };

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup[ID] = function () {
    clearInterval(timer);
    window.removeEventListener('r52_cfg', onCfg);
    if (mat && saved) {
      mat.blending = saved.blending;
      if (saved.hadCompile) mat.onBeforeCompile = saved.compile; else delete mat.onBeforeCompile;
      if (saved.hadKey) mat.customProgramCacheKey = saved.key; else delete mat.customProgramCacheKey;
      mat.needsUpdate = true;
    }
    mesh = mat = null;
    delete window.__r52skid;
    delete window.__r52_skidchanger;
    console.log('[Mod] Skid Changer cleaned up.');
  };
})();
