// Chạy trong chính trang TikTok (world: MAIN) trước mọi script của TikTok.
// TikTok tự dừng video khi trình duyệt báo trang bị ẩn (cửa sổ bị che, mở tab khác,
// mất focus). Ở đây ta báo "trang luôn đang hiển thị" để video tiếp tục chạy.
(() => {
  if (window.__gonKeepAlive) return;
  window.__gonKeepAlive = true;

  const define = (obj, prop, value) => {
    try { Object.defineProperty(obj, prop, { configurable: true, get: () => value }); } catch {}
  };
  define(Document.prototype, 'hidden', false);
  define(Document.prototype, 'webkitHidden', false);
  define(Document.prototype, 'visibilityState', 'visible');
  define(Document.prototype, 'webkitVisibilityState', 'visible');
  try { Document.prototype.hasFocus = () => true; } catch {}

  // Chặn các sự kiện báo ẩn/mất focus của chính trang (không chặn blur của ô nhập liệu)
  const block = event => event.stopImmediatePropagation();
  for (const name of ['visibilitychange', 'webkitvisibilitychange']) {
    window.addEventListener(name, block, true);
    document.addEventListener(name, block, true);
  }
  const blockPageBlur = event => {
    if (event.target === window || event.target === document) event.stopImmediatePropagation();
  };
  window.addEventListener('blur', blockPageBlur, true);
  document.addEventListener('blur', blockPageBlur, true);
})();
