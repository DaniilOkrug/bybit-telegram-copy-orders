const config = require("./config");
const TelegramBot = require('node-telegram-bot-api');
const Bybit = require('./bybit/node-bybit-api');
const Parser = require("./middleware/parser");
const { default: axios } = require("axios");

const bybitBot = new Bybit({
    APIKEY: config.bybit.apiKey,
    SECRETKEY: config.bybit.apiSecret,
    reconnect: true,
    verbose: true,
    log: function (...args) {
        console.log(Array.prototype.slice.call(args));
    }
});

let URL = "https://api.telegram.org/bot1816816914:AAF1oNW64vxq3tRv_AOaDWZtJRlVok1dssA/sendMessage?";

const bots = [];
const orders = {};
const positions = {};

config.telegram.bots.forEach(data => {
    const messages = {
        messageOrder: data.messageOrder,
        messageAction: data.messageAction,
        messageClose: data.messageClose,
        messageClosePartially: data.messageClosePartially,
        messageStopLossChange: data.messageStopLossChange,
        messageTakeProfitChange: data.messageTakeProfitChange,
        messageStopLoss: data.messageStopLoss,
        messageTakeProfit: data.messageTakeProfit,
        messageBreakEvenStopLoss: data.messageBreakEvenStopLoss,
    };
    const placeholders = typeof data.messagePlaceholders !== 'undefined' ? data.messagePlaceholders : false
    const parser = new Parser(messages, placeholders);

    bots.push({
        bot: new TelegramBot(data.token, { polling: true }),
        token: data.token,
        chatId: data.chat_id,
        parser
    });
})

let chatId;

bots.forEach(botData => {
    botData.bot.onText(/\/start/, (msg) => {
        chatId = msg.chat.id;

        botData.bot.sendMessage(chatId, "Bot started");
    });
});

bybitBot.websockets.futureOrder(orderMessage => {
    console.log("Order");
    console.log(orderMessage);

    orderMessage.data.forEach(orderData => {
        if (orderData.order_status == "New") {
            bots.forEach(async botData => {
                const ordersSymbols = Object.keys(orders);
                let isOrderExists = false;
                let messageSignal = "";
                if (ordersSymbols.includes(orderData.symbol)) {
                    const orderId = orders[orderData.symbol].order_ids.find(id => id == orderData.order_id);
                    if (typeof orderId !== 'undefined') isOrderExists = true;
                }

                let pasingData = {
                    price_open: orderData.price,
                    ...orderData
                };

                if (isOrderExists) {
                    if (orderData.take_profit != orders[orderData.symbol].take_profit) {
                        messageSignal = botData.parser.parseSignal(pasingData, "NEW_POSITION_TP");
                        orders[orderData.symbol].take_profit = orderData.take_profit;
                    } else if (orderData.stop_loss != orders[orderData.symbol].stop_loss) {
                        messageSignal = botData.parser.parseSignal(pasingData, "NEW_POSITION_SL");
                        orders[orderData.symbol].stop_loss = orderData.stop_loss;
                    } else {
                        messageSignal = botData.parser.parseSignal(pasingData, "CHAHGE_ORDER_POSITION");
                    }
                    
                } else {
                    if (typeof orders[orderData.symbol] === 'undefined') {
                        orders[orderData.symbol] = {
                            price_open: orderData.price,
                            take_profit: orderData.take_profit,
                            stop_loss: orderData.stop_loss,
                            order_ids: [orderData.order_id]
                        };
                    } else {
                        if (orderData.create_type != "CreateByClosing") {
                            orders[orderData.symbol] = {
                                price_open: orderData.price,
                                take_profit: orderData.take_profit,
                                stop_loss: orderData.stop_loss,
                                order_ids: [orderData.order_id]
                            };
                        }
                    }

                    pasingData.leverage = orders[orderData.symbol].leverage;

                    console.log(orders[orderData.symbol]);
                    messageSignal = botData.parser.parseSignal(pasingData, "");
                }

                await axios.get(URL, {
                    params: {
                        chat_id: botData.chatId,
                        text: messageSignal
                    }
                });
            });
        }

        if (orderData.order_status == "Cancelled") {
            bots.forEach(async botData => {
                const messageSignal = botData.parser.parseSignal(orderData, "");

                await axios.get(URL, {
                    params: {
                        chat_id: botData.chatId,
                        text: messageSignal
                    }
                });
            });
        }


        if (orderData.order_status == "Filled") {
            setTimeout(async () => {
                console.log(orders[orderData.symbol]);
                if (typeof positions[orderData.symbol] !== 'undefined') {
                    console.log(positions[orderData.symbol].current);
                    const { longPosition, shortPosition } = positions[orderData.symbol].current;

                    if (orderData.create_type == "CreateByClosing") {
                        const order = orders[orderData.symbol];
                        let roi = ((Math.abs(order.end_pnl - order.init_pnl)) / (order.size * order.price_open)) * 100;
                        if (order.end_pnl < order.init_pnl) {
                            roi *= -1;
                        }

                        if (longPosition.size == 0 && shortPosition.size == 0) {
                            bots.forEach(async botData => {
                                const signalMessage = botData.parser.parseSignal({
                                    roi: roi.toFixed(3),
                                    price_close: orderData.price,
                                    price_open: orders[orderData.symbol].price_open,
                                    ...orderData
                                }, "CLOSE");

                                await axios.get(URL, {
                                    params: {
                                        chat_id: botData.chatId,
                                        text: signalMessage
                                    }
                                });

                                delete orders[orderData.symbol];
                            });
                            return;
                        }

                        bots.forEach(async botData => {
                            const signalMessage = botData.parser.parseSignal({
                                roi: roi.toFixed(3),
                                closePercent: ((orderData.qty / orders[orderData.symbol].size) * 100),
                                price_close: orderData.price,
                                price_open: orders[orderData.symbol].price_open,
                                ...orderData
                            }, "PARTIALLY");
                            await axios.get(URL, {
                                params: {
                                    chat_id: botData.chatId,
                                    text: signalMessage
                                }
                            });

                            orders[orderData.symbol].size = orders[orderData.symbol].new_size;
                        });
                        return;
                    }

                    bots.forEach(async botData => {
                        const signalMessage = botData.parser.parseSignal({
                            leverage: orders[orderData.symbol].leverage,
                            price_open: orders[orderData.symbol].price_open,
                            ...orderData
                        }, "");
                        await axios.get(URL, {
                            params: {
                                chat_id: botData.chatId,
                                text: signalMessage
                            }
                        });
                    });
                }
            }, 1500);
        }
    });
});

