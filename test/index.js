const assert = require('assert');
const { parseSignal } = require('../middleware/parser');
const config = require('../config');

describe('Parse message', function () {
    describe('parseSignal', function () {
        it('return correct message', function () {
            const input = {
                "topic": "order",
                "action": "",
                "data": [
                    {
                        "order_id": "xxxxxxxx-xxxx-xxxx-9a8f-4a973eb5c418",
                        "order_link_id": "",
                        "symbol": "BTCUSDT",
                        "side": "Buy",
                        "order_type": "Limit",
                        "price": 11000,
                        "qty": 0.001,
                        "leaves_qty": 0.001,
                        "last_exec_price": 0,
                        "cum_exec_qty": 0,
                        "cum_exec_value": 0,
                        "cum_exec_fee": 0,
                        "time_in_force": "GoodTillCancel",
                        "create_type": "CreateByUser",
                        "cancel_type": "UNKNOWN",
                        "order_status": "New",
                        "take_profit": 0,
                        "stop_loss": 0,
                        "trailing_stop": 0,
                        "reduce_only": false,
                        "close_on_trigger": false,
                        "position_idx": 1,
                        "create_time": "2020-08-12T21:18:40.780039678Z",
                        "update_time": "2020-08-12T21:18:40.787986415Z"
                    }
                ]
            }

            const message = parseSignal(input.data[0], config.telegram.bots[0].messageSample);
            console.log(message);
            setTimeout(() => {}, 1000)
        });
    });
});