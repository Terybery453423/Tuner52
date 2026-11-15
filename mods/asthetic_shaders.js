// == Aesthetic Shaders (Overlay) ==
(function(){
  if (window.__r52_shaderOverlay) return;
  window.__r52_shaderOverlay = true;

  const mode = localStorage.getItem('r52_opt_aesthetic_shaders') || 'Sunrays & Bloom';
  if (mode === 'None') return;

  // Wait for the game canvas to exist
  const waitCanvas = setInterval(() => {
    const gameCanvas = document.querySelector('canvas');
    if (!gameCanvas) return;
    clearInterval(waitCanvas);
    initShader(gameCanvas);
  }, 500);

  function initShader(gameCanvas) {
    // 1. Create our transparent overlay canvas
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9999;';
    document.body.appendChild(overlayCanvas);

    // 2. Set up a separate Three.js renderer for the overlay
    const renderer = new THREE.WebGLRenderer({ canvas: overlayCanvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Keep it fast

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // 3. Turn the game's canvas into a texture we can sample
    const texture = new THREE.CanvasTexture(gameCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    let modeInt = 0;
    if (mode === 'Cyberpunk') modeInt = 1;
    if (mode === 'VHS / Retro') modeInt = 2;

    // 4. The Shader Code (Sunrays, Bloom, Aberration)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: texture },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMode: { value: modeInt }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform int uMode;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          vec4 color = texture2D(tDiffuse, uv);
          vec3 finalColor = color.rgb;

          // Sunrays & Bloom
          if (uMode == 0) {
            // Radially blur bright spots towards the "sun"
            vec2 lightPos = vec2(0.5, 0.7); // Adjust if the sun is in a different spot
            vec2 deltaTex = (uv - lightPos) * 0.08;
            vec2 texCoord = uv;
            vec4 rayColor = vec4(0.0);
            
            for(int i=0; i<8; i++) {
              texCoord -= deltaTex;
              vec4 sample = texture2D(tDiffuse, texCoord);
              float brightness = max(sample.r, max(sample.g, sample.b));
              // Only pick up really bright spots (like the sky)
              rayColor += sample * smoothstep(0.8, 1.0, brightness);
            }
            rayColor /= 8.0;
            
            finalColor += rayColor.rgb * 1.5; // Add rays
            
            // Cinematic Vignette
            float dist = distance(vUv, vec2(0.5));
            finalColor *= smoothstep(0.8, 0.4, dist);
          }
          
          // Cyberpunk (Chromatic Aberration)
          else if (uMode == 1) {
            float r = texture2D(tDiffuse, uv + vec2(0.004, 0.0)).r;
            float g = color.g;
            float b = texture2D(tDiffuse, uv - vec2(0.004, 0.0)).b;
            finalColor = vec3(r, g, b);
            
            // Color grade (Magenta/Cyan tint)
            finalColor = mix(finalColor, finalColor * vec3(0.8, 0.9, 1.5), 0.5);
            finalColor = mix(finalColor, finalColor * vec3(1.5, 0.8, 1.2), max(0.0, finalColor.r - 0.5));
            finalColor = pow(finalColor, vec3(1.2));
          }
          
          // VHS / Retro
          else if (uMode == 2) {
            float jitter = (sin(uv.y * 10.0 + uTime * 5.0) * 0.5 + 0.5 - 0.5) * 0.01;
            vec2 jitterUv = vec2(uv.x + jitter, uv.y);
            float scanline = sin(uv.y * uResolution.y * 1.5) * 0.04;
            finalColor = texture2D(tDiffuse, jitterUv).rgb - scanline;
            finalColor.r = texture2D(tDiffuse, jitterUv + vec2(0.002, 0.0)).r;
            finalColor.b = texture2D(tDiffuse, jitterUv - vec2(0.002, 0.0)).b;
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // 5. The Render Loop
    let animationId;
    function animate(time) {
      animationId = requestAnimationFrame(animate);
      
      if (!gameCanvas.width || !gameCanvas.height) return;
      
      // Handle window resize
      if (overlayCanvas.width !== window.innerWidth || overlayCanvas.height !== window.innerHeight) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }

      // Update the texture with the latest game frame
      texture.needsUpdate = true;
      material.uniforms.uTime.value = time * 0.001;

      // Draw the shader on top
      renderer.render(scene, camera);
    }
    animate();

    // 6. Cleanup (Restores normal view)
    window.__r52ModCleanup = window.__r52ModCleanup || {};
    window.__r52ModCleanup['aesthetic_shaders'] = function() {
      cancelAnimationFrame(animationId);
      if (overlayCanvas.parentNode) overlayCanvas.parentNode.removeChild(overlayCanvas);
      renderer.dispose();
      material.dispose();
      texture.dispose();
      delete window.__r52_shaderOverlay;
    };
  }
})();