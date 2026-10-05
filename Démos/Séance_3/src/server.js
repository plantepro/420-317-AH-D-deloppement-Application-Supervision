import http from "http";
import { Sensor } from "./sensor.js"
import { sendJson } from "./sendJson.js";
import { readFile } from "fs/promises";

const measures = [];
const sensor = new Sensor("temp-b127", {min: 18, max: 32}); //创建一个新的传感器对象，传感器的ID为"temp-b127"，测量值的范围为18到32。Sensor类继承自EventEmitter类，可以发出事件。传感器对象有一个read()方法，可以随机生成一个测量值，并返回一个包含sensor、value和createdAt属性的对象。
sensor.on("measure", (measure) => measures.push(measure)); //当传感器发出测量事件时，将测量值添加到measures数组中。sensor.on()是EventEmitter提供的方法，用于监听事件。这里监听的是"measure"事件，当事件发生时，回调函数会被调用，接收一个measure对象作为参数。measure对象包含sensor、value和createdAt属性，分别表示传感器的名称、测量值和测量时间。
sensor.start();


const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/measures") {
        const min = url.searchParams.get("min");
        const result = min === null ? measures : measures.filter((m) => m.value > Number(min));
        return sendJson(res, 200, result);
    }

    if (req.method === "GET" && url.pathname === "/api/measures/latest") {
        return sendJson(res, 200, measures.at(-1));
    }

    if (req.method === "GET" && url.pathname === "/") {
        const html = await readFile("src/public/index.html", "utf-8");
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(html);
    }
    if (req.method === "GET" && url.pathname === "/style.css") {
        const css = await readFile("src/public/style.css", "utf-8");
        res.writeHead(200, { "Content-Type": "text/css" });
        return res.end(css);
    }     
    if (req.method === "POST" && url.pathname === "/api/measures") {
        let body = "";
        let chunks = 0;

        req.on("data", (chunk) => {
            chunks += 1;
            body += chunk;
        });

        req.on("end", () => {
            try {
                const received = JSON.parse(body);

                if (typeof received.value !== "number") {
                return sendJson(res, 400, { error: "value doit etre un nombre" });
                }

                const measure = {
                sensor: received.sensor ?? sensor.id,
                value: received.value,
                createdAt: new Date().toISOString(),
                };

                measures.push(measure);
                sendJson(res, 201, measure);
            } catch {
                sendJson(res, 400, { error: "JSON malforme" });
            }
        });
    return;
  }

    sendJson(res, 404, {error: "Ressource introuvable"});
});

server.listen(3000, () => console.log("http://localhost:3000"));