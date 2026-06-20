import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agentsRouter from "./agents.js";
import toolsRouter from "./tools.js";
import evalRouter from "./eval.js";
import settingsRouter from "./settings.js";
import profileRouter from "./profile.js";
import goalsRouter from "./goals.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentsRouter);
router.use(toolsRouter);
router.use(evalRouter);
router.use(settingsRouter);
router.use(profileRouter);
router.use(goalsRouter);

export default router;
