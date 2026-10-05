export function logger(req, res, next) { //这个中间件函数会在每个请求到达路由之前执行，记录请求的时间、方法和URL。它有助于调试和监控应用程序的运行情况。
    console.log(`${req.method} ${req.originalUrl}`); //req.originalUrl是Express提供的属性，表示请求的原始URL，包括路径和查询字符串。它与req.url不同，req.url只包含路径和查询字符串，不包含协议、主机名和端口号。
    next(); //next()是Express提供的函数，表示将控制权传递给下一个中间件函数。如果没有调用next()，请求将被挂起，无法继续处理。中间件函数可以决定是否调用next()，也可以直接返回响应。
}