const TelegramBot = require('node-telegram-bot-api');
const cache = require('memory-cache');

const helpers = require('./helpers');
const keyboards = require('./keyboard');
const kb = require('./keyboard-buttons');
const frases = require('./frases');
const database = require('./database');

const token = '566065973:AAHbO6n8SXa95LC6xUJbA5APE-8F7guf-SU';
const bot = new TelegramBot(token, {polling: true});


bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, frases.phone, keyboards.phone)
});
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, frases.help)
});
bot.onText(/\/chat/, (msg) => {
    bot.sendMessage(msg.chat.id, msg.chat.id)
});

bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    if (msg.contact) {
        database.updateData('users/' + chatId, msg.contact);
        sendIdAsk(chatId)
    }
    else if (msg.text === kb.home.feedback) {
        bot.sendMessage(chatId, frases.feedback, keyboards.feedback)
    }
    else if (msg.text === kb.home.help) {
        bot.sendMessage(chatId, frases.help)
    }
    else if (msg.text === kb.home.report) {
        bot.sendMessage(chatId, 'Пока в разработке ⚙️', keyboards.home)
    }
    else if (msg.text === kb.cancel) {
        bot.sendMessage(chatId, 'Выберите действие', keyboards.home);
        cache.del(chatId)
    }
    else if (msg.text === kb.home.outcome || msg.text === kb.home.income) {
        database.getData('users/' + chatId + '/spreadsheetId').then(function (id) {
            if (id !== null) {
                database.getData('parameters/' + id + '/budget_item').then(function (budget_item) {
                    if (budget_item !== null) {
                        bot.sendMessage(chatId, 'Выберите статью бюджета', keyboards.items(budget_item))
                        var type = (msg.text === kb.home.outcome) ? 'Расход' : 'Приход';
                        cache.put(chatId, {p2: type, state: 'activities'});
                    } else {
                        sendIdAsk(chatId)
                    }
                })
            } else {
                sendIdAsk(chatId)
            }
        })
    }
    else {
        var state = (cache.get(chatId) === null) ? '' : cache.get(chatId).state
        switch (state) {
            case 'auth':
                database.getData('users/' + chatId).then(user => {
                    if (user.spreadsheetId === msg.text) {
                        bot.sendMessage(chatId, frases.start, keyboards.home)
                        cache.del(chatId)
                    } else {
                        bot.sendMessage(chatId, 'Нет доступа')
                        sendIdAsk(chatId)
                    }
                });
                break;
            case 'activities':
                database.getData('users/' + chatId + '/spreadsheetId').then(function (id) {
                    if (id !== null) {
                        database.getData('parameters/' + id + '/activities').then(function (activities) {
                            if (activities !== null) {
                                bot.sendMessage(chatId, 'Выберите направление деятельности', keyboards.items(activities))
                                var c = cache.get(chatId)
                                c.p5 = msg.text;
                                c.state = 'pay_type';
                                cache.put(chatId, c);
                            } else {
                                sendIdAsk(chatId)
                            }
                        })
                    } else {
                        sendIdAsk(chatId)
                    }
                })
                break;
            case 'pay_type':
                bot.sendMessage(chatId, 'Выберите тип оплаты', keyboards.pay_type);
                var c = cache.get(chatId)
                c.p4 = msg.text;
                c.state = 'sum';
                cache.put(chatId, c);
                break;
            case 'sum':
                bot.sendMessage(chatId, 'Введите сумму', {reply_markup: {remove_keyboard: true}})
                var c = cache.get(chatId)
                c.p3 = msg.text;
                c.state = 'tranche';
                cache.put(chatId, c);
                break;
            case 'tranche':
                if (isNaN(msg.text)) {
                    bot.sendMessage(chatId, 'Сумма не корректна!', {reply_markup: {remove_keyboard: true}});
                    return
                }
                var c = cache.get(chatId);
                c.p1 = helpers.convert_date(new Date());
                c.p6 = msg.text;
                delete c.state;
                database.getData('users/' + chatId + '/spreadsheetId').then(spreadsheetId => {
                    if (spreadsheetId !== null) {
                        database.pushData('data/' + spreadsheetId, c)
                        bot.sendMessage(chatId, 'Готово!', keyboards.home);
                    } else {
                        sendIdAsk(chatId)
                    }
                })

                break;
            default :
                if (msg.text[0] !== '/')
                    bot.sendMessage(chatId, 'Команда не распознана', keyboards.home);
                cache.del(chatId)
                break;

        }


    }

})

bot.on('callback_query', function (query) {
    const {chat, message_id, text} = query.message;
    switch (query.data) {
        case 'callback':
            database.getData('users/' + chat.id).then(user => {
                var date = new Date();
                bot.sendMessage('-309140108', `${date.getHours()}:${date.getMinutes()}  ` +
                    `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()} \n`+
                    `Обратная связь:\n${frases.user_link(chat.id,chat.first_name)} - ${user.phone_number}`
                    , {parse_mode: "HTML"})
                bot.sendMessage(chat.id, 'C вами свяжутся ✅')
                bot.deleteMessage(chat.id,message_id)
            })
            break;
    }
})

function sendIdAsk(chatId) {
    cache.put(chatId, {state: 'auth'});
    bot.sendMessage(chatId, frases.key, {reply_markup: {remove_keyboard: true}})
    bot.sendMessage(chatId, frases.key_video, {reply_markup: {remove_keyboard: true}})
}

console.log('bot has been started');