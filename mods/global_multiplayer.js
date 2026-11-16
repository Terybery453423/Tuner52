// == Global Multiplayer (P2P via MQTT) ==
(function(){
  if (window.__r52_globalMulti) return;
  window.__r52_globalMulti = true;

  // Ask for a room code. If left blank, they join the global lobby.
  const input = prompt("Enter Room Code (leave blank to join the Global Lobby):");
  const roomCode = input && input.trim() !== "" ? input.trim() : "global";
  const topic = `tuner52_multiplayer/${roomCode}`;
  
  console.log(`[Mod] Connecting to room: ${topic}...`);

  // Load the MQTT library dynamically via CDN
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/mqtt/dist/mqtt.min.js';
  script.onload = () => {
    // Connect to HiveMQ's free public WebSocket broker
    const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
    let ghostCar = null;
    let lastSend = 0;
    let intervalId = null;

    // Create a small UI indicator
    const ui = document.createElement('div');
    ui.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.7); color:#00ffcc; padding:8px 12px; border-radius:6px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid #00ffcc;';
    ui.textContent = `🌐 MULTIPLAYER: ${roomCode.toUpperCase()}`;
    document.body.appendChild(ui);

    client.on('connect', () => {
      console.log("[Mod] Connected to Multiplayer Server!");
      client.subscribe(topic);
      
      intervalId = setInterval(() => {
        const now = Date.now();
        if (now - lastSend < 50) return; // 20 updates per second max
        lastSend = now;

        // Find the game scene and player car
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

        // Spawn the ghost car if we haven't yet
        if (!ghostCar) {
          ghostCar = carGroup.userData.base.clone();
          ghostCar.traverse((node) => {
            if (node.isMesh && node.material) {
              node.material = node.material.clone();
              node.material.transparent = true;
              node.material.opacity = 0.5; // Make it a ghost
            }
          });
          const wrap = new THREE.Group();
          wrap.name = "__r52_ghost_global";
          wrap.add(ghostCar);
          sc.add(wrap);
          ghostCar = wrap;
        }

        // Broadcast our position
        client.publish(topic, JSON.stringify({
          x: carGroup.position.x,
          y: carGroup.position.y,
          z: carGroup.position.z,
          rx: carGroup.rotation.x,
          ry: carGroup.rotation.y,
          rz: carGroup.rotation.z
        }));
      }, 20);
    });

    // Receive other player's position
    client.on('message', (t, message) => {
      if (t === topic && ghostCar) {
        try {
          const data = JSON.parse(message.toString());
          
          // Smooth interpolation (lerp) to hide the 100-200ms lag
          ghostCar.position.lerp(new THREE.Vector3(data.x, data.y, data.z), 0.3);
          
          // Smooth rotation
          ghostCar.rotation.x += (data.rx - ghostCar.rotation.x) * 0.3;
          ghostCar.rotation.y += (data.ry - ghostCar.rotation.y) * 0.3;
          ghostCar.rotation.z += (data.rz - ghostCar.rotation.z) * 0.3;
        } catch(e) {}
      }
    });

    window.__r52ModCleanup = window.__r52ModCleanup || {};
    window.__r52ModCleanup['global_multiplayer'] = function() {
      clearInterval(intervalId);
      client.end();
      if (ui.parentNode) ui.parentNode.removeChild(ui);
      if (ghostCar && ghostCar.parent) ghostCar.parent.remove(ghostCar);
      delete window.__r52_globalMulti;
      console.log("[Mod] Global Multiplayer disconnected.");
    };
  };
  document.head.appendChild(script);
})();