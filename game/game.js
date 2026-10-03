const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Утилита для получения уникального ключа локации ---
function getLocationKey(mapX, mapY) {
    return `${mapX}_${mapY}`;
}

// --- Фабрика создания NPC ---
function createNPCInstance(className, type, mapX, mapY, x, y) {
    switch(className) {
        case 'Character': return new Character(type, mapX, mapY, x, y);
        case 'Puta': return new Puta(type, mapX, mapY, x, y);
        case 'Diler': return new Diler(type, mapX, mapY, x, y);
        case 'Samura': return new Samura(mapX, mapY, x, y);
        case 'BigBandit': return new BigBandit(mapX, mapY, x, y);
        case 'RikkiRat': return new RikkiRat(mapX, mapY, x, y);
        default: 
            console.warn(`Неизвестный класс NPC: ${className}, используется Character`);
            return new Character(type, mapX, mapY, x, y);
    }
}

// --- Логика спавна NPC из конфига ---
function spawnNPCFromConfig(mapX, mapY, npcConfig) {
    const locId = gameContext.map[mapY][mapX]; // Нужен только для findZoneByType
    const className = npcConfig.class || 'Character';
    
    if (npcConfig.count > 1 && npcConfig.spawnZone) {
        // Групповой спавн в зоне (в ряд)
        const zone = findZoneByType(locId, npcConfig.spawnZone);
        if (!zone) {
            console.warn(`Зона ${npcConfig.spawnZone} не найдена в локации типа ${locId}`);
            return;
        }
        const center = getZoneCenter(zone);
        const spacing = 60; // Расстояние между NPC в ряду
        
        for (let i = 0; i < npcConfig.count; i++) {
            const offsetX = (i - (npcConfig.count - 1) / 2) * spacing;
            const npc = createNPCInstance(className, npcConfig.type, mapX, mapY, center.x + offsetX, center.y);
            npc.state = npcConfig.initialState || 'stay';
            npc.interaction = npcConfig.interaction || {};
            gameContext.npcs.push(npc);
        }
        console.log(`[SPAWN] Создано ${npcConfig.count} x ${className} в зоне ${npcConfig.spawnZone} локации [${mapX},${mapY}]`);
    } else {
        // Одиночный спавн по точным координатам
        const npc = createNPCInstance(className, npcConfig.type, mapX, mapY, npcConfig.x, npcConfig.y);
        npc.state = npcConfig.initialState || 'stay';
        npc.direction = npcConfig.direction || 180;
        npc.interaction = npcConfig.interaction || {};
        gameContext.npcs.push(npc);
        console.log(`[SPAWN] Создан ${className} (${npcConfig.type}) в локации [${mapX},${mapY}]`);
    }
}

// --- Проверка и выполнение отложенных спавнов ---
function processLocationSpawns(mapX, mapY) {
    const locKey = getLocationKey(mapX, mapY);
    const locData = LOCATION_DATA[locKey];
    
    if (!locData || !locData.npcs) return;
    
    const state = gameContext.locationStates[locKey];
    if (!state) return;
    
    const now = Date.now();
    
    locData.npcs.forEach((npcConfig, index) => {
        if (!state.spawnedConfigs.has(index)) {
            const delayMs = (npcConfig.delay || 0) * 1000;
            if (now - state.enterTime >= delayMs) {
                spawnNPCFromConfig(mapX, mapY, npcConfig);
                state.spawnedConfigs.add(index);
            }
        }
    });
}

// --- Управление UI ---
function startGame(lang) {
    gameContext.currentLanguage = lang;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('video-screen').classList.remove('hidden');
    gameContext.currentState = STATE.VIDEO;
    
    gameContext.player = new Player('hero', 2, 2, 640, 360);
    loadSceneResources();
}

