// == Universal Theme Swapper ==
(function(){
  if (window.__r52_themeSwapper) return;
  window.__r52_themeSwapper = true;

  const selectedTheme = localStorage.getItem('r52_opt_theme_swapper') || 'None';
  if (selectedTheme === 'None') return;

  const style = document.createElement('style');
  style.id = 'r52_theme_style';

  const THEMES = {
    "OLED": `
      body, .optbox, #opts, .oBody, .sRow, .orow { background-color: #000000 !important; color: #ffffff !important; }
      .mi.sel, .btn, button, .sTog.on, .sSeg button.on { background-color: #333333 !important; color: #fff !important; border-color: #555 !important; box-shadow: none !important; }
      .mi { color: #888 !important; background-color: transparent !important; border: 1px solid #222 !important; }
      h2, h3, .sTxt, .orow span { color: #fff !important; }
      .oHead, .sRow, .orow, .oBody { border-color: #222 !important; }
      #r52_mods_ui > div, #r52_modal_content > div { background-color: #111 !important; border-color: #222 !important; }
      #r52_mods_btn, #r52_fixes_btn { color: #888 !important; border-color: #333 !important; }
      #r52_mods_btn.sel, #r52_fixes_btn.sel { color: #fff !important; background-color: #333 !important; box-shadow: none !important; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #000; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    `,
    "Crimson": `
      body, .optbox, #opts, .oBody, .sRow, .orow { background-color: #1a0505 !important; color: #ffcccc !important; }
      .mi.sel, .btn, button, .sTog.on, .sSeg button.on { background-color: #991b1b !important; color: #fff !important; border-color: #ef4444 !important; box-shadow: 0 0 10px rgba(239, 68, 68, 0.4) !important; }
      button:hover, .btn:hover, .mi:hover { background-color: #dc2626 !important; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6) !important; }
      .mi { color: #fca5a5 !important; background-color: transparent !important; border: 1px solid #7f1d1d !important; }
      h2, h3, .sTxt, .orow span { color: #fca5a5 !important; text-shadow: 0 0 5px rgba(252, 165, 165, 0.3) !important; }
      .oHead, .sRow, .orow, .oBody { border-color: #7f1d1d !important; }
      #r52_mods_ui > div, #r52_modal_content > div { background-color: #2a0a0a !important; border-color: #7f1d1d !important; }
      #r52_mods_btn, #r52_fixes_btn { color: #fca5a5 !important; border-color: #991b1b !important; }
      #r52_mods_btn.sel, #r52_fixes_btn.sel { color: #fff !important; background-color: #991b1b !important; box-shadow: 0 0 15px rgba(153, 27, 27, 0.8) !important; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1a0505; } ::-webkit-scrollbar-thumb { background: #991b1b; border-radius: 4px; }
    `,
    "Synthwave": `
      body, .optbox, #opts, .oBody, .sRow, .orow { background-color: #0b0914 !important; color: #e0b0ff !important; }
      .mi.sel, .btn, button, .sTog.on, .sSeg button.on { background-color: #d946ef !important; color: #fff !important; border-color: #f0abfc !important; box-shadow: 0 0 10px rgba(217, 70, 239, 0.5) !important; }
      button:hover, .btn:hover, .mi:hover { background-color: #e879f9 !important; box-shadow: 0 0 15px rgba(232, 121, 249, 0.7) !important; }
      .mi { color: #f0abfc !important; background-color: transparent !important; border: 1px solid #701a75 !important; }
      h2, h3, .sTxt, .orow span { color: #67e8f9 !important; text-shadow: 0 0 5px rgba(103, 232, 249, 0.5) !important; }
      .oHead, .sRow, .orow, .oBody { border-color: #701a75 !important; }
      #r52_mods_ui > div, #r52_modal_content > div { background-color: #1a103c !important; border-color: #701a75 !important; }
      #r52_mods_btn, #r52_fixes_btn { color: #f0abfc !important; border-color: #d946ef !important; }
      #r52_mods_btn.sel, #r52_fixes_btn.sel { color: #fff !important; background-color: #d946ef !important; box-shadow: 0 0 15px rgba(217, 70, 239, 0.8) !important; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #0b0914; } ::-webkit-scrollbar-thumb { background: #d946ef; border-radius: 4px; }
    `,
    "Amethyst": `
      body, .optbox, #opts, .oBody, .sRow, .orow { background-color: #12091c !important; color: #e9d5ff !important; }
      .mi.sel, .btn, button, .sTog.on, .sSeg button.on { background-color: #7c3aed !important; color: #ffffff !important; border-color: #a78bfa !important; box-shadow: 0 0 10px rgba(124, 58, 237, 0.4) !important; }
      button:hover, .btn:hover, .mi:hover { background-color: #8b5cf6 !important; box-shadow: 0 0 15px rgba(139, 92, 246, 0.6) !important; }
      .mi { color: #a78bfa !important; background-color: transparent !important; border: 1px solid #3b0764 !important; }
      h2, h3, .sTxt, .orow span { color: #d8b4fe !important; text-shadow: 0 0 5px rgba(216, 180, 254, 0.3) !important; }
      .oHead, .sRow, .orow, .oBody { border-color: #4c1d95 !important; }
      #r52_mods_ui > div, #r52_modal_content > div { background-color: #1e1032 !important; border-color: #4c1d95 !important; }
      #r52_mods_btn, #r52_fixes_btn { color: #d8b4fe !important; border-color: #7c3aed !important; }
      #r52_mods_btn.sel, #r52_fixes_btn.sel { color: #fff !important; background-color: #7c3aed !important; box-shadow: 0 0 15px rgba(124, 58, 237, 0.8) !important; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #12091c; } ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 4px; }
    `
  };

  if (THEMES[selectedTheme]) {
    style.textContent = THEMES[selectedTheme];
    document.head.appendChild(style);
  }

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['theme_swapper'] = function() {
    if (style.parentNode) style.parentNode.removeChild(style);
    delete window.__r52_themeSwapper;
  };
})();