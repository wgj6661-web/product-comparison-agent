// 后台服务：专门负责处理跨域请求
// Chrome Extension V3 Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchNvidia") {
    
    // 在 Background 环境下发起请求，可绕过 CORS
    fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      sendResponse({ success: false, error: error.toString() });
    });

    return true; // 保持消息通道开启以进行异步响应
  }
});