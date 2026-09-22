// --- Работа с ATLAS_DATA ---

function directionToKey(direction) {
    return String(direction).padStart(3, '0');
}

function getFrameCount(characterType, animation) {
    const dirKey = "000";
    if (!ATLAS_DATA[characterType]) return 0;
    if (!ATLAS_DATA[characterType][animation]) return 0;
    if (!ATLAS_DATA[characterType][animation][dirKey]) return 0;
    return Object.keys(ATLAS_DATA[characterType][animation][dirKey]).length;
}

function getSpriteData(characterType, animation, direction, frame) {
    const atlasDirection = DIRECTION_MAP[direction];
    if (!atlasDirection) return null;
    
    const frameKey = String(frame);
    
    if (!ATLAS_DATA[characterType]) return null;
    if (!ATLAS_DATA[characterType][animation]) return null;
    if (!ATLAS_DATA[characterType][animation][atlasDirection]) return null;
    if (!ATLAS_DATA[characterType][animation][atlasDirection][frameKey]) return null;
    
    return ATLAS_DATA[characterType][animation][atlasDirection][frameKey];
}

// --- Базовый класс персонажа ---

class Character {
    constructor(type, mapX, mapY, x, y, speed = 2.5) {
        this.type = type;
        this.mapX = mapX;
        this.mapY = mapY;
        this.x = x;
        this.y = y;
        this.state = 'stay';
        this.direction = 180;
        this.frame = 0;
        this.speed = speed;
        this.animSpeed = 6;
        this.animCounter = 0;
        this.targetX = null;
        this.targetY = null;
        this.isMoving = false;
    }
    
    // Установка цели движения
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
    }
    
    // Базовое обновление движения и анимации
    updateMovement() {
        if (!this.isMoving) {
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        const nextX = this.x + normalizedDx * this.speed;
        const nextY = this.y + normalizedDy * this.speed;
        
        // Проверка проходимости
        if (!isWalkable(nextX, nextY, this.mapX, this.mapY)) {
            this.isMoving = false;
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        this.x = nextX;
        this.y = nextY;
        
        this.direction = getDirectionFromVector(normalizedDx, normalizedDy);
        
        // Анимация
        this.state = 'walk';
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, 'walk');
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
    }
    
    // Отрисовка персонажа
    draw(ctx) {
        if (!resources.atlas) return;
        
        const spriteData = getSpriteData(
            this.type,
            this.state,
            this.direction,
            this.frame
        );
        
        if (spriteData) {
            const drawX = this.x - spriteData.w / 2;
            const drawY = this.y - spriteData.h;
            
            ctx.drawImage(
                resources.atlas,
                spriteData.x, spriteData.y, spriteData.w, spriteData.h,
                drawX, drawY,
                spriteData.w, spriteData.h
            );
        }
    }
}

// --- Класс игрока (наследует Character) ---

class Player extends Character {
    constructor(type, mapX, mapY, x, y) {
        super(type, mapX, mapY, x, y, 2.5);
        
        // Скорости
        this.walkSpeed = 2.5;
        this.runSpeed = 5.0;
        
        // Поля переходов
        this.transitionTimer = 0;
        this.transitionZone = null;
        this.isTransitioning = false;
        this.previousZone = 'walk';
        
        // Для обработки двойного клика
        this.pendingMove = null;  // {x, y, timer}

        // === Стрельба ===
        this.isShooting = false;
        this.shootFrameCounter = 0;
        this.shootDuration = 30;  // Длительность анимации стрельбы (кадров)
    }

    // Стрельба с поворотом в сторону клика
    shoot(clickX, clickY) {
        // Нельзя стрелять во время движения или перехода
        if (this.isMoving || this.isTransitioning || this.isShooting) return;
        
        // Вычисляем направление к точке клика
        const dx = clickX - this.x;
        const dy = clickY - this.y;
        const shootDirection = getDirectionFromVector(dx, dy);
        
        // Поворачиваем героя
        this.direction = shootDirection;
        
        // Начинаем стрельбу
        this.isShooting = true;
        this.shootFrameCounter = 0;
        this.state = 'shoot';
        this.frame = 0;
        this.animCounter = 0;
        
        // Получаем данные спрайта для вычисления точки вылета
        const spriteData = getSpriteData(this.type, 'shoot', this.direction, 0);
        const bulletOffsetY = spriteData ? -(spriteData.h * 2 / 3) : -80;
        
        // Создаем пулю в направлении взгляда героя
        const bullet = new Bullet(
            this.x,
            this.y + bulletOffsetY,
            this.direction+90,  // Пуля летит в направлении взгляда героя
            5
        );
        
        gameContext.bullets.push(bullet);
        console.log(`Выстрел в направлении ${this.direction}° (клик: ${clickX.toFixed(0)}, ${clickY.toFixed(0)})`);
    }
    
