// == Universal Car Swapper ==
(function(){
  if (window.__r52_carSwapper) return;
  window.__r52_carSwapper = true;

  const selectedCar = localStorage.getItem('r52_opt_car_swapper') || 'None';
  if (selectedCar === 'None') return;

  console.log("[Mod] Car Swapper loading: " + selectedCar);

  // EXACT VALUES PULLED FROM YOUR STANDALONE SCRIPTS
  const CARS = {
    "Red Bull RB16": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/rb16.glb',
      rotX: 0.0000, rotY: 0.0000, rotZ: 0.0000,
      k: 16.65, x: 40359.93, y: -2456.30, z: 21229.67
    },
    "Krabby Patty": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/krabby_patty.glb',
      rotX: 0.0000, rotY: -1.5708, rotZ: 0.0000,
      k: 96.92, x: 21.48, y: 42.59, z: -1.22
    },
    "Trackmania Car": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/tmnf_car.glb',
      rotX: -0.1916, rotY: 0.59, rotZ: 0.1084,
      k: 94.70, x: -19.53, y: 43.00, z: 365.90
    },
    "Lamborghini Huracan": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/huracan_itasha.glb',
      rotX: 0.0000, rotY: 0.0000, rotZ: 0.0000,
      k: 100, x: 0, y: 0, z: 0
    },
    "Aston Safety Car": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/aston_safety.glb',
      rotX: 0.0000, rotY: 0.0000, rotZ: 0.0000,
      k: 100, x: 0, y: 0, z: 0
    },
    // Bridge uses a dynamic calculation in its original script, 
    // these are the base multipliers it uses:
    "Golden Gate Bridge": {
      url: 'https://cdn.jsdelivr.net/gh/Terybery453423/Tuner52@main/custom_cars/Golden_Gate_Bridge.glb',
      rotX: 5 * Math.PI / 180, rotY: -Math.PI * 0.75, rotZ: 0,
      k: null, x: 0, y: null, z: 0, // 'null' triggers the dynamic bridge logic below
      bridgeScaleMul: 100.0,
      bridgeYOffset: -12
    }
  };

  const config = CARS[selectedCar];
  if (!config) return;

  // ... (rest of the script remains exactly the same) ...

  // Inside the interval loop, you'll need to add this check to handle the bridge:
  // (This replaces the standard model.scale.set and position.set logic)
  
  /*
  if (config.k === null) {
    // DYNAMIC BRIDGE LOGIC
    var origBox = new THREE.Box3().setFromObject(scaled);
    var origSize = origBox.getSize(new THREE.Vector3());
    var origLongest = Math.max(origSize.x, origSize.y, origSize.z);
    
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    var longest = Math.max(size.x, size.y, size.z) || 1;
    
    var baseK = (origLongest / 0.01) / longest;
    var k = baseK * config.bridgeScaleMul;
    
    model.scale.set(k, k, k);
    
    var box2 = new THREE.Box3().setFromObject(model);
    var center = box2.getCenter(new THREE.Vector3());
    
    model.position.set(-center.x, -box2.min.y + config.bridgeYOffset, -center.z);
  } else {
    // STANDARD LOGIC (for all other cars)
    model.scale.set(config.k, config.k, config.k);
    model.position.set(config.x, config.y, config.z);
  }
  */

})();