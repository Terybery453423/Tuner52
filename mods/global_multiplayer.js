// == Global Multiplayer (Claude's Bridge) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Using Postman echo just to test the bridge
  const WS_URL = 'wss://ws.postman-echo.com/raw'; 
  
  let ghostCar = null;
  let lastSend = 0;
  let sendInterval = null;

  // --- UI STATUS ELEMENT ---
  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.8); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
  document.body.appendChild(ui);
  function setStatus(txt, color = '#00ffcc') {
    ui.textContent = '🌐 ' + txt;
    ui.style.color = color;
    ui.style.borderColor = color;
  }
  setStatus('CONNECTING...');

  // --- CLAUDE'S NET BRIDGE ---
  const Net = (() => {
    const handlers = {};
    const toHub = (t, d = '') =>
      window.dispatchEvent(new CustomEvent('r52-to-hub', { detail: JSON.stringify({ t, d }) }));
    window.addEventListener('r52-to-page', (e) => {
      let m;
      try { m = JSON.parse(e.detail); } catch (_) { return; }
      (handlers[m.t] || []).forEach((fn) => fn(m.d));
    });
    return {
      on: (t, fn) => (handlers[t] = handlers[t] || []).push(fn),
      connect: (url) => toHub('connect', url),
      send: (obj) => toHub('send', JSON.stringify(obj)),
      close: () => toHub('close'),
      ping: () => toHub('ping'),
    };
  })();

  let retry = 0;
  function startNet() {
    let tries = 0, ready = false;
    const iv = setInterval(() => {
      if (ready) return clearInterval(iv);
      if (++tries > 25) { clearInterval(iv); setStatus('HUB NOT FOUND', '#ef4444'); return; }
      Net.ping();
    }, 400);
    Net.on('pong', () => {
      if (ready) return;
      ready = true;
      clearInterval(iv);
      Net.connect(WS_URL);
    });
  }

  Net.on('open', () => {
    retry = 0;
    setStatus('ONLINE', '#4ade80');
    
    // Start sending our position
    if (sendInterval) clearInterval(sendInterval);
    sendInterval = setInterval(() => {
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

      Net.send({
        x: carGroup.position.x,
        y: carGroup.position.y,
        z: carGroup.position.z,
        rx: carGroup.rotation.x,
        ry: carGroup.rotation.y,
        rz: carGroup.rotation.z
      });
    }, 50);
  });

  Net.on('message', (data) => {
    if (ghostCar) {
      try {
        const p = JSON.parse(data);
        ghostCar.position.lerp(new THREE.Vector3(p.x, p.y, p.z), 0.3);
        ghostCar.rotation.x += (p.rx - ghostCar.rotation.x) * 0.3;
        ghostCar.rotation.y += (p.ry - ghostCar.rotation.y) * 0.3;
        ghostCar.rotation.z += (p.rz - ghostCar.rotation.z) * 0.3;
      } catch(e) {}
    }
  });

  Net.on('error', (why) => setStatus('ERROR: ' + why, '#ef4444'));
  Net.on('close', () => {
    setStatus('RECONNECTING...', '#fbbf24');
    if (sendInterval) clearInterval(sendInterval);
    setTimeout(() => Net.connect(WS_URL), Math.min(10000, 1000 * ++retry));
  });

  startNet();

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['global_multiplayer'] = function() {
    if (sendInterval) clearInterval(sendInterval);
    Net.close();
    if (ui.parentNode) ui.parentNode.removeChild(ui);
    if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
    delete window.__r52_globalMulti;
    console.log("[Mod] Global Multiplayer disconnected.");
  };
})();