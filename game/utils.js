// --- Утилиты для работы с полигонами и зонами ---

// Проверка, находится ли точка внутри полигона (ray casting)
function pointInPolygon(x, y, polygon) {
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && 
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Получение текущей локации по позиции на карте
function getCurrentLocation(mapX, mapY) {
    const locId = gameContext.map[mapY][mapX];
    return LOCATIONS[locId];
}

// Проверка, находится ли точка в проходимой зоне (walk или transition)
function isWalkable(x, y, mapX, mapY) {
    const location = getCurrentLocation(mapX, mapY);
    if (!location || !location.zones) return false;
    
    for (const zone of location.zones) {
        if (zone.polygon_pixel && pointInPolygon(x, y, zone.polygon_pixel)) {
            if (zone.type === 'walk' || ['N', 'S', 'E', 'W'].includes(zone.type)) {
                return true;
            }
        }
    }
    return false;
}

// Определяет, в какой зоне перехода находится точка
function getTransitionZone(x, y, mapX, mapY) {
    const location = getCurrentLocation(mapX, mapY);
    if (!location || !location.zones) return null;
    
    const transitionTypes = ['N', 'S', 'E', 'W'];
    
    for (const zone of location.zones) {
        if (transitionTypes.includes(zone.type) && zone.polygon_pixel) {
            if (pointInPolygon(x, y, zone.polygon_pixel)) {
                return zone.type;
            }
        }
    }
    return null;
}

// Находит зону по типу в указанной локации
function findZoneByType(locId, zoneType) {
    const location = LOCATIONS[locId];
    if (!location || !location.zones) return null;
    
    for (const zone of location.zones) {
        if (zone.type === zoneType) {
            return zone;
        }
    }
    return null;
}

// Вычисляет центр полигона (среднее арифметическое точек)
function getZoneCenter(zone) {
    if (!zone.polygon_pixel || zone.polygon_pixel.length === 0) {
        return { x: 640, y: 360 };
    }
    
    let sumX = 0, sumY = 0;
    for (const point of zone.polygon_pixel) {
        sumX += point.x;
        sumY += point.y;
    }
    
    return {
        x: sumX / zone.polygon_pixel.length,
        y: sumY / zone.polygon_pixel.length
    };
}

// Определяет ближайшее из 8 направлений по вектору движения
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