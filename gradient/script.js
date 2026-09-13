// --- SETUP MAIN CANVAS ---
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

const width = 1080;
const height = 1920;
canvas.width = width;
canvas.height = height;

// --- SETUP OFFSCREEN CANVAS ---
const textCanvas = document.createElement('canvas');
textCanvas.width = width;
textCanvas.height = height;
const textCtx = textCanvas.getContext('2d');

// --- VARIABILI DELLA PALETTE ---
const blobColors = ['#CDECFB', '#FFAEC7', '#FFC556', '#FB8E45']; 

// --- GENERAZIONE BACKGROUND BLOBS ---
const blobs = [];
const numBlobs = 6;
for (let i = 0; i < numBlobs; i++) {
    blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 400 + 600, 
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: blobColors[i % blobColors.length]
    });
}

// --- GENERAZIONE NOISE MAP (MACCHIE) ---
const numSpots = 400;
const spots = [];
for (let i = 0; i < numSpots; i++) {
    spots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        maxRadius: Math.random() * 60 + 30,
        activation: Math.random() * 0.7
    });
}
const PI2 = Math.PI * 2; 

// --- VARIABILI DI ANIMAZIONE ---
let progress = 0;
let direction = 1; 
const speed = 0.0025; 
const textLines = ["Hope is", "in the air"];

// Curva Bezier Quintica
function bezierEase(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

animate();

function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, width, height);
    textCtx.clearRect(0, 0, width, height);

    // --- 1. RENDERING DEI BLOB FLUIDI ---
    ctx.save();
    ctx.filter = 'blur(150px)'; 
    ctx.globalAlpha = 0.8;
    
    for (let b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        
        if (b.x < -b.r || b.x > width + b.r) b.vx *= -1;
        if (b.y < -b.r || b.y > height + b.r) b.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = b.color;
        ctx.arc(b.x, b.y, b.r, 0, PI2);
        ctx.fill();
    }
    ctx.restore();

    progress += speed * direction;
    if (progress >= 1) {
        progress = 1; direction = -1;
    } else if (progress <= 0) {
        progress = 0; direction = 1;
    }

    const ease = bezierEase(progress);
    const currentScale = 1 + (ease * 1.5); 
    const blurAmount = ease * 60; 

    // --- 2. RENDERING DEL TESTO ---
    textCtx.save();
    textCtx.translate(width / 2, height / 2);
    textCtx.scale(currentScale, currentScale);
    
    if (blurAmount > 0.1) textCtx.filter = `blur(${blurAmount}px)`;
    textCtx.globalAlpha = 1 - (ease * 0.2); 
    
    textCtx.font = "600 120px 'Inter', sans-serif";
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.lineJoin = 'round'; 

   
    textCtx.shadowBlur = 50;
    textCtx.shadowOffsetX = 15;
    textCtx.shadowOffsetY = 25;

    const lineSpacing = 140; 
    
    textCtx.lineWidth = 26;
    textCtx.strokeStyle = '#ff9bd2';
    textCtx.strokeText(textLines[0], 0, -lineSpacing / 2);
    textCtx.strokeText(textLines[1], 0, lineSpacing / 2);

    textCtx.lineWidth = 14;
    textCtx.strokeStyle = '#FFFFFF';
    textCtx.strokeText(textLines[0], 0, -lineSpacing / 2);
    textCtx.strokeText(textLines[1], 0, lineSpacing / 2);

    // Creazione del gradiente dinamico per il riempimento del testo
    const textGradient = textCtx.createLinearGradient(0, -lineSpacing, 0, lineSpacing);
    textGradient.addColorStop(0, '#FFFFFF');    // Bianco
    textGradient.addColorStop(0.25, '#CDECFB'); // Azzurro
    textGradient.addColorStop(0.5, '#FFAEC7');  // Rosa
    textGradient.addColorStop(0.75, '#FFC556'); // Giallo
    textGradient.addColorStop(1, '#FB8E45');    // Arancione

    // Applica il gradiente al posto del nero
    textCtx.fillStyle = textGradient;
    textCtx.fillText(textLines[0], 0, -lineSpacing / 2);
    textCtx.fillText(textLines[1], 0, lineSpacing / 2);

    textCtx.restore();

    // --- 3. DISSOLVENZA A MACCHIE ---
    textCtx.save();
    textCtx.globalCompositeOperation = 'destination-out';
    textCtx.fillStyle = '#000000'; 
    
    const noiseBlur = ease * 50; 
    if (noiseBlur > 0.1) textCtx.filter = `blur(${noiseBlur}px)`;
    
    textCtx.beginPath();
    for (let spot of spots) {
        if (ease > spot.activation) {
            const growth = (ease - spot.activation) / (1 - spot.activation);
            const currentRadius = Math.max(0, spot.maxRadius * (growth * growth * 5)); 
            
            if (currentRadius > 0) {
                textCtx.moveTo(spot.x, spot.y);
                textCtx.arc(spot.x, spot.y, currentRadius, 0, PI2);
            }
        }
    }
    textCtx.fill();
    textCtx.restore();

    // --- 4. MERGE DEI LIVELLI ---
    ctx.drawImage(textCanvas, 0, 0);

    // --- 5. TONAL MAP PLATINUM PALETTE OVERLAY ---
    ctx.save();
    ctx.globalCompositeOperation = 'color'; 
    
    // Il gradiente finale che agisce da patina su tutto il canvas
    const overlayGradient = ctx.createLinearGradient(0, 0, 0, height);
    overlayGradient.addColorStop(0, '#FFFFFF');
    overlayGradient.addColorStop(0.25, '#CDECFB');
    overlayGradient.addColorStop(0.5, '#FFAEC7');
    overlayGradient.addColorStop(0.75, '#FFC556');
    overlayGradient.addColorStop(1, '#FB8E45');
    
    ctx.fillStyle = overlayGradient;
    ctx.globalAlpha = 0.5; 
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}