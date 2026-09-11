// --- Text-to-Speech Setup (Robust version) ---
let currentUtterance = null;
let synthVoices = [];

if ('speechSynthesis' in window) {
    synthVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        synthVoices = window.speechSynthesis.getVoices();
    };
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.lang = 'en-US'; 
        currentUtterance.rate = 0.8;     
        currentUtterance.pitch = 1.2;    
        
        if (synthVoices.length > 0) {
            const preferredVoice = synthVoices.find(v => v.lang.startsWith('en-US') && (v.name.includes('Google') || v.name.includes('Female')))
                                || synthVoices.find(v => v.lang.startsWith('en'));
            if (preferredVoice) {
                currentUtterance.voice = preferredVoice;
            }
        }
        
        window.speechSynthesis.speak(currentUtterance);
    } else {
        console.log("Text-to-speech is not supported by your browser.");
    }
}

document.querySelectorAll('.speaker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        btn.classList.add('speaker-playing');
        setTimeout(() => {
            btn.classList.remove('speaker-playing');
        }, 800);
        
        const text = btn.getAttribute('data-text');
        speakText(text);
    });
});

// --- Audio Setup (Tone.js) ---
let synth, cymbal;
let audioInitialized = false;

async function initAudio() {
    if (!audioInitialized) {
        await Tone.start();
        synth = new Tone.Synth().toDestination();
        cymbal = new Tone.MembraneSynth().toDestination();
        audioInitialized = true;
    }
}

function playCorrectSound() {
    if(!audioInitialized) return;
    const now = Tone.now();
    synth.triggerAttackRelease("C5", "16n", now);
    synth.triggerAttackRelease("E5", "16n", now + 0.1);
    synth.triggerAttackRelease("G5", "8n", now + 0.2);
}

function playIncorrectSound() {
    if(!audioInitialized) return;
    cymbal.triggerAttackRelease("G2", "8n");
    synth.triggerAttackRelease("C3", "8n", Tone.now() + 0.1);
}

function playWinSound() {
    if(!audioInitialized) return;
    const now = Tone.now();
    synth.triggerAttackRelease("C4", "8n", now);
    synth.triggerAttackRelease("E4", "8n", now + 0.2);
    synth.triggerAttackRelease("G4", "8n", now + 0.4);
    synth.triggerAttackRelease("C5", "2n", now + 0.6);
}

document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('dragstart', initAudio, { once: true });

// --- UI Message Box & Reset Logic ---
function showMessage(title, text) {
    document.getElementById('msg-title').innerText = title;
    document.getElementById('msg-text').innerText = text;
    const box = document.getElementById('message-box');
    box.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('message-content').classList.remove('scale-95');
        document.getElementById('message-content').classList.add('scale-100');
    }, 10);
}

document.getElementById('msg-btn').addEventListener('click', () => {
    const box = document.getElementById('message-box');
    document.getElementById('message-content').classList.remove('scale-100');
    document.getElementById('message-content').classList.add('scale-95');
    setTimeout(() => box.classList.add('hidden'), 200);
    
    // Slick Time UX Loop: Reset the game automatically
    if (sortedCount === totalPotions) {
        resetPotionsGame();
    }
});

function resetPotionsGame() {
    sortedCount = 0;
    const container = document.getElementById('potion-container');
    potions.forEach(potion => {
        container.appendChild(potion); 
        potion.classList.remove('sorted-top', 'sorted-bottom');
        potion.style.position = '';
        potion.style.bottom = '';
        potion.style.margin = '';
        potion.setAttribute('draggable', 'true');
        potion.style.cursor = 'grab';
    });
}

// --- Drag and Drop Logic (Sorting) ---
const potions = document.querySelectorAll('.potion');
const dropZones = document.querySelectorAll('.drop-zone');
const canvas = document.getElementById('connections-canvas');
const ctx = canvas.getContext('2d');

let sortedCount = 0;
const totalPotions = potions.length;
let drawnLines = []; 

function resizeCanvas() {
    canvas.width = document.body.scrollWidth;
    canvas.height = document.body.scrollHeight;
    redrawLines();
}
window.addEventListener('resize', resizeCanvas);

function redrawLines() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawnLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.startX, line.startY);
        const cpX = (line.startX + line.endX) / 2;
        const cpY = Math.min(line.startY, line.endY) - 50;
        ctx.quadraticCurveTo(cpX, cpY, line.endX, line.endY);
        
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]); 
        ctx.stroke();
        ctx.setLineDash([]); 
    });
}

