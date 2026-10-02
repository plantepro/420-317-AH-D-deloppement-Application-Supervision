// ============================================================
// ① 导入需要的模块（Imports）
// ============================================================

import http from "http";
import { readFile } from "fs/promises";
import { Sensor } from "./sensor.js";
import { computeStats } from "./stats.js";
import { sendJson } from "./sendJson.js";


// ============================================================
// ② 全局配置（Configuration）
// ============================================================

const PORT = 3000;

const SENSOR_CONFIG = { min: 18, max: 32 };


// ============================================================
// ③ 创建 Sensor + EventEmitter
//    Sensor 每隔一段时间产生 measurement
//    EventEmitter 负责在程序内部发布 / 接收 "measure" 事件
// ============================================================

// Sensor
//   │
//   │ emit("measure", measure)
//   ↓
// EventEmitter
//   │
//   │ 找到监听 "measure" 的 listener
//   ↓
// (measure) => measures.push(measure)
//   │
//   ↓
// measures[]

const measures = [];

const sensor = new Sensor("temp-b127", SENSOR_CONFIG); 

sensor.on("measure", (measure) => measures.push(measure));
// .on()：监听 "measure" 事件
// 当 Sensor emit("measure", measure) 时，
// 就执行这个 callback，把 measure 放进 measures[]

sensor.start();
// 启动 Sensor
// 默认每 2000 ms 产生一次 measurement


// ============================================================
// ④ 静态文件配置 + sendFile()
//    负责把 HTML / CSS 文件发送给浏览器
// ============================================================

const CONTENT_TYPES = { 
  ".html": "text/html", 
  ".css": "text/css"
};

async function sendFile(res, fileName, extension) {
  // 读取文件并发送给客户端

  try {
    const content = await readFile(
      `src/public/${fileName}`,
      "utf-8"
    );

    // 设置 HTTP 响应头
    // 告诉浏览器返回的是 HTML 还是 CSS
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[extension]
    });

    // 把文件内容发送给客户端
    res.end(content);

  } catch {
    // 文件不存在 → 返回 404
    sendJson(res, 404, {
      error: "Fichier introuvable"
    });
  }
}


// ============================================================
// ⑤ handlePost()
//    专门处理 POST /api/measures
//    接收客户端发送的 measurement
//    验证数据是否正确
//    保存 measurement
//    返回 HTTP 201 Created
// ============================================================

function handlePost(req, res) {

  let body = "";

  // ----------------------------------------------------------
  // ⑤-1 接收客户端发送的数据
  // ----------------------------------------------------------

  req.on("data", (chunk) => {
    body += chunk;
  });


  // ----------------------------------------------------------
  // ⑤-2 数据全部接收完成以后
  //      解析 JSON + 验证数据
  // ----------------------------------------------------------

  req.on("end", () => {

    try {

      // 把 JSON 字符串转换成 JavaScript object
      const received = JSON.parse(body);


      // ------------------------------------------------------
      // ⑤-3 验证 value 是否为数字
      // ------------------------------------------------------

      if (typeof received.value !== "number") { //验证value是否为数字，如果不是数字，返回400错误

        return sendJson(res, 400, {
          error: "value doit etre un nombre"
        });
      }


      // ------------------------------------------------------
      // ⑤-4 验证 value 是否在允许范围内
      // ------------------------------------------------------

      if (
        received.value < SENSOR_CONFIG.min ||  
        received.value > SENSOR_CONFIG.max
      ) {

        return sendJson(res, 400, {
          error: `value doit etre entre ${SENSOR_CONFIG.min} et ${SENSOR_CONFIG.max}`,
        });
      }


      // ------------------------------------------------------
      // ⑤-5 创建服务器认可的 measurement
      //这个是http client发送过来的数据，服务器需要自己生成时间戳，并且如果客户端没有传感器id，服务器需要使用自己的传感器id 主动告诉服务器 请创建一条measure value是多少
      // ------------------------------------------------------

      const measure = {

        // 如果客户端没有 sensor，
        // 使用服务器自己的 sensor.id
        sensor: received.sensor ?? sensor.id,

        // 使用客户端提供的 value
        value: received.value,

        // 时间由服务器生成
        createdAt: new Date().toISOString(),
      };


      // ------------------------------------------------------
      // ⑤-6 保存 measurement
      // ------------------------------------------------------

      measures.push(measure);


      // ------------------------------------------------------
      // ⑤-7 返回 HTTP 201 Created
      // ------------------------------------------------------

      sendJson(res, 201, measure);


    } catch {

      // JSON 格式错误
      sendJson(res, 400, {
        error: "JSON malforme"
      });
    }
  });
}


// ============================================================
// ⑥ 创建 HTTP Server
//    所有浏览器 / 客户端请求都会先来到这里
// ============================================================

const server = http.createServer((req, res) => {

  // 把请求 URL 转换成 URL 对象
  const url = new URL(
    req.url,
    `http://${req.headers.host}`
  );


  // ==========================================================
  // ⑦ GET 路由：返回 HTML 页面
  // ==========================================================

  if (
    req.method === "GET" &&
    url.pathname === "/"
  ) {

    return sendFile(
      res,
      "index.html",
      ".html"
    );
  }


  // ==========================================================
  // ⑧ GET 路由：返回 CSS
  // ==========================================================

  if (
    req.method === "GET" &&
    url.pathname === "/style.css"
  ) {

    return sendFile(
      res,
      "style.css",
      ".css"
    );
  }


  // ==========================================================
  // ⑨ GET /api/measures
  //    返回所有 measurements
  //    可以使用 ?min=xxx 过滤
  // ==========================================================

  if (
    req.method === "GET" &&
    url.pathname === "/api/measures"
  ) {

    const min = url.searchParams.get("min"); // 获取 URL 查询参数 ?min=xxx

    // 没有 min → 返回全部 measurements
    //
    // 有 min → 只返回 value > min 的 measurements
    const result = 
      min === null
        ? measures
        : measures.filter(
            (m) => m.value > Number(min) 
          );

    return sendJson(
      res,
      200,
      result
    );
  }


  // ==========================================================
  // ⑩ GET /api/measures/latest
  //     返回最新的一条 measurement
  // ==========================================================

  if (
    req.method === "GET" &&
    url.pathname === "/api/measures/latest"
  ) {

    // 如果没有任何 measurement
    if (measures.length === 0) {

      return sendJson(res, 404, {
        error: "Aucune mesure enregistree"
      });
    }

    // .at(-1) = 数组最后一个元素
    return sendJson(
      res,
      200,
      measures.at(-1) // 返回最后一个 measurement
    );
  }


  // ==========================================================
  // ⑪ GET /api/measures/stats
  //     返回统计数据
  // ==========================================================

  if (
    req.method === "GET" &&
    url.pathname === "/api/measures/stats"
  ) {

    return sendJson(
      res,
      200,
      computeStats(measures)
    );
  }


  // ==========================================================
  // ⑫ POST /api/measures
  //     接收客户端发送的新 measurement
  // ==========================================================

  if (
    req.method === "POST" &&
    url.pathname === "/api/measures"
  ) {

    return handlePost(req, res);
  }


  // ==========================================================
  // ⑬ 没有匹配任何路由 → 404
  // ==========================================================

  sendJson(res, 404, {
    error: "Ressource introuvable"
  });
});


// ============================================================
// ⑭ 启动 HTTP Server
// ============================================================

server.listen(
  PORT,
  () => console.log(`http://localhost:${PORT}`)
);