// == F1 Aston Martin Safety Car Mod (Standalone) ==
(function(){
  if (window.__r52_astonSafety) return;
  window.__r52_astonSafety = true;

  console.log("[Mod] Aston Martin Safety Car loading...");

  // ⚠️ CHANGE THIS to the actual URL of your .glb file on GitHub
  const CAR_URL = 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/aston_safety.glb';

  // ⚠️ TUNE THESE WITH YOUR TUNER SCRIPT
  window.__r52astonRotX = 0.0000; 
  window.__r52astonRotY = 0.0000;
  window.__r52astonRotZ = 0.0000;
  window.__r52astonBaked = {
    k: 100,
    x: 0,
    y: 0,
    z: 0
  };

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
      window.__r52DownloadFile(CAR_URL, 'aston', function(dataUrl) {
        if (!window.THREE || !THREE.GLTFLoader) { 
          console.warn("[Mod] THREE.GLTFLoader missing."); 
          return; 
        }
        var loader = new THREE.GLTFLoader();
        loader.load(dataUrl, function(gltf){
          window.__r52astonStash = gltf.scene;
          console.log("[Mod] Aston Safety Car model parsed.");
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

    if (!window.__r52astonStash) return;

    var existing = null;
    for (var i = 0; i < cg.children.length; i++) {
      if (cg.children[i].name === "__r52astonWrap") { existing = cg.children[i]; break; }
    }

    if (existing) {
      existing.position.copy(scaled.position);
      existing.rotation.copy(scaled.rotation);
      existing.rotation.x += window.__r52astonRotX;
      existing.rotation.y += window.__r52astonRotY;
      existing.rotation.z += window.__r52astonRotZ;
      scaled.visible = false;
      return;
    }

    try {
      var wrap = new THREE.Group();
      wrap.name = "__r52astonWrap";
      wrap.position.copy(scaled.position);
      wrap.rotation.copy(scaled.rotation);
      wrap.rotation.x += window.__r52astonRotX;
      wrap.rotation.y += window.__r52astonRotY;
      wrap.rotation.z += window.__r52astonRotZ;
      wrap.scale.setScalar(0.01);

      var model = window.__r52astonStash;
      if (model.parent) model.parent.remove(model);
      
      model.scale.set(window.__r52astonBaked.k, window.__r52astonBaked.k, window.__r52astonBaked.k);
      model.position.set(window.__r52astonBaked.x, window.__r52astonBaked.y, window.__r52astonBaked.z);

      wrap.add(model);
      cg.add(wrap);
      
      scaled.visible = false;
      window.__r52astonGroup = wrap;
      window.__r52astonModel = model;
      
      console.log("[Mod] Aston Safety Car swapped in!");
    } catch(e) { 
      console.error("[Mod] Swap error:", e); 
    }
  }, 300);

  setTimeout(downloadModel, 1000);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['aston_safety'] = function() {
    clearInterval(intervalId);
    if (window.__r52astonGroup && window.__r52astonGroup.parent) {
      window.__r52astonGroup.parent.remove(window.__r52astonGroup);
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
    delete window.__r52_astonSafety;
    delete window.__r52astonGroup;
    delete window.__r52astonModel;
    delete window.__r52astonStash;
    console.log("[Mod] Aston Safety Car cleaned up.");
  };
})();