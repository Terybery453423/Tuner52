// == Global Multiplayer (Direct WebSocket) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Using Postman's highly reliable echo server for testing
  const WS_URL = 'wss://ws.postman-echo.com/raw'; 
  
  const myId = Math.random().toString(36).substring(2, 9);
  
  let ws = null;
  let ghostCar = null;
  let lastSend = 0;
  let sendInterval = null;
  let retryCount = 0;

  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.8); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
  document.body.appendChild(ui);
  
  function setStatus(txt, color = '#00ffcc') {
    ui.textContent = '🌐 ' + txt;
    ui.style.color = color;
    ui.style.borderColor = color;
  }
  setStatus('CONNECTING...');

  function connect() {
    if (ws) { try { ws.close(); } catch(e){} }
    
    setStatus(retryCount === 0 ? 'CONNECTING...' : 'RECONNECTING...', '#fbbf24');
    console.log("[Mod] Trying to connect to " + WS_URL);
    
    try {
      ws = new WebSocket(WS_URL);
    } catch(e) {
      setStatus('BLOCKED BY CSP', '#ef4444');
      return;
    }

    ws.onopen = () => {
      console.log("[Mod] WebSocket Connected Direct!");
      setStatus('ONLINE', '#4ade80');
      retryCount = 0;
      
      if (sendInterval) clearInterval(sendInterval);
      sendInterval = setInterval(sendPos, 50);
    };

    ws.onmessage = (event) => {
      if (!ghostCar) return;
      try {
        const p = JSON.parse(event.data);
        // If it's an echo server, ignore our own messages
        if (p.id === myId) return; 
        
        ghostCar.position.lerp(new THREE.Vector3(p.x, p.y, p.z), 0.3);
        ghostCar.rotation.x += (p.rx - ghostCar.rotation.x) * 0.3;
        ghostCar.rotation.y += (p.ry - ghostCar.rotation.y) * 0.3;
        ghostCar.rotation.z += (p.rz - ghostCar.rotation.z) * 0.3;
      } catch(e) {}
    };

    ws.onclose = () => {
      console.log("[Mod] WebSocket Closed");
      if (sendInterval) clearInterval(sendInterval);
      setStatus('RECONNECTING...', '#fbbf24');
      retryCount++;
      setTimeout(connect, Math.min(5000, 1000 * retryCount));
    };

    ws.onerror = (e) => {
      console.log("[Mod] WebSocket Error", e);
      // The onclose event will handle the reconnect
    };
  }

  function sendPos() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
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

    ws.send(JSON.stringify({
      id: myId,
      x: carGroup.position.x,
      y: carGroup.position.y,
      z: carGroup.position.z,
      rx: carGroup.rotation.x,
      ry: carGroup.rotation.y,
      rz: carGroup.rotation.z
    }));
  }

  // Start connection
  connect();

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['global_multiplayer'] = function() {
    if (sendInterval) clearInterval(sendInterval);
    if (ws) ws.close();
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
    delete window.__r52_globalMulti;
    console.log("[Mod] Global Multiplayer disconnected.");
  };
})();