    // Обработка клика мыши (с задержкой для определения dblclick)
    handleClick(clickX, clickY) {
        if (this.pendingMove) {
            // Уже есть ожидающий клик — это второй клик = dblclick
            clearTimeout(this.pendingMove.timer);
            this.pendingMove = null;
            this.runTo(clickX, clickY);
            console.log(`Бег: X=${clickX.toFixed(0)}, Y=${clickY.toFixed(0)}`);
        } else {
            // Первый клик — запоминаем и ждем
            const timer = setTimeout(() => {
                // Таймер истек, dblclick не пришел — это обычный walk
                if (this.pendingMove) {
                    this.walkTo(this.pendingMove.x, this.pendingMove.y);
                    console.log(`Ходьба: X=${this.pendingMove.x.toFixed(0)}, Y=${this.pendingMove.y.toFixed(0)}`);
                    this.pendingMove = null;
                }
            }, 250);
            
            this.pendingMove = { x: clickX, y: clickY, timer };
        }
    }
    
    // Ходьба к точке
    walkTo(x, y) {
        this.speed = this.walkSpeed;
        this.moveTo(x, y);
    }

    // Бег к точке
    runTo(x, y) {
        this.speed = this.runSpeed;
        this.moveTo(x, y);
    }

    // Переопределяем updateMovement — используем текущий state для анимации
    updateMovement() {
        if (!this.isMoving) {
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        const nextX = this.x + normalizedDx * this.speed;
        const nextY = this.y + normalizedDy * this.speed;
        
        if (!isWalkable(nextX, nextY, this.mapX, this.mapY)) {
            this.isMoving = false;
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        this.x = nextX;
        this.y = nextY;
        
        this.direction = getDirectionFromVector(normalizedDx, normalizedDy);
        
        // === ВАЖНО: используем 'run' или 'walk' в зависимости от скорости ===
        this.state = this.speed > this.walkSpeed ? 'run' : 'walk';
        
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, this.state);
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
    }

    // Переопределяем update — добавляем логику переходов
    update() {
        if (this.isTransitioning) return;
        
        // === Обработка стрельбы ===
        if (this.isShooting) {
            this.shootFrameCounter++;
            
            // Анимация стрельбы
            this.animCounter++;
            if (this.animCounter >= this.animSpeed) {
                const frameCount = getFrameCount(this.type, 'shoot');
                if (frameCount > 0) {
                    this.frame = (this.frame + 1) % frameCount;
                }
                this.animCounter = 0;
            }
            
            // Завершение стрельбы
            if (this.shootFrameCounter >= this.shootDuration) {
                this.isShooting = false;
                this.state = 'stay';
                this.frame = 0;
                this.animCounter = 0;
            }
            return;  // Во время стрельбы не обрабатываем движение и переходы
        }

        // === Проверка зон перехода ===
        this.checkTransition();
        
        // === Базовое движение ===
        this.updateMovement();
    }
    
    // Логика переходов между локациями
    checkTransition() {
        const currentZoneType = getTransitionZone(this.x, this.y, this.mapX, this.mapY);
        const isCurrentlyInTransition = currentZoneType !== null;
        const wasInWalkZone = this.previousZone === 'walk';
        
        if (isCurrentlyInTransition) {
            if (wasInWalkZone) {
                // Только что вошел из walk зоны
                if (this.transitionZone !== currentZoneType) {
                    this.transitionZone = currentZoneType;
                    this.transitionTimer = 0;
                    console.log(`Вошли в зону перехода: ${currentZoneType} (из walk)`);
                }
            }
            
            // Наращиваем таймер
            if (wasInWalkZone || this.transitionZone === currentZoneType) {
                this.transitionTimer += 1 / 60;
                
                if (this.transitionTimer >= 0.5) {
                    console.log(`Переход инициирован: ${currentZoneType}`);
                    this.transitionTo(currentZoneType);
                    return;
                }
            }
            
            this.previousZone = currentZoneType;
        } else {
            if (!wasInWalkZone) {
                console.log(`Вышли из зоны перехода (возврат в walk)`);
                this.transitionZone = null;
                this.transitionTimer = 0;
            }
            this.previousZone = 'walk';
        }
    }


    
    // Выполняет переход в новую локацию
    async transitionTo(direction) {
        this.isTransitioning = true;
        this.isMoving = false;
        this.state = 'stay';
        this.frame = 0;
        
        let newMapX = this.mapX;
        let newMapY = this.mapY;
        let spawnZoneType = '';
        
        switch (direction) {
            case 'E':
                newMapX = this.mapX + 1;
                spawnZoneType = 'W';
                break;
            case 'W':
                newMapX = this.mapX - 1;
                spawnZoneType = 'E';
                break;
            case 'S':
                newMapY = this.mapY + 1;
                spawnZoneType = 'N';
                break;
            case 'N':
                newMapY = this.mapY - 1;
                spawnZoneType = 'S';
                break;
        }
        
        console.log(`Переход: ${direction} -> карта(${newMapX}, ${newMapY}), спавн в зоне ${spawnZoneType}`);
        
        this.mapX = newMapX;
        this.mapY = newMapY;
        
        // Загружаем ресурсы новой локации
        await loadSceneResources();
        
        // Находим зону спавна
        const locId = gameContext.map[newMapY][newMapX];
        const spawnZone = findZoneByType(locId, spawnZoneType);
        
        if (spawnZone) {
            const center = getZoneCenter(spawnZone);
            this.x = center.x;
            this.y = center.y;
            console.log(`Спавн в центре зоны ${spawnZoneType}: (${center.x.toFixed(0)}, ${center.y.toFixed(0)})`);
        } else {
            this.x = 640;
            this.y = 360;
            console.warn(`Зона ${spawnZoneType} не найдена в локации ${locId}, спавн в центре`);
        }
        
        this.transitionTimer = 0;
        this.transitionZone = null;
        this.previousZone = 'walk';
        this.isTransitioning = false;
    }
    
    // Переопределяем draw — добавляем индикатор перехода
    draw(ctx) {
        super.draw(ctx);
        
        // Индикатор таймера перехода
        if (this.transitionZone) {
            const progress = this.transitionTimer / 0.5;
            
            const barWidth = 40;
            const barHeight = 6;
            const barX = this.x - barWidth / 2;
            const barY = this.y - 120;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
            
            ctx.fillStyle = '#0ff';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            ctx.fillStyle = '#0ff';
            ctx.font = '12px monospace';
            ctx.fillText(`→ ${this.transitionZone}`, barX, barY - 5);
        }
    }
}

// --- Класс пули ---

class Bullet {
    constructor(x, y, direction, speed = 7) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
        this.age = 0;          // Количество кадров с момента вылета
        this.frame = 0;
        this.animCounter = 0;
        this.animSpeed = 5;    // Скорость анимации пули
        this.alive = true;
        this.type = 'fire';    // Тип спрайта в ATLAS_DATA
        this.animation = 'fly';
        
