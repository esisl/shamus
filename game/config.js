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
    
   // Игрок теперь создается в game.js
    player: null,
    
    // Массив NPC (будет заполняться позже)
    npcs: [],
    bullets: [],  // === МАССИВ ПУЛЬ ===

    // Текущее состояние
    currentState: STATE.MENU,
    currentLanguage: 'ru',

    // === НОВОЕ: Хранит время входа и заспавненные конфиги для каждой локации ===
    locationStates: {} 
};

// === НОВОЕ: Конфигурация содержимого локаций ===
const LOCATION_DATA = {
    '2_1': { // Локация 2,1 (mapX=2, mapY=1)
        npcs: [
            { 
                class: 'BigBandit', 
                spawnZone: 'W', 
                count: 7, 
                delay: 10, // Задержка 10 секунд после входа
                initialState: 'run', 
                interaction: {} 
            },
            { class: 'Character', type: 'bomzh', x: 728, y: 335, state: 'sit', direction: 135, delay: 0, interaction: {} },
            { class: 'Puta', type: 'puta', x: 553, y: 272, state: 'stay', direction: 45, delay: 0, interaction: {} }
        ]
    },
    '2_2': { // Локация 2,2 (mapX=2, mapY=2)
        npcs: [
            { 
                class: 'Samura', 
                spawnZone: 'N', 
                count: 5, 
                delay: 10, // Задержка 10 секунд после входа
                initialState: 'run', 
                interaction: {} 
            },
            { class: 'Diler', type: 'diler', x: 292, y: 418, state: 'stay', direction: 315, delay: 0, interaction: {} }
        ]
    }
    // Остальные локации можно добавлять сюда по мере необходимости
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