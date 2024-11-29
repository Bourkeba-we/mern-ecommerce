import express from "express";
const router = express.Router();

import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalytics } from "../controllers/analytics.controller.js";

router.get("/", protectRoute, adminRoute, getAnalytics);

export default router;
