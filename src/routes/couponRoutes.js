import { Router } from "express";
import { Coupon } from "../models/Coupon.js";

const router = Router();

router.get("/", async (_req, res) => {
  const coupons = await Coupon.find({ active: true }).sort({ minOrder: 1 });
  res.json(coupons);
});

export default router;
