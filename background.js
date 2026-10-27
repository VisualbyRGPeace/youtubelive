// Đặt mức zoom thật của trình duyệt cho tab TikTok (giống Ctrl + '-'),
// nên bố cục dùng đơn vị vh/vw của TikTok vẫn lấp đầy cửa sổ.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'gon-set-zoom' && sender.tab?.id != null) {
    const factor = Math.min(1, Math.max(0.25, Number(message.factor) || 1));
    chrome.tabs.setZoom(sender.tab.id, factor).catch(() => {});
  }
});
