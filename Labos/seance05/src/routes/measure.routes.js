import { Router } from "express";
import * as controller from "../controllers/measure.controller.js";

const router = Router();

// Le prefixe /api/measures est declare une seule fois, dans app.js
router.get("/", controller.list); // GET /api/measures?min=20
router.get("/latest", controller.getLatest);      // GET /api/measures/latest
router.get("/stats", controller.getStats); // GET /api/measures/stats?min=20
router.post("/", controller.create); // POST /api/measures

export default router;
