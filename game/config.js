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
        ['E', 'WE', 'WES', 'WE', 'WS', 'E', 'WE', 'WS'],
        ['ES', 'W', 'NS', 'ES', 'WN', 'ES', 'WE', 'NWS'],
        ['NES', 'WE', 'WN', 'NES', 'W', 'NS', 'E', 'WN'],
        ['NS', 'ES', 'WE', 'NESW', 'WS', 'NES', 'WES', 'WS'],
        ['NS', 'NS', 'S', 'NS', 'NS', 'N', 'N', 'NS'],
        ['NE', 'WN', 'NE', 'WN', 'NE', 'WE', 'WE', 'WN'],
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
    '3_1':{npcs: [
        {class: 'Puta', type: 'puta', x: 490, y: 237, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Эй, ты что-то ищешь, да?' },
                { speaker: 'hero', text: 'Откуда ты знаешь?' },
                { speaker: 'npc', text: 'Вижу я таких. Глаза бегают.' },
                { speaker: 'hero', text: 'Мне нужен один тип. Рикки.' },
                { speaker: 'npc', text: 'Рикки... Слышала имя. Один мой клиент болтал — он где-то на северо-востоке. В трущобах.' },
                { speaker: 'hero', text: 'Спасибо.' },
                { speaker: 'npc', text: 'Не благодари. И будь осторожен — оттуда не все возвращаются.' }
            ]
        }}
    ]},
    '0_2':{npcs: [
        {class: 'Puta', type: 'puta', x: 618, y: 325, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Не стой тут. Мешаешь.' },
                { speaker: 'hero', text: 'Извини.' },
                { speaker: 'npc', text: 'Проваливай.' }
            ]
        }}
    ]},
    '7_3':{npcs: [
        {class: 'Puta', type: 'puta', x: 1044, y: 440, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Знаешь, что самое странное в этом городе?' },
                { speaker: 'hero', text: 'Что?' },
                { speaker: 'npc', text: 'Все куда-то бегут. И никто не знает — зачем.' },
                { speaker: 'hero', text: 'Может, и не надо знать.' },
                { speaker: 'npc', text: 'Может, и так...' }
            ]
        }}
    ]},
    '5_3':{npcs: [
        {class: 'Puta', type: 'puta', x: 612, y: 320, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Опять этот дождь... Надоело.' },
                { speaker: 'hero', text: 'Бывает.' },
                { speaker: 'npc', text: 'Не бывает. Просто ты ещё не жил тут долго.' }
            ]
        }}
    ]},
    
    '1_3':{npcs: [
        { class: 'Diler', type: 'diler', x: 640, y: 190, state: 'stay', direction: 45, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Ты ищешь кого-то, Кайто?' },
                { speaker: 'hero', text: 'Мне сказали, ты знаешь про Рикки.' },
                { speaker: 'npc', text: 'Рикки? Ха! Забудь.' },
                { speaker: 'hero', text: 'Почему?' },
                { speaker: 'npc', text: 'Потому что Рикки ты никогда не найдёшь. Он — тень. Понял? Тень.' },
                { speaker: 'hero', text: 'Посмотрим.' },
                { speaker: 'npc', text: 'Посмотришь — и сгнёшь. Я сказал.' }
            ]
        }}
    ]},
    '4_1':{npcs: [
        { class: 'Diler', type: 'diler', x: 647, y: 292, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Психософ последнего поколения! Мозги как новые!' },
                { speaker: 'hero', text: 'Сколько?' },
                { speaker: 'npc', text: 'Для тебя — дорого. Уходи.' }
            ]
        }}
    ]},
    '3_3':{npcs: [
        { class: 'Diler', type: 'diler', x: 645, y: 235, state: 'stay', direction: 90, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Эй, парень. Ты тут новенький?' },
                { speaker: 'hero', text: 'А что?' },
                { speaker: 'npc', text: 'Не суй нос не в своё дело. Тут стены имеют уши.' },
                { speaker: 'hero', text: 'Спасибо за совет.' },
                { speaker: 'npc', text: 'Не благодари. Просто проваливай.' }
            ]
        }}
    ]},
    '7_5':{npcs: [
        { class: 'Diler', type: 'diler', x: 416, y: 440, state: 'stay', direction: 90, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Чипы? Софт? Есть всё.' },
                { speaker: 'hero', text: 'Не сегодня.' },
                { speaker: 'npc', text: 'Как знаешь. Товар не ждёт.' }
            ]
        }}
    ]},

    '1_1':{npcs: [
        { class: 'Character', type: 'bomzh', x: 438, y: 340, state: 'sit', direction: 45, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Ты тоже их слышишь? Они шуршат... шуршат...' },
                { speaker: 'hero', text: 'Кто?' },
                { speaker: 'npc', text: 'Крысы! Огромные! С красными глазами! Они везде!' },
                { speaker: 'hero', text: 'Где?' },
                { speaker: 'npc', text: 'В стенах! В трубах! В головах! Одна из них... она особенная. Она — Король. Рикки-Рат! Рикки-Рат!' },
                { speaker: 'hero', text: 'Что ты знаешь про Рикки?' },
                { speaker: 'npc', text: 'Он видит сквозь стены! Он слышит мысли! Не ищи его! НЕ ИЩИ ЕГО!' },
                { speaker: 'hero', text: 'Спокойно...' },
                { speaker: 'npc', text: 'У-у-у... они идут... они уже тут... у-у-у...' }
            ]
        } },
    ]},
    '1_4':{npcs: [
        { class: 'Character', type: 'bomzh', x: 878, y: 498, state: 'sit', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Хр-р-р... кхх...' },
                { speaker: 'hero', text: 'Эй, живой?' },
                { speaker: 'npc', text: 'Бр-р-р... ф-ф-ф...' },
                { speaker: 'hero', text: 'Спит.' }
            ]
        } },
    ]},


    '2_1': { // Локация 2,1 (mapX=2, mapY=1)
        npcs: [
            { 
                class: 'BigBandit', 
                spawnZone: 'W', 
                count: 7, 
                delay: 15, // Задержка 10 секунд после входа
                initialState: 'run', 
                interaction: {} 
            }
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
            }
        ]
    },
    '6_2':{
        npcs: [
            {
                class: 'RikkiRat',
                x: 400,
                y: 450,
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
    
    sounds.heels = new Audio('assets/sounds/samura.ogg');
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