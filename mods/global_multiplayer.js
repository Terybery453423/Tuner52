// == Global Multiplayer (Firebase Offset Polling) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Your specific Firebase URL
  const FIREBASE_URL = 'https://tuner5269420-default-rtdb.europe-west1.firebasedatabase.app/';
  
  const roomCode = prompt("Enter Room Code (or leave blank for Global):", "global") || "global";
  const playerId = Math.random().toString(36).substring(2, 9);
  
  const ROOM_URL = `${FIREBASE_URL}rooms/${roomCode}/${playerId}.json`;
  const ALL_PLAYERS_URL = `${FIREBASE_URL}rooms/${roomCode}.json`;

  let ghostCar = null;
  let sendInterval = null;
  let fetchInterval = null;

  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.8); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
  ui.textContent = `🌐 ROOM: ${roomCode.toUpperCase()}`;
  document.body.appendChild(ui);

  function getCarGroup() {
    let sc = null;
    try { if (typeof cam !== "undefined" && cam) { let p = cam; while (p.parent) p = p.parent; if (p.type === "Scene") sc = p; } } catch(e){}
    if (!sc) return null;
    for (let i = sc.children.length - 1; i >= 0; i--) {
      if (sc.children[i].type === "Group" && sc.children[i].userData && sc.children[i].userData.base) {
        return { scene: sc, car: sc.children[i] };
      }
    }
    return null;
  }

  // --- 1. SEND LOOP (Every 250ms) ---
  function sendPosition() {
    const data = getCarGroup();
    if (!data) return;
    
    const payload = JSON.stringify({
      x: data.car.position.x, y: data.car.position.y, z: data.car.position.z,
      rx: data.car.rotation.x, ry: data.car.rotation.y, rz: data.car.rotation.z,
      t: Date.now()
    });

    fetch(ROOM_URL, { method: 'PUT', body: payload }).catch(() => {});
  }

  // --- 2. FETCH LOOP (Every 250ms, offset by 125ms) ---
  function fetchPositions() {
    const data = getCarGroup();
    if (!data) return;
    const { scene, car } = data;

    fetch(ALL_PLAYERS_URL)
      .then(r => {
        if (!r.ok) throw new Error("Firebase rules blocked read");
        return r.json();
      })
      .then(players => {
        if (!players) return;
        const now = Date.now();

        for (const id in players) {
          if (id === playerId) continue; // Skip ourselves
          
          const p = players[id];
          // Ignore players who disconnected (no update in 3 seconds)
          if (now - p.t > 3000) continue;

          if (!ghostCar) {
            ghostCar = car.userData.base.clone();
            ghostCar.traverse((node) => {
              if (node.isMesh && node.material) {
                node.material = node.material.clone();
                node.material.transparent = true;
                node.material.opacity = 0.5;
              }
            });
            const wrap = new THREE.Group();
            wrap.name = "__r52_ghost";
            wrap.add(ghostCar);
            scene.add(wrap);
            ghostCar = wrap;
          }

          // Smoothly move the ghost car to the new coordinates
          ghostCar.position.lerp(new THREE.Vector3(p.x, p.y, p.z), 0.5);
          ghostCar.rotation.x += (p.rx - ghostCar.rotation.x) * 0.5;
          ghostCar.rotation.y += (p.ry - ghostCar.rotation.y) * 0.5;
          ghostCar.rotation.z += (p.rz - ghostCar.rotation.z) * 0.5;
          break; // Only render the first person we find
        }
      }).catch((e) => {
        console.warn("[Multiplayer] Fetch error:", e.message);
      });
  }

  // --- START THE OFFSET LOOPS ---
  sendInterval = setInterval(sendPosition, 250);
  
  // Wait 125ms before starting the fetch loop so they interlace
  setTimeout(() => {
    fetchInterval = setInterval(fetchPositions, 250);
  }, 125);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['global_multiplayer'] = function() {
    clearInterval(sendInterval);
    clearInterval(fetchInterval);
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
    
    // Delete ourselves from the database on disconnect
    fetch(ROOM_URL, { method: 'DELETE' }).catch(() => {});
    delete window.__r52_globalMulti;
  };
})();