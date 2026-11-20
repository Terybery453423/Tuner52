// == Global Multiplayer (Live WebSockets) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Generate a random room code for the lobby
  const roomCode = prompt("Enter Room Code (or leave blank for Global):", "global") || "global";
  // Yjs public relay - stable and designed for real-time sync
  const WS_URL = 'wss://demos.yjs.dev/ws'; 

  const myId = Math.random().toString(36).substring(2, 9);
  
  let ws = null;
  let ghostCar = null;
  let lastSend = 0;
  let sendInterval = null;
  let retryCount = 0;
  let timeoutId = null;

  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.8); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
  document.body.appendChild(ui);
  
  function setStatus(txt, color = '#00ffcc') {
    ui.textContent = `🌐 ${roomCode.toUpperCase()} | ${txt}`;
    ui.style.color = color;
    ui.style.borderColor = color;
  }
  setStatus('CONNECTING...');

  function connect() {
    if (ws) { try { ws.close(); } catch(e){} }
    if (timeoutId) clearTimeout(timeoutId);
    
    setStatus('CONNECTING...', '#fbbf24');
    
    try {
      ws = new WebSocket(WS_URL);
    } catch(e) {
      setStatus('CSP BLOCKED', '#ef4444');
      return;
    }

    // Timeout if connection takes too long
    timeoutId = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        setStatus('TIMEOUT', '#ef4444');
        ws.close();
      }
    }, 8000);

    ws.onopen = () => {
      clearTimeout(timeoutId);
      console.log("[Multiplayer] Connected to Yjs relay!");
      
      // Join the room by sending a sync message
      ws.send(JSON.stringify({
        type: 'join',
        room: roomCode,
        id: myId
      }));

      setStatus('ONLINE', '#4ade80');
      retryCount = 0;
      
      if (sendInterval) clearInterval(sendInterval);
      sendInterval = setInterval(sendPos, 50); // 20 updates per second
    };

    ws.onmessage = (event) => {
      if (!ghostCar) return;
      try {
        const data = JSON.parse(event.data);
        
        // Ignore our own messages
        if (data.id === myId) return;
        // Only accept messages from our room
        if (data.room !== roomCode) return;
        
        // Smooth interpolation (lerp) to hide network lag
        ghostCar.position.lerp(new THREE.Vector3(data.x, data.y, data.z), 0.3);
        ghostCar.rotation.x += (data.rx - ghostCar.rotation.x) * 0.3;
        ghostCar.rotation.y += (data.ry - ghostCar.rotation.y) * 0.3;
        ghostCar.rotation.z += (data.rz - ghostCar.rotation.z) * 0.3;
        
        if (ui.style.color !== '#4ade80') setStatus('ONLINE', '#4ade80');
      } catch(e) {}
    };

    ws.onclose = () => {
      clearTimeout(timeoutId);
      console.log("[Multiplayer] WebSocket Closed");
      if (sendInterval) clearInterval(sendInterval);
      setStatus('RECONNECTING...', '#fbbf24');
      retryCount++;
      // Retry with exponential backoff, max 5 seconds
      setTimeout(connect, Math.min(5000, 1000 * retryCount));
    };

    ws.onerror = (e) => {
      console.log("[Multiplayer] WebSocket Error", e);
      setStatus('ERROR', '#ef4444');
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

    // Spawn the ghost car if it doesn't exist yet
    if (!ghostCar) {
      ghostCar = carGroup.userData.base.clone();
      ghostCar.traverse((node) => {
        if (node.isMesh && node.material) {
          node.material = node.material.clone();
          node.material.transparent = true;
          node.material.opacity = 0.6; // Ghostly look
        }
      });
      const wrap = new THREE.Group();
      wrap.name = "__r52_ghost_global";
      wrap.add(ghostCar);
      sc.add(wrap);
      ghostCar = wrap;
    }

    // Send our position to the room
    ws.send(JSON.stringify({
      type: 'pos',
      room: roomCode,
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
    if (timeoutId) clearTimeout(timeoutId);
    if (ws) ws.close();
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
    delete window.__r52_globalMulti;
    console.log("[Mod] Global Multiplayer disconnected.");
  };
})();