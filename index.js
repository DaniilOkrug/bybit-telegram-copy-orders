const config = require("./config");
const TelegramBot = require('node-telegram-bot-api');
const Bybit = require('./bybit/node-bybit-api');
const Parser = require("./middleware/parser");
const ImageGenearator = require('./middleware/imageGenerator');
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
        messageCancel: data.messageCancel,
        messageClose: data.messageClose,
        messageClosePartially: data.messageClosePartially,
        messageStopLossChange: data.messageStopLossChange,
        messageTakeProfitChange: data.messageTakeProfitChange,
        messageStopLoss: data.messageStopLoss,
        messageTakeProfit: data.messageTakeProfit,
        messageBreakEvenStopLoss: data.messageBreakEvenStopLoss,
        messageDeleteStopLoss: data.messageDeleteStopLoss,
        messageDeleteTakeProfit: data.messageDeleteTakeProfit,
        messageCloseByTakeProfit: data.messageCloseByTakeProfit,
        messageCloseByStopLoss: data.messageCloseByStopLoss,
    };
    const placeholders = typeof data.messagePlaceholders !== 'undefined' ? data.messagePlaceholders : false
    const parser = new Parser(messages, placeholders);

    bots.push({
        bot: new TelegramBot(data.token, { polling: true }),
        token: data.token,
        chatId_channel: data.chat_id_channel,
        chatId_group: data.chat_id_group,
        parser
    });
});

