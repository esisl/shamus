// --- Инициализация Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
// }
// window.addEventListener('resize', resizeCanvas);
// resizeCanvas();

// --- Управление UI ---
function startGame(lang) {
    gameContext.currentLanguage = lang;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('video-screen').classList.remove('hidden');
    gameContext.currentState = STATE.VIDEO;
    
    loadSceneResources();
}

function skipVideo() {
    document.getElementById('video-screen').classList.add('hidden');
    gameContext.currentState = STATE.GAMEPLAY;
    // Начальная позиция героя в центре экрана
    gameContext.player.x = 640;  // Было 964
    gameContext.player.y = 360;  // Было 540
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
        const player = gameContext.player;
        const locId = gameContext.map[player.mapY][player.mapX];
        
        console.log(`\n=== Загрузка локации: ${locId} ===`);
        
        resources.back = await loadImage(`assets/backgrounds/back/${locId}.png`);
        resources.front = await loadImage(`assets/backgrounds/front/${locId}.png`);
        resources.atlas = await loadImage('assets/atlas_0.png');
        
        console.log(`=== Локация загружена ===\n`);
        
    } catch (e) {
        console.error("Ошибка загрузки ресурсов:", e);
    }
}

// --- Работа с полигонами ---

// Проверка, находится ли точка внутри полигона (алгоритм ray casting)
function pointInPolygon(x, y, polygon) {
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && 
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Получение текущей локации
function getCurrentLocation() {
    const player = gameContext.player;
    const locId = gameContext.map[player.mapY][player.mapX];
    return LOCATIONS[locId];
}

// --- Проверка коллизий (теперь тоже в пикселях) ---
function isWalkable(x, y) {
    const location = getCurrentLocation();
    if (!location || !location.zones) return false;
    
    for (const zone of location.zones) {
        if (zone.polygon_pixel && pointInPolygon(x, y, zone.polygon_pixel)) {
            // Walkable ИЛИ зона перехода
            if (zone.type === 'walk' || ['N', 'S', 'E', 'W'].includes(zone.type)) {
                return true;
            }
        }
    }
    return false;
}

// --- Переходы между локациями ---

// Определяет, в какой зоне перехода находится точка
function getTransitionZone(x, y) {
    const location = getCurrentLocation();
    if (!location || !location.zones) return null;
    
    const transitionTypes = ['N', 'S', 'E', 'W'];
    
    for (const zone of location.zones) {
        if (transitionTypes.includes(zone.type) && zone.polygon_pixel) {
            if (pointInPolygon(x, y, zone.polygon_pixel)) {
                return zone.type;
            }
        }
    }
    return null;
}

// Вычисляет центр полигона (среднее арифметическое точек)
function getZoneCenter(zone) {
    if (!zone.polygon_pixel || zone.polygon_pixel.length === 0) {
        return { x: 640, y: 360 }; // Fallback: центр экрана
    }
    
    let sumX = 0, sumY = 0;
    for (const point of zone.polygon_pixel) {
        sumX += point.x;
        sumY += point.y;
    }
    
    return {
        x: sumX / zone.polygon_pixel.length,
        y: sumY / zone.polygon_pixel.length
    };
}

// Находит зону по типу в указанной локации
function findZoneByType(locId, zoneType) {
    const location = LOCATIONS[locId];
    if (!location || !location.zones) return null;
    
    for (const zone of location.zones) {
        if (zone.type === zoneType) {
            return zone;
        }
    }
    return null;
}

// Выполняет переход в новую локацию
async function transitionTo(direction) {
    const player = gameContext.player;
    player.isTransitioning = true;
    player.isMoving = false;
    player.state = 'stay';
    player.frame = 0;
    
    // Вычисляем новые координаты на карте
    let newMapX = player.mapX;
    let newMapY = player.mapY;
    let spawnZoneType = '';
    
    switch (direction) {
        case 'E':
            newMapX = player.mapX + 1;
            spawnZoneType = 'W';
            break;
        case 'W':
            newMapX = player.mapX - 1;
            spawnZoneType = 'E';
            break;
        case 'S':
            newMapY = player.mapY + 1;
            spawnZoneType = 'N';
            break;
        case 'N':
            newMapY = player.mapY - 1;
            spawnZoneType = 'S';
            break;
    }
    
    console.log(`Переход: ${direction} -> карта(${newMapX}, ${newMapY}), спавн в зоне ${spawnZoneType}`);
    
    // Обновляем позицию на карте
    player.mapX = newMapX;
    player.mapY = newMapY;
    
    // Загружаем ресурсы новой локации
    await loadSceneResources();
    
    // Находим зону спавна в новой локации и ставим героя в её центр
    const locId = gameContext.map[newMapY][newMapX];
    const spawnZone = findZoneByType(locId, spawnZoneType);
    
    if (spawnZone) {
        const center = getZoneCenter(spawnZone);
        player.x = center.x;
        player.y = center.y;
        console.log(`Спавн в центре зоны ${spawnZoneType}: (${center.x.toFixed(0)}, ${center.y.toFixed(0)})`);
    } else {
        // Если зона спавна не найдена — ставим в центр экрана
        player.x = 640;
        player.y = 360;
        console.warn(`Зона ${spawnZoneType} не найдена в локации ${locId}, спавн в центре`);
    }
    
    // Сбрасываем таймеры
    player.transitionTimer = 0;
    player.transitionZone = null;
    player.isTransitioning = false;
}


// --- Работа с ATLAS_DATA ---

// Преобразует число направления (0, 45, 90...) в строку с ведущими нулями ("000", "045", "090"...)
function directionToKey(direction) {
    return String(direction).padStart(3, '0');
}

// Получает количество кадров для данной анимации и направления
function getFrameCount(characterType, animation) {
    // Берем первое направление как эталон (например, 045 для S)
    const atlasDirection = '045';
    if (!ATLAS_DATA[characterType]) return 0;
    if (!ATLAS_DATA[characterType][animation]) return 0;
    if (!ATLAS_DATA[characterType][animation][atlasDirection]) return 0;
    return Object.keys(ATLAS_DATA[characterType][animation][atlasDirection]).length;
}

// Получает данные спрайта
function getSpriteData(characterType, animation, direction, frame) {
    // Преобразуем игровое направление в ключ ATLAS_DATA
    const atlasDirection = DIRECTION_MAP[direction];
    if (!atlasDirection) {
        console.error(`Неизвестное направление: ${direction}`);
        return null;
    }
    
    const frameKey = String(frame);
    
    if (!ATLAS_DATA[characterType]) return null;
    if (!ATLAS_DATA[characterType][animation]) return null;
    if (!ATLAS_DATA[characterType][animation][atlasDirection]) return null;
    if (!ATLAS_DATA[characterType][animation][atlasDirection][frameKey]) return null;
    
    return ATLAS_DATA[characterType][animation][atlasDirection][frameKey];
}

// --- Работа с полигонами ---

// Проверка, находится ли точка внутри полигона (ray casting)
function pointInPolygon(x, y, polygon) {
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && 
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Получение текущей локации
function getCurrentLocation() {
    const player = gameContext.player;
    const locId = gameContext.map[player.mapY][player.mapX];
    return LOCATIONS[locId];
}

// Проверка, находится ли точка в зоне walk
function isWalkable(x, y) {
    const location = getCurrentLocation();
    if (!location || !location.zones) return false;
    
    for (const zone of location.zones) {
        // Проверяем только зоны типа 'walk'
        if (zone.type === 'walk' && zone.polygon_pixel) {
            if (pointInPolygon(x, y, zone.polygon_pixel)) {
                return true;
            }
        }
    }
    return false;
}

// --- Отрисовка персонажа ---
function drawCharacter(character) {
    if (!resources.atlas) return;
    
    const spriteData = getSpriteData(
        character.type,
        character.state,
        character.direction,
        character.frame
    );
    
    if (spriteData) {
        // character.x и character.y - это пиксельные координаты (0-1280, 0-720)
        // Центрируем спрайт по этим координатам
        const drawX = character.x - spriteData.w / 2;
        const drawY = character.y - spriteData.h;
        
        ctx.drawImage(
            resources.atlas,
            spriteData.x, spriteData.y, spriteData.w, spriteData.h,
            drawX, drawY,
            spriteData.w, spriteData.h
        );
        
        // Отладка: рисуем крестик в точке персонажа
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(character.x - 10, character.y);
        ctx.lineTo(character.x + 10, character.y);
        ctx.moveTo(character.x, character.y - 10);
        ctx.lineTo(character.x, character.y + 10);
        ctx.stroke();
    }
}

// --- Обработка мыши ---
canvas.addEventListener('click', (e) => {
    if (gameContext.currentState !== STATE.GAMEPLAY) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Всегда устанавливаем целевую точку
    gameContext.player.targetX = clickX;
    gameContext.player.targetY = clickY;
    gameContext.player.isMoving = true;
    
    console.log(`Цель: X=${clickX.toFixed(0)}, Y=${clickY.toFixed(0)}`);
});

// --- Обновление игрока ---
function updatePlayer() {
    const player = gameContext.player;
    
    // Если происходит переход — ничего не делаем
    if (player.isTransitioning) return;

    if (!player.isMoving) {
        player.state = 'stay';
        player.frame = 0;
        player.animCounter = 0;
        return;
    }

    // === Проверка зон перехода ===
    const currentTransitionZone = getTransitionZone(player.x, player.y);
    
    if (currentTransitionZone) {
        // Игрок в зоне перехода
        if (player.transitionZone === currentTransitionZone) {
            // Уже в этой зоне — наращиваем таймер
            player.transitionTimer += 1 / 60; // Предполагаем 60 FPS
            
            if (player.transitionTimer >= 0.5) {
                // 0.5 секунды прошло — выполняем переход
                console.log(`Переход инициирован: ${currentTransitionZone}`);
                transitionTo(currentTransitionZone);
                return;
            }
        } else {
            // Вошли в новую зону перехода — сбрасываем таймер
            player.transitionZone = currentTransitionZone;
            player.transitionTimer = 0;
            console.log(`Вошли в зону перехода: ${currentTransitionZone}`);
        }
    } else {
        // Игрок не в зоне перехода — сбрасываем
        if (player.transitionZone) {
            console.log(`Вышли из зоны перехода`);
        }
        player.transitionZone = null;
        player.transitionTimer = 0;
    }

    // === Движение ===
    if (!player.isMoving) return;
    
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Если дошли (с запасом в 1 пиксель, чтобы не дрожал)
    if (distance <= player.speed) {
        player.x = player.targetX;
        player.y = player.targetY;
        player.isMoving = false;
        player.state = 'stay';
        player.frame = 0;
        player.animCounter = 0;
        return;
    }
    
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;

    // Вычисляем следующую позицию
    const nextX = player.x + normalizedDx * player.speed;
    const nextY = player.y + normalizedDy * player.speed;
    
    // Проверяем walkable ИЛИ зону перехода (разрешаем заходить в зоны перехода)
    const location = getCurrentLocation();
    const inWalkable = isWalkable(nextX, nextY);
    const inTransition = getTransitionZone(nextX, nextY) !== null;
    
    if (!inWalkable && !inTransition) {
        player.isMoving = false;
        player.state = 'stay';
        player.frame = 0;
        player.animCounter = 0;
        return;
    }
    
    player.x = nextX;
    player.y = nextY;
    
    player.direction = getDirectionFromVector(normalizedDx, normalizedDy);
    
    player.state = 'walk';
    player.animCounter++;
    if (player.animCounter >= player.animSpeed) {
        const frameCount = getFrameCount(player.type, 'walk');
        if (frameCount > 0) {
            player.frame = (player.frame + 1) % frameCount;
        }
        player.animCounter = 0;
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
        updatePlayer();
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
    if (!resources.back || !resources.front || !resources.atlas) {
        console.log("Ждем загрузки ресурсов...");
        return;
    }

    // 1. Рисуем задний фон
    ctx.drawImage(resources.back, 0, 0, canvas.width, canvas.height);
    
    // 2. Рисуем персонажа
    drawCharacter(gameContext.player);
    
    // 3. ОТЛАДКА ПОЛИГОНОВ (Рисуем ДО переднего плана, чтобы исключить перекрытие)
    const location = getCurrentLocation();
    //console.log("Текущая локация:", location ? location.room_type : "НЕ НАЙДЕНА");
    
    // 4. Рисуем передний план. 
    // ВАЖНО: Если после этого шага красные линии исчезнут, значит front.png непрозрачен и перекрывает их.
    ctx.drawImage(resources.front, 0, 0, canvas.width, canvas.height);

    // Индикатор таймера перехода
    /*
    if (gameContext.player.transitionZone) {
        const progress = gameContext.player.transitionTimer / 0.5;
        
        // Рисуем полоску прогресса над головой героя
        const barWidth = 40;
        const barHeight = 6;
        const barX = gameContext.player.x - barWidth / 2;
        const barY = gameContext.player.y - 120; // Над головой
        
        // Фон полоски
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        // Заполнение
        ctx.fillStyle = '#0ff';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Подпись
        ctx.fillStyle = '#0ff';
        ctx.font = '12px monospace';
        ctx.fillText(`→ ${gameContext.player.transitionZone}`, barX, barY - 5);
    }
        */

    if (location && location.zones) {
        //console.log(`Найдено зон: ${location.zones.length}`);
        
        // Делаем линии ЯРКО-КРАСНЫМИ и ТОЛСТЫМИ, чтобы их невозможно было не заметить
        ctx.strokeStyle = '#FF0000'; 
        ctx.lineWidth = 4;
        
        for (let z = 0; z < location.zones.length; z++) {
            const zone = location.zones[z];
            if (zone.polygon_pixel && zone.polygon_pixel.length > 0) {
                //console.log(`Рисуем зону ${z} (${zone.type}), точек: ${zone.polygon_pixel.length}`);
                
                ctx.beginPath();
                const p0 = zone.polygon_pixel[0];
                ctx.moveTo(p0.x, p0.y);
                
                // Рисуем жирный красный квадрат в первой точке, чтобы точно видеть, где начало
                ctx.fillStyle = 'red';
                ctx.fillRect(p0.x - 6, p0.y - 6, 12, 12);
                
                for (let i = 1; i < zone.polygon_pixel.length; i++) {
                    const p = zone.polygon_pixel[i];
                    ctx.lineTo(p.x, p.y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }


        
    } else {
        console.warn("⚠️ Зоны не найдены для текущей локации!");
    }

    
}

requestAnimationFrame(gameLoop);