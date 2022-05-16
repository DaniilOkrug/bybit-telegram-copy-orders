module.exports = {
  telegram: {
    bots: [
      {
        token: "1816816914:AAF1oNW64vxq3tRv_AOaDWZtJRlVok1dssA",
        chat_id_group: "-1001319144479",
        // chat_id_channel: "-1001526673230",
        messageAction: "⚡️ Сигнал {{action}} {{symbol}}\
            \nВошел в сделку по цене {{price_open}}\
            {{take_profit_message}}\
            {{stop_loss_message}}\
            \n\
            \nСделки совершаю на бирже <a href='https://bybit.com/'>ByBit</a>. При регистрации по ссылке бонусы до 4100$\
            \n\
            \n📌 Не забудьте включить уведомления и закрепить канал, чтобы ничего не пропустить",
        messageClosePartially: "🏁 Закрываем {{close_percent}}% позиции по {{symbol}}\
            \nPnL {{roi}}%",
        messageClose: "🏁 Закрываем всю позицию по {{symbol}} \
            \nPnL {{roi}}%",
        messageStopLoss: "\nСтоп поставил на уровне {{stop_loss}}",
        messageTakeProfit: "\nПланирую держать до цели {{take_profit}}",
        messageDeleteStopLoss: "Убираем стоп-лосс по {{symbol}}",
        messageDeleteTakeProfit: "Убираем тейк-профит по {{symbol}}",
        messageCloseByTakeProfit: "🏁 Сработал тейк-профит. Закрыл {{close_percent}}% позиции по {{symbol}}\
            \nPnL {{roi}}%",
        messageCloseByStopLoss: "🏁 Сработал стоп-лосс. Закрыл {{close_percent}}% позиции по {{symbol}}\
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
