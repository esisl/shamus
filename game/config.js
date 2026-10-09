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
        }},
        { class: 'Samura', spawnZone: 'S', count: 2, delay: 10, initialState: 'run', interaction: {}},
        { class: 'BigBandit',spawnZone: 'S', count: 5, delay: 11, initialState: 'run', interaction: {}}
    ]},
    '0_2':{npcs: [
        {class: 'Puta', type: 'puta', x: 618, y: 325, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Не стой тут. Мешаешь.' },
                { speaker: 'hero', text: 'Извини.' },
                { speaker: 'npc', text: 'Проваливай.' }
            ]
        }},
        { class: 'BigBandit',spawnZone: 'N', count: 3, delay: 15, initialState: 'run', interaction: {}},
        { class: 'Samura', spawnZone: 'E', count: 2, delay: 15, initialState: 'run', interaction: {}}
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
        }},
        { class: 'BigBandit',spawnZone: 'E', count: 3, delay: 12, initialState: 'run', interaction: {}}
    ]},
    '4_1':{npcs: [
        { class: 'Diler', type: 'diler', x: 647, y: 292, state: 'stay', direction: 135, delay: 0, interaction: {
            dialog: [
                { speaker: 'npc', text: 'Психософ последнего поколения! Мозги как новые!' },
                { speaker: 'hero', text: 'Сколько?' },
                { speaker: 'npc', text: 'Для тебя — дорого. Уходи.' }
            ]
        }},
        { class: 'BigBandit',spawnZone: 'N', count: 5, delay: 10, initialState: 'run', interaction: {}}
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
        }},
        { class: 'BigBandit',spawnZone: 'N', count: 2, delay: 15, initialState: 'run', interaction: {}},
        { class: 'BigBandit',spawnZone: 'E', count: 3, delay: 15, initialState: 'run', interaction: {}},
        { class: 'Samura', spawnZone: 'S', count: 1, delay: 15, initialState: 'run', interaction: {}}
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
        {class: 'BigBandit', type: 'big_bandit', x: 750, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 755, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 760, y: 360, state: 'run', direction: 135, delay: 0, interaction: {}},
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
        { class: 'BigBandit',spawnZone: 'N', count: 3, delay: 10, initialState: 'run', interaction: {}}
    ]},


    '0_1':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 600, y: 315, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 610, y: 325, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 305, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '1_5':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 600, y: 415, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 610, y: 425, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 405, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '2_3':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 640, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 650, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '3_4':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 550, y: 468, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 555, y: 460, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 560, y: 478, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 565, y: 460, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 545, y: 468, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '3_5':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 600, y: 410, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 605, y: 415, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 610, y: 405, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 605, y: 420, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 610, y: 400, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '2_5':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 560, y: 525, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 565, y: 530, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 570, y: 520, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 560, y: 530, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 565, y: 520, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '2_4':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 665, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 670, y: 485, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 655, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 665, y: 475, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 655, y: 485, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '4_3':{npcs:[
        {class: 'Samura', type: 'samura', x: 650, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 655, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 660, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 645, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 650, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 660, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 645, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '4_4':{npcs:[
        {class: 'Samura', type: 'samura', x: 570, y: 465, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 575, y: 470, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 580, y: 460, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 570, y: 455, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 565, y: 460, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 570, y: 465, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '4_5':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 560, y: 515, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 565, y: 520, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 570, y: 510, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 565, y: 525, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 560, y: 515, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '5_5':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 328, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 635, y: 332, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 635, y: 342, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 640, y: 338, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 635, y: 328, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 320, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '6_5':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 348, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 635, y: 352, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 635, y: 352, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 640, y: 348, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 635, y: 338, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '7_4':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 500, y: 435, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 505, y: 440, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 510, y: 430, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 495, y: 435, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 500, y: 445, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '6_3':{npcs:[
        {class: 'Samura', type: 'samura', x: 700, y: 450, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 705, y: 455, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 710, y: 445, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 705, y: 450, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 710, y: 455, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 700, y: 445, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '5_2':{npcs:[
        {class: 'Samura', type: 'samura', x: 533, y: 450, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 530, y: 455, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 538, y: 460, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 553, y: 450, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 533, y: 455, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 533, y: 445, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '5_1':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 500, y: 384, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 505, y: 389, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 510, y: 380, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 500, y: 380, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '6_1':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 355, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 625, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 625, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 355, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '7_1':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 367, y: 282, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 362, y: 287, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 360, y: 279, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 923, y: 545, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 927, y: 550, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 920, y: 540, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '7_2':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 585, y: 415, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 590, y: 420, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 580, y: 425, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 590, y: 410, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 585, y: 420, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '7_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 625, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 625, y: 325, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 320, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 615, y: 325, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 620, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '6_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 560, y: 410, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 565, y: 405, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 570, y: 400, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 565, y: 405, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 560, y: 410, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 555, y: 400, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '5_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 630, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 625, y: 485, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 620, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 615, y: 475, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 470, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 475, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 620, y: 485, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '5_4':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 750, y: 540, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 755, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 760, y: 530, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 755, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 750, y: 540, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 745, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 740, y: 530, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 745, y: 520, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '6_4':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 750, y: 540, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 755, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 760, y: 530, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 750, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 755, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 745, y: 535, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 740, y: 530, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 745, y: 520, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '0_4':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 500, y: 440, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 505, y: 435, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 510, y: 430, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 505, y: 440, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '0_3':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 500, y: 440, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 505, y: 435, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 510, y: 430, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 505, y: 430, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '1_2':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 680, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 685, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 690, y: 355, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 685, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 680, y: 355, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '2_2':{npcs:[
        {class: 'Samura', type: 'samura', x: 600, y: 390, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 605, y: 395, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 400, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 615, y: 390, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 610, y: 390, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '2_1':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 540, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 545, y: 485, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 550, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 530, y: 475, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 535, y: 470, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '2_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 600, y: 420, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 605, y: 425, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 610, y: 430, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 615, y: 435, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 620, y: 420, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 600, y: 440, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '3_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 650, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 655, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 660, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 665, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 645, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 640, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '4_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 650, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 655, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 660, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 650, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 645, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 640, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '3_2':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 740, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 745, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 750, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 745, y: 500, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 735, y: 485, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 730, y: 490, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 740, y: 495, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '4_2':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 780, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 785, y: 340, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 790, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 780, y: 350, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 775, y: 345, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 770, y: 335, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 780, y: 330, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},
    '1_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 570, y: 390, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 575, y: 395, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 580, y: 395, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 570, y: 400, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 575, y: 400, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 580, y: 380, state: 'run', direction: 135, delay: 0, interaction: {}},
    ]},
    '0_0':{npcs:[
        {class: 'BigBandit', type: 'big_bandit', x: 530, y: 470, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 535, y: 470, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 540, y: 475, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 545, y: 475, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'BigBandit', type: 'big_bandit', x: 530, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 535, y: 480, state: 'run', direction: 135, delay: 0, interaction: {}},
        {class: 'Samura', type: 'samura', x: 540, y: 470, state: 'run', direction: 135, delay: 0, interaction: {}}
    ]},

    '0_5':{npcs:[
        { class: 'BigBandit',spawnZone: 'E', count: 2, delay: 5, initialState: 'run', interaction: {}},
        { class: 'BigBandit',spawnZone: 'N', count: 2, delay: 5, initialState: 'run', interaction: {}}
    ]},

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