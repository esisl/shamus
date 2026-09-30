class BigBandit extends Character {
    constructor(mapX, mapY, x, y) {
        super('samura', mapX, mapY, x, y, 3.0);
        
        this.direction = 180;
        this.state = 'stay';
        this.mode = 'idle';
        this.fightDistance = this.calculateFightDistance();
        this.collisionRadius = 35;
        this.movingAnimation = 'run';
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
            this.mode = 'idle';
            this.state = 'stay';
            this.isMoving = false;
            return;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.fightDistance) {
            if (this.mode !== 'fight') {
                this.mode = 'fight';
                this.isMoving = false;
                this.state = 'fight';
                this.frame = 0;
                this.animCounter = 0;
            }
        } else {
            if (this.mode !== 'chase') {
                this.mode = 'chase';
            }
        }
        
        if (this.mode === 'fight') {
            this.updateFight();
        } else if (this.mode === 'chase') {
            // === ИСПОЛЬЗУЕМ УМНЫЙ БАЗОВЫЙ МЕТОД ===
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
}