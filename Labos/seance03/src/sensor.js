//"events" 不是你自己写的文件，也不是需要 npm install 的第三方 package。它是 Node.js 内置模块（module natif）
//从 Node.js 自带的 events 模块里面，把 EventEmitter 这个东西拿出来。
import { EventEmitter } from "events"; //EventEmitter 是一个类（class），可以用来创建对象，这些对象可以发出事件（emit）和监听事件（on）。

export class Sensor extends EventEmitter { //继承 EventEmitter 类，Sensor 类可以发出事件（emit）和监听事件（on）。
  constructor(id, { min, max }) { //构造函数，接收传感器的 id 和最小值、最大值
    super();
    this.id = id;
    this.min = min;
    this.max = max;
    this.timer = null;
  }

  read() {  //生成一个随机数，表示传感器的测量值，范围在最小值和最大值之间
    const value = this.min + Math.random() * (this.max - this.min);
    return Number(value.toFixed(1)); //保留一位小数
  }

  start(intervalMs = 2000) { //启动传感器，每隔 intervalMs 毫秒生成一个测量值，并发出一个 "measure" 事件，事件的参数是一个对象，包含传感器的 id、测量值和时间戳
    if (this.timer) return; //如果传感器已经启动，就不再启动， this.timer 很简单，它是 Sensor 对象用来保存“定时器”的一个属性

    this.timer = setInterval(() => { //setInterval() 是 Node.js 提供的一个函数，可以用来创建一个定时器，每隔 intervalMs 毫秒执行一次回调函数
          const measure = { //创建一个测量对象，包含传感器的 id、测量值和时间戳 
            sensor: this.id, //传感器的 id
            value: this.read(), //调用 read() 方法，生成一个随机数，表示传感器的测量值
            createdAt: new Date().toISOString(), //时间戳，表示测量的时间，格式是 ISO 8601. new Date() 创建一个代表“现在这个时间”的 Date 对象。
          };

          this.emit("measure", measure); //发出一个 "measure" 事件，事件的参数是测量对象。emit() 是 EventEmitter 类提供的方法，可以用来发出事件，参数是事件的名称和事件的参数。
      }, intervalMs);
  }

  stop() { //停止传感器，清除定时器
    clearInterval(this.timer); //clearInterval() 是 Node.js 提供的一个函数，可以用来清除定时器，参数是定时器的 id
    this.timer = null; //把 this.timer 置为 null，表示传感器已经停止
  }
}