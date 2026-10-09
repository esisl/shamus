const DIALOGS = {
  "ru":{
    // === Дилеры ===
    'diler_bg1': [
        { speaker: 'npc', text: 'Чипы? Софт? Есть всё.' },
        { speaker: 'hero', text: 'Не сегодня.' },
        { speaker: 'npc', text: 'Как знаешь. Товар не ждёт.' }
    ],
    'diler_bg2': [
        { speaker: 'npc', text: 'Эй, парень. Ты тут новенький?' },
        { speaker: 'hero', text: 'А что?' },
        { speaker: 'npc', text: 'Не суй нос не в своё дело. Тут стены имеют уши.' },
        { speaker: 'hero', text: 'Спасибо за совет.' },
        { speaker: 'npc', text: 'Не благодари. Просто проваливай.' }
    ],
    'diler_bg3': [
        { speaker: 'npc', text: 'Психософ последнего поколения! Мозги как новые!' },
        { speaker: 'hero', text: 'Сколько?' },
        { speaker: 'npc', text: 'Для тебя — дорого. Уходи.' }
    ],
    'diler_plot': [
        { speaker: 'npc', text: 'Ты ищешь кого-то, Кайто?' },
        { speaker: 'hero', text: 'Мне сказали, ты знаешь про Рикки.' },
        { speaker: 'npc', text: 'Рикки? Ха! Забудь.' },
        { speaker: 'hero', text: 'Почему?' },
        { speaker: 'npc', text: 'Потому что Рикки ты никогда не найдёшь. Он — тень. Понял? Тень.' },
        { speaker: 'hero', text: 'Посмотрим.' },
        { speaker: 'npc', text: 'Посмотришь — и сгнёшь. Я сказал.' }
    ],
    
    // === Проститутки ===
    'puta_bg1': [
        { speaker: 'npc', text: 'Привет, красавчик.' },
        { speaker: 'hero', text: 'Привет.' },
        { speaker: 'npc', text: 'Один? Или ждёшь кого-то?' },
        { speaker: 'hero', text: 'Один.' },
        { speaker: 'npc', text: 'Ну тогда — до встречи.' }
    ],
    'puta_bg2': [
        { speaker: 'npc', text: 'Опять этот дождь... Надоело.' },
        { speaker: 'hero', text: 'Бывает.' },
        { speaker: 'npc', text: 'Не бывает. Просто ты ещё не жил тут долго.' }
    ],
    'puta_bg3': [
        { speaker: 'npc', text: 'Знаешь, что самое странное в этом городе?' },
        { speaker: 'hero', text: 'Что?' },
        { speaker: 'npc', text: 'Все куда-то бегут. И никто не знает — зачем.' },
        { speaker: 'hero', text: 'Может, и не надо знать.' },
        { speaker: 'npc', text: 'Может, и так...' }
    ],
    'puta_bg4': [
        { speaker: 'npc', text: 'Не стой тут. Мешаешь.' },
        { speaker: 'hero', text: 'Извини.' },
        { speaker: 'npc', text: 'Проваливай.' }
    ],
    'puta_main': [
        { speaker: 'npc', text: 'Эй, ты что-то ищешь, да?' },
        { speaker: 'hero', text: 'Откуда ты знаешь?' },
        { speaker: 'npc', text: 'Вижу я таких. Глаза бегают.' },
        { speaker: 'hero', text: 'Мне нужен один тип. Рикки.' },
        { speaker: 'npc', text: 'Рикки... Слышала имя. Один мой клиент болтал — он где-то на северо-востоке. В трущобах.' },
        { speaker: 'hero', text: 'Спасибо.' },
        { speaker: 'npc', text: 'Не благодари. И будь осторожен — оттуда не все возвращаются.' }
    ],
    
    // === Бомжи ===
    'bombzh_bg1': [
        { speaker: 'npc', text: 'У-у-у... о-о-о...' },
        { speaker: 'hero', text: 'Ты в порядке?' },
        { speaker: 'npc', text: 'М-м-м... а-а-а...' },
        { speaker: 'hero', text: 'Ладно...' }
    ],
    'bombzh_bg2': [
        { speaker: 'npc', text: 'Хр-р-р... кхх...' },
        { speaker: 'hero', text: 'Эй, живой?' },
        { speaker: 'npc', text: 'Бр-р-р... ф-ф-ф...' },
        { speaker: 'hero', text: 'Спит.' }
    ],
    'bombzh_crazy': [
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
},
"en":{
    // === Dealers ===
    'diler_bg1': [
        { speaker: 'npc', text: 'Chips? Soft? Got it all.' },
        { speaker: 'hero', text: 'Not today.' },
        { speaker: 'npc', text: 'Suit yourself. Goods won\'t wait.' }
    ],
    'diler_bg2': [
        { speaker: 'npc', text: 'Hey, kid. You new around here?' },
        { speaker: 'hero', text: 'Why?' },
        { speaker: 'npc', text: 'Don\'t stick your nose where it doesn\'t belong. Walls have ears here.' },
        { speaker: 'hero', text: 'Thanks for the tip.' },
        { speaker: 'npc', text: 'Don\'t thank me. Just get lost.' }
    ],
    'diler_bg3': [
        { speaker: 'npc', text: 'Latest gen psychosoft! Brains like new!' },
        { speaker: 'hero', text: 'How much?' },
        { speaker: 'npc', text: 'For you — too much. Move along.' }
    ],
    'diler_plot': [
        { speaker: 'npc', text: 'Looking for someone, Kaito?' },
        { speaker: 'hero', text: 'They told me you know about Rikki.' },
        { speaker: 'npc', text: 'Rikki? Ha! Forget it.' },
        { speaker: 'hero', text: 'Why?' },
        { speaker: 'npc', text: 'Because you\'ll never find Rikki. He\'s a shadow. Get it? A shadow.' },
        { speaker: 'hero', text: 'We\'ll see.' },
        { speaker: 'npc', text: 'Look — and you\'ll break. I said so.' }
    ],
    
    // === Prostitutes ===
    'puta_bg1': [
        { speaker: 'npc', text: 'Hey, handsome.' },
        { speaker: 'hero', text: 'Hey.' },
        { speaker: 'npc', text: 'Alone? Or waiting for someone?' },
        { speaker: 'hero', text: 'Alone.' },
        { speaker: 'npc', text: 'Well then — see you around.' }
    ],
    'puta_bg2': [
        { speaker: 'npc', text: 'This rain again... I\'m sick of it.' },
        { speaker: 'hero', text: 'It happens.' },
        { speaker: 'npc', text: 'It doesn\'t. You just haven\'t lived here long enough.' }
    ],
    'puta_bg3': [
        { speaker: 'npc', text: 'You know what\'s strangest about this city?' },
        { speaker: 'hero', text: 'What?' },
        { speaker: 'npc', text: 'Everyone\'s running somewhere. And no one knows why.' },
        { speaker: 'hero', text: 'Maybe they don\'t need to know.' },
        { speaker: 'npc', text: 'Maybe...' }
    ],
    'puta_bg4': [
        { speaker: 'npc', text: 'Don\'t stand here. You\'re in the way.' },
        { speaker: 'hero', text: 'Sorry.' },
        { speaker: 'npc', text: 'Get lost.' }
    ],
    'puta_main': [
        { speaker: 'npc', text: 'Hey, you\'re looking for something, aren\'t you?' },
        { speaker: 'hero', text: 'How do you know?' },
        { speaker: 'npc', text: 'I can tell. Your eyes are darting around.' },
        { speaker: 'hero', text: 'I need a guy. Rikki.' },
        { speaker: 'npc', text: 'Rikki... heard the name. One of my clients was babbling — he\'s somewhere northeast. In the slums.' },
        { speaker: 'hero', text: 'Thanks.' },
        { speaker: 'npc', text: 'Don\'t thank me. And be careful — not everyone comes back from there.' }
    ],
    
    // === Bums ===
    'bombzh_bg1': [
        { speaker: 'npc', text: 'Uu-uu... oo-oo...' },
        { speaker: 'hero', text: 'Are you alright?' },
        { speaker: 'npc', text: 'Mm-mm... aa-aa...' },
        { speaker: 'hero', text: 'Alright...' }
    ],
    'bombzh_bg2': [
        { speaker: 'npc', text: 'Hrr-hrr... khk...' },
        { speaker: 'hero', text: 'Hey, you alive?' },
        { speaker: 'npc', text: 'Brr-brr... ff-ff...' },
        { speaker: 'hero', text: 'Sleeping.' }
    ],
    'bombzh_crazy': [
        { speaker: 'npc', text: 'Can you hear them too? They\'re rustling... rustling...' },
        { speaker: 'hero', text: 'Who?' },
        { speaker: 'npc', text: 'Rats! Huge! With red eyes! They\'re everywhere!' },
        { speaker: 'hero', text: 'Where?' },
        { speaker: 'npc', text: 'In the walls! In the pipes! In the heads! One of them... she\'s special. She\'s the King. Rikki-Rat! Rikki-Rat!' },
        { speaker: 'hero', text: 'What do you know about Rikki?' },
        { speaker: 'npc', text: 'He sees through walls! He hears thoughts! Don\'t look for him! DON\'T LOOK FOR HIM!' },
        { speaker: 'hero', text: 'Calm down...' },
        { speaker: 'npc', text: 'Uu-uu... they\'re coming... they\'re already here... uu-uu...' }
    ]
}};

// Функция получения диалога по ключу на текущем языке
function getDialog(key) {
    const lang = gameContext.currentLanguage || 'ru';
    return DIALOGS[lang][key] || [];
}