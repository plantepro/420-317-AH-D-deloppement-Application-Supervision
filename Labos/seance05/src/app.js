//负责配置Express应用程序，包括中间件、路由和错误处理。然后将应用程序导出以供服务器使用。
//负责这个Express应用有哪些middleware，routes，error handler。
import express from "express"; 
import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import measureRoutes from "./routes/measure.routes.js";

const app = express(); //创建一个Express应用程序实例。这个实例是一个函数，可以处理HTTP请求和响应。它有很多方法和属性，可以用来配置应用程序的行为。

// L'ordre de declaration est l'ordre d'execution. 
// app.use() 會在每個請求到達路由之前執行，app.use() 的順序就是中間件的執行順序。app.use() 可以接受一個函數，也可以接受一個路徑和一個函數。當請求的路徑匹配到指定的路徑時，才會執行該函數。
//app.use() 核心意思：把一个middleware函数接到express的请求处理链上，当请求到达时，按注册顺序依次执行这些函数。每个中间件函数可以对请求和响应进行处理，也可以决定是否将控制权传递给下一个中间件函数。
app.use(logger); //使用logger中间件。这个中间件会在每个请求到达路由之前执行，记录请求的时间、方法和URL。它有助于调试和监控应用程序的运行情况。
app.use(express.json()); //使用express.json()中间件。这个中间件会在每个请求到达路由之前执行，解析请求体中的JSON数据，并将其存储在req.body属性中。它允许应用程序处理JSON格式的请求数据。
app.use(express.static("src/public")); //使用express.static()中间件。这个中间件会处理静态文件的请求，将请求的文件从指定的目录中返回给客户端。

app.use("/api/measures", measureRoutes);

// Apres les routeurs : tout ce qui n'a pas ete reconnu.
app.use((req, res) => {
  res.status(404).json({ error: "Ressource introuvable" });
});

// En tout dernier.
app.use(errorHandler);

export default app;
