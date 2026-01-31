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

  // Kreiraj dugmad za akcije
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'code128-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'code128-action-btn';
  copyBtn.innerHTML = '📋 Copy to Clipboard';
  copyBtn.onclick = () => copyToClipboard(codeContainer, type);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'code128-action-btn';
  saveBtn.innerHTML = '💾 Save as PNG';
  saveBtn.onclick = () => saveAsPNG(codeContainer, text, type);

  actionsContainer.appendChild(copyBtn);
  actionsContainer.appendChild(saveBtn);

  // Dodaj sve u balon
  balloon.appendChild(closeBtn);
  balloon.appendChild(title);
  balloon.appendChild(textDisplay);
  balloon.appendChild(codeContainer);
  balloon.appendChild(actionsContainer);

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
    actionsContainer.style.display = 'none';
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
  // NOVA BIBLIOTEKA: qrcode-generator umjesto qrcode.js
  // qrcode-generator podržava QR kodove do version 40 (do ~2953 byte-ova!)
  
  const encoder = new TextEncoder();
  const byteLength = encoder.encode(text).length;
  
  // qrcode-generator može do ~2953 byte-ova (version 40, Level L)
  if (byteLength > 2900) {
    throw new Error(`Tekst je predugačak za QR kod (max ~2900 byte-ova). Trenutno: ${byteLength} byte-ova. Za vrlo duge tekstove koristi bit.ly skraćivač.`);
  }
  
  // Kreiraj div za QR kod
  const qrDiv = document.createElement('div');
  qrDiv.id = 'qrcode-container';
  qrDiv.style.display = 'flex';
  qrDiv.style.justifyContent = 'center';
  qrDiv.style.alignItems = 'center';
  qrDiv.style.padding = '20px';
  container.appendChild(qrDiv);

  try {
    // Generiraj QR kod koristeći qrcode-generator
    // typeNumber 0 = automatski odabir verzije (1-40) ovisno o količini podataka
    // errorCorrectionLevel: 'L' = 7% error correction, maksimalni kapacitet
    const qr = qrcode(0, 'L');
    qr.addData(text);
    qr.make();
    
    // Kreiraj IMG element sa QR kodom
    const imgTag = qr.createImgTag(4, 0);  // cellSize=4, margin=0
    qrDiv.innerHTML = imgTag;
    
    // Style za sliku
    const img = qrDiv.querySelector('img');
    if (img) {
      img.style.width = '200px';
      img.style.height = '200px';
      img.style.imageRendering = 'pixelated';
    }
  } catch (error) {
    // Ako qrcode-generator baci grešku
    throw new Error('QR kod greška: ' + error.message);
  }
}

function positionBalloon(balloon) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const balloonRect = balloon.getBoundingClientRect();
  
  balloon.style.left = `${(viewportWidth - balloonRect.width) / 2}px`;
  balloon.style.top = `${(viewportHeight - balloonRect.height) / 2}px`;
}

async function copyToClipboard(container, type) {
  try {
    const canvas = await createCanvasFromElement(container, type);
    
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showNotification('✅ Kopirano u clipboard!', 'success');
      } catch (err) {
        showNotification('❌ Greška pri kopiranju', 'error');
        console.error('Clipboard error:', err);
      }
    });
  } catch (error) {
    showNotification('❌ Greška pri kreiranju slike', 'error');
    console.error('Canvas error:', error);
  }
}

function saveAsPNG(container, text, type) {
  try {
    createCanvasFromElement(container, type).then(canvas => {
      // Kreiraj download link
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generiraj ime fajla
        const timestamp = new Date().toISOString().slice(0, 10);
        const sanitizedText = text.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
        const typeName = type === 'code128' ? 'CODE128' : 'QR';
        a.download = `${typeName}-${sanitizedText}-${timestamp}.png`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Spremljeno kao PNG!', 'success');
      });
    });
  } catch (error) {
    showNotification('❌ Greška pri spremanju', 'error');
    console.error('Save error:', error);
  }
}

async function createCanvasFromElement(container, type) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (type === 'code128') {
    // Za CODE 128 - SVG element
    const svg = container.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Bijela pozadina
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Crtaj sliku
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };
      
      img.src = url;
    });
  } else {
    // Za QR kod - IMG element
    const img = container.querySelector('img');
    
    if (!img) {
      throw new Error('QR kod slika nije pronađena');
    }
    
    return new Promise((resolve) => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Bijela pozadina
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Crtaj QR kod
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    });
  }
}

function showNotification(message, type) {
  // Ukloni staru notifikaciju ako postoji
  const existing = document.getElementById('code128-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'code128-notification';
  notification.className = `code128-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animiraj prikazivanje
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  // Ukloni nakon 3 sekunde
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
