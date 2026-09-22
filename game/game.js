const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Управление UI ---
function startGame(lang) {
    gameContext.currentLanguage = lang;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('video-screen').classList.remove('hidden');
    gameContext.currentState = STATE.VIDEO;
    
    // === Создаем игрока ДО загрузки ресурсов ===
    gameContext.player = new Player('hero', 2, 2, 640, 360);
    
    loadSceneResources();
}

function skipVideo() {
    document.getElementById('video-screen').classList.add('hidden');
    gameContext.currentState = STATE.GAMEPLAY;
    
    // Игрок уже создан в startGame(), здесь ничего не нужно
}

// --- Загрузка ресурсов ---
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
    });
}

async function loadSceneResources() {
    try {
        const locId = gameContext.map[gameContext.player.mapY][gameContext.player.mapX];
        
        resources.back = await loadImage(`assets/backgrounds/back/${locId}.png`);
        resources.front = await loadImage(`assets/backgrounds/front/${locId}.png`);
        resources.atlas = await loadImage('assets/atlas_0.png');
        
        console.log(`Загружена локация: ${locId}`);
    } catch (e) {
        console.error("Ошибка загрузки ресурсов:", e);
    }
}

// --- Обработка мыши ---
canvas.addEventListener('click', (e) => {
    if (gameContext.currentState !== STATE.GAMEPLAY) return;
    if (!gameContext.player) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    gameContext.player.handleClick(clickX, clickY);
});

// --- Отрисовка полигонов (для отладки) ---
function drawDebugPolygons() {
    const location = getCurrentLocation(
        gameContext.player.mapX, 
        gameContext.player.mapY
    );
    
    if (!location || !location.zones) return;
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    
    for (const zone of location.zones) {
        if (zone.polygon_pixel && zone.polygon_pixel.length > 0) {
            ctx.beginPath();
            ctx.moveTo(zone.polygon_pixel[0].x, zone.polygon_pixel[0].y);
            
            for (let i = 1; i < zone.polygon_pixel.length; i++) {
                ctx.lineTo(zone.polygon_pixel[i].x, zone.polygon_pixel[i].y);
            }
            
            ctx.closePath();
            ctx.stroke();
            
            // Подпись типа зоны
            const centerX = zone.polygon_pixel.reduce((sum, p) => sum + p.x, 0) / zone.polygon_pixel.length;
            const centerY = zone.polygon_pixel.reduce((sum, p) => sum + p.y, 0) / zone.polygon_pixel.length;
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.font = '12px monospace';
            ctx.fillText(zone.type, centerX, centerY);
        }
    }
}

// --- Основной цикл ---
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameContext.currentState === STATE.GAMEPLAY) {
        if (gameContext.player) {
            gameContext.player.update();
        }
        
        // В будущем: обновление NPC
        // gameContext.npcs.forEach(npc => npc.update());
    }
}

function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameContext.currentState === STATE.GAMEPLAY) {
        renderGameplay();
    }
}

function renderGameplay() {
    if (!resources.back || !resources.front || !resources.atlas) return;
    if (!gameContext.player) return;

    // 1. Задний фон
    ctx.drawImage(resources.back, 0, 0, canvas.width, canvas.height);
    
    // 2. Отладка: полигоны
    drawDebugPolygons();
    
    // 3. NPC (в будущем)
    // gameContext.npcs.forEach(npc => npc.draw(ctx));
    
    // 4. Игрок
    gameContext.player.draw(ctx);
    
    // 5. Передний фон
    ctx.drawImage(resources.front, 0, 0, canvas.width, canvas.height);
    
    // 6. Отладочная информация
    ctx.fillStyle = '#0ff';
    ctx.font = '14px monospace';
    const locId = gameContext.map[gameContext.player.mapY][gameContext.player.mapX];
    ctx.fillText(`Локация: ${locId}`, 10, 20);
    ctx.fillText(`Позиция: ${gameContext.player.x.toFixed(0)}, ${gameContext.player.y.toFixed(0)}`, 10, 40);
    ctx.fillText(`На карте: (${gameContext.player.mapX}, ${gameContext.player.mapY})`, 10, 60);
}

// --- Запуск ---
requestAnimationFrame(gameLoop);