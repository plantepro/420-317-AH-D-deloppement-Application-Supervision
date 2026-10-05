//负责启动传感器并将测量值存储到数据库中。然后启动HTTP服务器，监听端口3000。只关心服务器什么时候启动 监听哪个端口，传感器什么时候启动，测量值什么时候被存储到数据库中。然后将应用程序导出以供服务器使用。
//如果以后写测试 不想真的启动传感器和HTTP服务器，可以在测试中导入这个模块，然后模拟传感器和HTTP请求。
import app from "./app.js";
import { Sensor } from "./sensor.js";
import * as measureService from "./services/measure.service.js";

const sensor = new Sensor("temp-b127", { min: 18, max: 32 }); //创建一个新的传感器对象，传感器的ID为"temp-b127"，测量值的范围为18到32。Sensor类继承自EventEmitter类，可以发出事件。传感器对象有一个read()方法，可以随机生成一个测量值，并返回一个包含sensor、value和createdAt属性的对象。
sensor.on("measure", (measure) => measureService.add(measure)); //当传感器发出测量事件时，将测量值添加到measureService中。sensor.on()是EventEmitter提供的方法，用于监听事件。这里监听的是"measure"事件，当事件发生时，回调函数会被调用，接收一个measure对象作为参数。measure对象包含sensor、value和createdAt属性，分别表示传感器的名称、测量值和测量时间。
sensor.start();

app.listen(3000, () => console.log("http://localhost:3000"));
