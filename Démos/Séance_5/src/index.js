import app from "./app.js";
import * as measureService from "./services/measure.service.js";
import {Sensor} from "./sensor.js"

const sensor = new Sensor("tmp-127",{min: 18, max: 32}); //创建一个新的传感器对象，传感器的ID为"tmp-127"，测量值的范围为18到32。Sensor类继承自EventEmitter类，可以发出事件。传感器对象有一个read()方法，可以随机生成一个测量值，并返回一个包含sensor、value和createdAt属性的对象。
sensor.on("measure", (measure) => measureService.add(measure)); //当传感器发出测量事件时，将测量值添加到measureService中。sensor.on()是EventEmitter提供的方法，用于监听事件。这里监听的是"measure"事件，当事件发生时，回调函数会被调用，接收一个measure对象作为参数。measure对象包含sensor、value和createdAt属性，分别表示传感器的名称、测量值和测量时间。
sensor.start();


app.listen(3000, () => console.log("http://localhost:3000"));