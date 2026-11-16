// == Global Multiplayer (Native WebSocket) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Use a public WebSocket relay server
  const WS_URL = 'wss://socketsbay.com/wss/v2/1/demo/';
  let ws;
  let ghostCar = null;
  let lastSend = 0;
  let intervalId = null;

  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.7); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
  ui.textContent = `🌐 MULTIPLAYER: CONNECTING...`;
  document.body.appendChild(ui);

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[Mod] WebSocket Connected!");
      ui.textContent = `🌐 MULTIPLAYER: ONLINE`;
      
      intervalId = setInterval(() => {
        const now = Date.now();
        if (now - lastSend < 50) return; 
        lastSend = now;

        let sc = null;
        try { if (typeof cam !== "undefined" && cam) { let p = cam; while (p.parent) p = p.parent; if (p.type === "Scene") sc = p; } } catch(e){}
        if (!sc) return;

        let carGroup = null;
        for (let i = sc.children.length - 1; i >= 0; i--) {
          if (sc.children[i].type === "Group" && sc.children[i].userData && sc.children[i].userData.base) {
            carGroup = sc.children[i];
            break;
          }
        }
        if (!carGroup) return;

        if (!ghostCar) {
          ghostCar = carGroup.userData.base.clone();
          ghostCar.traverse((node) => {
            if (node.isMesh && node.material) {
              node.material = node.material.clone();
              node.material.transparent = true;
              node.material.opacity = 0.5;
            }
          });
          const wrap = new THREE.Group();
          wrap.name = "__r52_ghost_global";
          wrap.add(ghostCar);
          sc.add(wrap);
          ghostCar = wrap;
        }

        // Send our position over the raw WebSocket
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            x: carGroup.position.x,
            y: carGroup.position.y,
            z: carGroup.position.z,
            rx: carGroup.rotation.x,
            ry: carGroup.rotation.y,
            rz: carGroup.rotation.z
          }));
        }
      }, 20);
    };

    ws.onmessage = (event) => {
      if (ghostCar) {
        try {
          const data = JSON.parse(event.data);
          // Ignore our own messages if the server echoes them back
          if (data.id === window.__r52_myId) return;
          
          ghostCar.position.lerp(new THREE.Vector3(data.x, data.y, data.z), 0.3);
          ghostCar.rotation.x += (data.rx - ghostCar.rotation.x) * 0.3;
          ghostCar.rotation.y += (data.ry - ghostCar.rotation.y) * 0.3;
          ghostCar.rotation.z += (data.rz - ghostCar.rotation.z) * 0.3;
        } catch(e) {}
      }
    };

    ws.onerror = (e) => {
      console.error("[Mod] WebSocket Error:", e);
      ui.textContent = `🌐 MULTIPLAYER: ERROR`;
      ui.style.borderColor = '#ef4444';
      ui.style.color = '#ef4444';
    };

  } catch (e) {
    console.error("[Mod] WebSocket failed to initialize", e);
  }

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['global_multiplayer'] = function() {
    clearInterval(intervalId);
    if (ws) ws.close();
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
    delete window.__r52_globalMulti;
    console.log("[Mod] Global Multiplayer disconnected.");
  };
})();