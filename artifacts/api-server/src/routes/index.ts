// import { Router, type IRouter } from "express";
// import healthRouter from "./health";
// import aiRouter from "./ai";

// const router: IRouter = Router();

// router.use(healthRouter);
// router.use(aiRouter);

// export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agentsRouter from "./agents.js";
import toolsRouter from "./tools.js";
import evalRouter from "./eval.js";
import settingsRouter from "./settings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentsRouter);
router.use(toolsRouter);
router.use(evalRouter);
router.use(settingsRouter);

export default router;
