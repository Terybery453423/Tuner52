// == Manual Cockpit Override ==
(function(){
  if (window.__r52_manualCockpit) return;
  window.__r52_manualCockpit = true;

  let cfg = { cockpitColor: '#ff00ff' };
  try { cfg = JSON.parse(localStorage.getItem('r52_cfg_manual_cockpit') || '{}'); } catch(e){}

  // --- 1. DOM UNLOCK BYPASS ---
  function unlockUI() {
    // Hide the premium paywall buttons
    const premBtns = document.querySelectorAll('#iPrem, #bPrem, .gold');
    premBtns.forEach(b => b.style.display = 'none');

    // Force all customization buttons to be enabled
    const customBtns = document.querySelectorAll('#pWheels button, #pInterior button, #iCats button');
    customBtns.forEach(b => {
      b.disabled = false;
      b.removeAttribute('disabled');
      b.style.opacity = '1';
      b.style.pointerEvents = 'auto';
    });
  }

  // Run DOM unlock frequently to catch the UI when it renders
  setInterval(unlockUI, 500);

  // --- 2. 3D SCENE PAINT ---
  function paintCockpit() {
    let sc = null;
    try { let p = cam; while (p.parent) p = p.parent; if (p.type === "Scene") sc = p; } catch(e){}
    if (!sc) return;

    const targetColor = new THREE.Color(cfg.cockpitColor || '#ff00ff');

    sc.traverse(obj => {
      if (!obj.isMesh || !obj.material) return;

      // We know from the probe that the cockpit is part of the car's children.
      // A steering wheel is usually a TorusGeometry or CylinderGeometry.
      const geoType = obj.geometry ? obj.geometry.type : '';
      
      // Look for the steering wheel (Torus) or dashboard (Box/Cylinder) near the camera
      if (geoType === 'TorusGeometry' || geoType === 'CylinderGeometry') {
        // Clone material so we don't accidentally paint the whole car
        if (!obj.userData.r52_painted) {
          obj.material = obj.material.clone();
          obj.userData.r52_painted = true;
        }
        
        if (obj.material.color) {
          obj.material.color.copy(targetColor);
        }
        if (obj.material.uniforms && obj.material.uniforms.color) {
          obj.material.uniforms.color.value.copy(targetColor);
        }
      }
    });
  }

  // Listen for live updates from the Hub
  function onCfg(e) {
    const d = e && e.detail;
    if (!d || d.id !== 'manual_cockpit') return;
    cfg = d.cfg;
    paintCockpit();
  }
  window.addEventListener('r52_cfg', onCfg);

  // Run 3D paint frequently
  const timer = setInterval(paintCockpit, 1000);

  // --- CLEANUP ---
  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['manual_cockpit'] = function() {
    clearInterval(timer);
    window.removeEventListener('r52_cfg', onCfg);
    delete window.__r52_manualCockpit;
  };
})();