bybitBot.websockets.futurePosition(position => {
    try {
        console.log("Position");
        // console.log(position.data);

        if (position.data.length > 1) {
            let longPosition;
            let shortPosition;
            for (const positionReport of position.data) {
                if (positionReport.side == 'Buy') {
                    longPosition = positionReport;
                } else {
                    shortPosition = positionReport;
                }
            }

            if (typeof positions[longPosition.symbol] === 'undefined') {
                positions[longPosition.symbol] = {
                    previous: {
                        longPosition,
                        shortPosition,
                    },
                    current: {
                        longPosition,
                        shortPosition,
                    }
                }
            } else {
                positions[longPosition.symbol] = {
                    previous: {
                        longPosition: positions[longPosition.symbol]?.current?.longPosition,
                        shortPosition: positions[longPosition.symbol]?.current?.shortPosition
                    },
                    current: {
                        longPosition,
                        shortPosition,
                    }
                }
            }
        } else if (position.data.length == 1) {
            const positionData = position.data[0];

            if (typeof positions[positionData.symbol] === 'undefined') {
                if (positionData.side == "Buy") {
                    positions[positionData.symbol] = {
                        previous: {
                            longPosition: positionData
                        },
                        current: {
                            longPosition: positionData
                        }
                    }
                } else {
                    positions[positionData.symbol] = {
                        previous: {
                            shortPosition: positionData
                        },
                        current: {
                            shortPosition: positionData
                        }
                    }
                }
            } else {
                if (positionData.side == "Buy") {
                    positions[positionData.symbol] = {
                        previous: {
                            longPosition: positions[positionData.symbol].current.longPosition,
                            shortPosition: positions[positionData.symbol].current.shortPosition
                        },
                        current: {
                            longPosition: positionData,
                            shortPosition: positions[positionData.symbol].current.shortPosition
                        }
                    }
                } else {
                    positions[positionData.symbol] = {
                        previous: {
                            longPosition: positions[positionData.symbol].current.longPosition,
                            shortPosition: positions[positionData.symbol].current.shortPosition
                        },
                        current: {
                            longPosition: positions[positionData.symbol].current.longPosition,
                            shortPosition: positionData
                        }
                    }
                }
            }
        }

        const currentPos = position.data[0];

        if (!positions[currentPos.symbol].previous) {
            if (currentPos.side == 'Buy') {
                positions[currentPos.symbol].previous.longPosition = currentPos;
            } else {
                positions[currentPos.symbol].previous.shortPosition = currentPos;
            }
            return;
        }

        let previousPos = positions[currentPos.symbol].previous;
        previousPos = currentPos.side == 'Buy' ? previousPos.longPosition : previousPos.shortPosition;

        //Changing take-profit
        // console.log(currentPos.size, previousPos.size);
        // console.log(currentPos.take_profit, previousPos.take_profit);
        if (currentPos.size == previousPos.size && currentPos.take_profit != previousPos.take_profit) {
            bots.forEach(async botData => {
                const signalMessage = botData.parser.parseSignal({
                    symbol: currentPos.symbol,
                    side: currentPos.side,
                    price_open: currentPos.entry_price,
                    take_profit: currentPos.take_profit,
                    stop_loss: currentPos.stop_loss
                }, "NEW_POSITION_TP");

                await axios.get(URL, {
                    params: {
                        chat_id: botData.chatId,
                        text: signalMessage
                    }
                });
            });
        }

        //Changing stoploss
        console.log(currentPos.size, previousPos.size);
        console.log(currentPos.stop_loss, previousPos.stop_loss);
        if (currentPos.size == previousPos.size && currentPos.stop_loss != previousPos.stop_loss) {
            const slUpRange = orders[currentPos.symbol].price_open + orders[currentPos.symbol].price_open * 0.01;
            const slDownRange = orders[currentPos.symbol].price_open - orders[currentPos.symbol].price_open * 0.01
            if (currentPos.stop_loss >= slDownRange && currentPos.stop_loss <= slUpRange) {
                bots.forEach(async botData => {
                    const signalMessage = botData.parser.parseSignal({
                        symbol: currentPos.symbol,
                        side: currentPos.side,
                        price_open: currentPos.entry_price,
                        take_profit: currentPos.take_profit,
                        stop_loss: currentPos.stop_loss
                    }, "BREAKEVEN_SL");

                    await axios.get(URL, {
                        params: {
                            chat_id: botData.chatId,
                            text: signalMessage
                        }
                    });
                });
            } else {
                bots.forEach(async botData => {
                    const signalMessage = botData.parser.parseSignal({
                        symbol: currentPos.symbol,
                        side: currentPos.side,
                        price_open: currentPos.entry_price,
                        take_profit: currentPos.take_profit,
                        stop_loss: currentPos.stop_loss
                    }, "NEW_POSITION_SL");

                    await axios.get(URL, {
                        params: {
                            chat_id: botData.chatId,
                            text: signalMessage
                        }
                    });
                });
            }
        }

        //For staticstics
        //At start
        const prev = positions[currentPos.symbol].previous;
        const cur = positions[currentPos.symbol].current;

        // console.log(prev);
        // console.log(cur);
        if (prev.longPosition.size == 0 && prev.shortPosition.size == 0 && (cur.longPosition.size > 0 || cur.shortPosition.size > 0)) {
            if (cur.longPosition.size > 0) {
                orders[currentPos.symbol].init_pnl = cur.longPosition.realised_pnl;
                orders[currentPos.symbol].price_open = cur.longPosition.entry_price;
                orders[currentPos.symbol].size = cur.longPosition.size;
                orders[currentPos.symbol].leverage = cur.longPosition.leverage;
            }

            if (cur.shortPosition.size > 0) {
                orders[currentPos.symbol].init_pnl = cur.shortPosition.realised_pnl;
                orders[currentPos.symbol].price_open = cur.shortPosition.entry_price;
                orders[currentPos.symbol].size = cur.shortPosition.size;
                orders[currentPos.symbol].leverage = cur.shortPosition.leverage;
            }
        }

        //At partially closing
        if ((prev.longPosition.size > cur.longPosition.size || prev.shortPosition.size > cur.shortPosition.size) && (cur.longPosition.size > 0 || cur.shortPosition.size > 0)) {
            if (prev.longPosition.size > 0) {
                orders[currentPos.symbol].end_pnl = cur.longPosition.realised_pnl;
                orders[currentPos.symbol].new_size = cur.longPosition.size;
            }

            if (prev.shortPosition.size > 0) {
                orders[currentPos.symbol].end_pnl = cur.shortPosition.realised_pnl;
                orders[currentPos.symbol].new_size = cur.shortPosition.size;
            }
        }

        //At the end
        if ((prev.longPosition.size > 0 || prev.shortPosition.size > 0) && (cur.longPosition.size == 0 && cur.shortPosition.size == 0)) {
            if (prev.longPosition.size > 0) {
                orders[currentPos.symbol].end_pnl = cur.longPosition.realised_pnl;
            }

            if (prev.shortPosition.size > 0) {
                orders[currentPos.symbol].end_pnl = cur.shortPosition.realised_pnl;
            }
        }


    } catch (error) {
        console.log(error);
    }
});

