// == Manual Cockpit Override v2 ==
(function(){
  if (window.__r52_manualCockpit) return;
  window.__r52_manualCockpit = true;

  let cfg = { cockpitColor: '#ff00ff' };
  try { cfg = JSON.parse(localStorage.getItem('r52_cfg_manual_cockpit') || '{}'); } catch(e){}

  // --- 1. THE DOM BRUTE-FORCE ---
  // The game re-renders the UI constantly, so we use a MutationObserver to catch it the millisecond it appears.
  const observer = new MutationObserver(() => {
    // 1. Hide the Premium buttons
    document.querySelectorAll('#iPrem, #bPrem, .gold').forEach(b => {
      b.style.setProperty('display', 'none', 'important');
    });

    // 2. Find all customization buttons and force them open
    document.querySelectorAll('#pWheels button, #pInterior button, #iCats button').forEach(b => {
      b.disabled = false;
      b.removeAttribute('disabled');
      b.style.setProperty('opacity', '1', 'important');
      b.style.setProperty('pointer-events', 'auto', 'important');
      // Remove any lock classes the game might have added
      b.classList.remove('prem', 'locked', 'gold');
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });


  // --- 2. THE 3D SCENE SCANNER ---
  function paintCockpit() {
    let camera = null;
    try { camera = cam; } catch(e){}
    if (!camera) return;

    const targetColor = new THREE.Color(cfg.cockpitColor || '#ff00ff');

    // In first-person, the cockpit meshes are almost always children of the Camera.
    // We scan the camera and everything attached to it.
    camera.traverse(obj => {
      if (!obj.isMesh || !obj.material) return;

      // Ignore the skybox or massive meshes
      if (obj.geometry && obj.geometry.type === 'BoxGeometry' && obj.scale.x > 10) return;

      // If we find the wheel, dashboard, or driver, paint it.
      const name = (obj.name || '').toLowerCase();
      const geo = (obj.geometry && obj.geometry.type) ? obj.geometry.type : '';
      
      // Paint Torus/Cylinders (Wheels/Knobs) or anything named 'steer', 'dash', 'helmet'
      if (geo === 'TorusGeometry' || geo === 'CylinderGeometry' || name.includes('steer') || name.includes('dash') || name.includes('helmet')) {
        
        // We have to clone the material, otherwise we paint the whole car
        if (!obj.userData.r52_painted) {
          obj.material = obj.material.clone();
          obj.userData.r52_painted = true;
        }

        if (obj.material.color) obj.material.color.copy(targetColor);
        if (obj.material.uniforms && obj.material.uniforms.color) {
            obj.material.uniforms.color.value.copy(targetColor);
        }
      }
    });
  }

  // Run the 3D scanner every second
  const timer = setInterval(paintCockpit, 1000);

  // --- LIVE UPDATE FROM HUB ---
  window.addEventListener('r52_cfg', (e) => {
    if (e.detail && e.detail.id === 'manual_cockpit') {
      cfg = e.detail.cfg;
      paintCockpit();
    }
  });

  // --- CLEANUP ---
  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['manual_cockpit'] = function() {
    clearInterval(timer);
    observer.disconnect();
    delete window.__r52_manualCockpit;
  };
})();