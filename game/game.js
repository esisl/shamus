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
            npc.interaction = resolveInteraction(npcConfig.interaction);  // ← РАЗРЕШАЕМ КЛЮЧ
            gameContext.npcs.push(npc);
        }
        console.log(`[SPAWN] Создано ${npcConfig.count} x ${className} в зоне ${npcConfig.spawnZone} локации [${mapX},${mapY}]`);
    } else {
        // Одиночный спавн по точным координатам
        const npc = createNPCInstance(className, npcConfig.type, mapX, mapY, npcConfig.x, npcConfig.y);
        npc.state = npcConfig.initialState || 'stay';
        npc.direction = npcConfig.direction || 180;
        npc.interaction = resolveInteraction(npcConfig.interaction);  // ← РАЗРЕШАЕМ КЛЮЧ
        gameContext.npcs.push(npc);
        console.log(`[SPAWN] Создан ${className} (${npcConfig.type}) в локации [${mapX},${mapY}]`);
    }
}

// === НОВАЯ ФУНКЦИЯ: преобразует dialogKey в реальный диалог ===
function resolveInteraction(interaction) {
    if (!interaction) return {};
    if (interaction.dialogKey) {
        const dialog = getDialog(interaction.dialogKey);
        if (dialog && dialog.length > 0) {
            return { dialog: dialog };
        } else {
            console.warn(`Диалог с ключом '${interaction.dialogKey}' не найден для языка '${gameContext.currentLanguage}'`);
            return {};
        }
    }
    return interaction;
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

// --- Воспроизведение видеоролика ---
function playVideo(videoKey, onComplete) {
    const lang = gameContext.currentLanguage || 'ru';
    const videoSrc = VIDEO_MAP[videoKey]?.[lang];
    
    if (!videoSrc) {
        console.warn(`[VIDEO] Не найден источник для ключа '${videoKey}', язык '${lang}'`);
        if (onComplete) onComplete();
        return;
    }
    
    gameContext.isVideoPlaying = true;
    
    const videoScreen = document.getElementById('video-screen');
    const video = document.getElementById('game-video');
    const fallback = document.getElementById('video-fallback');
    const fallbackSubtitle = document.getElementById('fallback-subtitle');
    const skipBtn = document.getElementById('skip-video-btn');
    
    // Сброс состояния
    video.classList.remove('hidden');
    fallback.classList.add('hidden');
    videoScreen.classList.remove('hidden');
    
    // Субтитры для заглушки
    const subtitles = {
        intro: { ru: 'Вступление: Кайто выходит на след...', en: 'Intro: Kaito is on the trail...' },
        rikki_dialog: { ru: 'Диалог с Rikki Rat', en: 'Dialog with Rikki Rat' },
        victory: { ru: 'Победа! Кайто победил Rikki Rat', en: 'Victory! Kaito defeated Rikki Rat' }
    };
    fallbackSubtitle.textContent = subtitles[videoKey]?.[lang] || '';
    
    // Функция завершения
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        
        video.pause();
        video.removeAttribute('src');
        video.load();
        
        videoScreen.classList.add('hidden');
        gameContext.isVideoPlaying = false;
        gameContext.videosPlayed[videoKey] = true;
        
        // === УДАЛЕНИЕ ВСЕХ ОБРАБОТЧИКОВ ===
        skipBtn.removeEventListener('click', finish);
        videoScreen.removeEventListener('click', screenClickHandler);
        document.removeEventListener('keydown', keyHandler);
        video.removeEventListener('ended', finish);
        video.removeEventListener('error', showError);
        
        if (onComplete) onComplete();
    };
    
    // Обработчик ошибки — показываем заглушку
    const showError = () => {
        console.warn(`[VIDEO] Не удалось загрузить ${videoSrc}, показываем заглушку`);
        video.classList.add('hidden');
        fallback.classList.remove('hidden');
    };
    
    // Привязываем события
    video.addEventListener('ended', finish);
    video.addEventListener('error', showError);
    // === ОБРАБОТЧИКИ ПРОПУСКА ===
    // 1. Клик по кнопке "Пропустить"
    skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();  // Чтобы клик не сработал на video-screen
        finish();
    });

    // 2. Клик по всему видео-экрану
    const screenClickHandler = (e) => {
        // Игнорируем клик, если он был по кнопке (уже обработан)
        if (e.target === skipBtn) return;
        finish();
    };
    videoScreen.addEventListener('click', screenClickHandler);

    // 3. Нажатие пробела или Enter
    const keyHandler = (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();  // Чтобы пробел не скроллил страницу
            finish();
        }
    };
    document.addEventListener('keydown', keyHandler);
    
    // Пытаемся загрузить видео
    video.src = videoSrc;
    video.play().catch(err => {
        console.warn(`[VIDEO] Автовоспроизведение заблокировано:`, err);
        showError();
    });
}

// --- Управление UI ---
// --- Запуск игры ---
function startGame(lang) {
    gameContext.currentLanguage = lang;
    document.getElementById('menu-screen').classList.add('hidden');
    
    // === ЗАПУСК ИНТРО-ВИДЕО ===
    // После окончания видео (или пропуска) — начнётся игра
    playVideo('intro', startGameplay);
}

// --- Инициализация геймплея (вызывается после интро) ---
function startGameplay() {
    gameContext.currentState = STATE.GAMEPLAY;
    
    // Создаём игрока
    gameContext.player = new Player('hero', 0, 5, 460, 500);
    loadSceneResources();
    
    // Инициализируем стартовую локацию
    const startX = gameContext.player.mapX;
    const startY = gameContext.player.mapY;
    const startKey = getLocationKey(startX, startY);
    
    gameContext.locationStates[startKey] = {
        enterTime: Date.now(),
        spawnedConfigs: new Set()
    };
    
    // Спавним NPC для стартовой локации
    processLocationSpawns(startX, startY);
    
    // Инициализируем систему диалогов (если ещё не инициализирована)
    if (!gameContext.dialogSystem) {
        gameContext.dialogSystem = new DialogSystem();
    }
    
    console.log(`🎮 Игра началась. Язык: ${lang}, стартовая локация: (${startX}, ${startY})`);
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

    // === 3. НОВОЕ: Сначала рисуем мёртвых NPC (на заднем плане) ===
    gameContext.npcs.forEach(npc => {
        if (npc.mapX === gameContext.player.mapX && npc.mapY === gameContext.player.mapY) {
            if (npc.status === 'dead' || npc.status === 'dying') {
                npc.draw(ctx);
            }
        }
    });
    
    const drawables = [];
    
    // Игрок (если жив)
    if (gameContext.player.status !== 'dead') {
        drawables.push({ type: 'player', obj: gameContext.player, y: gameContext.player.y, x: gameContext.player.x });
    } else {
        // Мёртвый игрок рисуем отдельно (на заднем плане)
        gameContext.player.draw(ctx);
    }
    
    // Живые NPC
    gameContext.npcs.forEach(npc => {
        if (npc.mapX === gameContext.player.mapX && npc.mapY === gameContext.player.mapY) {
            if (npc.status === 'alive') {
                drawables.push({ type: 'npc', obj: npc, y: npc.y, x: npc.x });
            }
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

        // === НОВОЕ: GAME OVER ===
    if (gameContext.player && gameContext.player.status === 'dead') {
        // Затемнение экрана
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Надпись GAME OVER
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        
        // Подсказка
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText('Нажмите F5 для перезапуска', canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
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