// background.js
chrome.action.onClicked.addListener((tab) => {
  // Inject both JS and CSS into the current tab
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["content.css"]
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});
