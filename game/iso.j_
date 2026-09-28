// --- Определение направления движения ---

function getDirectionFromVector(dx, dy) {
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    angle = (angle + 360) % 360;
    
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];
    let closest = directions[0];
    let minDiff = Math.abs(angle - closest);
    
    for (let i = 1; i < directions.length; i++) {
        const diff = Math.abs(angle - directions[i]);
        const diffWrapped = Math.min(diff, 360 - diff);
        if (diffWrapped < minDiff) {
            minDiff = diffWrapped;
            closest = directions[i];
        }
    }
    return closest;
}