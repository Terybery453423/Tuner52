// == PacenotePal Co-Driver Mod ==
(function(){
  if (window.__r52_codriver) return;
  window.__r52_codriver = true;

  // Read the selected language from the Hub, default to English
  const langSetting = localStorage.getItem('r52_opt_codriver') || 'English';
  const safeLang = encodeURIComponent(langSetting); // Turns "English Woman" into "English%20Woman"
  const AUDIO_BASE = `https://cdn.jsdelivr.net/gh/Koenvh1/PacenotePal@main/voices/${safeLang}/`;

  console.log(`[Mod] PacenotePal Co-Driver loading (Language: ${langSetting})...`);

  let audioUnlocked = false;
  let isPreloading = false;
  const audioCache = {};

  // 1. Create the Start Button
  const btn = document.createElement('button');
  btn.textContent = '🎙️ START CO-DRIVER';
  btn.style.cssText = 'position:fixed;bottom:150px;left:10px;z-index:9999;padding:12px 16px;background:#fbbf24;color:#000;font:bold 12px monospace;border-radius:8px;border:2px solid #fff;cursor:pointer;box-shadow:0 4px 6px rgba(0,0,0,0.5);';
  
  btn.onclick = () => {
    if (isPreloading) return;
    isPreloading = true;
    btn.textContent = '⏳ UNLOCKING...';
    
    const silentAudio = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
    const silent = new Audio(silentAudio);
    
    silent.play().then(() => {
      audioUnlocked = true;
      preloadAudio();
    }).catch(err => {
      btn.textContent = '❌ UNLOCK FAILED';
      btn.style.background = '#ef4444';
      isPreloading = false;
    });
  };
  document.body.appendChild(btn);

  // 2. Fetch via Hub API and convert to Base64
  function fetchAndCache(filename, callback) {
    if (audioCache[filename]) return callback();

    if (!window.__r52DownloadFile) {
      console.warn("[Mod] Hub API missing. Cannot load audio.");
      return callback();
    }

    window.__r52DownloadFile(AUDIO_BASE + filename, filename, function(blobUrl) {
      fetch(blobUrl)
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            audioCache[filename] = reader.result;
            callback();
          };
          reader.readAsDataURL(blob);
        })
        .catch(e => {
          console.warn("[Mod] Failed to convert audio:", filename, e);
          callback();
        });
    }, function(err) {
      console.warn("[Mod] Hub failed to download:", filename, err);
      callback();
    });
  }

  // 3. Preload Base Files
  function preloadAudio() {
    const baseFiles = [
      'Left1.wav', 'Left2.wav', 'Left3.wav', 'Left4.wav', 'Left5.wav', 'Left6.wav',
      'Right1.wav', 'Right2.wav', 'Right3.wav', 'Right4.wav', 'Right5.wav', 'Right6.wav',
      'LeftHP.wav', 'RightHP.wav', 'LeftSquare.wav', 'RightSquare.wav', 
      'Jump.wav', 'Finish.wav', 'Dip.wav', 'Crest.wav',
      'DontCut.wav', 'Tightens.wav', 'Opens.wav', 'Caution.wav'
    ];
    
    let loadedCount = 0;
    const total = baseFiles.length;

    const updateProgress = () => {
      btn.textContent = `⏳ PRELOADING ${loadedCount}/${total}...`;
      if (loadedCount >= total) {
        btn.textContent = '🎙️ CO-DRIVER READY';
        btn.style.background = '#4ade80';
        setTimeout(() => { btn.style.display = 'none'; }, 1500);
      }
    };

    const downloadNext = (index) => {
      if (index >= total) {
        updateProgress();
        return;
      }
      fetchAndCache(baseFiles[index], () => {
        loadedCount++;
        updateProgress();
        setTimeout(() => downloadNext(index + 1), 50);
      });
    };
    
    downloadNext(0);
  }

  // 4. Parse the Label and Build the Filename
  function getFilename(label) {
    let mods = [];
    
    if (label.includes('_EXCL')) mods.push('Caution');
    if (label.includes('_OPEN')) mods.push('Opens');
    if (label.includes('_TIGHT')) mods.push('Tightens');
    if (label.includes('_DC')) mods.push('DontCut');
    
    let base = label.replace(/_EXCL|_OPEN|_TIGHT|_DC|_PLUS|_BUMP/g, '');
    base = base.replace(/_+/g, '_').replace(/^_|_$/g, '').trim();

    let baseStr = '';
    if (base.includes(' ')) {
      const parts = base.split(' ');
      const dir = parts[0] === 'L' ? 'Left' : 'Right';
      let type = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      if (type === 'Hairpin') type = 'HP';
      baseStr = dir + type;
    } else if (base === 'JUMP' || base === 'JMP') {
      baseStr = 'Jump';
    } else if (base === 'DIP') {
      baseStr = 'Dip';
    } else if (base === 'CREST') {
      baseStr = 'Crest';
    } else if (base === 'FINISH') {
      baseStr = 'Finish';
    } else if (base.length > 1) {
      baseStr = (base.charAt(0) === 'L' ? 'Left' : 'Right') + base.substring(1);
    } else {
      baseStr = base.charAt(0).toUpperCase() + base.substring(1).toLowerCase();
    }

    const specialCorners = ['HP', 'Square', 'Jump', 'Finish', 'Dip', 'Crest'];
    if (specialCorners.some(s => baseStr.includes(s))) mods = []; 

    let filename = baseStr;
    if (mods.length > 0) filename += '-' + mods.join('-');
    
    return { base: baseStr + '.wav', full: filename + '.wav' };
  }

  // 5. Play Audio
  function playAudio(filenameObj) {
    const fullFilename = filenameObj.full;
    const baseFilename = filenameObj.base;

    if (audioCache[fullFilename]) {
      new Audio(audioCache[fullFilename]).play().catch(e => {});
      return;
    }

    if (audioCache[baseFilename]) {
      new Audio(audioCache[baseFilename]).play().catch(e => {});
      
      if (fullFilename !== baseFilename) {
        fetchAndCache(fullFilename, () => {}); 
      }
      return;
    }

    fetchAndCache(baseFilename, () => {
      if (audioCache[baseFilename]) {
        new Audio(audioCache[baseFilename]).play().catch(e => {});
      }
    });
  }

  // 6. Watch Game for Callouts
  const checkInterval = setInterval(() => {
    if (!audioUnlocked) return;
    if (typeof state !== 'undefined' && state !== 'race' && state !== 'count') return;

    const pnContainer = document.getElementById('pn');
    if (!pnContainer) return;

    const arrows = pnContainer.querySelectorAll('.pnC');
    let activeArrow = null;

    arrows.forEach(arrow => {
      if (arrow.style.zIndex === '10' || arrow.style.transform.includes('scale(1)')) {
        activeArrow = arrow;
      }
    });

    if (activeArrow) {
      let currentLabel = activeArrow.getAttribute('aria-label') || "";
      let svgCode = activeArrow.innerHTML;

      if (svgCode.includes('M12.5 10V20')) currentLabel += '_DC';
      if (svgCode.includes('M14 43V57')) currentLabel += '_PLUS';
      if (svgCode.includes('M110 43l-7 7 7 7')) currentLabel += '_TIGHT';
      if (svgCode.includes('M102 43l7 7-7 7')) currentLabel += '_OPEN';
      if (svgCode.includes('M100 9V15.5')) currentLabel += '_EXCL';
      if (svgCode.includes('M93 89Q100 78 107 89')) currentLabel += '_BUMP';

      if (activeArrow.dataset.r52label !== currentLabel) {
        activeArrow.dataset.r52label = currentLabel;
        activeArrow.dataset.r52played = 'false';
      }

      if (activeArrow.dataset.r52played !== 'true') {
        activeArrow.dataset.r52played = 'true';
        const filenameObj = getFilename(currentLabel);
        playAudio(filenameObj);
      }
    }
  }, 50);

  // --- CLEANUP ---
  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['codriver'] = function() {
    clearInterval(checkInterval);
    if (btn.parentNode) btn.parentNode.removeChild(btn);
    delete window.__r52_codriver;
    console.log("[Mod] PacenotePal Co-Driver cleaned up.");
  };
})();