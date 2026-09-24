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
    // В canvas Y растет вниз.
    // atan2(dy, dx): 0=вправо(E), PI/2=вниз(S), -PI/2=вверх(N)
    
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * 180 / Math.PI;
    
    // Приводим к диапазону [0, 360)
    if (angleDeg < 0) angleDeg += 360;
    
    // Теперь у нас есть угол в системе координат экрана (0=E, 90=S, 180=W, 270=N)
    // Но нам нужно вернуть ключ спрайта (0=N, 45=NE, 90=E...)
    // Проще всего использовать таблицу соответствия углов экранных -> игровым направлениям
    
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];
    let closestDirKey = 0;
    let minDiff = Infinity;
    
    for (let dir of directions) {
        // Определяем экранный угол для этого направления
        // N(0) -> 270, NE(45) -> 315, E(90) -> 0, SE(135) -> 45, S(180) -> 90, SW(225) -> 135, W(270) -> 180, NW(315) -> 225
        let screenAngleForDir = 0;
        
        switch(dir) {
            case 0:   screenAngleForDir = 0; break; // N
            case 45:  screenAngleForDir = 45; break; // NE
            case 90:  screenAngleForDir = 90;   break; // E
            case 135: screenAngleForDir = 135;  break; // SE
            case 180: screenAngleForDir = 180;  break; // S
            case 225: screenAngleForDir = 225; break; // SW
            case 270: screenAngleForDir = 270; break; // W
            case 315: screenAngleForDir = 315; break; // NW
        }
        
        let diff = Math.abs(angleDeg - screenAngleForDir);
        if (diff > 180) diff = 360 - diff;
        
        if (diff < minDiff) {
            minDiff = diff;
            closestDirKey = dir;
        }
    }
    
    return closestDirKey;
}