// --- Пуля рикки-крысы ---
class RikkiRatBullet {
    constructor(x, y, targetX, targetY, speed = 7) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.speed = speed;
        this.alive = true;
        this.type = 'fire';  // Тип спрайта в атласе
        this.animation = 'fly';
        this.frame = 0;
        this.animCounter = 0;
        this.animSpeed = 2;
        this.age = 0;
        
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.dx = dist > 0 ? dx / dist : 0;
        this.dy = dist > 0 ? dy / dist : 0;
    }
    
    update() {
        if (!this.alive) return;
        
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        this.age++;
        
        // Проверка попадания в героя
        const player = gameContext.player;
        if (player && player.status === 'alive') {
            const radius = 25;
            if (segmentIntersectsCircle(this.prevX, this.prevY, this.x, this.y, player.x, player.y, radius)) {
                player.kill();
                this.alive = false;
                console.log('🎯 Рикки попал в героя!');
                return;
            }
        }
        
        // Анимация
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const flyData = ATLAS_DATA[this.type]?.[this.animation];
            const frameCount = flyData ? Object.keys(flyData).length : 2;
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
        
        // За пределами экрана или слишком старая
        if (this.x < -50 || this.x > 1330 || this.y < -50 || this.y > 770 || this.age > 180) {
            this.alive = false;
        }
    }
    
    draw(ctx) {
        if (!this.alive || !resources.atlas) return;
        
        const frameKey = String(this.frame);
        const flyData = ATLAS_DATA[this.type]?.[this.animation];
        
        if (!flyData) {
            console.warn(`[RIKKI BULLET] Нет данных для ${this.type}.${this.animation}`);
            return;
        }
        
        // Прямой доступ к кадру (плоская структура, как у fire)
        const spriteData = flyData[frameKey];
        
        if (!spriteData) {
            console.warn(`[RIKKI BULLET] Нет кадра ${frameKey}. Доступные ключи:`, Object.keys(flyData));
            return;
        }
        
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

// --- Рикки-крыса (финальный босс) ---
class RikkiRat extends Character {
    constructor(mapX, mapY, x, y) {
        super('rikki_rat', mapX, mapY, x, y, 2.5);
        
        this.direction = 180;
        this.state = 'stay';
        
        // === Режимы: 'wander', 'shoot' ===
        this.mode = 'wander';
        
        // Collision
        this.collisionRadius = 35;
        
        // Wander
        this.wanderTarget = null;
        this.wanderPause = 0;
        
        // Line of sight
        this.sightCheckTimer = 0;
        this.sightCheckInterval = 15;
        this.lastSightResult = false;
        
        // Стрельба очередями
        this.shootTimer = 0;
        this.shootInterval = 120;  // кадров между очередями (~2 сек)
        this.burstCount = 0;
        this.burstSize = 4;        // пуль в очереди
        this.burstDelay = 10;      // кадров между пулями
        this.burstTimer = 0;
        
        // Анимация движения
        this.movingAnimation = 'run';
        this.idleAnimation = 'run';
        
        console.log('🐀 Рикки-крыса появилась!');
    }
    
    update() {
        if (this.status === 'dying' || this.status === 'dead') {
            super.update();
            return;
        }
        
        const player = gameContext.player;
        if (!player) return;
        
        const sameLocation = player.mapX === this.mapX && player.mapY === this.mapY;
        if (!sameLocation) {
            this.mode = 'wander';
            this.isMoving = false;
            this.state = 'stay';
            return;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // === Переключение режимов ===
        
        // 1. Видим героя — стреляем
        if (this.mode !== 'shoot' && this.canSeePlayer(player)) {
            this.mode = 'shoot';
            this.isMoving = false;
            this.state = 'shoot';
            this.frame = 0;
            this.animCounter = 0;
            this.shootTimer = 0;
            this.burstCount = 0;
            console.log('🐀 Рикки увидел героя — открывает огонь!');
        }
        // 2. В режиме shoot, но потеряли из виду — возвращаемся в wander
        else if (this.mode === 'shoot' && !this.canSeePlayer(player)) {
            this.mode = 'wander';
            this.wanderTarget = null;
            this.burstCount = 0;
            console.log('🐀 Рикки потерял героя из виду');
        }
        
        // === Поведение ===
        if (this.mode === 'shoot') {
            this.updateShoot(player);
        } else {
            this.updateWander();
        }
    }
    
    // Проверка линии видимости
    canSeePlayer(player) {
        this.sightCheckTimer++;
        if (this.sightCheckTimer < this.sightCheckInterval) {
            return this.lastSightResult || false;
        }
        this.sightCheckTimer = 0;
        
        this.lastSightResult = hasLineOfSight(
            this.x, this.y,
            player.x, player.y,
            this.mapX, this.mapY
        );
        return this.lastSightResult;
    }
    
    // Хаотическое блуждание (как у самурая)
    updateWander() {
        if (!this.isMoving || !this.wanderTarget) {
            this.wanderPause++;
            if (this.wanderPause > 30) {
                const point = findRandomWalkablePoint(this.mapX, this.mapY);
                if (point) {
                    const pdx = point.x - this.x;
                    const pdy = point.y - this.y;
                    const dist = Math.sqrt(pdx * pdx + pdy * pdy);
                    
                    if (dist > 50) {
                        this.wanderTarget = point;
                        this.speed = 2.0;
                        this.movingAnimation = 'run';
                        this.moveTo(point.x, point.y);
                    }
                }
                this.wanderPause = 0;
            }
            return;
        }
        
        this.updateMovement();
    }
    
    // Стрельба очередями
    updateShoot(player) {
        // Анимация shoot
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, 'shoot');
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
        
        // Поворачиваемся к герою
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.direction = getDirectionFromVector(dx, dy);
        
        // Логика стрельбы
        this.shootTimer++;
        
        // Запуск новой очереди
        if (this.burstCount === 0 && this.shootTimer >= this.shootInterval) {
            this.burstCount = this.burstSize;
            this.burstTimer = 0;
            this.shootTimer = 0;
        }
        
        // Выстрел в рамках очереди
        if (this.burstCount > 0) {
            this.burstTimer++;
            if (this.burstTimer >= this.burstDelay) {
                this.fireBullet(player);
                this.burstCount--;
                this.burstTimer = 0;
            }
        }
    }
    
    fireBullet(player) {
        // Стреляем в текущую позицию героя (без упреждения — для честности)
        const bullet = new RikkiRatBullet(this.x, this.y - 50, player.x, player.y, 7);
        gameContext.rikkiBullets.push(bullet);
    }
}