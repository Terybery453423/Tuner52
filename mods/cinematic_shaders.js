// == Cinematic Shaders Mod ==
(function(){
  if (window.__r52_cinematic) return;
  window.__r52_cinematic = true;

  const selectedEffect = localStorage.getItem('r52_opt_cinematic_shaders') || 'Sunrays & Bloom';
  if (selectedEffect === 'None') return;

  let renderer = null;
  let renderTarget = null;
  let postScene = null;
  let postCamera = null;
  let postMaterial = null;
  let originalRender = null;
  let originalSetSize = null;
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Wait for THREE and the renderer to exist
  const initInterval = setInterval(() => {
    if (!window.THREE) return;
    
    // Trick to capture the renderer instance: wrap the render function
    if (!window.__r52_hijackedRenderer) {
      window.__r52_hijackedRenderer = true;
      const originalProtoRender = THREE.WebGLRenderer.prototype.render;
      THREE.WebGLRenderer.prototype.render = function(scene, camera) {
        if (!window.__r52_renderer) {
          window.__r52_renderer = this;
        }
        return originalProtoRender.apply(this, arguments);
      };
    }

    if (window.__r52_renderer) {
      clearInterval(initInterval);
      setupPostProcessing(window.__r52_renderer);
    }
  }, 500);

  function setupPostProcessing(rend) {
    renderer = rend;
    
    // Get actual renderer size
    const canvas = renderer.domElement;
    width = canvas.width;
    height = canvas.height;

    renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    postScene = new THREE.Scene();
    postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Custom Shader Code
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform int uMode;
      varying vec2 vUv;

      // Pseudo-random for noise
      float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        vec4 color = texture2D(tDiffuse, uv);
        vec3 finalColor = color.rgb;

        // 1. Sunrays & Bloom (Mode 0)
        if (uMode == 0) {
          // Screen-space Sunrays centered at 0.5, 0.7 (sky)
          vec2 lightPos = vec2(0.5, 0.7);
          vec2 deltaTex = (uv - lightPos) * 0.05;
          vec2 texCoord = uv;
          vec4 rayColor = vec4(0.0);
          
          for(int i=0; i<8; i++) {
            texCoord -= deltaTex;
            vec4 sample = texture2D(tDiffuse, texCoord);
            float brightness = max(sample.r, max(sample.g, sample.b));
            // Only pick up bright spots (sky/sun)
            rayColor += sample * smoothstep(0.7, 1.0, brightness);
          }
          rayColor /= 8.0;
          
          // Add rays to final color
          finalColor += rayColor.rgb * 0.8;
          
          // Slight vignette
          float dist = distance(vUv, vec2(0.5));
          finalColor *= smoothstep(0.8, 0.4, dist);
        }
        
        // 2. Cyberpunk (Mode 1)
        else if (uMode == 1) {
          // Chromatic Aberration
          float r = texture2D(tDiffuse, uv + vec2(0.004, 0.0)).r;
          float g = color.g;
          float b = texture2D(tDiffuse, uv - vec2(0.004, 0.0)).b;
          finalColor = vec3(r, g, b);
          
          // Color grading (Blue/Cyan shadows, Magenta highlights)
          finalColor = mix(finalColor, finalColor * vec3(0.8, 0.9, 1.5), 0.5); // Blue tint
          finalColor = mix(finalColor, finalColor * vec3(1.5, 0.8, 1.2), max(0.0, finalColor.r - 0.5)); // Magenta highlights
          
          // High contrast
          finalColor = pow(finalColor, vec3(1.2));
        }
        
        // 3. VHS / Retro (Mode 2)
        else if (uMode == 2) {
          // Horizontal jitter
          float jitter = (rand(vec2(uTime, uv.y)) - 0.5) * 0.01;
          vec2 jitterUv = vec2(uv.x + jitter, uv.y);
          
          // Scanlines
          float scanline = sin(uv.y * uResolution.y * 1.5) * 0.04;
          finalColor = texture2D(tDiffuse, jitterUv).rgb - scanline;
          
          // Color bleed
          finalColor.r = texture2D(tDiffuse, jitterUv + vec2(0.002, 0.0)).r;
          finalColor.b = texture2D(tDiffuse, jitterUv - vec2(0.002, 0.0)).b;
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    let modeInt = 0;
    if (selectedEffect === 'Cyberpunk') modeInt = 1;
    if (selectedEffect === 'VHS / Retro') modeInt = 2;

    postMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMode: { value: modeInt }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      depthTest: false,
      depthWrite: false
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
    postScene.add(quad);

    // Save original render and override it
    originalRender = renderer.render.bind(renderer);
    renderer.render = function(scene, camera) {
      if (!renderer || !renderTarget) return originalRender(scene, camera);
      
      postMaterial.uniforms.uTime.value = performance.now() / 1000;

      // 1. Render game to off-screen target
      renderer.setRenderTarget(renderTarget);
      originalRender(scene, camera);

      // 2. Render post-process quad to screen
      renderer.setRenderTarget(null);
      originalRender(postScene, postCamera);
    };

    // Handle resize
    originalSetSize = renderer.setSize.bind(renderer);
    renderer.setSize = function(w, h, updateStyle) {
      originalSetSize(w, h, updateStyle);
      if (renderTarget) {
        width = w; height = h;
        renderTarget.setSize(w, h);
        postMaterial.uniforms.uResolution.value.set(w, h);
      }
    };
  }

  // Cleanup
  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['cinematic_shaders'] = function() {
    clearInterval(initInterval);
    if (renderer) {
      if (originalRender) renderer.render = originalRender;
      if (originalSetSize) renderer.setSize = originalSetSize;
    }
    if (renderTarget) renderTarget.dispose();
    if (postMaterial) postMaterial.dispose();
    delete window.__r52_cinematic;
    delete window.__r52_renderer;
    delete window.__r52_hijackedRenderer;
  };
})();