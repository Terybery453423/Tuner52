# Tuner52 (RALLY52 Mod Hub)

An open-source mod hub for [RALLY52](https://rally52.com), the daily WebGL rally game. It injects a hidden menu into the game's Settings page via Tampermonkey and fetches mods, themes, and assets dynamically from this repo.

License: GPL-3.0 
Current Hub Version: 2.1.0

## Features

- Visual mods (car swaps, liveries, effect removers)
- Live-fetched co-driver pacenote audio with multiple language options
- Full UI theme replacements
- Gameplay tweaks and performance adjustments
- Multi-option mods (dropdown selection saved per-mod)
- Automatic update notices when a new Hub version is released
- Stealth unlock: menu is hidden until you tap "SETTINGS" 5 times

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open `mod_hub.txt` and copy the entire script.
3. Create a new Tampermonkey script and paste it in.
4. Save and visit [rally52.com](https://rally52.com).
5. Go to Settings and tap "SETTINGS" 5 times to reveal the Tuner52 tab.

## Usage

The hub adds two tabs to the Settings page.

### TUNER52

The mod store. Browse and install mods here. Installed mods appear under the ACTIVE sub-tab, where each one can be toggled on or off, have its UI hidden or shown, or be fully removed.

### FIXES

Diagnostic and recovery tools, including:

- Resetting the car model
- Fixing a stuck camera FOV
- Clearing local game data
- Full factory reset

## Store Categories

Mods in the store fall into a few broad categories:

- Car Models — custom vehicles ranging from open-wheelers to meme cars
- Cosmetics — paint jobs, hitbox viewers, effect removers
- Audio — live pacenote co-driver with selectable language
- Themes — full UI reskins

## For Mod Developers

Mods follow a simple lifecycle contract. Every mod should guard against double-loading and register a cleanup function so it can be uninstalled cleanly.

```javascript
(function(){
  if (window.__my_mod_id) return;
  window.__my_mod_id = true;

  // Mod logic here.

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['my_mod_id'] = function() {
    // Undo DOM changes, clear intervals, delete flags.
    delete window.__my_mod_id;
  };
})();
```

### Hub API

The hub injects the following APIs into the page context for mods to use:

- `window.__r52DownloadFile(url, name, onSuccess, onError)` — download a file through Tampermonkey (bypasses CSP). Returns a Blob URL.
- `window.__r52ModUIToggles[id]` — register a visibility callback so the hub can hide or show your mod's UI.
- `window.__r52ApplyUIToggle(id, visible)` — called by the hub to apply a visibility state.
- `window.__r52ModCleanup[id]` — register your teardown function.

### Mod Options

A mod can expose a dropdown in the store by adding an `options` array to its entry in `store.json`:

```json
  {
  "id": "my_mod",
  "name": "My Mod",
  "desc": "Does something useful.",
  "author": "your_name",
  "options": ["Option A", "Option B", "Option C"],
  "url": "https://raw.githubusercontent.com/.../my_mod.js"
  }, 
```

The hub renders this as a `<select>` element. The user's choice is saved to `localStorage` under `r52_opt_<mod_id>`. Read it at startup:

```javascript
const choice = localStorage.getItem('r52_opt_my_mod') || 'Option A';
```

## Updating the Hub

When a newer Hub version is available, the TUNER52 tab shows an update banner. Click it to copy the latest script, then paste it into your Tampermonkey editor and save. Mods do not need updating — they are always fetched fresh from GitHub.

## Notes

- Performance buff mods should not be stacked. Enable one at a time.
- Some mods (such as extra tries) are not leaderboard-safe. This is called out in their store descriptions.
- The game enforces a strict Content Security Policy. External audio and video must be converted to Base64 data URIs. See `codriver.js` for a reference implementation.

## License

GPL-3.0. Free to use, modify, and redistribute under the same terms.

## Credits

- Hub and mods: [@Terybery453423](https://github.com/Terybery453423) (aka me) 
- Pacenote audio: [PacenotePal](https://github.com/Koenvh1/PacenotePal) by Koenvh1
- Game: RALLY52 by its respective developers

Not affiliated with RALLY52. Use at your own risk.