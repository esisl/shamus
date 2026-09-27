const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Управление UI ---
function startGame(lang) {
    gameContext.currentLanguage = lang;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('video-screen').classList.remove('hidden');
    gameContext.currentState = STATE.VIDEO;
    
    gameContext.player = new Player('hero', 2, 2, 640, 360);
    
    // Вызываем синхронно
    loadSceneResources();
}

function skipVideo() {
    document.getElementById('video-screen').classList.add('hidden');
    gameContext.currentState = STATE.GAMEPLAY;
    
    // Создаем игрока
    //gameContext.player = new Player('hero', 2, 2, 640, 360);
    
    // === Создаем бомжа ===
    const bomzh = new Character('bomzh', 2, 1, 728, 335);
    bomzh.state = 'sit';  // Сидит
    bomzh.direction = 135;  // Смотрит на запад
    gameContext.npcs.push(bomzh);

    // === Создаем путану ===
    const puta = new Puta('puta', 2, 1, 553, 272);
    puta.state = 'stay';
    puta.direction = 45;
    gameContext.npcs.push(puta);

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

function loadSceneResources() {
    const locId = gameContext.map[gameContext.player.mapY][gameContext.player.mapX];
    
    // Загружаем изображения синхронно (без await)
    resources.back = new Image();
    resources.back.src = `assets/backgrounds/back/${locId}.png`;
    
    resources.front = new Image();
    resources.front.src = `assets/backgrounds/front/${locId}.png`;
    
    resources.atlas = new Image();
    resources.atlas.src = 'assets/atlas_0.png';
    
    console.log(`Загружена локация: ${locId}`);
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

// --- Отключение контекстного меню на ПКМ ---
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// --- Обработка нажатий мыши (включая ПКМ) ---
canvas.addEventListener('mousedown', (e) => {
    if (gameContext.currentState !== STATE.GAMEPLAY) return;
    if (!gameContext.player) return;
    
    if (e.button === 0) {
        // ЛКМ — уже обрабатывается через 'click'
    } else if (e.button === 2) {
        // ПКМ — стрельба с передачей координат клика
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        gameContext.player.shoot(clickX, clickY);
    }
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

        // === Обновление NPC ===
        gameContext.npcs.forEach(npc => {
            if (npc.mapX === gameContext.player.mapX && npc.mapY === gameContext.player.mapY) {
                npc.update();  // Теперь update() обрабатывает и смерть
            }
        });

        // === Удаляем помеченных NPC ===
        const before = gameContext.npcs.length;
        gameContext.npcs = gameContext.npcs.filter(npc => !npc.removed);
        if (gameContext.npcs.length < before) {
            console.log(`Удалено NPC: ${before - gameContext.npcs.length}`);
        }
        
        // === Обновление пуль ===
        gameContext.bullets.forEach(bullet => bullet.update());
        // Удаляем мертвые пули
        gameContext.bullets = gameContext.bullets.filter(b => b.alive);
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
    
    // 3. === Собираем все объекты для отрисовки ===
    const drawables = [];
    
    // Игрок (если в текущей локации)
    drawables.push({
        type: 'player',
        obj: gameContext.player,
        y: gameContext.player.y
    });
    
    // NPC (только из текущей локации)
    gameContext.npcs.forEach(npc => {
        if (npc.mapX === gameContext.player.mapX && npc.mapY === gameContext.player.mapY) {
            drawables.push({
                type: 'npc',
                obj: npc,
                y: npc.y
            });
        }
    });
    
    // Пули (все, так как они летят через всю сцену)
    gameContext.bullets.forEach(bullet => {
        drawables.push({
            type: 'bullet',
            obj: bullet,
            y: bullet.y
        });
    });
    
    // 4. === Сортируем по Y (от меньшего к большему = от дальних к ближним) ===
    drawables.sort((a, b) => a.y - b.y);
    
    // 5. === Отрисовываем в порядке сортировки ===
    drawables.forEach(item => {
        item.obj.draw(ctx);
    });
    
    // 6. Передний фон
    ctx.drawImage(resources.front, 0, 0, canvas.width, canvas.height);
    
    // 7. Отладочная информация
    ctx.fillStyle = '#0ff';
    ctx.font = '14px monospace';
    const locId = gameContext.map[gameContext.player.mapY][gameContext.player.mapX];
    ctx.fillText(`Локация: ${locId}`, 10, 20);
    ctx.fillText(`Позиция: ${gameContext.player.x.toFixed(0)}, ${gameContext.player.y.toFixed(0)}`, 10, 40);
    ctx.fillText(`На карте: (${gameContext.player.mapX}, ${gameContext.player.mapY})`, 10, 60);
    ctx.fillText(`Пуль: ${gameContext.bullets.length}`, 10, 80);
    ctx.fillText(`NPC: ${gameContext.npcs.length}`, 10, 100);
}

// --- Запуск ---
requestAnimationFrame(gameLoop);