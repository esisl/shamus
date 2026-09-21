// --- Состояния игры ---
const STATE = {
    MENU: 0,
    VIDEO: 1,
    GAMEPLAY: 2,
    GAMEOVER: 3
};

// --- Игровой контекст ---
const gameContext = {
    // Карта 8x6 (8 колонок, 6 строк)
    map: [
        ['WN', 'N', 'N', 'N', 'N', 'NE'],
        ['W', 'WE', 'WS', 'WE', 'WE', 'E'],
        ['W', 'WE', 'NESW', 'NESW', 'WE', 'E'],
        ['W', 'WE', 'NESW', 'NESW', 'WE', 'E'],
        ['W', 'WE', 'WE', 'WE', 'WE', 'E'],
        ['SW', 'S', 'S', 'S', 'S', 'SE']
    ],
    
    player: {
        type: 'hero',
        mapX: 2,
        mapY: 2,
        x: 640,          // Центр по X (1280 / 2)
        y: 360,          // Центр по Y (720 / 2)
        state: 'stay',
        direction: 180,
        frame: 0,
        speed: 2.5,      // Пикселей за кадр (подберите под себя)
        animSpeed: 6,
        animCounter: 0,
        targetX: null,
        targetY: null,
        isMoving: false,
    
        // === Переходы между локациями ===
        transitionTimer: 0,       // Время нахождения в зоне перехода (секунды)
        transitionZone: null,     // Тип зоны перехода, в которой находится игрок (E/S/W/N)
        isTransitioning: false,    // Флаг: происходит ли переход (загрузка новой локации)
        previousZone: 'walk'  // Тип зоны, в которой игрок был на предыдущем кадре
    },
    
    // Текущее состояние
    currentState: STATE.MENU,
    currentLanguage: 'ru'
};

// Маппинг игровых направлений на ключи спрайтов в ATLAS_DATA
// Формат: игровое_направление → ключ_в_ATLAS_DATA
const DIRECTION_MAP = {
    0: '270',    // N (север, вверх) → спрайт 225°
    45: '315',   // NE → спрайт 270°
    90: '000',   // E (восток, вправо) → спрайт 315°
    135: '045',  // SE → спрайт 000°
    180: '090',  // S (юг, вниз) → спрайт 045°
    225: '135',  // SW → спрайт 090°
    270: '180',  // W (запад, влево) → спрайт 135°
    315: '225'   // NW → спрайт 180°
};

// --- Ресурсы ---
const resources = {
    back: null,
    front: null,
    atlas: null
};