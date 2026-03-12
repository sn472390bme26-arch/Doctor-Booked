import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import hospitalsRouter from "./hospitals";
import doctorsRouter from "./doctors";
import sessionsRouter from "./sessions";
import bookingsRouter from "./bookings";
import tokensRouter from "./tokens";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/hospitals", hospitalsRouter);
router.use("/doctors", doctorsRouter);
router.use("/sessions", sessionsRouter);
router.use("/bookings", bookingsRouter);
router.use("/tokens", tokensRouter);
router.use("/admin", adminRouter);
router.use(storageRouter);

export default router;
