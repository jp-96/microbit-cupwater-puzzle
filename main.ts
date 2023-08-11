mstate.defineState(StateMachines.M0, "分配待ち", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
    })
    mstate.declareCustomTransition(machine, state, "free=", ["分配完了"], function (args) {
        if (args[0] == 相手のSN) {
            mstate.transitTo(machine, 0)
            // effect/
            空き容量 = args[1]
        }
    })
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "容量水量", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        容量 = 0
        水量 = 0
    })
    mstate.declareDo(machine, state, 500, function () {
        前回の値 = 今回の値
        今回の値 = 0
        if (input.buttonIsPressed(Button.A)) {
            今回の値 += 10
        }
        if (input.buttonIsPressed(Button.B)) {
            今回の値 += 1
        }
    })
    mstate.declareExit(machine, state, function () {
        showNum(容量)
    })
    mstate.declareCustomTransition(machine, state, "", ["アイドル"], function (args) {
        if (0 < 今回の値 && 前回の値 == 今回の値) {
            mstate.transitTo(machine, 0)
            // effect/
            switch (今回の値) {
                case 1:
                    容量 = 3
                    水量 = 0
                    break
                case 10:
                    容量 = 7
                    水量 = 0
                    break
                default:
                    容量 = 10
                    水量 = 10
                    break
            }
        }
    })
})
// 右に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltRight, function () {
    mstate.fire(StateMachines.M0, "tilt", [])
})
mstate.defineState(StateMachines.M0, "ペア確定", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("moved")
    })
    mstate.declareDo(machine, state, 500, function () {
        radio.sendValue("pairing", 相手のSN)
    })
    mstate.declareCustomTransition(machine, state, "pair=", ["傾き待ち"], function (args) {
        if (args[0] == 相手のSN && args[1] == control.deviceSerialNumber()) {
            mstate.transitTo(machine, 0)
            // effect/
            basic.showIcon(IconNames.Heart)
        }
    })
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "受取完了", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
    })
    mstate.declareSimpleTransition(machine, state, "ACK", "受取加算")
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
// 左に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltLeft, function () {
    mstate.fire(StateMachines.M0, "tilt", [])
})
mstate.defineState(StateMachines.M0, "受取候補", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("receiver")
        basic.showLeds(`
            . . # . .
            . . # . .
            # . # . #
            . # # # .
            . . # . .
            `)
    })
    mstate.declareSimpleTransition(machine, state, "ACK", "受取待ち")
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "分配衝突", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("NAK")
    })
    mstate.declareSimpleTransition(machine, state, "", "衝突表示")
})
mstate.defineState(StateMachines.M0, "分配完了", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        受け渡し量 = Math.min(空き容量, 水量)
        radio.sendValue("share", 受け渡し量)
    })
    mstate.declareSimpleTransition(machine, state, "ACK", "分配減算")
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "分配候補", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("sender")
        basic.showLeds(`
            . . # . .
            . # # # .
            # . # . #
            . . # . .
            . . # . .
            `)
    })
    mstate.declareSimpleTransition(machine, state, "receiver", "分配待ち")
    mstate.declareSimpleTransition(machine, state, "sender", "分配衝突")
    mstate.declareSimpleTransition(machine, state, "NAK", "衝突表示")
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
// 0～10までの数字を一文字で表示
function showNum (value: number) {
    if (10 > value) {
        basic.showNumber(value)
    } else {
        basic.showLeds(`
            # . # # .
            # # . . #
            # # . . #
            # # . . #
            # . # # .
            `)
    }
}
mstate.defineState(StateMachines.M0, "時間切れ", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        点滅 = 0
        basic.showIcon(IconNames.No)
    })
    mstate.declareDo(machine, state, 200, function () {
        if (0 == 点滅) {
            点滅 = 1
            led.setBrightness(100)
        } else {
            点滅 = 0
            led.setBrightness(255)
        }
    })
    mstate.declareExit(machine, state, function () {
        led.setBrightness(255)
        basic.showIcon(IconNames.Happy)
    })
    mstate.declareCustomTransition(machine, state, "", ["アイドル"], function (args) {
        if (mstate.isTimeouted(machine, 2000)) {
            mstate.transitTo(machine, 0)
        }
    })
})
mstate.defineState(StateMachines.M0, "衝突表示", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        basic.showIcon(IconNames.Confused)
    })
    mstate.declareSimpleTransition(machine, state, "", "傾き待ち")
})
// シミュレーターでA+Bを同時に押す為に配置（デバッグ用）
input.onButtonPressed(Button.AB, function () {
	
})
// 無線で文字列を受信したときに、トリガー
radio.onReceivedString(function (receivedString) {
    if ("moved" == receivedString) {
        mstate.fire(StateMachines.M0, "moved", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("sender" == receivedString) {
        mstate.fire(StateMachines.M0, "sender", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("receiver" == receivedString) {
        mstate.fire(StateMachines.M0, "receiver", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("NAK" == receivedString) {
        mstate.fire(StateMachines.M0, "NAK", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("ACK" == receivedString) {
        mstate.fire(StateMachines.M0, "ACK", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else {
    	
    }
})
mstate.defineState(StateMachines.M0, "相手待ち", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        basic.showIcon(IconNames.Yes)
        radio.sendString("moved")
        相手のSN = 0
        空き容量 = 0
        受け渡し量 = 0
    })
    mstate.declareCustomTransition(machine, state, "moved", ["ペア確定"], function (args) {
        mstate.transitTo(machine, 0)
        // effect/
        相手のSN = args[0]
    })
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
// 無線でキーと値を受信したときに、トリガー（引数あり）
radio.onReceivedValue(function (name, value) {
    if ("pairing" == name) {
        mstate.fire(StateMachines.M0, "pair=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("free" == name) {
        mstate.fire(StateMachines.M0, "free=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("share" == name) {
        mstate.fire(StateMachines.M0, "share=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else {
    	
    }
})
mstate.defineState(StateMachines.M0, "受取待ち", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        空き容量 = 容量 - 水量
        radio.sendValue("free", 空き容量)
    })
    mstate.declareCustomTransition(machine, state, "share=", ["受取完了"], function (args) {
        if (args[0] == 相手のSN) {
            mstate.transitTo(machine, 0)
            // effect/
            受け渡し量 = args[1]
        }
    })
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "傾き待ち", function (machine, state) {
    mstate.declareSimpleTransition(machine, state, "tilt", "分配候補")
    mstate.declareSimpleTransition(machine, state, "sender", "受取候補")
    mstate.declareTimeoutedTransition(machine, state, 3000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "分配減算", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
        水量 += -1 * 受け渡し量
    })
    mstate.declareSimpleTransition(machine, state, "", "アイドル")
})
mstate.defineState(StateMachines.M0, "受取加算", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        水量 += 受け渡し量
    })
    mstate.declareSimpleTransition(machine, state, "", "アイドル")
})
mstate.defineState(StateMachines.M0, "アイドル", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        showNum(水量)
    })
    mstate.declareDo(machine, state, 100, function () {
        if (1200 < input.acceleration(Dimension.Strength)) {
            mstate.fire(StateMachines.M0, "lift", [])
        }
    })
    mstate.declareSimpleTransition(machine, state, "lift", "相手待ち")
})
let 点滅 = 0
let 受け渡し量 = 0
let 今回の値 = 0
let 前回の値 = 0
let 水量 = 0
let 容量 = 0
let 空き容量 = 0
let 相手のSN = 0
radio.setGroup(1)
radio.setTransmitSerialNumber(true)
// mstate.exportUml("容量水量", true, function (line) {
// console.log(line)
// })
mstate.start(StateMachines.M0, "容量水量")
