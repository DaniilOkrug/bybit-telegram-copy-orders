const placeholdes = {
    action: "{{action}}",
    symbol: "{{symbol}}",
    side: "{{side}}",
    price_open: "{{price_open}}",
    price_close: "{{price_close}}",
    stoploss: "{{stop_loss}}",
    takeprofit: "{{take_profit}}",
    order_status: "{{order_status}}",
    order_type: "{{order_type}}",
    leverage: "{{leverage}}",
    roi: "{{roi}}",
    take_profit_message: "{{take_profit_message}}",
    stop_loss_message: "{{stop_loss_message}}",
    close_percent: "{{close_percent}}",
    cancel_type: "{{cancel_type}}"
};

const defaultMesasges = {
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
            newBuy: "Выставляем ордер на покупку",
            newSell: "Выставляем ордер на продажу",
            partiallyClosed: "Частиное закрытие позции",
            close: "Закрытие позиции",
            cancelled: "Отменен ордер",
            change_order_position: "Изменение ордера",
            filled: "Исполнение ордера",
            new_tp: "Изменяем тейк-профит",
            new_sl: "Изменяем стоп-лосс",
            breakeven_sl: "Ставим стоп-лосс в БУ",
        }
    }
};

class Parser {
    messagePlaceholders;
    messageOrder;
    messageAction;
    messageClose;
    messageStopLoss;
    messageTakeProfit;
    messageStopLossChange;
    messageTakeProfitChange;
    messageBreakEvenStopLoss;
    messageCancel;
    messageDeleteStopLoss;
    messageDeleteTakeProfit;
    messageCloseByTakeProfit
    messageCloseByStopLoss

    constructor(messages, messagePlaceholders = false) {
        this.messageOrder = messages.messageOrder;
        this.messageAction = messages.messageAction;
        this.messageClose = messages.messageClose;
        this.messageClosePartially = messages.messageClosePartially;
        this.messageStopLossChange = messages.messageStopLossChange;
        this.messageTakeProfitChange = messages.messageTakeProfitChange;
        this.messageStopLoss = messages.messageStopLoss;
        this.messageTakeProfit = messages.messageTakeProfit;
        this.messageBreakEvenStopLoss = messages.messageBreakEvenStopLoss;
        this.messageCancel = messages.messageCancel;
        this.messageDeleteStopLoss = messages.messageDeleteStopLoss;
        this.messageDeleteTakeProfit = messages.messageDeleteTakeProfit;
        this.messageCloseByTakeProfit = messages.messageCloseByTakeProfit;
        this.messageCloseByStopLoss = messages.messageCloseByStopLoss;

        if (messagePlaceholders) {
            this.messagePlaceholders = messagePlaceholders;
        } else {
            this.messagePlaceholders = defaultMesasges;
        }
    }