        // Вычисляем вектор движения из направления
        const angle = direction * Math.PI / 180;
        console.log('angle', angle);
        this.dx = Math.sin(angle);
        this.dy = -Math.cos(angle);
    }
    
    update() {
        if (!this.alive) return;
        
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        this.age++;
        
        // Анимация пули
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, this.animation);
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
        
        // Пуля погибает, если вышла за границы экрана или прожила слишком долго
        if (this.x < -50 || this.x > 1330 || this.y < -50 || this.y > 770) {
            this.alive = false;
        }
        if (this.age > 120) {  // 2 секунды при 60 FPS
            this.alive = false;
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        if (!resources.atlas) return;
        
        // Первые 10 кадров не отображаем (чтобы не "проскальзывала" через героя)
        if (this.age < 10) return;
        
        // Для пули не используем DIRECTION_MAP — она летит в направлении выстрела
        const frameKey = String(this.frame);
        const spriteData = ATLAS_DATA[this.type]?.[this.animation]?.[frameKey];
        
        if (spriteData) {
            // Пуля рисуется по центру своей позиции
            const drawX = this.x - spriteData.w / 2;
            const drawY = this.y - spriteData.h / 2;
            
            ctx.drawImage(
                resources.atlas,
                spriteData.x, spriteData.y, spriteData.w, spriteData.h,
                drawX, drawY,
                spriteData.w, spriteData.h
            );
        }
    }
}