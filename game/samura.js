class Samura extends Character {
    constructor(mapX, mapY, x, y) {
        super('samura', mapX, mapY, x, y, 3.0);
        
        this.direction = 180;
        this.state = 'stay';
        this.mode = 'idle';
        
        // === Режимы: 'wander', 'chase', 'fight' ===
        this.mode = 'wander';
        
        // Fight
        this.fightDistance = this.calculateFightDistance();
        this.collisionRadius = 35;
        
        // Wander
        this.wanderTarget = null;
        this.wanderPause = 0;  // Пауза перед выбором новой точки
        
        // Line of sight
        this.sightCheckTimer = 0;
        this.sightCheckInterval = 15;  // Проверять видимость каждые 15 кадров
        
        // Анимация бега
        this.movingAnimation = 'run';
        this.idleAnimation = 'run';
    }
    
    calculateFightDistance() {
        const spriteData = getSpriteData('samura', 'fight', 0, 0);
        return spriteData ? spriteData.w : 100;
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
            // Игрок в другой локации — просто стоим
            this.mode = 'wander';
            this.isMoving = false;
            this.state = 'stay';
            return;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // === Переключение режимов ===
        
        // 1. Близко к герою — fight
        if (distance <= this.fightDistance) {
            if (this.mode !== 'fight') {
                this.mode = 'fight';
                this.isMoving = false;
                this.state = 'fight';
                this.frame = 0;
                this.animCounter = 0;
            }
        }
        // 2. Видим героя — chase
        else if (this.mode !== 'chase' && this.canSeePlayer(player)) {
            this.mode = 'chase';
        }
        // 3. В режиме chase, но потеряли из виду — возвращаемся в wander
        else if (this.mode === 'chase' && !this.canSeePlayer(player)) {
            this.mode = 'wander';
            this.wanderTarget = null;  // Выберем новую точку
        }
        
        // === Поведение ===
        if (this.mode === 'fight') {
            this.updateFight();
        } else if (this.mode === 'chase') {
            this.updateChase(player);
        } else {
            this.updateWander();
        }
    }
    
    // Проверка линии видимости
    canSeePlayer(player) {
        this.sightCheckTimer++;
        if (this.sightCheckTimer < this.sightCheckInterval) {
            // Возвращаем результат последней проверки, если таймер не истёк
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
    
    // Хаотическое блуждание
    updateWander() {
        // Если упёрлись или нет цели — выбираем новую точку
        if (!this.isMoving || !this.wanderTarget) {
            this.wanderPause++;
            if (this.wanderPause > 30) {  // Пауза ~0.5 сек
                const point = findRandomWalkablePoint(this.mapX, this.mapY);
                if (point) {
                    // Не выбираем точку слишком близко
                    const dx = point.x - this.x;
                    const dy = point.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 50) {
                        this.wanderTarget = point;
                        this.speed = 1.5;  // Медленная ходьба
                        this.movingAnimation = 'walk';
                        this.moveTo(point.x, point.y);
                    }
                }
                this.wanderPause = 0;
            }
            return;
        }
        
        this.updateMovement();
    }
    
    // Преследование
    updateChase(player) {
        this.speed = 3.0;  // Быстрый бег
        this.movingAnimation = 'run';
        this.moveTo(player.x, player.y);
        this.updateMovement();
    }
    
    // Анимация боя
    updateFight() {
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, 'fight');
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
    }
}