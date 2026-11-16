// == Universal Car Swapper ==
(function(){
  if (window.__r52_carSwapper) return;
  window.__r52_carSwapper = true;

  // Read the selected car from the Hub Options
  const selectedCar = localStorage.getItem('r52_opt_car_swapper') || 'None';
  if (selectedCar === 'None') return;

  console.log("[Mod] Car Swapper loading: " + selectedCar);

// --- DELEGATION LOGIC FOR GOLDEN GATE BRIDGE ---
if (selectedCar === 'Golden Gate Bridge') {
  fetch('https://raw.githubusercontent.com/Terybery453423/Tuner52/main/mods/bridge.js?t=' + Date.now())
    .then(r => r.text())
    .then(code => {
      const script = document.createElement('script');
      script.textContent = code;
      document.head.appendChild(script);
      script.remove();
      console.log("[Mod] Bridge loaded via delegation.");
    })
    .catch(e => console.error("[Mod] Failed to load bridge.js:", e));

  // When the user changes to a different car, ensure the bridge cleans itself up
  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['car_swapper'] = function() {
    if (window.__r52ModCleanup && window.__r52ModCleanup['bridge']) {
      window.__r52ModCleanup['bridge']();
    }
    delete window.__r52_carSwapper;
    console.log("[Mod] Car Swapper (Bridge delegation) cleaned up.");
  };
  return; // Stop execution here, let bridge.js do the rest
    }
  const CARS = {
    "Red Bull RB16": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/rb16.glb',
      rotX: 0, rotY: 0, rotZ: 0,
      k: 16.65, x: 40359.93, y: -2456.30, z: 21229.67
    },
    "Krabby Patty": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/krabby_patty.glb',
      rotX: 0, rotY: -1.5708, rotZ: 0,
      k: 96.92, x: 21.48, y: 42.59, z: -1.22
    },
    "Trackmania Car": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/tmnf_car.glb',
      rotX: -0.1916, rotY: 0.59, rotZ: 0.1084,
      k: 94.70, x: -19.53, y: 43.00, z: 365.90
    },
    "Lamborghini Huracan": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/huracan_itasha.glb',
      rotX: 0, rotY: 0, rotZ: 0,
      k: 100, x: 0, y: 0, z: 0 // Adjust if needed
    },
    "Aston Safety Car": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/aston_safety.glb',
      rotX: 0, rotY: 0, rotZ: 0,
      k: 100, x: 0, y: 0, z: 0 // Adjust if needed
    },
  };

  const config = CARS[selectedCar];
  if (!config) return;

  function getScene(){
    if (window.__r52sceneCached && window.__r52sceneCached.type === "Scene") return window.__r52sceneCached;
    try { if (typeof cam !== "undefined" && cam) { var p = cam; while (p.parent) p = p.parent; if (p.type === "Scene") { window.__r52sceneCached = p; return p; } } } catch(e){}
    try { if (typeof sky !== "undefined" && sky) { var p2 = sky; while (p2.parent) p2 = p2.parent; if (p2.type === "Scene") { window.__r52sceneCached = p2; return p2; } } } catch(e){}
    return null;
  }

  function findCarGroup(sc){
    if (!sc || !sc.children) return null;
    for (var k = sc.children.length - 1; k >= 0; k--) {
      var c = sc.children[k];
      if (c.type === "Group" && c.userData && c.userData.base) return c;
    }
    return null;
  }

  function downloadModel() {
    if (window.__r52DownloadFile) {
      window.__r52DownloadFile(config.url, selectedCar, function(dataUrl) {
        if (!window.THREE || !THREE.GLTFLoader) { return; }
        var loader = new THREE.GLTFLoader();
        loader.load(dataUrl, function(gltf){
          window.__r52csStash = gltf.scene;
          console.log("[Mod] Model parsed: " + selectedCar);
        }, undefined, function(err){
          console.error("[Mod] Failed to parse GLB:", err);
        });
      }, function(err) {
        console.error("[Mod] Failed to download model:", err);
      });
    }
  }

  var intervalId = setInterval(function(){
    var sc = getScene(); if (!sc) return;
    var cg = findCarGroup(sc); if (!cg) return;
    
    var scaled = null;
    for (var j = 0; j < cg.children.length; j++) {
      var ch = cg.children[j];
      if (ch.type === "Group" && ch.scale && Math.abs(ch.scale.x - 0.01) < 0.001) { scaled = ch; break; }
    }
    if (!scaled) scaled = cg.children[0];
    if (!scaled) return;

    if (!window.__r52csStash) return;

    var existing = null;
    for (var i = 0; i < cg.children.length; i++) {
      if (cg.children[i].name === "__r52csWrap") { existing = cg.children[i]; break; }
    }

    if (existing) {
      existing.position.copy(scaled.position);
      existing.rotation.copy(scaled.rotation);
      existing.rotation.x += config.rotX;
      existing.rotation.y += config.rotY;
      existing.rotation.z += config.rotZ;
      scaled.visible = false;
      return;
    }

    try {
      var wrap = new THREE.Group();
      wrap.name = "__r52csWrap";
      wrap.position.copy(scaled.position);
      wrap.rotation.copy(scaled.rotation);
      wrap.rotation.x += config.rotX;
      wrap.rotation.y += config.rotY;
      wrap.rotation.z += config.rotZ;
      wrap.scale.setScalar(0.01);

      var model = window.__r52csStash;
      if (model.parent) model.parent.remove(model);
      
      model.scale.set(config.k, config.k, config.k);
      model.position.set(config.x, config.y, config.z);

      wrap.add(model);
      cg.add(wrap);
      
      scaled.visible = false;
      window.__r52csGroup = wrap;
      window.__r52csModel = model;
      
      console.log("[Mod] Swapped in: " + selectedCar);
    } catch(e) { 
      console.error("[Mod] Swap error:", e); 
    }
  }, 300);

  setTimeout(downloadModel, 1000);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['car_swapper'] = function() {
    clearInterval(intervalId);
    if (window.__r52csGroup && window.__r52csGroup.parent) {
      window.__r52csGroup.parent.remove(window.__r52csGroup);
    }
    var sc = getScene();
    if (sc) {
      var cg = findCarGroup(sc);
      if (cg) {
        for (var j = 0; j < cg.children.length; j++) {
          if (cg.children[j].scale && Math.abs(cg.children[j].scale.x - 0.01) < 0.001) {
            cg.children[j].visible = true;
          }
        }
      }
    }
    delete window.__r52_carSwapper;
    delete window.__r52csGroup;
    delete window.__r52csModel;
    delete window.__r52csStash;
    console.log("[Mod] Car Swapper cleaned up.");
  };
})();