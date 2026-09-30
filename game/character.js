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
        
        this.movingAnimation = 'walk';
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

    // Базовое обновление движения — простое и надежное
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
        
        // Достигли цели
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
        
        // Проверка проходимости и коллизий
        const walkable = isWalkable(nextX, nextY, this.mapX, this.mapY);
        const collides = collidesWithNPC(nextX, nextY, this.mapX, this.mapY, this);
        
        if (walkable && !collides) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // Уперлись — просто останавливаемся
            // Наследник (Samura) сам решит, что делать дальше
            this.isMoving = false;
            this.state = 'stay';
            this.frame = 0;
            this.animCounter = 0;
            return;
        }
        
        this.direction = getDirectionFromVector(normalizedDx, normalizedDy);
        
        // Анимация движения
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