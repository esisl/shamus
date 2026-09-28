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
    }
    
    // Вычисляет дистанцию fight из размера спрайта
    calculateFightDistance() {
        const spriteData = getSpriteData('big_bandit', 'fight', 0, 0);
        return spriteData ? spriteData.w : 100;  // Fallback: 100 пикселей
    }
    
    update() {
        // Если умирает — стандартная логика смерти
        if (this.status === 'dying' || this.status === 'dead') {
            super.update();
            return;
        }
        
        const player = gameContext.player;
        if (!player) return;
        
        // Проверяем, в той ли локации игрок
        const sameLocation = player.mapX === this.mapX && player.mapY === this.mapY;
        
        if (!sameLocation) {
            // Игрок в другой локации — стоим
            this.mode = 'idle';
            this.state = 'stay';
            this.isMoving = false;
            return;
        }
        
        // Расстояние до игрока
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // === Переключение режимов ===
        if (distance <= this.fightDistance) {
            // Приблизились — переходим в fight
            if (this.mode !== 'fight') {
                this.mode = 'fight';
                this.isMoving = false;
                this.state = 'fight';
                this.frame = 0;
                this.animCounter = 0;
                console.log(`Бандит перешел в режим fight`);
            }
        } else {
            // Далеко — бежим к герою
            if (this.mode !== 'chase') {
                this.mode = 'chase';
                this.state = 'run';
            }
        }
        
        // === Поведение в зависимости от режима ===
        if (this.mode === 'fight') {
            this.updateFight();
        } else if (this.mode === 'chase') {
            this.updateChase();
        } else {
            this.updateMovement();
        }
    }
    
    // Обновление в режиме fight
    updateFight() {
        // Циклическая анимация fight
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, 'fight');
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
    }
    
    // Обновление в режиме chase (бег к герою)
    updateChase() {
        const player = gameContext.player;
        if (!player) return;
        
        // Цель — позиция игрока
        this.targetX = player.x;
        this.targetY = player.y;
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.speed) {
            // Дошли до цели
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            return;
        }
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        const nextX = this.x + normalizedDx * this.speed;
        const nextY = this.y + normalizedDy * this.speed;
        
        // Проверка проходимости
        const walkable = isWalkable(nextX, nextY, this.mapX, this.mapY);
        
        // Проверка коллизии с другими NPC
        const collides = collidesWithNPC(nextX, nextY, this.mapX, this.mapY, this);
        
        if (walkable && !collides) {
            // Путь свободен — двигаемся
            this.x = nextX;
            this.y = nextY;
            this.obstacleTimer = 0;  // Сбрасываем таймер препятствия
        } else {
            // Препятствие — пытаемся обходить
            this.obstacleTimer++;
            
            if (this.obstacleTimer > 10) {
                // Препятствие слишком долго — сдвигаем цель в сторону
                const offsetAngle = (Math.random() - 0.5) * Math.PI;  // Случайный угол
                const offsetDist = 50;
                
                this.targetX = player.x + Math.cos(offsetAngle) * offsetDist;
                this.targetY = player.y + Math.sin(offsetAngle) * offsetDist;
                
                this.obstacleTimer = 0;
            }
        }
        
        // Обновляем направление
        this.direction = getDirectionFromVector(normalizedDx, normalizedDy);
        
        // Анимация бега
        this.state = 'run';
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, 'run');
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
    }
}