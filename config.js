module.exports = {
  telegram: {
    bots: [
      {
        token: "1816816914:AAF1oNW64vxq3tRv_AOaDWZtJRlVok1dssA",
        chat_id_group: "-1001319144479",
        // chat_id_channel: "-1001526673230",
        messageOrder: "<b>Выставляем лимитный ордер на {{side}} {{symbol}}</b>\
            \nЦена {{price_open}}\
            \nПлечо х5-x10\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageOrderExecution: "<b>{{action}} {{symbol}}</b>\
            \nСработал выставленный лимитный ордер\
            \nМоя цена входа {{price_open}}\
            \nПлече x{{leverage}}\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageAction: "<b>{{action}} {{symbol}}</b>\
            \nМоя цена входа {{price_open}}\
            \nПлечо x{{leverage}}\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageClosePartially: "<b>🏁 Закрываем {{close_percent}}% позиции по {{symbol}}</b>\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nPnL {{roi}}%",
        messageClose: "<b>🏁 Закрываем всю позицию по {{symbol}}</b> \
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nPnL {{roi}}%",
        messageCancel: "<b>Отменяем лимитный ордер на {{side}} {{symbol}}</b> \
            \nОрдер ставили на уровень {{price_open}}",
        messageStopLossChange: "<b>Изменяем стоп-лосс по {{symbol}}</b> \
            \nНовый стоп ставим на уровень {{stop_loss}}",
        messageTakeProfitChange: "<b>Изменяем тейк-профит по {{symbol}}</b> \
            \nНовый тейк ставим на уровень {{take_profit}}",
        messageStopLoss: "\nСтоп {{stop_loss}}",
        messageTakeProfit: "\nТейк {{take_profit}}",
        messageBreakEvenStopLoss: "<b>Ставим стоп-лосс в БУ по {{symbol}}</b>\
            \nМоя точка входа {{price_open}}\
            \nМой стоп: {{stop_loss}}",
        messageDeleteStopLoss: "<b>Убираем стоп-лосс по {{symbol}}</b>",
        messageDeleteTakeProfit: "<b>Убираем тейк-профит по {{symbol}}</b>",
        messageCloseByTakeProfit: "<b>🏁 Сработал тейк-профит. Закрыл {{close_percent}}% от текущей позиции по {{symbol}}</b>\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nPnL {{roi}}%",
        messageCloseByStopLoss: "<b>🏁 Сработал стоп-лосс. Закрыл {{close_percent}}% от текущей позиции по {{symbol}}</b>\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nPnL {{roi}}%",
        messagePlaceholders: {
          action: {
            buy: "🟢 LONG",
            sell: "🔴 SHORT"
          },
          side: {
            long: "LONG",
            short: "SHORT"
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
