// --- Класс игрока (наследует Character) ---
class Player extends Character {
    constructor(type, mapX, mapY, x, y) {
        super(type, mapX, mapY, x, y, 2.5);
        
        this.walkSpeed = 2.5;
        this.runSpeed = 5.0;
        
        this.transitionZone = null;
        this.isTransitioning = false;
        this.previousZone = 'walk';
        
        this.pendingMove = null;
        
        this.isShooting = false;
        this.shootFrameCounter = 0;
        this.shootDuration = 30;
    }

    // Стрельба с поворотом в сторону клика
    shoot(clickX, clickY) {
        if (this.isMoving || this.isTransitioning || this.isShooting) return;

        // === ЗВУК ВЫСТРЕЛА ===
        playSoundOnce('assets/sounds/fire.ogg', 0.5);
        
        // === НОВОЕ: Запуск таймера при первом выстреле ===
        if (!gameContext.countdownActive) {
            gameContext.countdownActive = true;
            gameContext.countdownStartTime = Date.now();
            console.log("⏱️ Таймер обратного отсчета запущен!");
        }

        // 1. Поворачиваем героя (для анимации спрайта)
        const dx = clickX - this.x;
        const dy = clickY - this.y;
        this.direction = getDirectionFromVector(dx, dy);
        
        // 2. Запускаем анимацию стрельбы
        this.isShooting = true;
        this.shootFrameCounter = 0;
        this.state = 'shoot';
        this.frame = 0;
        this.animCounter = 0;
        
        // 3. Создаем пулю, которая летит ПРЯМО В ТОЧКУ КЛИКА
        const spriteData = getSpriteData(this.type, 'shoot', this.direction, 0);
        const bulletOffsetY = spriteData ? -(spriteData.h * 2 / 3) : -80;
        
        const bullet = new Bullet(
            this.x, 
            this.y + bulletOffsetY, 
            clickX,  // Передаем X цели
            clickY,  // Передаем Y цели
            7
        );
        
        gameContext.bullets.push(bullet);
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
        
        // === Проверка проходимости И коллизии с NPC ===
        if (!isWalkable(nextX, nextY, this.mapX, this.mapY) || 
            collidesWithNPC(nextX, nextY, this.mapX, this.mapY)) {
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
        // === БЛОКИРОВКА УПРАВЛЕНИЯ НА ВРЕМЯ ВИДЕО ===
        if (gameContext.isVideoPlaying) return;

        // === БЛОКИРОВКА УПРАВЛЕНИЯ ПРИ СМЕРТИ ===
        if (this.status === 'dying' || this.status === 'dead') {
            // Проигрываем анимацию die
            this.animCounter++;
            if (this.animCounter >= this.animSpeed) {
                const frameCount = getFrameCount(this.type, 'die');
                if (frameCount > 0) {
                    this.frame++;
                    if (this.frame >= frameCount) {
                        this.frame = frameCount - 1;
                        this.status = 'dead';
                    }
                }
                this.animCounter = 0;
            }
            return;  // Никаких движений, стрельбы, переходов
        }
        
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
        
        if (isCurrentlyInTransition && wasInWalkZone) {
            // Игрок только что вошел из walk зоны в transition зону — переходим
            console.log(`✓ Переход: ${currentZoneType}`);
            this.transitionTo(currentZoneType);
            return;
        }
        
        // Обновляем previousZone
        if (isCurrentlyInTransition) {
            this.previousZone = currentZoneType;
        } else {
            this.previousZone = 'walk';
        }
    }

    // Выполняет переход в новую локацию
    transitionTo(direction) {
        // === СБРОС ТАЙМЕРА ПРИ ПЕРЕХОДЕ ===
        gameContext.countdownActive = false;
        console.log(`⏱️ Таймер сброшен при переходе в новую локацию`);

        // === СБРОС ДРОНА И ОСТАНОВКА ЖУЖЖАНИЯ ===
        if (gameContext.dron && sounds.dron) {
            sounds.dron.pause();
            sounds.dron.currentTime = 0;
        }

        // === СБРОС ДРОНА ПРИ ПЕРЕХОДЕ ===
        gameContext.dron = null;
        gameContext.dronBullets = [];
        console.log(`🚁 Дрон исчез при переходе в новую локацию`);

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
        
        loadSceneResources();
        
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
        
        // Устанавливаем previousZone в тип spawn-зоны
        this.transitionZone = spawnZoneType;
        this.previousZone = spawnZoneType;
        this.isTransitioning = false;

        // === НОВОЕ: Проверка.special локации (6,2) для видео с Rikki ===
        if (this.mapX === 6 && this.mapY === 2 && !gameContext.videosPlayed.rikki_dialog) {
            // Блокируем управление на время видео
            gameContext.isVideoPlaying = true;
            playVideo('rikki_dialog', () => {
                gameContext.isVideoPlaying = true; // Остаётся заблокированным, пока видео не закончится
            });
        }
    }
    
    // Переопределяем draw — добавляем индикатор перехода
    draw(ctx) {
        super.draw(ctx);
        
    }
}