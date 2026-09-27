// --- Класс пули ---

class Bullet {
    constructor(x, y, targetX, targetY, speed = 7) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.age = 0;
        this.frame = 0;
        this.animCounter = 0;
        this.animSpeed = 2;
        this.alive = true;
        this.type = 'fire';
        this.animation = 'fly';
        
        // Вычисляем нормализованный вектор движения напрямую
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
        
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        this.age++;
        
        this.animCounter++;
        if (this.animCounter >= this.animSpeed) {
            const frameCount = getFrameCount(this.type, this.animation);
            if (frameCount > 0) {
                this.frame = (this.frame + 1) % frameCount;
            }
            this.animCounter = 0;
        }
        
        if (this.x < -50 || this.x > 1330 || this.y < -50 || this.y > 770) {
            this.alive = false;
        }
        if (this.age > 120) {
            this.alive = false;
        }
    }
    
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