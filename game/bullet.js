// --- Класс пули ---

class Bullet {
    constructor(x, y, targetX, targetY, speed = 15) {
        this.x = x;
        this.y = y;
        this.prevX = x;  // === Предыдущая позиция для swept collision ===
        this.prevY = y;
        this.speed = speed;
        this.age = 0;
        this.frame = 0;
        this.animCounter = 0;
        this.animSpeed = 2;
        this.alive = true;
        this.type = 'fire';
        this.animation = 'fly';
        
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) {
            this.dx = 0;
            this.dy = 0;
        } else {
            this.dx = dx / dist;
            this.dy = dy / dist;
        }
    }
    
    update() {
        if (!this.alive) return;
        
        // === Сохраняем предыдущую позицию ПЕРЕД движением ===
        this.prevX = this.x;
        this.prevY = this.y;
        
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        this.age++;
        
        // === Проверка попадания в NPC (swept collision) ===
        this.checkNPCCollision();
        
        // Анимация пули
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, this.animation);
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
        
        // Убираем пулю при выходе за границы
        if (this.x < -50 || this.x > 1330 || this.y < -50 || this.y > 770) {
            this.alive = false;
        }
        if (this.age > 120) {
            this.alive = false;
        }
    }

    // === Проверка попадания в NPC через swept collision ===
    checkNPCCollision() {
    const player = gameContext.player;
    if (!player) return;
    
    for (const npc of gameContext.npcs) {
        // Только NPC из текущей локации
        if (npc.mapX !== player.mapX || npc.mapY !== player.mapY) continue;
        
        // Только живые NPC
        if (npc.status !== 'alive') continue;
        if (npc.removed) continue;
        
        // === Проверка swept collision (отрезок движения пули) ===
        if (segmentIntersectsCircle(
            this.prevX, this.prevY, 
            this.x, this.y,
            npc.x, npc.y, 
            npc.collisionRadius
        )) {
            // Попадание!
            npc.kill();
            this.alive = false;
            console.log(`Пуля попала в NPC ${npc.type}`);
            return;
        }
        
        // === Дополнительная проверка: прямое попадание в текущей позиции ===
        const dx = this.x - npc.x;
        const dy = this.y - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < npc.collisionRadius) {
            npc.kill();
            this.alive = false;
            console.log(`Пуля попала в NPC ${npc.type} (прямое попадание)`);
            return;
        }
    }
}
    /*
    checkNPCCollision() {
        const player = gameContext.player;
        if (!player) return;
        
        for (const npc of gameContext.npcs) {
            // Только NPC из текущей локации
            if (npc.mapX !== player.mapX || npc.mapY !== player.mapY) continue;
            
            // Только живые NPC
            if (npc.status !== 'alive') continue;
            
            // Проверяем пересечение отрезка движения пули с bounding circle NPC
            if (segmentIntersectsCircle(
                this.prevX, this.prevY, 
                this.x, this.y,
                npc.x, npc.y, 
                npc.collisionRadius
            )) {
                // Попадание!
                npc.kill();
                this.alive = false;
                console.log(`Пуля попала в NPC ${npc.type}`);
                return;  // Пуля уничтожена, выходим
            }
        }
    }
        */
    
    draw(ctx) {
        if (!this.alive || !resources.atlas) return;
        if (this.age < 10) return;
        
        const frameKey = String(this.frame);
        const spriteData = ATLAS_DATA[this.type]?.[this.animation]?.[frameKey];
        
        if (spriteData) {
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
}