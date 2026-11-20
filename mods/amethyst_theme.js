// == Amethyst Theme ==
(function(){
  if (window.__r52_amethystTheme) return;
  window.__r52_amethystTheme = true;

  const style = document.createElement('style');
  style.id = 'r52_amethyst_style';
  style.textContent = `
    /* Base Backgrounds */
    body, .optbox, #opts, .oBody, .sRow, .orow {
      background-color: #12091c !important;
      color: #e9d5ff !important;
    }

    /* Primary Accents (Buttons, Highlights) */
    .mi.sel, .btn, button, .sTog.on, .sSeg button.on {
      background-color: #7c3aed !important;
      color: #ffffff !important;
      border-color: #a78bfa !important;
      box-shadow: 0 0 10px rgba(124, 58, 237, 0.4) !important;
    }

    /* Hover States */
    button:hover, .btn:hover, .mi:hover {
      background-color: #8b5cf6 !important;
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.6) !important;
    }

    /* Inactive Tabs */
    .mi {
      color: #a78bfa !important;
      background-color: transparent !important;
      border: 1px solid #3b0764 !important;
    }

    /* Text & Borders */
    h2, h3, .sTxt, .orow span {
      color: #d8b4fe !important;
      text-shadow: 0 0 5px rgba(216, 180, 254, 0.3) !important;
    }

    .oHead, .sRow, .orow, .oBody {
      border-color: #4c1d95 !important;
    }

    /* Custom Mod Store Styling */
    #r52_mods_ui > div, #r52_modal_content > div {
      background-color: #1e1032 !important;
      border-color: #4c1d95 !important;
    }

    /* Custom Hub Buttons */
    #r52_mods_btn, #r52_fixes_btn {
      color: #d8b4fe !important;
      border-color: #7c3aed !important;
    }
    
    #r52_mods_btn.sel, #r52_fixes_btn.sel {
      color: #fff !important;
      background-color: #7c3aed !important;
      box-shadow: 0 0 15px rgba(124, 58, 237, 0.8) !important;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #12091c; }
    ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #a78bfa; }
  `;
  document.head.appendChild(style);

  window.__r52ModCleanup = window.__r52ModCleanup || {};
  window.__r52ModCleanup['amethyst_theme'] = function() {
    if (style.parentNode) style.parentNode.removeChild(style);
    delete window.__r52_amethystTheme;
  };
})();