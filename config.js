module.exports = {
  telegram: {
    bots: [
      {
        token: "1816816914:AAF1oNW64vxq3tRv_AOaDWZtJRlVok1dssA",
        chat_id_group: "-1001319144479",
        // chat_id_channel: "-1001526673230",
        messageOrder: "{{order_status}} {{symbol}} ({{side}} сделка)\
            \nЦена входа {{price_open}}\
            \nПлечо х5-х10\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageAction: "{{action}} {{symbol}} ({{side}} сделка)\
            \nМоя цена входа {{price_open}}\
            \nПлечо x{{leverage}}\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageClosePartially: "🏁 Закрываем {{close_percent}}% позиции по {{symbol}}\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nROI {{roi}}%",
        messageClose: "🏁 Закрываем всю позицию по {{symbol}} \
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nROI {{roi}}%",
        messageCancel: "Отменяем лимитный ордер на {{cancel_type}} {{symbol}} ({{side}} сделка)\
            \nОрдер ставили на уровень {{price_open}}",
        messageStopLossChange: "{{order_status}} по {{symbol}}\
            \nНовый стоп ставим на уровень {{stop_loss}}",
        messageTakeProfitChange: "{{order_status}} по {{symbol}}\
            \nНовый тейк ставим на уровень {{take_profit}}",
        messageStopLoss: "\nСтоп {{stop_loss}}",
        messageTakeProfit: "\nТейк {{take_profit}}",
        messageBreakEvenStopLoss: "{{order_status}} по {{symbol}}\
            \nМоя точка входа {{price_open}}\
            \nМой стоп: {{stop_loss}}",
        messageDeleteStopLoss: "Убираем стоп-лосс по {{symbol}}",
        messageDeleteTakeProfit: "Убираем тейк-профит по {{symbol}}",
        messageCloseByTakeProfit: "🏁 Сработал тейк-профит. Закрыл {{close_percent}}% позиции по {{symbol}}\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nROI {{roi}}%",
        messageCloseByStopLoss: "🏁 Сработал стоп-лосс. Закрыл {{close_percent}}% позиции по {{symbol}}\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nROI {{roi}}%",
        messagePlaceholders: {
          action: {
            buy: "🟢 Покупаем",
            sell: "🔴 Продаем"
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