(async () => {
    // console.log(await bybitBot.positions());
    (await bybitBot.positions()).forEach(position => {
        if (typeof positions[position.data.symbol] === 'undefined') {
            positions[position.data.symbol] = {
                previous: {},
                current: {}
            }
        }

        if (position.data.side == 'Buy') {
            positions[position.data.symbol].previous.longPosition = position.data;
            positions[position.data.symbol].current.longPosition = position.data;
        } else {
            positions[position.data.symbol].previous.shortPosition = position.data;
            positions[position.data.symbol].current.shortPosition = position.data;
        }
    });
    console.log(positions);
})();

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
        setTimeout(async () => {
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
                            const { longPosition, shortPosition } = positions[orderData.symbol].current;
                            if (orderData.create_type != "CreateByClosing" && longPosition.size == 0 && shortPosition.size == 0) {
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

                    if (typeof botData.chatId_group !== 'undefined') {
                        botData.bot.sendMessage(botData.chatId_group, messageSignal);
                    }

                    if (typeof botData.chatId_channel !== 'undefined') {
                        await axios.get(URL, {
                            params: {
                                chat_id: botData.chatId_channel,
                                text: messageSignal
                            }
                        });
                    }
                });
            }

            if (orderData.order_status == "Cancelled") {
                bots.forEach(async botData => {
                    const messageSignal = botData.parser.parseSignal({
                        price_open: orderData.price,
                        ...orderData
                    }, "");

                    if (typeof botData.chatId_group !== 'undefined') {
                        botData.bot.sendMessage(botData.chatId_group, messageSignal);
                    }

                    if (typeof botData.chatId_channel !== 'undefined') {
                        await axios.get(URL, {
                            params: {
                                chat_id: botData.chatId_channel,
                                text: messageSignal
                            }
                        });
                    }
                });
            }

            if (orderData.order_status == "Filled") {
                console.log(orders[orderData.symbol]);
                if (typeof positions[orderData.symbol] !== 'undefined') {
                    const { longPosition, shortPosition } = positions[orderData.symbol].current;
                    const prevLongPosition = positions[orderData.symbol].previous.longPosition;
                    const prevShortPosition = positions[orderData.symbol].previous.shortPosition;

                    console.log("here", prevLongPosition, longPosition);

                    //Закрытие части или всей позиции
                    const fullCloseCondition = (shortPosition.size == 0 && prevShortPosition?.size > 0) || (longPosition.size == 0 && prevLongPosition?.size > 0)
                    const limitCloseCondition = orderData.order_type == "Limit" && ((shortPosition.size > 0 && prevShortPosition?.size > 0) || (longPosition.size > 0 && prevLongPosition?.size > 0));
                    const marketCloseCondition = orderData.order_type == "Market" && ((orderData.side == 'Buy' && shortPosition.size > 0 && prevShortPosition?.size > shortPosition.size) || (orderData.side == 'Sell' && longPosition.size > 0 && prevLongPosition?.size > longPosition.size))
                    if (orderData.create_type == "CreateByClosing" || marketCloseCondition || limitCloseCondition || fullCloseCondition) {
                        // console.log(fullCloseCondition, limitCloseCondition, marketCloseCondition);

                        //Full close long
                        if (longPosition.size == 0 && prevLongPosition?.size > 0) {
                            const order = orders[orderData.symbol].long;
                            // let roi = ((Math.abs(order.end_pnl - order.init_pnl)) / (order.size * prevLongPosition.entry_price)) * 100;
                            roi = ((orderData.last_exec_price - prevLongPosition.entry_price) / (orderData.last_exec_price / prevLongPosition.leverage)) * 100;

                            // if (order.end_pnl < order.init_pnl) {
                            //     roi *= -1;
                            // }

                            bots.forEach(async botData => {
                                let signalMessage;

                                if (orderData.create_type == 'CreateByTakeProfit') {
                                    signalMessage = botData.parser.parseSignal({
                                        roi: roi.toFixed(3),
                                        price_close: orderData.last_exec_price,
                                        price_open: prevLongPosition.entry_price,
                                        closePercent: Math.round((orderData.qty / order.size) * 100),
                                        ...orderData
                                    }, "CloseByTakeProfit");
                                } else if (orderData.create_type == 'CreateByStopLoss') {
                                    signalMessage = botData.parser.parseSignal({
                                        roi: roi.toFixed(3),
                                        price_close: orderData.last_exec_price,
                                        price_open: prevLongPosition.entry_price,
                                        closePercent: Math.round((orderData.qty / order.size) * 100),
                                        ...orderData
                                    }, "CloseByStopLoss");
                                } else {
                                    signalMessage = botData.parser.parseSignal({
                                        roi: roi.toFixed(3),
                                        price_close: orderData.last_exec_price,
                                        price_open: prevLongPosition.entry_price,
                                        ...orderData
                                    }, "CLOSE");
                                }

                                if (typeof botData.chatId_group !== 'undefined') {
                                    await ImageGenearator.new('Long', {
                                        symbol: orderData.symbol,
                                        open: prevLongPosition.entry_price,
                                        close: orderData.last_exec_price,
                                        leverage: prevLongPosition.leverage,
                                        pnl: roi.toFixed(3)
                                    });
                                    // botData.bot.sendMessage(botData.chatId_group, signalMessage);
                                    botData.bot.sendPhoto(botData.chatId_group, './output.png', {
                                        caption: signalMessage
                                    });
                                }

                                if (typeof botData.chatId_channel !== 'undefined') {
                                    await axios.get(URL, {
                                        params: {
                                            chat_id: botData.chatId_channel,
                                            text: signalMessage
                                        }
                                    });
                                }

                                delete orders[orderData.symbol].long;
                            });
                            return;
                        }

                        //Full close short
                        if (shortPosition.size == 0 && prevShortPosition?.size > 0) {
                            const order = orders[orderData.symbol].short;
                            // let roi = ((Math.abs(order.end_pnl - order.init_pnl)) / (order.size * prevShortPosition.entry_price)) * 100;
                            roi = ((prevShortPosition.entry_price - orderData.last_exec_price) / (orderData.last_exec_price / prevShortPosition.leverage)) * 100;

                            // if (order.end_pnl < order.init_pnl) {
                            //     roi *= -1;
                            // }

                            bots.forEach(async botData => {
                                let signalMessage;

                                if (orderData.create_type == 'CreateByTakeProfit') {
                                    signalMessage = botData.parser.parseSignal({
                                        roi: roi.toFixed(3),
                                        price_close: orderData.last_exec_price,
                                        price_open: prevShortPosition.entry_price,
                                        closePercent: Math.round((orderData.qty / order.size) * 100),
                                        ...orderData
                                    }, "CloseByTakeProfit");
                                } else if (orderData.create_type == 'CreateByStopLoss') {
                                    signalMessage = botData.parser.parseSignal({
                                        roi: roi.toFixed(3),
                                        price_close: orderData.last_exec_price,
                                        price_open: prevShortPosition.entry_price,
                                        closePercent: Math.round((orderData.qty / order.size) * 100),
                                        ...orderData
                                    }, "CloseByStopLoss");
                                } else {
                                    signalMessage = botData.parser.parseSignal({
                                        roi: roi.toFixed(3),
                                        price_close: orderData.last_exec_price,
                                        price_open: prevShortPosition.entry_price,
                                        ...orderData
                                    }, "CLOSE");
                                }

                                if (typeof botData.chatId_group !== 'undefined') {
                                    await ImageGenearator.new('Short', {
                                        symbol: orderData.symbol,
                                        open: prevShortPosition.entry_price,
                                        close: orderData.last_exec_price,
                                        leverage: prevShortPosition.leverage,
                                        pnl: roi.toFixed(3)
                                    });
                                    // botData.bot.sendMessage(botData.chatId_group, signalMessage);
                                    botData.bot.sendPhoto(botData.chatId_group, './output.png', {
                                        caption: signalMessage
                                    });
                                }

                                if (typeof botData.chatId_channel !== 'undefined') {
                                    await axios.get(URL, {
                                        params: {
                                            chat_id: botData.chatId_channel,
                                            text: signalMessage
                                        }
                                    });
                                }

                                delete orders[orderData.symbol].short;
                            });
                            return;
                        }

                        //Partially close
                        bots.forEach(async botData => {
                            try {
                                let order;
                                let signalMessage;
                                let roi;

                                if (shortPosition.size < prevShortPosition?.size) {
                                    order = orders[orderData.symbol].short;

                                    //My previuous roi
                                    // roi = ((Math.abs(order.end_pnl - order.init_pnl)) / (order.size * shortPosition.entry_price)) * 100;
                                    //New roi
                                    roi = ((shortPosition.entry_price - orderData.last_exec_price) / (orderData.last_exec_price / shortPosition.leverage)) * 100;
                                    // if (order.end_pnl < order.init_pnl) {
                                    //     roi *= -1;
                                    // }

                                    if (orderData.create_type == 'CreateByTakeProfit') {
                                        signalMessage = botData.parser.parseSignal({
                                            roi: roi.toFixed(3),
                                            closePercent: Math.round((orderData.qty / order.size) * 100),
                                            price_close: orderData.last_exec_price,
                                            price_open: shortPosition.entry_price,
                                            ...orderData
                                        }, "CloseByTakeProfit");
                                    } else if (orderData.create_type == 'CreateByStopLoss') {
                                        signalMessage = botData.parser.parseSignal({
                                            roi: roi.toFixed(3),
                                            closePercent: Math.round((orderData.qty / order.size) * 100),
                                            price_close: orderData.last_exec_price,
                                            price_open: shortPosition.entry_price,
                                            ...orderData
                                        }, "CloseByStopLoss");
                                    } else {
                                        signalMessage = botData.parser.parseSignal({
                                            roi: roi.toFixed(3),
                                            closePercent: Math.round((orderData.qty / order.size) * 100),
                                            price_close: orderData.last_exec_price,
                                            price_open: shortPosition.entry_price,
                                            ...orderData
                                        }, "PARTIALLY");
                                    }

                                    await ImageGenearator.new('Short', {
                                        symbol: orderData.symbol,
                                        open: prevShortPosition.entry_price,
                                        close: orderData.last_exec_price,
                                        leverage: prevShortPosition.leverage,
                                        pnl: roi.toFixed(3)
                                    });
                                } else {
                                    order = orders[orderData.symbol].long;

                                    // roi = ((Math.abs(order.end_pnl - order.init_pnl)) / (order.size * longPosition.entry_price)) * 100;
                                    roi = ((orderData.last_exec_price - longPosition.entry_price) / (orderData.last_exec_price / longPosition.leverage)) * 100;
                                    // if (order.end_pnl < order.init_pnl) {
                                    //     roi *= -1;
                                    // }

                                    if (orderData.create_type == 'CreateByTakeProfit') {
                                        signalMessage = botData.parser.parseSignal({
                                            roi: roi.toFixed(3),
                                            closePercent: Math.round((orderData.qty / order.size) * 100),
                                            price_close: orderData.last_exec_price,
                                            price_open: longPosition.entry_price,
                                            ...orderData
                                        }, "CloseByTakeProfit");
                                    } else if (orderData.create_type == 'CreateByStopLoss') {
                                        signalMessage = botData.parser.parseSignal({
                                            roi: roi.toFixed(3),
                                            closePercent: Math.round((orderData.qty / order.size) * 100),
                                            price_close: orderData.last_exec_price,
                                            price_open: longPosition.entry_price,
                                            ...orderData
                                        }, "CloseByStopLoss");
                                    } else {
                                        signalMessage = botData.parser.parseSignal({
                                            roi: roi.toFixed(3),
                                            closePercent: Math.round((orderData.qty / order.size) * 100),
                                            price_close: orderData.last_exec_price,
                                            price_open: longPosition.entry_price,
                                            ...orderData
                                        }, "PARTIALLY");
                                    }

                                    await ImageGenearator.new('Long', {
                                        symbol: orderData.symbol,
                                        open: prevLongPosition.entry_price,
                                        close: orderData.last_exec_price,
                                        leverage: prevLongPosition.leverage,
                                        pnl: roi.toFixed(3)
                                    });
                                }

                                console.log('Signal message: ', signalMessage);

                                if (typeof botData.chatId_group !== 'undefined') {
                                    // botData.bot.sendMessage(botData.chatId_group, signalMessage);
                                    botData.bot.sendPhoto(botData.chatId_group, './output.png', {
                                        caption: signalMessage
                                    });
                                }

                                if (typeof botData.chatId_channel !== 'undefined') {
                                    await axios.get(URL, {
                                        params: {
                                            chat_id: botData.chatId_channel,
                                            text: signalMessage
                                        }
                                    });
                                }

                                if (longPosition.size < prevLongPosition?.size) {
                                    orders[orderData.symbol].long.size = orders[orderData.symbol].long.new_size;
                                }

                                if (shortPosition.size < prevShortPosition?.size) {
                                    orders[orderData.symbol].short.size = orders[orderData.symbol].short.new_size;
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                        return;
                    }

                    //Продажа или покупка актива
                    bots.forEach(async botData => {
                        let signalMessage;
                        if (longPosition.size > prevLongPosition.size) {
                            signalMessage = botData.parser.parseSignal({
                                leverage: orders[orderData.symbol].long.leverage,
                                price_open: orderData.last_exec_price,
                                ...orderData
                            }, "");
                        } else if (shortPosition.size > prevShortPosition.size) {
                            signalMessage = botData.parser.parseSignal({
                                leverage: orders[orderData.symbol].short.leverage,
                                price_open: orderData.last_exec_price,
                                ...orderData
                            }, "");
                        }

                        if (typeof botData.chatId_group !== 'undefined') {
                            botData.bot.sendMessage(botData.chatId_group, signalMessage);
                        }

                        if (typeof botData.chatId_channel !== 'undefined') {
                            await axios.get(URL, {
                                params: {
                                    chat_id: botData.chatId_channel,
                                    text: signalMessage
                                }
                            });
                        }
                    });
                }
            }
        }, 2000);
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
        if (currentPos.size == previousPos.size && currentPos.take_profit != previousPos.take_profit) {
            bots.forEach(async botData => {
                const signalMessage = botData.parser.parseSignal({
                    symbol: currentPos.symbol,
                    side: currentPos.side,
                    price_open: currentPos.entry_price,
                    take_profit: currentPos.take_profit,
                    stop_loss: currentPos.stop_loss
                }, "NEW_POSITION_TP");

                if (typeof botData.chatId_group !== 'undefined') {
                    botData.bot.sendMessage(botData.chatId_group, signalMessage);
                }

                if (typeof botData.chatId_channel !== 'undefined') {
                    await axios.get(URL, {
                        params: {
                            chat_id: botData.chatId_channel,
                            text: signalMessage
                        }
                    });
                }
            });
        }

        //Changing stoploss
        if (currentPos.size == previousPos.size && currentPos.stop_loss != previousPos.stop_loss) {
            const slUpRange = currentPos.entry_price + currentPos.entry_price * 0.01;
            const slDownRange = currentPos.entry_price - currentPos.entry_price * 0.01
            if (currentPos.stop_loss >= slDownRange && currentPos.stop_loss <= slUpRange) {
                bots.forEach(async botData => {
                    const signalMessage = botData.parser.parseSignal({
                        symbol: currentPos.symbol,
                        side: currentPos.side,
                        price_open: currentPos.entry_price,
                        take_profit: currentPos.take_profit,
                        stop_loss: currentPos.stop_loss
                    }, "BREAKEVEN_SL");

                    if (typeof botData.chatId_group !== 'undefined') {
                        botData.bot.sendMessage(botData.chatId_group, signalMessage);
                    }

                    if (typeof botData.chatId_channel !== 'undefined') {
                        await axios.get(URL, {
                            params: {
                                chat_id: botData.chatId_channel,
                                text: signalMessage
                            }
                        });
                    }
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

                    if (typeof botData.chatId_group !== 'undefined') {
                        botData.bot.sendMessage(botData.chatId_group, signalMessage);
                    }

                    if (typeof botData.chatId_channel !== 'undefined') {
                        await axios.get(URL, {
                            params: {
                                chat_id: botData.chatId_channel,
                                text: signalMessage
                            }
                        });
                    }
                });
            }
        }

        //For staticstics
        //At start
        const prev = positions[currentPos.symbol].previous;
        const cur = positions[currentPos.symbol].current;

        // console.log(prev);
        // console.log(cur);

        if (prev.longPosition.size == 0 && cur.longPosition.size > 0) {
            if (typeof orders[currentPos.symbol] === 'undefined') {
                orders[currentPos.symbol] = {
                    long: {},
                    short: {},
                    order_ids: []
                };
            }

            if (!orders[currentPos.symbol].long) {
                orders[currentPos.symbol].long = {};
            }

            orders[currentPos.symbol].long.init_pnl = cur.longPosition.realised_pnl;
            orders[currentPos.symbol].long.price_open = cur.longPosition.entry_price;
            orders[currentPos.symbol].long.size = cur.longPosition.size;
            orders[currentPos.symbol].long.leverage = cur.longPosition.leverage;
        }

        if (cur.shortPosition.size > 0 && prev.shortPosition.size == 0) {
            if (typeof orders[currentPos.symbol] === 'undefined') {
                orders[currentPos.symbol] = {
                    long: {},
                    short: {},
                    order_ids: []
                };
            }

            if (!orders[currentPos.symbol].short) {
                orders[currentPos.symbol].short = {};
            }

            orders[currentPos.symbol].short.init_pnl = cur.shortPosition.realised_pnl;
            orders[currentPos.symbol].short.price_open = cur.shortPosition.entry_price;
            orders[currentPos.symbol].short.size = cur.shortPosition.size;
            orders[currentPos.symbol].short.leverage = cur.shortPosition.leverage;
        }

        //At adding to current position
        if (cur.longPosition.size > 0 && prev.longPosition.size > 0 && prev.longPosition.size < cur.longPosition.size) {
            orders[currentPos.symbol].long.size = cur.longPosition.size;
        }

        if (cur.shortPosition.size > 0 && prev.shortPosition.size > 0 && prev.shortPosition.size < cur.shortPosition.size) {
            orders[currentPos.symbol].short.size = cur.shortPosition.size;
        }

        //At partially closing
        if (prev.longPosition.size > cur.longPosition.size && cur.longPosition.size > 0) {
            if (typeof orders[currentPos.symbol] !== 'undefined') {
                if (typeof orders[currentPos.symbol].long !=='undefined') {
                    orders[currentPos.symbol].long.end_pnl = cur.longPosition.realised_pnl;
                    orders[currentPos.symbol].long.new_size = cur.longPosition.size;
                }
            }
        }

        if (prev.shortPosition.size > cur.shortPosition.size && prev.shortPosition.size > 0) {
            if (typeof orders[currentPos.symbol] !== 'undefined') {
                if (typeof orders[currentPos.symbol].short !== 'undefined') {
                    orders[currentPos.symbol].short.end_pnl = cur.shortPosition.realised_pnl;
                    orders[currentPos.symbol].short.new_size = cur.shortPosition.size;
                }
            }
        }

        //At the end
        if (prev.longPosition.size > 0 && cur.longPosition.size == 0) {
            if (typeof orders[currentPos.symbol] !== 'undefined') {
                if (typeof orders[currentPos.symbol].long !== 'undefined') {
                    orders[currentPos.symbol].long.end_pnl = cur.longPosition.realised_pnl;
                }
            }
        }

        if (prev.shortPosition.size > 0 && cur.shortPosition.size == 0) {
            if (typeof orders[currentPos.symbol] !== 'undefined') {
                if (typeof orders[currentPos.symbol].short !== 'undefined') {
                    orders[currentPos.symbol].short.end_pnl = cur.shortPosition.realised_pnl;
                }
            }
        }


    } catch (error) {
        console.log(error);
    }
});

