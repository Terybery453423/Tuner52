// == Cockpit Customizer ==
(function(){
  if (window.__r52_cockpitCustom) return;
  window.__r52_cockpitCustom = true;

  let cfg = { interiorColor: '#111111' };
  try { cfg = JSON.parse(localStorage.getItem('r52_cfg_cockpit_customizer') || '{}'); } catch(e){}

  function findScene() {
    try { let p = cam; while (p.parent) p = p.parent; if (p.type === "Scene") return p; } catch(e){}
    return null;
  }

  function applyColor() {
    const sc = findScene();
    if (!sc) return;
    
    const targetColor = new THREE.Color(cfg.interiorColor || '#111111');

    sc.traverse(obj => {
      if (obj.isMesh && obj.material) {
        // Look for the custom shader that handles the interior
        if (obj.material.isShaderMaterial && obj.material.uniforms && obj.material.uniforms.uInC) {
          obj.material.uniforms.uInC.value.copy(targetColor);
        }
      }
    });
  }

  function onCfg(e) {
    const d = e && e.detail;
    if (!d || d.id !== 'cockpit_customizer') return;
    cfg = d.cfg;
    applyColor();
  }
  window.addEventListener('r52_cfg', onCfg);

  const timer = setInterval(applyColor, 1000);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['cockpit_customizer'] = function() {
    clearInterval(timer);
    window.removeEventListener('r52_cfg', onCfg);
    delete window.__r52_cockpitCustom;
    // Reset to default (or let the game handle it on reload)
  };
})();