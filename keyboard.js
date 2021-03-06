const kb = require('./keyboard-buttons');

module.exports = {
    phone: {
        reply_markup: {
            keyboard: [
                [kb.phone],
            ]
        }
    },
    home: {
        reply_markup: {
            keyboard: [
                [kb.home.income, kb.home.outcome],
                [kb.home.report],
                [kb.home.help, kb.home.feedback],
            ]
        }
    },
    pay_type:{
        reply_markup: {
            keyboard: [
                [kb.cancel],
                ['Безналичная'],
                ['Наличная']
            ]
        }
    },
    feedback: {
      reply_markup:{
          inline_keyboard:[
              [{
                  text:'Связаться',
                  callback_data: 'callback'
              }]
          ]
      }
    },
    items(budget_item) {
        var out = [[kb.cancel]];
        for (var temp in budget_item)
            out.push([budget_item[temp]]);

        return {
            reply_markup: {
                keyboard: out
            }
        }
    }

}