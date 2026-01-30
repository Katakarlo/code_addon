// Sluša poruke od background scripta
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateBarcode") {
    if (request.type === "code128") {
      showBarcodeBallon(request.text, "code128");
    } else if (request.type === "qrcode") {
      showBarcodeBallon(request.text, "qrcode");
    }
  }
});

function showBarcodeBallon(text, type) {
  // Ukloni stari balon ako postoji
  const existingBalloon = document.getElementById('code128-balloon');
  if (existingBalloon) {
    existingBalloon.remove();
  }

  // Kreiraj balon kontejner
  const balloon = document.createElement('div');
  balloon.id = 'code128-balloon';
  balloon.className = 'code128-balloon';

  // Kreiraj zatvaranje dugme
  const closeBtn = document.createElement('button');
  closeBtn.className = 'code128-close';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = () => balloon.remove();

  // Kreiraj naslov
  const title = document.createElement('div');
  title.className = 'code128-title';
  title.textContent = type === "code128" ? 'CODE 128 Barkod' : 'QR Kod';

  // Kreiraj text prikaz
  const textDisplay = document.createElement('div');
  textDisplay.className = 'code128-text';
  textDisplay.textContent = text;

  // Kreiraj kontejner za kod
  const codeContainer = document.createElement('div');
  codeContainer.className = 'code128-container';

  // Dodaj sve u balon
  balloon.appendChild(closeBtn);
  balloon.appendChild(title);
  balloon.appendChild(textDisplay);
  balloon.appendChild(codeContainer);

  // Dodaj balon na stranicu
  document.body.appendChild(balloon);

  // Generiraj odgovarajući kod
  try {
    if (type === "code128") {
      generateCode128(codeContainer, text);
    } else if (type === "qrcode") {
      generateQRCode(codeContainer, text);
    }
  } catch (error) {
    textDisplay.textContent = 'Greška: ' + error.message;
    textDisplay.style.color = '#e74c3c';
    codeContainer.style.display = 'none';
  }

  // Pozicioniraj balon u centar ekrana
  positionBalloon(balloon);

  // Omogući zatvaranje klikom izvan balona
  setTimeout(() => {
    document.addEventListener('click', function closeBalloon(e) {
      if (!balloon.contains(e.target)) {
        balloon.remove();
        document.removeEventListener('click', closeBalloon);
      }
    });
  }, 100);
}

function generateCode128(container, text) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'code128-barcode';
  svg.style.width = '100%';
  container.appendChild(svg);

  JsBarcode(svg, text, {
    format: "CODE128",
    width: 2,
    height: 80,
    displayValue: false,
    margin: 10
  });
}

function generateQRCode(container, text) {
  // Kreiraj div za QR kod
  const qrDiv = document.createElement('div');
  qrDiv.id = 'qrcode-container';
  qrDiv.style.display = 'flex';
  qrDiv.style.justifyContent = 'center';
  qrDiv.style.alignItems = 'center';
  qrDiv.style.padding = '20px';
  container.appendChild(qrDiv);

  // Generiraj QR kod koristeći QRCode.js
  new QRCode(qrDiv, {
    text: text,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function positionBalloon(balloon) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const balloonRect = balloon.getBoundingClientRect();
  
  balloon.style.left = `${(viewportWidth - balloonRect.width) / 2}px`;
  balloon.style.top = `${(viewportHeight - balloonRect.height) / 2}px`;
}
