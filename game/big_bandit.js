class BigBandit extends Character {
    constructor(mapX, mapY, x, y) {
        super('big_bandit', mapX, mapY, x, y, 3.0);
        
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

        // === НОВОЕ: Атакует героя после 3 циклов анимации fight ===
        this.attackCycles = 3;
        this.fightFramesCounted = 0;

        this.runSound = null;
    }
    
    // Вычисляет дистанцию fight из размера спрайта
    calculateFightDistance() {
        const spriteData = getSpriteData('samura', 'fight', 0, 0);
        const spriteWidth = spriteData ? spriteData.w : 100;
        
        // === Увеличиваем дистанцию в 2 раза ===
        // Это даст самураям больше пространства для входа в режим fight
        return spriteWidth * 2;  // Было: spriteWidth, стало: spriteWidth * 2
    }
    
    update() {
        if (this.status === 'dying' || this.status === 'dead') {
            // === ОСТАНОВКА ЗВУКА БЕГА ПРИ СМЕРТИ ===
            if (this.runSound) {
                this.runSound.pause();
                this.runSound.currentTime = 0;
                this.runSound = null;
            }

            super.update();
            return;
        }
        
        const player = gameContext.player;
        if (!player) return;
        
        const sameLocation = player.mapX === this.mapX && player.mapY === this.mapY;
        if (!sameLocation) {
            this.mode = 'idle';
            this.state = 'stay';
            this.isMoving = false;
            this.fightFramesCounted = 0;  // === СБРОС СЧЁТЧИКА ===

            // === ОСТАНОВКА ЗВУКА БЕГА ===
            if (this.runSound) {
                this.runSound.pause();
                this.runSound.currentTime = 0;
                this.runSound = null;
            }

            return;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // === Переключение режимов ===
        if (distance <= this.fightDistance) {
            if (this.mode !== 'fight') {
                this.mode = 'fight';
                this.isMoving = false;
                this.state = 'fight';
                this.frame = 0;
                this.animCounter = 0;
                this.fightFramesCounted = 0;  // === СБРОС ПРИ ВХОДЕ В FIGHT ===
                // === КРИК ПРИ АТАКЕ ===
                playSoundOnce('assets/sounds/samura.ogg', 0.7);
            }
        } else {
            if (this.mode !== 'chase') {
                this.mode = 'chase';
                this.fightFramesCounted = 0;  // === СБРОС ПРИ ВЫХОДЕ ИЗ FIGHT ===

                // === ЗАПУСК ЗВУКА БЕГА ===
                if (!this.runSound) {
                    this.runSound = new Audio('assets/sounds/samura.ogg');
                    this.runSound.loop = true;
                    this.runSound.volume = 0.3;
                    this.runSound.play().catch(e => {});
                }
            }
        }
        
        // === Поведение ===
        if (this.mode === 'fight') {
            this.updateFight();
            
            // === ЛОГИКА АТАКИ ГЕРОЯ ===
            if (this.attackCycles > 0 && player.status === 'alive') {
                this.fightFramesCounted++;
                const frameCount = getFrameCount(this.type, 'fight');
                const threshold = this.attackCycles * frameCount;
                
                if (frameCount > 0 && this.fightFramesCounted >= threshold) {
                    player.kill();
                    console.log(`💀 ${this.type} убил героя в ближнем бою!`);
                    this.fightFramesCounted = 0;  // Сброс, чтобы не спамить
                }
            }
        } else if (this.mode === 'chase') {
            this.moveTo(player.x, player.y);
            this.updateMovement();
        } else {
            this.updateMovement();
        }
    }

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