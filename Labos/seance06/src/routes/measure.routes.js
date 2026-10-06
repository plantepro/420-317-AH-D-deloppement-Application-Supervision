import { Router } from "express";
import * as controller from "../controllers/measure.controller.js";

const router = Router();

router.get("/", controller.list);
router.get("/latest", controller.getLatest);
router.get("/stats", controller.getStats);
router.get("/:id", controller.getOne); //必须放在最后 否则会被当作id参数 例如 /stats 会被当作id=stats

export default router;
