import express from "express";
import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import measureRoutes from "./routes/measure.routes.js"

const app = express(); //创建一个Express应用程序实例。之前是const server =http.createServer(); app是Express application对象，这个对象本身有很多express提供的方法 例如app.use()，app.get()，app.post()，app.listen()等。这个对象本身也是一个函数，可以作为请求处理函数使用。
//app.use(...)是调用Express给app提供的use()方法。在express中主要用于把middleware加入request处理链中。middleware是一个函数。
app.use(express.json()); // express.json()中间件会在每个请求到达路由之前执行，解析请求体中的JSON数据，并将其存储在req.body属性中。它允许应用程序处理JSON格式的请求数据。
app.use(logger);
app.use(express.static("src/public"));
app.use("/api/measures", measureRoutes); ///把api/measures这个URL前缀交给measureRoutes这个Router处理。measureRoutes是一个Express路由器，它定义了与测量相关的API端点。
app.use((req,res)=>{ 
  res.status(404).json({error: "Ressource introuvable"}); //如果请求的路径没有匹配到任何路由，则返回404状态码和一个JSON对象，表示资源未找到。
});
app.use(errorHandler); //如果controller/service抛出异常，errorHandler中间件会捕获异常并返回一个JSON对象，表示服务器错误。500 JSON对象的格式为{error: "message"}，其中message是异常的消息。

export default app; //输出app 然后index.js会导入app并启动HTTP服务器。