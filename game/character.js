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

        // === Статус жизни NPC ===
        // 'alive' — живой, препятствие
        // 'dying' — проигрывается анимация die
        // 'dead' — совсем умер, не препятствие, рисуется последний кадр die
        this.status = 'alive';
        
        // Радиус для коллизий (половина ширины bounding box)
        this.collisionRadius = 20;
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
    }
    
    // Базовое обновление движения и анимации
    updateMovement() {
        if (!this.isMoving) {
            this.state = 'stay';
            
            // === АНИМАЦИЯ STAY ===
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
