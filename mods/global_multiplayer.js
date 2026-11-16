// == Global Multiplayer (CSP Bypass via Hub Relay) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Using Postman's reliable echo server for testing
  const WS_URL = 'wss://ws.postman-echo.com/raw';
  
  let ghostCar = null;
  let lastSend = 0;
  let intervalId = null;
  let isConnected = false;

  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.7); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
  ui.textContent = `🌐 MULTIPLAYER: CONNECTING...`;
  document.body.appendChild(ui);

  // 1. Tell the Hub to open the WebSocket
  window.dispatchEvent(new CustomEvent('r52_ws_connect', { detail: { url: WS_URL } }));

  // 2. Listen for Hub events
  window.addEventListener('r52_ws_open', () => {
    console.log("[Mod] WebSocket Connected via Hub!");
    ui.textContent = `🌐 MULTIPLAYER: ONLINE`;
    ui.style.color = '#4ade80';
    ui.style.borderColor = '#4ade80';
    isConnected = true;

    intervalId = setInterval(() => {
      if (!isConnected) return;
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

      // Send via Hub relay
      window.dispatchEvent(new CustomEvent('r52_ws_send', { 
        detail: JSON.stringify({
          x: carGroup.position.x,
          y: carGroup.position.y,
          z: carGroup.position.z,
          rx: carGroup.rotation.x,
          ry: carGroup.rotation.y,
          rz: carGroup.rotation.z
        })
      }));
    }, 20);
  });

  window.addEventListener('r52_ws_message', (event) => {
    if (ghostCar && isConnected) {
      try {
        const data = JSON.parse(event.detail);
        ghostCar.position.lerp(new THREE.Vector3(data.x, data.y, data.z), 0.3);
        ghostCar.rotation.x += (data.rx - ghostCar.rotation.x) * 0.3;
        ghostCar.rotation.y += (data.ry - ghostCar.rotation.y) * 0.3;
        ghostCar.rotation.z += (data.rz - ghostCar.rotation.z) * 0.3;
      } catch(e) {}
    }
  });

  window.addEventListener('r52_ws_close', () => {
    isConnected = false;
    ui.textContent = `🌐 MULTIPLAYER: DISCONNECTED`;
    ui.style.color = '#ef4444';
    ui.style.borderColor = '#ef4444';
  });

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['global_multiplayer'] = function() {
    clearInterval(intervalId);
    window.dispatchEvent(new CustomEvent('r52_ws_disconnect'));
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
    delete window.__r52_globalMulti;
    console.log("[Mod] Global Multiplayer disconnected.");
  };
})();