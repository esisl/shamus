// --- Класс путаны с кастомной анимацией ---

class Diler extends Character {
    constructor(type, mapX, mapY, x, y) {
        super(type, mapX, mapY, x, y, 0);  // Скорость 0 — не двигается

        // === Поведение при выстреле ===
        this.isFleeing = false;     // Убегает ли сейчас
        this.fleeSpeed = 4.0;       // Скорость побега
        this.removed = false;       // Пометка для удаления из игры
        this.hasReacted = false;    // Уже отреагировала на выстрел
    }
    
    // Переопределяем update
    update() {
        // Если помечена на удаление — ничего не делаем
        if (this.removed) return;
        
        // Если умирает — стандартная логика смерти
        if (this.status === 'dying') {
            super.update();
            return;
        }
        
        // === Проверяем, был ли выстрел ===
        if (!this.hasReacted && gameContext.bullets.length > 0) {
            this.startFleeing();
        }
        
        // === Если убегает — логика побега ===
        if (this.isFleeing) {
            this.updateFleeing();
            return;
        }
        
        // === Иначе — стандартная анимация курения ===
        this.updateMovement();
    }
    
    // Начало побега
    startFleeing() {
        this.hasReacted = true;
        this.isFleeing = true;
        this.speed = this.fleeSpeed;
        this.state = 'run';
        this.frame = 0;
        this.animCounter = 0;
        
        // Находим ближайшую зону перехода
        const targetZone = this.findNearestTransitionZone();
        
        if (targetZone) {
            const center = getZoneCenter(targetZone);
            this.targetX = center.x;
            this.targetY = center.y;
            this.isMoving = true;
            console.log(`Путана убегает к зоне ${targetZone.type} (${center.x.toFixed(0)}, ${center.y.toFixed(0)})`);
        } else {
            // Нет зон перехода — просто бежит в случайном направлении
            console.log(`Путана в панике, но не нашла выход!`);
            this.targetX = this.x + (Math.random() - 0.5) * 200;
            this.targetY = this.y + (Math.random() - 0.5) * 200;
            this.isMoving = true;
        }
    }
    
    // Поиск ближайшей зоны перехода в текущей локации
    findNearestTransitionZone() {
        const location = getCurrentLocation(this.mapX, this.mapY);
        if (!location || !location.zones) return null;
        
        const transitionTypes = ['N', 'S', 'E', 'W'];
        let nearest = null;
        let minDist = Infinity;
        
        for (const zone of location.zones) {
            if (transitionTypes.includes(zone.type) && zone.polygon_pixel) {
                const center = getZoneCenter(zone);
                const dx = center.x - this.x;
                const dy = center.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < minDist) {
                    minDist = dist;
                    nearest = zone;
                }
            }
        }
        
        return nearest;
    }
    
    // Обновление побега
    updateFleeing() {
        if (!this.isMoving) {
            // Дошла до цели или остановилась
            // Проверяем, в зоне ли перехода
            const zone = getTransitionZone(this.x, this.y, this.mapX, this.mapY);
            if (zone) {
                // Исчезаем!
                this.removed = true;
                this.isFleeing = false;
                console.log(`Путана исчезла через зону ${zone}`);
                return;
            }
            
            // Не в зоне перехода — пробуем найти другую
            const nextZone = this.findNearestTransitionZone();
            if (nextZone) {
                const center = getZoneCenter(nextZone);
                this.targetX = center.x;
                this.targetY = center.y;
                this.isMoving = true;
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
            return;
        }
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        const nextX = this.x + normalizedDx * this.speed;
        const nextY = this.y + normalizedDy * this.speed;
        
        // При побеге игнорируем коллизии с другими NPC, но проверяем walkable + transition
        const walkable = isWalkable(nextX, nextY, this.mapX, this.mapY);
        if (walkable) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // Уперлась в стену — попробуем оббежать
            // Простая стратегия: сдвигаем цель немного в сторону
            this.targetX += (Math.random() - 0.5) * 100;
            this.targetY += (Math.random() - 0.5) * 100;
        }
        
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
    
    // Переопределяем draw — не рисуем удаленных
    draw(ctx) {
        if (this.removed) return;
        super.draw(ctx);
    }
}