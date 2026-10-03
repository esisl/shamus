// --- Пуля дрона (с плоской структурой атласа) ---
class DronBullet {
    constructor(x, y, targetX, targetY, speed = 8) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.speed = speed;
        this.alive = true;
        this.type = 'fire';
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
            const radius = 25; // Радиус хитбокса героя
            if (segmentIntersectsCircle(this.prevX, this.prevY, this.x, this.y, player.x, player.y, radius)) {
                player.kill();
                this.alive = false;
                if (gameContext.dron) gameContext.dron.onHeroDead();
                console.log('🎯 Дрон попал в героя!');
                return;
            }
        }
        
        // === АНИМАЦИЯ (исправлена для плоской структуры fire) ===
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const flyData = ATLAS_DATA[this.type]?.[this.animation];
            // Считаем количество кадров напрямую из ключей объекта (их будет 2: "0" и "1")
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
            console.warn(`[DEBUG BULLET] ОШИБКА: Нет данных в ATLAS_DATA для ${this.type}.${this.animation}`);
            return;
        }
        
        // === ПРЯМОЙ ДОСТУП К КАДРУ ===
        // Так как у fire нет вложенности по направлениям, берем спрайт сразу по ключу кадра
        const spriteData = flyData[frameKey];
        
        if (!spriteData) {
            console.warn(`[DEBUG BULLET] ОШИБКА: Не найден спрайт для кадра '${frameKey}'. Доступные ключи:`, Object.keys(flyData));
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

// --- Полицейский дрон ---
class PoliceDron {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.type = 'police_dron';
        this.frame = 0;
        this.animCounter = 0;
        this.animSpeed = 6;
        this.direction = 90;  // Начальное направление (восток)
        
        // Параметры орбиты (эллипс по периметру экрана)
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.orbitRadiusX = canvas.width / 2 - 80;
        this.orbitRadiusY = canvas.height / 2 - 80;
        this.angle = 0;
        this.orbitSpeed = 0.012;  // радиан/кадр
        
        // Стрельба очередями
        this.shootTimer = 0;
        this.shootInterval = 150;  // кадров между очередями (~2.5 сек)
        this.burstCount = 0;       // сколько пуль осталось выпустить в очереди
        this.burstSize = 5;        // пуль в очереди
        this.burstDelay = 8;       // кадров между пулями в очереди
        this.burstTimer = 0;
        
        // Состояние
        this.heroDead = false;
        
        console.log('🚁 Дрон запущен!');
    }
    
    update() {
        // Движение по эллиптической орбите
        this.angle += this.orbitSpeed;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
        
        this.x = this.centerX + Math.cos(this.angle) * this.orbitRadiusX;
        this.y = this.centerY + Math.sin(this.angle) * this.orbitRadiusY;
        
        // === Вычисляем направление движения (касательная к эллипсу) ===
        const vx = -Math.sin(this.angle) * this.orbitRadiusX;
        const vy = Math.cos(this.angle) * this.orbitRadiusY;
        this.direction = getDirectionFromVector(vx, vy);
        
        // Анимация fly
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, 'fly');
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
        
        // Логика стрельбы (только если герой жив)
        if (!this.heroDead) {
            this.shootTimer++;
            
            // Запуск новой очереди
            if (this.burstCount === 0 && this.shootTimer >= this.shootInterval) {
                this.burstCount = this.burstSize;
                this.burstTimer = 0;
                this.shootTimer = 0;
                console.log(`🚁 Дрон начинает очередь (${this.burstSize} пуль)`);
            }
            
            // Выстрел в рамках очереди
            if (this.burstCount > 0) {
                this.burstTimer++;
                if (this.burstTimer >= this.burstDelay) {
                    this.fireBullet();
                    this.burstCount--;
                    this.burstTimer = 0;
                }
            }
        }
    }
    
    fireBullet() {
        const player = gameContext.player;
        if (!player) return;

        // === ЗВУК ВЫСТРЕЛА ДРОНА ===
        playSoundOnce('assets/sounds/fire.ogg', 0.4);
        
        // Стреляем в текущую позицию героя
        const bullet = new DronBullet(this.x, this.y, player.x, player.y, 8);
        gameContext.dronBullets.push(bullet);
        console.log(`🚁 Дрон выстрелил (осталось в очереди: ${this.burstCount})`);
    }
    
    onHeroDead() {
        this.heroDead = true;
        console.log('🚁 Дрон прекращает стрельбу (герой мёртв)');
    }
    
    draw(ctx) {
        if (!resources.atlas) return;
        
        const flyData = ATLAS_DATA[this.type]?.fly;
        if (!flyData) {
            console.warn(`[DRON] Нет данных для ${this.type}.fly`);
            return;
        }
        
        // === 1. Сначала пробуем нужное направление ===
        let spriteData = getSpriteData(this.type, 'fly', this.direction, this.frame);
        
        // === 2. Если не нашли — берём любое доступное направление ===
        if (!spriteData) {
            const availableDirKey = Object.keys(flyData)[0];
            if (!availableDirKey) {
                console.warn(`[DRON] Нет доступных направлений для ${this.type}.fly`);
                return;
            }
            
            const frameKey = String(this.frame);
            spriteData = flyData[availableDirKey]?.[frameKey];
            
            if (!spriteData) {
                console.warn(`[DRON] Нет кадра ${frameKey} для направления ${availableDirKey}`);
                return;
            }
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