    /**
     * 
     * @param {*} orderMessage 
     * @param {string} formatter 
     * @param {*} messageSample 
     * @returns 
     */
    parseSignal(orderMessage, type) {
        let message;

        if (orderMessage.order_status == 'New') message = this.messageOrder;
        if (orderMessage.order_status == 'Cancelled') message = this.messageCancel;
        if (orderMessage.order_status == 'Filled') message = this.messageAction;
        if (type == "CLOSE") message = this.messageClose;
        if (type == "PARTIALLY") message = this.messageClosePartially;
        if (type == "NEW_POSITION_TP") message = this.messageTakeProfitChange;
        if (type == "NEW_POSITION_SL") message = this.messageStopLossChange;
        if (type == "BREAKEVEN_SL") message = this.messageBreakEvenStopLoss;
        if (type == "CloseByTakeProfit") message = this.messageCloseByTakeProfit;
        if (type == "CloseByStopLoss") message = this.messageCloseByStopLoss;

        //Canceling TP/SL
        if (type == "NEW_POSITION_TP" && orderMessage.take_profit == 0) {
            message = this.messageDeleteTakeProfit;
        }

        if (type == "NEW_POSITION_SL" && orderMessage.stop_loss == 0) {
            message = this.messageDeleteStopLoss;
        }

        //Order status
        if (message.includes(placeholdes.order_status)) {
            switch (type) {
                case "CHAHGE_ORDER_POSITION":
                    message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.change_order_position);
                    break;
                case "NEW_POSITION_TP":
                    message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.new_tp);
                    break;
                case "NEW_POSITION_SL":
                    message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.new_sl);
                    break;
                case "BREAKEVEN_SL":
                    message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.breakeven_sl);
                    break;
                default:
                    if (orderMessage.order_status === "New") {
                        if (orderMessage.side == "Buy") {
                            message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.newBuy);
                        } else {
                            message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.newSell);
                        }
                    }
                    // if (orderMessage.order_status === "Cancelled") {
                    // 
                    // }
                    if (orderMessage.order_status === "Filled") {
                        message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.filled);
                    }
                    break;
            }
        }

        //Closing
        if (type == "CLOSE"){
            message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.close);
        }
        if (type == "PARTIALLY"){
            message = message.replace(placeholdes.order_status, this.messagePlaceholders.order.status.partiallyClosed);
        }

        //Cancel type
        if (message.includes(placeholdes.cancel_type)) {
            if (orderMessage.side == "Buy") {
                message = message.replace(placeholdes.cancel_type, this.messagePlaceholders.order.cancel_type.long);
            } else {
                message = message.replace(placeholdes.cancel_type, this.messagePlaceholders.order.cancel_type.short);
            }
        }

        //Roi
        if (message.includes(placeholdes.roi)) {
            message = message.replace(placeholdes.roi, orderMessage.roi);
        }

        //Order type
        if (message.includes(placeholdes.order_type)) {
            if (orderMessage.order_status === "Limit") {
                message = message.replace(placeholdes.order_type, this.messagePlaceholders.order.type.limit);
            }
            if (orderMessage.order_status === "Market") {
                message = message.replace(placeholdes.order_type, this.messagePlaceholders.order.type.market);
            }
        }

        //Symbol
        if (message.includes(placeholdes.symbol)) {
            const symbol = orderMessage.symbol.replace("USDT", "");
            message = message.replace(placeholdes.symbol, symbol);
        }

        //Action
        if (message.includes(placeholdes.action)) {
            if (orderMessage.side == "Buy") {
                message = message.replace(placeholdes.action, this.messagePlaceholders.action.buy);
            }
            if (orderMessage.side == "Sell") {
                message = message.replace(placeholdes.action, this.messagePlaceholders.action.sell);
            }
        }

        //Side
        if (message.includes(placeholdes.side)) {
            if (orderMessage.side == "Buy") {
                message = message.replace(placeholdes.side, this.messagePlaceholders.side.long);
            }
            if (orderMessage.side == "Sell") {
                message = message.replace(placeholdes.side, this.messagePlaceholders.side.short);
            }
        }

        //Price open
        if (message.includes(placeholdes.price_open)) {
            message = message.replace(placeholdes.price_open, orderMessage.price_open);
        }

        //Price close
        if (message.includes(placeholdes.price_close)) {
            message = message.replace(placeholdes.price_close, orderMessage.price_close);
        }

        //Leverage
        if (message.includes(placeholdes.leverage)) {
            message = message.replace(placeholdes.leverage, orderMessage.leverage);
        }

        //StopLoss message
        if (message.includes(placeholdes.stop_loss_message)) {
           if (orderMessage.stop_loss != 0) {
               const slMessage = this.messageStopLoss.replace(placeholdes.stoploss, orderMessage.stop_loss);

               message = message.replace(placeholdes.stop_loss_message, slMessage);
           } else {
               message = message.replace(placeholdes.stop_loss_message, "");
           }
        } else {
            if (message.includes(placeholdes.stoploss)) {
                message = message.replace(placeholdes.stoploss, orderMessage.stop_loss);
            }
        }
        
        //TakeProfit Price
        if (message.includes(placeholdes.take_profit_message)) {
            message = message.replace(placeholdes.takeprofit, orderMessage.take_profit == 0 ? "-" : orderMessage.take_profit);
            if (orderMessage.take_profit != 0) {
                const tpMessage = this.messageTakeProfit.replace(placeholdes.takeprofit, orderMessage.take_profit);

                message = message.replace(placeholdes.take_profit_message, tpMessage);
            } else {
                message = message.replace(placeholdes.take_profit_message, "");
            }
        } else {
            if (message.includes(placeholdes.takeprofit)) {
                message = message.replace(placeholdes.takeprofit, orderMessage.take_profit);
            }
        }
        
        //Close percent
        if (message.includes(placeholdes.close_percent)) {
            message = message.replace(placeholdes.close_percent, this.formattingPercentClose(orderMessage.closePercent));
        }

        return message;
    }

    formattingPercentClose(percent) {
        if (Math.abs(percent - 10) < 5) return 10
        if (Math.abs(percent - 25) < 15) return 25
        if (Math.abs(percent - 50) < 8) return 50
        if (Math.abs(percent - 75) < 8) return 75
        return percent
    }
}

module.exports = Parser;