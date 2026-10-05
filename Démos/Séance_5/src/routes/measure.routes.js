import { Router } from "express";
import * as controller from "../controllers/measure.controller.js"

const router = Router(); //express.Router()是Express提供的一个路由器对象，当此句执行后 router对象就拥有express提供的方法例如router.get()，router.post()，router.put()，router.delete()等。然后可以把这个router对象交给app.use()使用。app.use("/api/measures", measureRoutes)表示所有以/api/measures开头的请求都会交给measureRoutes这个Router处理。

router.get("/", controller.list); //如果这个Router收到GET请求，并且路径是/api/measures，那么就会调用controller.list这个函数来处理请求。controller.list是一个控制器函数，它会从数据库中获取测量数据，并返回给客户端。
router.get("/latest", controller.getLatest); //latest是我自己写的route规则
router.get("/boom", (req,res,next)=>{
    next(new Error("Panne simulee"));
})
export default router;