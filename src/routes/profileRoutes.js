import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateProfile } from "../middleware/validation.js";
import { UserProfile } from "../models/UserProfile.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const profile = await UserProfile.findOne({ uid: req.user.uid });
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  return res.json(profile);
});

router.post("/me", requireAuth, validateProfile, async (req, res) => {
  const payload = { ...req.body, uid: req.user.uid, email: req.user.email || req.body.email };
  const profile = await UserProfile.findOneAndUpdate({ uid: req.user.uid }, payload, {
    upsert: true,
    new: true,
    runValidators: true
  });
  return res.status(201).json(profile);
});

export default router;
