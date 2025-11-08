document.getElementById("launch").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTabId = tabs[0].id;
    // chrome.tabs.update(currentTabId, { url: "https://your-webapp.com" });
    // chrome.tabs.update({ url: chrome.runtime.getURL("web-app/index.html") });
    chrome.tabs.update(currentTabId, { url: "http://localhost:5050" });
  });
});
