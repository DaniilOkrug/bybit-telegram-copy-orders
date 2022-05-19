module.exports = {
  telegram: {
    bots: [
      {
        token: "1816816914:AAF1oNW64vxq3tRv_AOaDWZtJRlVok1dssA",
        chat_id_group: "-1001526673230",
        // chat_id_channel: "-1001526673230",
        messageOrderExecution: "<b>⚡️ Сигнал {{action}} {{symbol}}</b>\
            \nВошел в сделку по цене {{price_open}}\
            {{take_profit_message}}\
            {{stop_loss_message}}\
            \n\
            \nСделки совершаю на бирже <a href='https://bybit.com/'>ByBit</a>. При регистрации по ссылке бонусы до 4000$\
            \n\
            \n<i>📌 Не забудьте включить уведомления и закрепить канал, чтобы ничего не пропустить</i>",
        messageAction: "<b>⚡️ Сигнал {{action}} {{symbol}}</b>\
            \nВошел в сделку по цене {{price_open}}\
            {{take_profit_message}}\
            {{stop_loss_message}}\
            \n\
            \nСделки совершаю на бирже <a href='https://bybit.com/'>ByBit</a>. При регистрации по ссылке бонусы до 4000$\
            \n\
            \n<i>📌 Не забудьте включить уведомления и закрепить канал, чтобы ничего не пропустить</i>",
        messageClosePartially: "<b>🏁 Закрываем {{close_percent}}% позиции по {{symbol}}</b>\
            \nPnL {{roi}}%",
        messageClose: "<b>🏁 Закрываем всю позицию по {{symbol}}</b>\
            \nPnL {{roi}}%",
        messageStopLoss: "\nСтоп поставил на уровне {{stop_loss}}",
        messageTakeProfit: "\nПланирую держать до цели {{take_profit}}",
        messageCloseByTakeProfit: "<b>🏁 Сработал тейк-профит. Закрыл {{close_percent}}% позиции по {{symbol}}</b>\
            \nPnL {{roi}}%",
        messageCloseByStopLoss: "<b>🏁 Сработал стоп-лосс. Закрыл {{close_percent}}% позиции по {{symbol}}</b>\
            \nPnL {{roi}}%",
        messagePlaceholders: {
          action: {
            buy: "LONG",
            sell: "SHORT"
          },
          side: {
            long: "лонг",
            short: "шорт"
          },
          order: {
            type: {
              limit: "Лимитный",
              market: "Маркет"
            },
            cancel_type: {
              long: "покупку",
              short: "продажу"
            },
            status: {
              newBuy: "Выставляем лимитный ордер на покупку",
              newSell: "Выставляем лимитный ордер на продажу",
              partiallyClosed: "Частиное закрытие позции",
              change_order_position: "Изменение ордера",
              filled: "Исполнение ордера",
              new_tp: "Изменяем тейк-профит",
              new_sl: "Изменяем стоп-лосс",
              breakeven_sl: "Ставим стоп-лосс в БУ",
            }
          }
        }
      }
    ]
  }
}