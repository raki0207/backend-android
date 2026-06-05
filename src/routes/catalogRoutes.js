import { Router } from "express";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { PromoVideo } from "../models/PromoVideo.js";
import { buildProductFilter, buildProductSort } from "../utils/productQuery.js";

const router = Router();

router.get("/promo-videos", async (_req, res) => {
  const videos = await PromoVideo.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 }).limit(20);
  res.json(videos);
});

router.get("/categories", async (_req, res) => {
  const categories = await Category.find({ active: true }).sort({ displayOrder: 1, name: 1 });
  res.json(categories);
});

router.get("/home", async (req, res) => {
  const location = req.query.location ? String(req.query.location) : "";
  const base = location ? { active: { $ne: false }, deliveryZones: { $in: [location] } } : { active: { $ne: false } };

  const [mostOrdered, justArrived, freshlyBaked, categories, promoVideos] = await Promise.all([
    Product.find({ ...base, isMostOrdered: true }).sort({ createdAt: -1 }).limit(12),
    Product.find({ ...base, isJustArrived: true }).sort({ createdAt: -1 }).limit(12),
    Product.find({ ...base, isFreshlyBaked: true }).sort({ createdAt: -1 }).limit(12),
    Category.find({ active: true }).sort({ displayOrder: 1, name: 1 }),
    PromoVideo.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 }).limit(20)
  ]);

  res.json({ mostOrdered, justArrived, freshlyBaked, categories, promoVideos });
});

router.get("/products", async (req, res) => {
  const filter = buildProductFilter(req.query);
  const sort = buildProductSort(req.query.sort);
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const products = await Product.find(filter).sort(sort).limit(limit);
  res.json(products);
});

router.get("/search-suggestions", async (req, res) => {
  const q = String(req.query.q || "");
  if (!q) return res.json([]);
  const products = await Product.find({ name: { $regex: q, $options: "i" }, active: { $ne: false } }).limit(8);
  res.json(products.map((item) => ({ id: item._id, name: item.name })));
});

export default router;
