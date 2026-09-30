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
        this.collisionRadius = 20;
        
        // === Логика обхода препятствий ===
        this.obstacleTimer = 0;
        this.slideDirection = 0;
        this.movingAnimation = 'walk';

        // === Логика обнаружения застревания ===
        this.lastX = x;
        this.lastY = y;
        this.stuckTimer = 0;
        this.isStuck = false;
        this.originalTargetX = null;
        this.originalTargetY = null;
    }

    kill() {
        if (this.status !== 'alive') return;
        this.status = 'dying';
        this.state = 'die';
        this.frame = 0;
        this.animCounter = 0;
        this.isMoving = false;
        this.speed = 0;
        this.targetX = null;
        this.targetY = null;
        console.log(`NPC ${this.type} начал умирать`);
    }

    update() {
        if (this.status === 'dying') {
            this.animCounter++;
            if (this.animCounter >= this.animSpeed) {
                const frameCount = getFrameCount(this.type, 'die');
                if (frameCount > 0) {
                    this.frame++;
                    if (this.frame >= frameCount) {
                        this.frame = frameCount - 1;
                        this.status = 'dead';
                        console.log(`NPC ${this.type} совсем умер`);
                    }
                } else {
                    this.status = 'dead';
                }
                this.animCounter = 0;
            }
            return;
        }
        if (this.status === 'alive') {
            this.updateMovement();
        }
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
        this.obstacleTimer = 0;
        this.slideDirection = 0;
    }

    // === УМНОЕ ДВИЖЕНИЕ СО СКОЛЬЖЕНИЕМ И АНТИ-ЗАСТРЕВАНИЕМ ===
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
        
        // === ДОСТИЖЕНИЕ ЦЕЛИ ===
        if (distance <= this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            
            // Если это была точка unstuck, возвращаемся к оригинальной цели
            if (this.isStuck) {
                this.isStuck = false;
                this.stuckTimer = 0;
                this.targetX = this.originalTargetX;
                this.targetY = this.originalTargetY;
                this.originalTargetX = null;
                this.originalTargetY = null;
                this.isMoving = true;
                // НЕ делаем return — продолжаем движение к новой цели в этом же кадре
            } else {
                this.isMoving = false;
                this.state = 'stay';
                this.frame = 0;
                this.animCounter = 0;
                this.obstacleTimer = 0;
                this.slideDirection = 0;
                return;
            }
        }

        // === ДЕТЕКЦИЯ ЗАСТРЕВАНИЯ ===
        const distMoved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
        if (distMoved < 0.5) {
            this.stuckTimer++;
        } else {
            this.stuckTimer = 0;
            this.isStuck = false;
        }
        this.lastX = this.x;
        this.lastY = this.y;

        if (this.stuckTimer > 40 && !this.isStuck) {
            this.isStuck = true;
            this.originalTargetX = this.targetX;
            this.originalTargetY = this.targetY;
            
            const locId = gameContext.map[this.mapY][this.mapX];
            const locationData = LOCATIONS[locId];
            
            if (locationData && locationData.unstuck) {
                this.targetX = locationData.unstuck.x;
                this.targetY = locationData.unstuck.y;
                console.log(`NPC ${this.type} застрял! Бежит в unstuck (${this.targetX}, ${this.targetY})`);
            }
        }

        // === ПРОВЕРКА ДОСТИЖЕНИЯ UNSTUCK ===
        if (this.isStuck) {
            const distToUnstuck = Math.sqrt((this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2);
            
            // Если достигли unstuck точки (расстояние <= 50)
            if (distToUnstuck <= 50) {
                this.isStuck = false;
                this.stuckTimer = 0;
                this.targetX = this.originalTargetX;
                this.targetY = this.originalTargetY;
                this.originalTargetX = null;
                this.originalTargetY = null;
                console.log(`NPC ${this.type} достиг unstuck, возвращается к цели`);
            }
        }

        // === ПЕРЕСЧЁТ ВЕКТОРА (критически важно!) ===
        const currentDx = this.targetX - this.x;
        const currentDy = this.targetY - this.y;
        const currentDist = Math.sqrt(currentDx * currentDx + currentDy * currentDy);

        if (currentDist <= 0.001) {
            this.isMoving = false;
            return;
        }

        const normalizedDx = currentDx / currentDist;
        const normalizedDy = currentDy / currentDist;

        const nextX = this.x + normalizedDx * this.speed;
        const nextY = this.y + normalizedDy * this.speed;
        
        const walkable = isWalkable(nextX, nextY, this.mapX, this.mapY);
        const collides = collidesWithNPC(nextX, nextY, this.mapX, this.mapY, this);
        
        if (walkable && !collides) {
            // Путь свободен
            this.x = nextX;
            this.y = nextY;
            this.obstacleTimer = 0;
            this.slideDirection = 0;
        } else {
            // === ПРЕПЯТСТВИЕ: скольжение ===
            this.obstacleTimer++;
            
            if (this.obstacleTimer > 5) {
                if (this.slideDirection === 0) {
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
                        this.slideDirection = 1;
                    } else if (rightOk && !leftOk) {
                        this.slideDirection = -1;
                    } else if (leftOk && rightOk) {
                        this.slideDirection = Math.random() < 0.5 ? 1 : -1;
                    } else {
                        this.slideDirection = 0;
                        this.obstacleTimer = 0;
                    }
                }
                
                if (this.slideDirection !== 0) {
                    const perpX = -normalizedDy * this.slideDirection;
                    const perpY = normalizedDx * this.slideDirection;
                    
                    const slideX = this.x + perpX * this.speed;
                    const slideY = this.y + perpY * this.speed;
                    
                    if (isWalkable(slideX, slideY, this.mapX, this.mapY) && !collidesWithNPC(slideX, slideY, this.mapX, this.mapY, this)) {
                        this.x = slideX;
                        this.y = slideY;
                    } else {
                        this.slideDirection = 0;
                        this.obstacleTimer = 0;
                    }
                }
            }
        }
        
        this.direction = getDirectionFromVector(normalizedDx, normalizedDy);
        
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

    draw(ctx) {
        if (!resources.atlas) return;
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