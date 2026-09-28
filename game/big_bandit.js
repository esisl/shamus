class BigBandit extends Character {
    constructor(mapX, mapY, x, y) {
        super('big_bandit', mapX, mapY, x, y, 3.0);  // Скорость бега 3.0
        
        this.direction = 180;  // Смотрит на юг (к герою)
        this.state = 'stay';
        
        // === Режимы поведения ===
        this.mode = 'idle';  // 'idle', 'chase', 'fight'
        
        // Дистанция для перехода в fight (размер спрайта)
        this.fightDistance = this.calculateFightDistance();

        // === Увеличенный collision radius для бандитов ===
        this.collisionRadius = 35;  // Было 20, стало 35
        
        // Для обхода препятствий
        this.obstacleTimer = 0;
        // === Указываем базовому классу использовать анимацию 'run' при движении ===
        this.movingAnimation = 'run';
    }
    
    // Вычисляет дистанцию fight из размера спрайта
    calculateFightDistance() {
        const spriteData = getSpriteData('big_bandit', 'fight', 0, 0);
        return spriteData ? spriteData.w : 100;  // Fallback: 100 пикселей
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
            this.mode = 'idle';
            this.state = 'stay';
            this.isMoving = false;
            return;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // === Переключение режимов ===
        if (distance <= this.fightDistance) {
            if (this.mode !== 'fight') {
                this.mode = 'fight';
                this.isMoving = false; // Останавливаем движение при переходе в бой
                this.state = 'fight';
                this.frame = 0;
                this.animCounter = 0;
            }
        } else {
            if (this.mode !== 'chase') {
                this.mode = 'chase';
            }
        }
        
        // === Поведение в зависимости от режима ===
        if (this.mode === 'fight') {
            this.updateFight();
        } else if (this.mode === 'chase') {
            // === ГЛАВНОЕ ИСПРАВЛЕНИЕ ===
            // 1. Говорим базовому классу, куда бежать
            this.moveTo(player.x, player.y);
            // 2. Запускаем базовую логику, которая сама умеет обходить стены
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
}