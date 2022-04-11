const { default: axios } = require('axios');

let api = function Bybit(options = {}) {
    const Bybit = this;
    const WebSocket = require('ws');
    const crypto = require('crypto');

    const publicSpotStream = "wss://stream.bybit.com/spot/quote/ws/v1";
    const privateSpotStream = "wss://stream.bybit.com/spot/ws";
    const privateFuturesStream = "wss://stream.bytick.com/realtime_private";

    const base = "https://api.bybit.com";

    Bybit.subscriptions = {};
    Bybit.options = {
        reconnect: true,
        verbose: true,
        log: function (...args) {
            console.log(Array.prototype.slice.call(args));
        }
    }

    if (options) setOptions(options);

    function setOptions() {
        Bybit.options = options;
    }
    
    const getTime = async () => {
        return +(await axios.get(base + "/v2/public/time")).data.time_now;
    }

    const getSignature = (parameters, secret) => {
        let orderedParams = "";
        Object.keys(parameters).sort().forEach(function (key) {
            orderedParams += key + "=" + parameters[key] + "&";
        });
        orderedParams = orderedParams.substring(0, orderedParams.length - 1);

        return crypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
    }

    const userDataHandler = data => {
        let type = data.e;
        if (type === 'outboundAccountInfo') {
            if (Bybit.options.executionCallback) Bybit.options.executionCallback(data);
        } else if (type === 'executionReport') {
            if (Bybit.options.outboundCallback) Bybit.options.outboundCallback(data);
        } else if (type === 'ticketInfo') {
            if (Bybit.options.ticketInfoCallback) Bybit.options.ticketInfoCallback(data);
        } else if (!data.ping) {
            Bybit.options.log('Unexpected userData: ');
            Bybit.options.log(data);
        }
    };

    const futurePrivateDataHandler = (data, callback) => {
        if (data.topic) {
            callback(data);
        }
    }

    const handleSocketClose = function (reconnect, code, reason) {
        delete Bybit.subscriptions[this.endpoint];
        if (Bybit.subscriptions && Object.keys(Bybit.subscriptions).length === 0) {
            clearInterval(Bybit.socketHeartbeatInterval);
        }
        Bybit.options.log('WebSocket closed: ' + this.endpoint);
            // (code ? ' (' + code + ')' : '') +
            // (reason ? ' ' + reason : ''));
        if (Bybit.options.reconnect && reconnect) {
            if (this.endpoint && parseInt(this.endpoint.length, 10) === 60) Bybit.options.log('Account data WebSocket reconnecting...');
            else Bybit.options.log('WebSocket reconnecting: ' + this.endpoint + '...');
            try {
                reconnect();
            } catch (error) {
                Bybit.options.log('WebSocket reconnect error: ' + error.message);
            }
        }
    };

    const subscribe = (stream, endpoint, callback, reconnect = false, opened_callback = false) => {
        let ws = new WebSocket(stream + endpoint);

        ws.endpoint = endpoint;
        ws.isAlive = false;
        ws.on('open', () => {
            expires = new Date().getTime() + 10000;
            signature = crypto.createHmac("sha256", Bybit.options.SECRETKEY).update("GET/realtime" + expires).digest("hex");
            payload = {
                op: "auth",
                args: [Bybit.options.APIKEY, expires.toFixed(0), signature],
            }

            switch (stream) {
                case publicSpotStream:
                    ws.send(JSON.stringify({
                        "symbol": "BTCUSDT",
                        "topic": "trade",
                        "event": "sub",
                        "params": { "binary": false }
                    }));
                    break;
                case privateSpotStream:
                    ws.send(JSON.stringify(payload));
                    setInterval(() => { ws.ping() }, 30000);
                    break;
            }

        });
        ws.on('error', (err) => console.log(err));
        ws.on('close', handleSocketClose.bind(ws, reconnect));
        ws.on('message', data => {
            try {
                callback(JSON.parse(data));
            } catch (error) {
                Bybit.options.log('Parse error: ' + error.message);
            }
        });
        return ws;
    }

    const futureSubscribe = (stream, endpoint, callback, reconnect = false, opened_callback = false) => {
        let ws = new WebSocket(stream);

        ws.endpoint = "";
        ws.isAlive = false;
        ws.on('open', () => {
            expires = new Date().getTime() + 10000;
            signature = crypto.createHmac("sha256", Bybit.options.SECRETKEY).update("GET/realtime" + expires).digest("hex");
            payload = {
                op: "auth",
                args: [Bybit.options.APIKEY, expires.toFixed(0), signature],
            }

            switch (stream) {
                case privateFuturesStream:
                    if (Bybit.options.verbose) Bybit.options.log("Websocket connected: " + endpoint);
                    ws.send(JSON.stringify(payload));
                    setInterval(() => { ws.send('{"op":"ping"}'); }, 30000);
                    ws.send(JSON.stringify({ "op": "subscribe", "args": [endpoint] }));
                    break;
            }

        });
        ws.on('error', (err) => console.log(err));
        ws.on('close', handleSocketClose.bind(ws, reconnect));
        ws.on('message', data => {
            try {
                futurePrivateDataHandler(JSON.parse(data), callback);
            } catch (error) {
                Bybit.options.log('Parse error: ' + error.message);
            }
        });
        return ws;
    }

    return {
        positions: function positions(){
            return new Promise(async (resolve, reject) => {
                const params = {
                    api_key: Bybit.options.APIKEY,
                    timestamp: Date.now().toString()
                };
                params.sign = getSignature(params, Bybit.options.SECRETKEY);

                const res = await axios.get(base + "/private/linear/position/list", { params });

                resolve(res.data.result);
            });
        },

        websockets: {
            trade: function trade(symbol, callback) {
                let reconnect = () => {
                    if (Bybit.options.reconnect) trades(symbols, callback);
                };

                const subscription = subscribe(publicSpotStream, symbol.toLowerCase() + '@trade', callback, reconnect);

                return subscription.endpoint;
            },

            userData: function userData(executionCallback, outboundCallback = false, ticketInfoCallback = false) {
                let reconnect = () => {
                    if (Bybit.options.reconnect) userData(outboundCallback, executionCallback, ticketInfoCallback);
                };

                Bybit.executionCallback = executionCallback;
                Bybit.outboundCallback = outboundCallback;
                Bybit.ticketInfoCallback = ticketInfoCallback;

                const subscription = subscribe(privateSpotStream, "", userDataHandler, reconnect);
                return subscription.endpoint;
            },

            futurePosition: function futurePosition(callback) {
                let reconnect = () => {
                    if (Bybit.options.reconnect) futurePosition(callback);
                };

                const subscription = futureSubscribe(privateFuturesStream, "position", callback, reconnect);
                return subscription;
            },

            futureOrder: function futureOrder(callback) {
                let reconnect = () => {
                    if (Bybit.options.reconnect) futureOrder(callback);
                };

                const subscription = futureSubscribe(privateFuturesStream, "order", callback, reconnect);
                return subscription;
            },

            futureExecution: function futureExecution(callback) {
                let reconnect = () => {
                    if (Bybit.options.reconnect) futureExecution(callback);
                };

                const subscription = futureSubscribe(privateFuturesStream, "execution", callback, reconnect);
                return subscription;
            },
        }
    }
}

module.exports = api;