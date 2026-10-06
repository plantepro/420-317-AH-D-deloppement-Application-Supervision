import { Router } from "express";
import * as controller from "../controllers/sensor.controller.js";
import { validateSensorCreate, validateSensorUpdate } from "../middlewares/sensor.validator.js";

const router = Router();

// CRUD complet : c'est la seule ressource ou une personne cree quelque
// chose via l'API (voir measures : lecture seule).
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", validateSensorCreate, controller.create); //调用validateSensorCreate中间件来验证请求体中的数据，如果验证通过则调用controller.create方法来创建传感器
router.put("/:id", validateSensorUpdate, controller.replace); //调用validateSensorUpdate中间件来验证请求体中的数据，如果验证通过则调用controller.replace方法来更新传感器
router.delete("/:id", controller.remove);

export default router;
