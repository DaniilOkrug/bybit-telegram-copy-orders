module.exports = {
  bybit: {
    apiKey: "",
    apiSecret: ""
  },
  telegram: {
    bots: [
      {
        token: "",
        chat_id: "",
        messageOrder: "{{order_status}} {{symbol}}({{side}} сделка)\
            \nМоя цена входа {{price_open}}\
            \nПлечо х5-х10\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageAction: "{{action}} {{symbol}}({{side}} сделка)\
            \nМоя цена входа {{price_open}}\
            \nПлечо x{{leverage}}\
            {{take_profit_message}}\
            {{stop_loss_message}}",
        messageClosePartially: "🏁 Закрываем {{close_percent}}% позиции по {{symbol}}\
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nPnL {{roi}}%",
        messageClose: "🏁 Закрываем всю позицию по {{symbol}} \
            \nМоя цена входа {{price_open}}\
            \nМоя цена закрытия {{price_close}}\
            \nPnL {{roi}}%",
        messageStopLossChange: "{{order_status}} по {{symbol}}\
            \nНовый стоп ставим на уровень {{stop_loss}}",
        messageTakeProfitChange: "{{order_status}} по {{symbol}}\
            \nНовый тейк ставим на уровень {{take_profit}}",
        messageStopLoss: "\nСтоп {{stop_loss}}",
        messageTakeProfit: "\nТейк {{take_profit}}",
        messageBreakEvenStopLoss: "{{order_status}} по {{symbol}}\
            \nМоя точка входа {{price_open}}\
            \nМой стоп: {{stop_loss}}"
        // messagePlaceholders: {
        //   action: {
        //     buy: "Покупаем",
        //     sell: "Продаем"
        //   },
        //   side: {
        //     long: "лонг",
        //     short: "шорт"
        //   },
        //   order: {
        //     type: {
        //       "limit": "Лимитный",
        //       "market": "Маркет"
        //     },
        //     status: {
        //       new: "new",
        //       partiallyClosed: "partiallyClosed",
        //       close: "Закрытие позиции",
        //       cancelled: "cancelled",
        //       change_order_position: "change_order_position",
        //       filled: "filled",
        //       new_tp: "new_tp",
        //       new_sl: "new_sl"
        //     }
        //   }
        // }
      }
    ]
  }
}
