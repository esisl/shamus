class DialogSystem {
    constructor() {
        this.active = false;
        this.dialog = [];
        this.currentIndex = 0;
        this.currentReplica = null;
        this.replicaTimer = 0;
        this.replicaDuration = 120; // 2 секунды при 60 FPS
        this.npc = null;
    }
    
    startDialog(npc, dialog) {
        if (this.active) return;
        this.active = true;
        this.dialog = dialog;
        this.currentIndex = 0;
        this.npc = npc;
        this.showNextReplica();
        console.log(`💬 Диалог начат с ${npc.type}`);
    }
    
    showNextReplica() {
        if (this.currentIndex >= this.dialog.length) {
            this.endDialog();
            return;
        }
        this.currentReplica = this.dialog[this.currentIndex];
        this.replicaTimer = 0;
        this.currentIndex++;
    }
    
    update() {
        if (!this.active) return;
        
        this.replicaTimer++;
        if (this.replicaTimer >= this.replicaDuration) {
            this.showNextReplica();
        }
    }
    
    endDialog() {
        this.active = false;
        
        // === НОВОЕ: Помечаем NPC, что диалог уже сыгран ===
        if (this.npc) {
            this.npc.dialogPlayed = true;
            console.log(`💬 Диалог с ${this.npc.type} завершён, флаг dialogPlayed = true`);
        }
        
        this.dialog = [];
        this.currentReplica = null;
        this.npc = null;
    }
    
    isActive() {
        return this.active;
    }
    
    draw(ctx) {
        if (!this.active || !this.currentReplica) return;
        
        const replica = this.currentReplica;
        const isHero = replica.speaker === 'hero';
        
        // Позиция облачка
        let x, y;
        if (isHero) {
            // Облачко героя — над героем
            x = gameContext.player.x;
            y = gameContext.player.y - 150;
        } else {
            // Облачко NPC — над NPC
            x = this.npc.x;
            y = this.npc.y - 150;
        }
        
        // Цвет облачка
        const bgColor = isHero ? '#4488ff' : '#ffaa44';
        const textColor = '#ffffff';
        
        // Рисуем облачко
        this.drawBubble(ctx, x, y, replica.text, bgColor, textColor);
    }
    
    drawBubble(ctx, x, y, text, bgColor, textColor) {
        ctx.font = '16px monospace';
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const padding = 15;
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = 40;
        
        const bubbleX = x - bubbleWidth / 2;
        const bubbleY = y - bubbleHeight / 2;
        
        // Рисуем прямоугольник облачка
        ctx.fillStyle = bgColor;
        ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        
        // Рисуем "хвостик" облачка
        ctx.beginPath();
        ctx.moveTo(x - 10, bubbleY + bubbleHeight);
        ctx.lineTo(x, bubbleY + bubbleHeight + 15);
        ctx.lineTo(x + 10, bubbleY + bubbleHeight);
        ctx.closePath();
        ctx.fill();
        
        // Рисуем текст
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}