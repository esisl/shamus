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

    // === Дрон и его пули ===
    dron: null,
    dronBullets: [],

    // Текущее состояние
    currentState: STATE.MENU,
    currentLanguage: 'ru',

    // === НОВОЕ: Хранит время входа и заспавненные конфиги для каждой локации ===
    locationStates: {},

    // === Система диалогов ===
    dialogSystem: null,

    // === НОВОЕ: Пули рикки-крысы ===
    rikkiBullets: [],

    // === НОВОЕ: Состояние таймера обратного отсчета ===
    countdownActive: false,
    countdownDuration: 10, // Длительность в секундах
    countdownStartTime: 0  // Timestamp начала отсчета
};

// === НОВОЕ: Конфигурация содержимого локаций ===
const LOCATION_DATA = {
    '2_1': { // Локация 2,1 (mapX=2, mapY=1)
        npcs: [
            { 
                class: 'BigBandit', 
                spawnZone: 'W', 
                count: 7, 
                delay: 15, // Задержка 10 секунд после входа
                initialState: 'run', 
                interaction: {} 
            },
            { class: 'Character', type: 'bomzh', x: 728, y: 335, state: 'sit', direction: 135, delay: 0, interaction: {} },
            { class: 'Puta', type: 'puta', x: 553, y: 272, state: 'stay', direction: 45, delay: 0, interaction: {
                dialog: [
                        { speaker: 'npc', text: 'Привет, красавчик!' },
                        { speaker: 'hero', text: 'Привет...' },
                        { speaker: 'npc', text: 'Не хочешь провести время?' },
                        { speaker: 'hero', text: 'Нет, спасибо.' },
                        { speaker: 'npc', text: 'Как хочешь...' }
                    ]
            } }
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
            { class: 'Diler', type: 'diler', x: 292, y: 418, state: 'stay', direction: 315, delay: 0, interaction: {}
            }
        ]
    },
    '3_3':{
        npcs: [
            {
                class: 'RikkiRat',
                x: 640,
                y: 400,
                initialState: 'stay',
                delay: 0,
                interaction: {}
            }
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

// --- Звуки ---
const sounds = {
    fire: null,
    scream: null,
    dron: null,
    heels: null
};

// Загрузка всех звуков
function loadSounds() {
    sounds.fire = new Audio('assets/sounds/fire.ogg');
    sounds.fire.volume = 0.5;
    
    sounds.scream = new Audio('assets/sounds/scream.ogg');
    sounds.scream.volume = 0.7;
    
    sounds.dron = new Audio('assets/sounds/dron.ogg');
    sounds.dron.loop = true;
    sounds.dron.volume = 0.4;
    
    sounds.heels = new Audio('assets/sounds/heels.ogg');
    sounds.heels.loop = true;
    sounds.heels.volume = 0.5;
    
    sounds.samura = new Audio('assets/sounds/samura.ogg');
    sounds.samura.loop = true;
    sounds.samura.volume = 0.5;
    
    console.log('🔊 Звуки загружены');
}

// Вспомогательная функция для воспроизведения одноразовых звуков
// (создаём новый Audio каждый раз, чтобы можно было накладывать несколько)
function playSoundOnce(soundSrc, volume = 0.5) {
    const audio = new Audio(soundSrc);
    audio.volume = volume;
    audio.play().catch(e => console.warn('Звук заблокирован браузером:', e));
}