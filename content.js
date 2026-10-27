(() => {
  if (window.__gonTikTokOverlay) return;
  window.__gonTikTokOverlay = true;

  const KEY = 'gon-tiktok-overlay';
  let state = { scale: 100, transparency: 0, open: false };

  // Độ trong suốt áp lên <body>; bảng điều khiển nằm ngoài <body> nên không bị mờ theo.
  const styleTag = document.createElement('style');
  document.documentElement.appendChild(styleTag);

  function apply() {
    const opacity = 1 - state.transparency / 100;
    styleTag.textContent = state.transparency > 0
      ? 'html{background:#000!important}body{opacity:' + opacity + '!important}'
      : '';
    try { chrome.runtime.sendMessage({ type: 'gon-set-zoom', factor: state.scale / 100 }); } catch {}
    // giữ bảng điều khiển luôn có kích thước đọc được dù trang đang thu nhỏ
    host.style.zoom = String(100 / state.scale);
  }
  function save() { try { chrome.storage.local.set({ [KEY]: state }); } catch {} }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:10px;top:10px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      *{box-sizing:border-box;font-family:system-ui,'Segoe UI',sans-serif}
      .fab{width:34px;height:34px;border:0;border-radius:50%;background:#000c;color:#fff;font-size:16px;cursor:pointer;box-shadow:0 4px 16px #0008;opacity:.55;transition:opacity .15s}
      .fab:hover,.wrap.open .fab{opacity:1}
      .wrap{display:flex;flex-direction:column-reverse;align-items:flex-end;gap:8px}
      .panel{display:none;width:230px;padding:12px 14px;border-radius:14px;background:#141413f2;color:#f4f2ed;border:1px solid #ffffff22;box-shadow:0 10px 30px #0009}
      .wrap.open .panel{display:block}
      .row{margin:0 0 10px}.row:last-child{margin:0}
      label{display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:5px}
      output{color:#c5c1b6;font-variant-numeric:tabular-nums}
      input[type=range]{width:100%;accent-color:#fb443b;cursor:pointer}
      small{display:block;margin-top:4px;color:#85837c;font-size:10.5px}
    </style>
    <div class="wrap" id="wrap">
      <div class="panel">
        <div class="row"><label for="scale"><span>Thu nhỏ màn hình</span><output id="scaleOut">100%</output></label>
          <input id="scale" type="range" min="40" max="100" step="5" value="100"></div>
        <div class="row"><label for="trans"><span>Độ trong suốt</span><output id="transOut">0%</output></label>
          <input id="trans" type="range" min="0" max="90" step="5" value="0">
          <small>0% là rõ nét · 90% gần như trong suốt</small></div>
      </div>
      <button class="fab" id="fab" title="Thu nhỏ / độ trong suốt (Gọn)" aria-label="Thu nhỏ và độ trong suốt">◐</button>
    </div>`;
  const $ = id => root.getElementById(id);

  function sync() {
    $('scale').value = state.scale; $('scaleOut').textContent = state.scale + '%';
    $('trans').value = state.transparency; $('transOut').textContent = state.transparency + '%';
    $('wrap').classList.toggle('open', state.open);
  }
  $('scale').addEventListener('input', e => { state.scale = Number(e.target.value); sync(); apply(); });
  $('trans').addEventListener('input', e => { state.transparency = Number(e.target.value); sync(); apply(); });
  $('scale').addEventListener('change', save);
  $('trans').addEventListener('change', save);
  $('fab').addEventListener('click', () => { state.open = !state.open; sync(); save(); });

  document.documentElement.appendChild(host);
  try {
    chrome.storage.local.get(KEY, data => { if (data?.[KEY]) state = { ...state, ...data[KEY] }; sync(); apply(); });
  } catch { sync(); apply(); }
})();