function drawExampleLine() {
    const redPotion = document.getElementById('potion-red');
    const topShelf = document.getElementById('shelf-top');
    
    if(redPotion && topShelf) {
        const pRect = redPotion.getBoundingClientRect();
        const sRect = topShelf.getBoundingClientRect();
        
        drawnLines.push({
            startX: pRect.left + pRect.width / 2 + window.scrollX,
            startY: pRect.top + pRect.height / 2 + window.scrollY,
            endX: sRect.left + sRect.width / 4 + window.scrollX, 
            endY: sRect.top + sRect.height / 2 + window.scrollY,
            color: 'rgba(255, 255, 255, 0.3)' 
        });
    }
}

setTimeout(() => {
    resizeCanvas();
    drawExampleLine();
    redrawLines();
}, 500); 

potions.forEach(potion => {
    potion.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.currentTarget.id);
        e.currentTarget.classList.add('opacity-50');
    });

    potion.addEventListener('dragend', (e) => {
        e.currentTarget.classList.remove('opacity-50');
    });
});

dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        zone.classList.add('hover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('hover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('hover');
        
        const id = e.dataTransfer.getData('text/plain');
        const draggableElement = document.getElementById(id);
        
        if (!draggableElement) return;

        const expectedSize = zone.getAttribute('data-target');
        const actualSize = draggableElement.getAttribute('data-size');

        if (expectedSize === actualSize) {
            playCorrectSound();
            draggableElement.classList.add(expectedSize === 'big' ? 'sorted-top' : 'sorted-bottom');
            draggableElement.style.position = 'relative';
            draggableElement.style.bottom = expectedSize === 'big' ? '10px' : '0px';
            draggableElement.style.margin = '0 5px';
            zone.appendChild(draggableElement);
            draggableElement.setAttribute('draggable', 'false');
            draggableElement.style.cursor = 'default';

            sortedCount++;
            if (sortedCount === totalPotions) {
                setTimeout(() => {
                    playWinSound();
                    showMessage("✨ 魔法完成！ ✨", "太棒了！分類成功！");
                }, 500);
            }
        } else {
            playIncorrectSound();
            draggableElement.style.transform = 'translateX(-10px)';
            setTimeout(() => draggableElement.style.transform = 'translateX(10px)', 100);
            setTimeout(() => draggableElement.style.transform = 'translateX(-10px)', 200);
            setTimeout(() => draggableElement.style.transform = 'translateX(0)', 300);
            
            setTimeout(() => {
                showMessage("哎呀！", "等一下，這是大 (BIG) 還是小 (small)？再試一次！");
            }, 400);
        }
    });
});

// --- Bonus Challenge (Maze) Logic ---
const mazeCells = document.querySelectorAll('.maze-cell');
const snail = document.getElementById('snail-svg');
const startCell = document.getElementById('maze-start');

let currentSnailPos = { x: 0, y: 2 };

function updateSnailPosition(newX, newY, targetCell) {
    if(targetCell.classList.contains('obstacle')) {
        playIncorrectSound();
        targetCell.style.backgroundColor = '#EF4444'; 
        setTimeout(() => targetCell.style.backgroundColor = '', 300);
        return;
    }

    targetCell.appendChild(snail);
    targetCell.classList.add('path');
    currentSnailPos = { x: newX, y: newY };
    playCorrectSound();

    if (targetCell.id === 'maze-goal') {
        setTimeout(() => {
            playWinSound();
            showMessage("🐌 太棒了！", "Yellow 找到黃色藥水了！");
        }, 300);
    }
}

const arrowBtns = document.querySelectorAll('.arrow-btn');
arrowBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const dx = parseInt(btn.getAttribute('data-dx'));
        const dy = parseInt(btn.getAttribute('data-dy'));
        const newX = currentSnailPos.x + dx;
        const newY = currentSnailPos.y + dy;
        
        const targetCell = document.querySelector(`.maze-cell[data-x="${newX}"][data-y="${newY}"]`);
        if (targetCell) {
            updateSnailPosition(newX, newY, targetCell);
        } else {
            playIncorrectSound(); 
        }
    });
});

mazeCells.forEach(cell => {
    cell.addEventListener('click', () => {
        const cx = parseInt(cell.getAttribute('data-x'));
        const cy = parseInt(cell.getAttribute('data-y'));
        
        const isAdjacent = (Math.abs(cx - currentSnailPos.x) === 1 && cy === currentSnailPos.y) ||
                           (Math.abs(cy - currentSnailPos.y) === 1 && cx === currentSnailPos.x);

        if (isAdjacent) {
            updateSnailPosition(cx, cy, cell);
        }
    });
});

document.getElementById('reset-maze').addEventListener('click', () => {
    startCell.appendChild(snail);
    currentSnailPos = { x: 0, y: 2 };
    mazeCells.forEach(c => {
        if(c.id !== 'maze-start') c.classList.remove('path');
    });
});