// Kreiraj context menu items kada se ekstenzija instalira
chrome.runtime.onInstalled.addListener(() => {
  // Parent menu
  chrome.contextMenus.create({
    id: "barcodeMenu",
    title: "Generiraj kod",
    contexts: ["selection"]
  });
  
  // CODE 128 opcija
  chrome.contextMenus.create({
    id: "generateCode128",
    parentId: "barcodeMenu",
    title: "CODE 128 barkod",
    contexts: ["selection"]
  });
  
  // QR kod opcija
  chrome.contextMenus.create({
    id: "generateQRCode",
    parentId: "barcodeMenu",
    title: "QR kod",
    contexts: ["selection"]
  });
});

// Kada korisnik klikne na context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateCode128") {
    // Pošalji poruku content scriptu za CODE 128
    chrome.tabs.sendMessage(tab.id, {
      action: "generateBarcode",
      type: "code128",
      text: info.selectionText
    });
  } else if (info.menuItemId === "generateQRCode") {
    // Pošalji poruku content scriptu za QR kod
    chrome.tabs.sendMessage(tab.id, {
      action: "generateBarcode",
      type: "qrcode",
      text: info.selectionText
    });
  }
});
