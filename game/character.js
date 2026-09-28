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
        
        this.status = 'alive';
        this.collisionRadius = 100;
        
        // === Умный обход препятствий ===
        this.obstacleTimer = 0;
        this.slideDirection = 0;  // 0=нет, 1=влево, -1=вправо
        this.ignoreNPCCollisions = false;  // Флаг для Diler и подобных
        this.movingAnimation = 'walk';  // Анимация при движении (можно переопределить на 'run')
    }

    // Запуск смерти
    kill() {
        if (this.status !== 'alive') return;
        
        this.status = 'dying';
        this.state = 'die';
        this.frame = 0;
        this.animCounter = 0;
        this.isMoving = false;
        this.speed = 0;  // === Обнуляем скорость ===
        this.targetX = null;
        this.targetY = null;
        
        console.log(`NPC ${this.type} начал умирать`);
    }

    // Обновление (для NPC с анимацией смерти)
    update() {
        if (this.status === 'dying') {
            // Проигрываем анимацию die
            this.animCounter++;
            if (this.animCounter >= this.animSpeed) {
                const frameCount = getFrameCount(this.type, 'die');
                if (frameCount > 0) {
                    this.frame++;
                    if (this.frame >= frameCount) {
                        // Анимация die завершена — переходим в статус 'dead'
                        this.frame = frameCount - 1;  // Последний кадр
                        this.status = 'dead';
                        console.log(`NPC ${this.type} совсем умер`);
                    }
                } else {
                    // Нет анимации die — сразу мертв
                    this.status = 'dead';
                }
                this.animCounter = 0;
            }
            return;
        }
        
        // Для живых NPC — базовое обновление движения
        if (this.status === 'alive') {
            this.updateMovement();
        }
        // Для 'dead' ничего не делаем — просто отрисовывается последний кадр
    }
    
    // Установка цели движения
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
        this.obstacleTimer = 0;
        this.slideDirection = 0;
    }
    
    // Базовое обновление движения и анимации с умным обходом препятствий
    updateMovement() {
        if (!this.isMoving) {
            this.state = 'stay';
            this.animCounter++;
            if (this.animCounter >= this.animSpeed) {
                const frameCount = getFrameCount(this.type, 'stay');
                if (frameCount > 0) {
                    this.frame = (this.frame + 1) % frameCount;
                }
                this.animCounter = 0;
            }
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
            this.obstacleTimer = 0;
            this.slideDirection = 0;
            return;
        }
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        const nextX = this.x + normalizedDx * this.speed;
        const nextY = this.y + normalizedDy * this.speed;
        
        // Проверка проходимости и коллизий
        const walkable = isWalkable(nextX, nextY, this.mapX, this.mapY);
        const collides = collidesWithNPC(nextX, nextY, this.mapX, this.mapY, this);
        
        if (walkable && !collides) {
            // Путь свободен
            this.x = nextX;
            this.y = nextY;
            this.obstacleTimer = 0;
            this.slideDirection = 0;
        } else {
            // === ПРЕПЯТСТВИЕ: включаем режим скольжения ===
            this.obstacleTimer++;
            
            if (this.obstacleTimer > 5) {
                // Выбираем направление скольжения, если ещё не выбрали
                if (this.slideDirection === 0) {
                    // Перпендикулярные векторы
                    const perpX = -normalizedDy;
                    const perpY = normalizedDx;
                    const slideDist = 30;
                    
                    const leftX = this.x + perpX * slideDist;
                    const leftY = this.y + perpY * slideDist;
                    const rightX = this.x - perpX * slideDist;
                    const rightY = this.y - perpY * slideDist;
                    
                    const leftOk = isWalkable(leftX, leftY, this.mapX, this.mapY) && !collidesWithNPC(leftX, leftY, this.mapX, this.mapY, this);
                    const rightOk = isWalkable(rightX, rightY, this.mapX, this.mapY) && !collidesWithNPC(rightX, rightY, this.mapX, this.mapY, this);
                    
                    if (leftOk && !rightOk) {
                        this.slideDirection = 1; // Влево
                    } else if (rightOk && !leftOk) {
                        this.slideDirection = -1; // Вправо
                    } else if (leftOk && rightOk) {
                        this.slideDirection = Math.random() < 0.5 ? 1 : -1; // Случайно, если обе свободны
                    } else {
                        // Обе стороны заблокированы — стоим
                        this.slideDirection = 0;
                        this.obstacleTimer = 0;
                    }
                }
                
                // Двигаемся в сторону скольжения
                if (this.slideDirection !== 0) {
                    const perpX = -normalizedDy * this.slideDirection;
                    const perpY = normalizedDx * this.slideDirection;
                    
                    const slideX = this.x + perpX * this.speed;
                    const slideY = this.y + perpY * this.speed;
                    
                    if (isWalkable(slideX, slideY, this.mapX, this.mapY) && !collidesWithNPC(slideX, slideY, this.mapX, this.mapY, this)) {
                        this.x = slideX;
                        this.y = slideY;
                    } else {
                        // Скольжение заблокировано — сбрасываем
                        this.slideDirection = 0;
                        this.obstacleTimer = 0;
                    }
                }
            }
        }
        
        // Обновляем направление
        this.direction = getDirectionFromVector(normalizedDx, normalizedDy);
        
        // Анимация движения (по умолчанию 'walk', но можно переопределить в наследниках)
        const animName = this.movingAnimation || 'walk';
        this.state = animName;
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, animName);
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
    }
    
    // Отрисовка персонажа
    draw(ctx) {
        if (!resources.atlas) return;

        // Для 'dead' — всегда рисуем последний кадр die
        const drawState = this.status === 'dead' ? 'die' : this.state;
        const drawFrame = this.status === 'dead' 
            ? Math.max(0, getFrameCount(this.type, 'die') - 1) 
            : this.frame;
        
        const spriteData = getSpriteData(this.type, drawState, this.direction, drawFrame);
        
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