function skipVideo() {
    document.getElementById('video-screen').classList.add('hidden');
    gameContext.currentState = STATE.GAMEPLAY;

    // === ЗАГРУЗКА ЗВУКОВ ===
    loadSounds();
    
    // Инициализируем стартовую локацию по координатам
    const startX = gameContext.player.mapX;
    const startY = gameContext.player.mapY;
    const startKey = getLocationKey(startX, startY);
    
    gameContext.locationStates[startKey] = {
        enterTime: Date.now(),
        spawnedConfigs: new Set()
    };
    
    // Спавним NPC для стартовой локации
    processLocationSpawns(startX, startY);

    // === ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ ДИАЛОГОВ ===
    gameContext.dialogSystem = new DialogSystem();
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

// --- Загрузка ресурсов (использует тип локации, как и раньше) ---
function loadSceneResources() {
    const locId = gameContext.map[gameContext.player.mapY][gameContext.player.mapX];
    resources.back = new Image();
    resources.back.src = `assets/backgrounds/back/${locId}.png`;
    resources.front = new Image();
    resources.front.src = `assets/backgrounds/front/${locId}.png`;
    resources.atlas = new Image();
    resources.atlas.src = 'assets/atlas_0.png';
    console.log(`Загружены ресурсы для типа локации: ${locId}`);
}

// --- Обработка мыши ---
canvas.addEventListener('click', (e) => {
    if (gameContext.currentState !== STATE.GAMEPLAY || !gameContext.player) return;
    const rect = canvas.getBoundingClientRect();
    gameContext.player.handleClick(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
    if (gameContext.currentState !== STATE.GAMEPLAY || !gameContext.player) return;
    if (e.button === 2) {
        const rect = canvas.getBoundingClientRect();
        gameContext.player.shoot(e.clientX - rect.left, e.clientY - rect.top);
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
        // === ОБНОВЛЕНИЕ ТАЙМЕРА ===
        if (gameContext.countdownActive) {
            const elapsed = (Date.now() - gameContext.countdownStartTime) / 1000;
            const remaining = gameContext.countdownDuration - elapsed;
            if (remaining <= 0) {
                gameContext.countdownActive = false;
                onCountdownFinished();
            }
        }
        
        // === ОБНОВЛЕНИЕ ДИАЛОГА ===
        if (gameContext.dialogSystem && gameContext.dialogSystem.isActive()) {
            gameContext.dialogSystem.update();
            
            // Блокируем управление героем
            if (gameContext.player) {
                gameContext.player.isMoving = false;
            }
        } else {
            // Обычная логика
            if (gameContext.player) {
                gameContext.player.update();
                
                // === ПРОВЕРКА СМЕНЫ ЛОКАЦИИ ДЛЯ СПАВНА ===
                const currentX = gameContext.player.mapX;
                const currentY = gameContext.player.mapY;
                const currentKey = getLocationKey(currentX, currentY);
                
                if (!gameContext.locationStates[currentKey]) {
                    gameContext.locationStates[currentKey] = {
                        enterTime: Date.now(),
                        spawnedConfigs: new Set()
                    };
                    loadSceneResources();
                }
                
                // Обрабатываем отложенные спавны (только если нет диалога)
                processLocationSpawns(currentX, currentY);
                
                // === ПРОВЕРКА ТРИГГЕРА ДИАЛОГА ===
                for (const npc of gameContext.npcs) {
                    if (npc.mapX === gameContext.player.mapX && 
                        npc.mapY === gameContext.player.mapY &&
                        npc.interaction && npc.interaction.dialog) {
                        
                        const dx = npc.x - gameContext.player.x;
                        const dy = npc.y - gameContext.player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // === СБРОС ФЛАГА: если герой отошёл далеко ===
                        if (npc.dialogPlayed && distance > 100) {
                            npc.dialogPlayed = false;
                            console.log(`💬 Диалог с ${npc.type} сброшен (герой отошёл)`);
                        }
                        
                        // === ЗАПУСК ДИАЛОГА: близко и ещё не сыгран ===
                        if (distance < 50 && !npc.dialogPlayed) {
                            gameContext.dialogSystem.startDialog(npc, npc.interaction.dialog);
                            break;
                        }
                    }
                }
            }
            
            // === Обновление NPC ===
            gameContext.npcs.forEach(npc => {
                if (npc.mapX === gameContext.player.mapX && npc.mapY === gameContext.player.mapY) {
                    // Блокируем NPC на время диалога
                    if (!gameContext.dialogSystem || !gameContext.dialogSystem.isActive()) {
                        npc.update();
                    }
                } else {
                    // === НОВОЕ: Останавливаем звуки NPC в других локациях ===
                    if (npc.runSound) {
                        npc.runSound.pause();
                        npc.runSound.currentTime = 0;
                        npc.runSound = null;
                    }
                }
            });
        }
        
        // === Удаляем помеченных NPC ===
        const before = gameContext.npcs.length;
        gameContext.npcs = gameContext.npcs.filter(npc => !npc.removed);
        if (gameContext.npcs.length < before) {
            console.log(`Удалено NPC: ${before - gameContext.npcs.length}`);
        }
        
        // === Обновление пуль ===
        gameContext.bullets.forEach(bullet => bullet.update());
        gameContext.bullets = gameContext.bullets.filter(b => b.alive);
        
        // === Обновление дрона и его пуль ===
        if (gameContext.dron) {
            gameContext.dron.update();
        }
        gameContext.dronBullets.forEach(bullet => bullet.update());
        gameContext.dronBullets = gameContext.dronBullets.filter(b => b.alive);

        // === НОВОЕ: Обновление пуль рикки ===
        gameContext.rikkiBullets.forEach(bullet => bullet.update());
        gameContext.rikkiBullets = gameContext.rikkiBullets.filter(b => b.alive);
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
    if (!resources.back || !resources.front || !resources.atlas || !gameContext.player) return;

    ctx.drawImage(resources.back, 0, 0, canvas.width, canvas.height);
    drawDebugPolygons();
    
    const drawables = [];
    
    drawables.push({ type: 'player', obj: gameContext.player, y: gameContext.player.y, x: gameContext.player.x });
    
    gameContext.npcs.forEach(npc => {
        if (npc.mapX === gameContext.player.mapX && npc.mapY === gameContext.player.mapY) {
            drawables.push({ type: 'npc', obj: npc, y: npc.y, x: npc.x });
        }
    });
    
    gameContext.bullets.forEach(bullet => {
        drawables.push({ type: 'bullet', obj: bullet, y: bullet.y, x: bullet.x });
    });

    // === НОВОЕ: Пули рикки (участвуют в сортировке по Y) ===
    gameContext.rikkiBullets.forEach(bullet => {
        drawables.push({ type: 'rikki_bullet', obj: bullet, y: bullet.y, x: bullet.x });
    });
    
    // Стабильная сортировка по Y, затем по X
    drawables.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 1) return a.x - b.x;
        return a.y - b.y;
    });
    
    drawables.forEach(item => item.obj.draw(ctx));
    
    ctx.globalAlpha = 0.5;
    ctx.drawImage(resources.front, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // 7. === НОВОЕ: Дрон и его пули (ПОВЕРХ всего) ===
    if (gameContext.dron) {
        gameContext.dron.draw(ctx);
    }
    // === ОТЛАДКА ОТРИСОВКИ ПУЛЬ ДРОНА ===
    if (!gameContext.dronBullets || gameContext.dronBullets.length === 0) {
        console.log("[DEBUG RENDER] Массив пуль дрона пуст.");
    } else {
        console.log(`[DEBUG RENDER] В массиве пуль дрона ${gameContext.dronBullets.length} шт.`);
        
        gameContext.dronBullets.forEach((bullet, index) => {            
            if (bullet.alive) {
                bullet.draw(ctx);
            } else {
                console.warn(`[DEBUG RENDER] Пуля #${index} пропущена: alive=false`);
            }
        });
    }
    
    ctx.fillStyle = '#0ff';
    ctx.font = '14px monospace';
    const locId = gameContext.map[gameContext.player.mapY][gameContext.player.mapX];
    ctx.fillText(`Локация: ${locId}`, 10, 20);
    ctx.fillText(`Позиция: ${gameContext.player.x.toFixed(0)}, ${gameContext.player.y.toFixed(0)}`, 10, 40);
    ctx.fillText(`На карте: (${gameContext.player.mapX}, ${gameContext.player.mapY})`, 10, 60);
    ctx.fillText(`Пуль: ${gameContext.bullets.length}`, 10, 80);
    ctx.fillText(`NPC: ${gameContext.npcs.length}`, 10, 100);

    // === НОВОЕ: Отрисовка таймера (правый верхний угол) ===
    if (gameContext.countdownActive) {
        const elapsed = (Date.now() - gameContext.countdownStartTime) / 1000;
        const remaining = Math.max(0, Math.ceil(gameContext.countdownDuration - elapsed));
        
        ctx.fillStyle = '#ff3333'; // Красный цвет для привлечения внимания
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'right'; // Выравнивание по правому краю
        
        // Рисуем текст с небольшим отступом от правого края (canvas.width - 20)
        ctx.fillText(`ВРЕМЯ: ${remaining}с`, canvas.width - 20, 40);
        
        ctx.textAlign = 'left'; // Возвращаем стандартное выравнивание
    }

    // === НОВОЕ: Отрисовка диалога (поверх всего) ===
    if (gameContext.dialogSystem) {
        gameContext.dialogSystem.draw(ctx);
    }
}

// === ЗАГЛУШКА: Срабатывает по окончании таймера ===
function onCountdownFinished() {
    console.log("⏰ ТАЙМЕР ЗАВЕРШЕН! Прилетает дрон!");
    gameContext.dron = new PoliceDron();

    // === ЗАПУСК ЖУЖЖАНИЯ ДРОНА ===
    if (sounds.dron) {
        sounds.dron.currentTime = 0;
        sounds.dron.play().catch(e => console.warn('Дрон: звук заблокирован', e));
    }
}

// --- Запуск ---
requestAnimationFrame(gameLoop);