// Trang "bệ phóng": https://www.tiktok.com/robots.txt (nhẹ, cùng domain với TikTok).
// Bấm nút để mở cửa sổ nổi LUÔN NẰM TRÊN CÙNG (Document Picture-in-Picture) chứa TikTok.
// Vì cửa sổ nổi thuộc cùng domain tiktok.com nên TikTok cho phép nhúng và giữ đăng nhập.
(() => {
  if (!location.pathname.startsWith('/robots.txt')) return;
  const KEY = 'gon-pin-settings';
  let s = { scale: 100, transparency: 0 };
  let pip = null, frame = null;

  document.title = 'Gọn — Ghim TikTok';
  document.body.style.cssText = 'margin:0;background:#10100f;color:#f4f2ed;font:14px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center';
  const box = document.createElement('div');
  box.style.cssText = 'padding:14px';
  box.innerHTML = '<button id="pin" style="padding:11px 18px;border:0;border-radius:999px;background:#fb443b;color:#fff;font:700 14px system-ui;cursor:pointer">📌 Ghim TikTok</button><p id="msg" style="margin:10px 0 0;font-size:12px;color:#a7a49b;line-height:1.5">Bấm để mở cửa sổ nổi luôn nằm trên cùng.<br>Thu nhỏ cửa sổ này, đừng đóng.</p>';
  document.body.replaceChildren(box);
  const msg = box.querySelector('#msg');
  const say = t => { msg.textContent = t; };

  try { chrome.storage.local.get(KEY, d => { if (d?.[KEY]) s = { ...s, ...d[KEY] }; }); } catch {}
  const save = () => { try { chrome.storage.local.set({ [KEY]: s }); } catch {} };

  function applyFrame() {
    if (!frame) return;
    const k = s.scale / 100;
    frame.style.width = (100 / k) + 'vw';
    frame.style.height = (100 / k) + 'vh';
    frame.style.transform = k < 1 ? 'scale(' + k + ')' : '';
    frame.style.opacity = String(1 - s.transparency / 100);
  }

  async function pin() {
    if (pip && !pip.closed) { pip.focus?.(); return; }
    if (!('documentPictureInPicture' in window)) { say('Cần Chrome hoặc Edge bản mới trên máy tính.'); return; }
    try {
      pip = await documentPictureInPicture.requestWindow({ width: 360, height: 640, disallowReturnToOpener: true });
    } catch (e) { say('Không mở được cửa sổ ghim: ' + (e.message || e)); return; }
    const doc = pip.document;
    doc.title = 'TikTok — Gọn';
    const style = doc.createElement('style');
    style.textContent = `
      html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
      iframe{position:absolute;left:0;top:0;border:0;background:#000;transform-origin:0 0}
      .gon{position:fixed;top:8px;right:8px;z-index:9;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:system-ui,'Segoe UI',sans-serif}
      .fab{width:32px;height:32px;border:0;border-radius:50%;background:#000c;color:#fff;font-size:15px;cursor:pointer;opacity:.5;transition:opacity .15s}
      .fab:hover,.gon.open .fab{opacity:1}
      .panel{display:none;width:220px;padding:12px 14px;border-radius:14px;background:#141413f2;color:#f4f2ed;border:1px solid #ffffff22}
      .gon.open .panel{display:block}
      .row{margin:0 0 10px}.row:last-child{margin:0}
      label{display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:5px}
      input{width:100%;accent-color:#fb443b;cursor:pointer}
      small{display:block;margin-top:4px;color:#85837c;font-size:10.5px}`;
    doc.head.append(style);
    frame = doc.createElement('iframe');
    frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture; web-share';
    frame.src = 'https://www.tiktok.com/';
    const ui = doc.createElement('div');
    ui.className = 'gon';
    ui.innerHTML = `<div class="panel">
      <div class="row"><label for="sc"><span>Thu nhỏ màn hình</span><output id="sco"></output></label><input id="sc" type="range" min="40" max="100" step="5"></div>
      <div class="row"><label for="tr"><span>Độ trong suốt</span><output id="tro"></output></label><input id="tr" type="range" min="0" max="90" step="5"><small>0% rõ nét · 90% gần như trong suốt</small></div>
    </div><button class="fab" title="Thu nhỏ / độ trong suốt">◐</button>`;
    doc.body.append(frame, ui);
    const $ = sel => ui.querySelector(sel);
    const sync = () => {
      $('#sc').value = s.scale; $('#sco').textContent = s.scale + '%';
      $('#tr').value = s.transparency; $('#tro').textContent = s.transparency + '%';
      applyFrame();
    };
    $('#sc').addEventListener('input', e => { s.scale = Number(e.target.value); sync(); });
    $('#tr').addEventListener('input', e => { s.transparency = Number(e.target.value); sync(); });
    $('#sc').addEventListener('change', save);
    $('#tr').addEventListener('change', save);
    $('.fab').addEventListener('click', () => ui.classList.toggle('open'));
    sync();
    say('Đã ghim. Cửa sổ nổi luôn nằm trên cùng; bấm ◐ trong đó để chỉnh. Hãy thu nhỏ (không đóng) cửa sổ này.');
    pip.addEventListener('pagehide', () => { pip = null; frame = null; say('Cửa sổ ghim đã đóng. Bấm lại để ghim.'); });
  }
  box.querySelector('#pin').addEventListener('click', pin);
})();
