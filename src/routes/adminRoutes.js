import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateCategory, validateOrderStatus, validateProduct, validatePromoVideo } from "../middleware/validation.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { PromoVideo } from "../models/PromoVideo.js";
import { UserProfile } from "../models/UserProfile.js";
import { promoVideoPath, uploadPromoVideoFile } from "../middleware/uploadPromoVideo.js";
import { syncOrderStatus } from "../services/realtimeService.js";
import { restoreStockForOrder } from "../services/stockService.js";
import {
  canAdminCancel,
  canAdminConfirm,
  isCancelledStatus,
  normalizeAdminStatus,
  ORDER_STATUS
} from "../utils/orderStatus.js";
import { productImagePath, uploadProductImage } from "../middleware/uploadProductImage.js";
import { slugify } from "../utils/slugify.js";

const router = Router();
router.use(requireAuth, requireAdmin);

function getDateRange(req) {
  const { startDate, endDate } = req.query;
  if (!startDate && !endDate) return null;
  const range = {};
  if (startDate) range.$gte = new Date(String(startDate));
  if (endDate) range.$lte = new Date(String(endDate));
  return { createdAt: range };
}

router.get("/dashboard", async (_req, res) => {
  const [total, pending, confirmed, cancelled] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "confirmed" }),
    Order.countDocuments({
      status: { $in: [ORDER_STATUS.CANCELLED_BY_USER, ORDER_STATUS.CANCELLED_BY_ADMIN, "cancelled"] }
    })
  ]);
  const revenueAgg = await Order.aggregate([{ $match: { status: "confirmed" } }, { $group: { _id: null, revenue: { $sum: "$total" } } }]);
  res.json({
    totalOrders: total,
    pendingOrders: pending,
    confirmedOrders: confirmed,
    cancelledOrders: cancelled,
    totalRevenue: revenueAgg[0]?.revenue || 0
  });
});

router.get("/categories", async (_req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
  res.json(categories);
});

router.post("/categories", validateCategory, async (req, res) => {
  const payload = {
    name: req.body.name,
    slug: req.body.slug || slugify(req.body.name),
    image: req.body.image || "",
    active: req.body.active !== false,
    displayOrder: Number(req.body.displayOrder) || 0
  };
  const category = await Category.create(payload);
  res.status(201).json(category);
});

router.put("/categories/:id", validateCategory, async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug || slugify(req.body.name),
      image: req.body.image ?? "",
      active: req.body.active !== false,
      displayOrder: Number(req.body.displayOrder) || 0
    },
    { new: true }
  );
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json(category);
});

router.delete("/categories/:id", async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.status(204).send();
});

router.post("/products", validateProduct, async (req, res) => {
  const product = await Product.create(normalizeProductBody(req.body));
  res.status(201).json(product);
});

router.post("/products/upload-image", (req, res) => {
  uploadProductImage(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Image upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Product image file is required" });
    }
    if (!req.body.name?.trim()) {
      return res.status(400).json({ message: "Product name is required for image upload" });
    }

    return res.status(201).json({
      image: productImagePath(req.file.filename),
      filename: req.file.filename
    });
  });
});

function normalizeProductBody(body) {
  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.filter(Boolean) : [];
  if (body.categoryId && !categoryIds.includes(String(body.categoryId))) {
    categoryIds.push(body.categoryId);
  }
  return {
    name: body.name,
    description: body.description || "",
    categoryId: body.categoryId || categoryIds[0] || undefined,
    categoryIds,
    price: Number(body.price),
    originalPrice: Number(body.originalPrice) || 0,
    discountPercent: Math.max(0, Math.min(100, Number(body.discountPercent) || 0)),
    stock: Number(body.stock) || 0,
    image: body.image || "",
    isMostOrdered: Boolean(body.isMostOrdered),
    isJustArrived: Boolean(body.isJustArrived),
    isFreshlyBaked: Boolean(body.isFreshlyBaked),
    active: body.active !== false,
    tags: body.tags || [],
    deliveryZones: body.deliveryZones?.length ? body.deliveryZones : ["default"]
  };
}

router.get("/products", async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(200);
  res.json(products);
});

router.put("/products/:id", validateProduct, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, normalizeProductBody(req.body), { new: true });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

router.delete("/products/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.status(204).send();
});

function profileToCustomer(profile) {
  if (!profile) return null;
  return {
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode
  };
}

async function enrichOrdersWithImages(orders) {
  const productIds = [
    ...new Set(
      orders.flatMap((order) => (order.items || []).map((item) => String(item.productId)).filter(Boolean))
    )
  ];

  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
        .select("_id image")
        .lean()
    : [];
  const imageMap = Object.fromEntries(products.map((product) => [String(product._id), product.image || ""]));

  return orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      image: item.image || imageMap[String(item.productId)] || ""
    }))
  }));
}

router.get("/orders", async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(300).lean();
  const userIds = [...new Set(orders.map((order) => order.userId))];
  const profiles = await UserProfile.find({ uid: { $in: userIds } }).lean();
  const profileMap = Object.fromEntries(profiles.map((profile) => [profile.uid, profile]));

  const withCustomers = orders.map((order) => ({
    ...order,
    customer: order.customer || profileToCustomer(profileMap[order.userId])
  }));

  const enriched = await enrichOrdersWithImages(withCustomers);
  res.json(enriched);
});

router.get("/reports/monthly-revenue", async (req, res) => {
  const dateRange = getDateRange(req);
  const match = { status: "confirmed", ...(dateRange || {}) };
  const rows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(rows.map((item) => ({ month: item._id, revenue: item.revenue, orders: item.orders })));
});

router.get("/reports/monthly-revenue.csv", async (req, res) => {
  const dateRange = getDateRange(req);
  const match = { status: "confirmed", ...(dateRange || {}) };
  const rows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const csv = ["month,orders,revenue", ...rows.map((item) => `${item._id},${item.orders},${item.revenue}`)].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="monthly-revenue.csv"');
  res.send(csv);
});

router.get("/reports/orders.csv", async (req, res) => {
  const dateRange = getDateRange(req);
  const orders = await Order.find(dateRange || {}).sort({ createdAt: -1 }).limit(2000);
  const lines = orders.map(
    (item) =>
      `${item._id},${item.userId},${item.status},${item.total},${item.paymentMethod},${new Date(item.createdAt).toISOString()}`
  );
  const csv = ["orderId,userId,status,total,paymentMethod,createdAt", ...lines].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
  res.send(csv);
});

router.put("/orders/:id/status", validateOrderStatus, async (req, res) => {
  const nextStatus = normalizeAdminStatus(String(req.body?.status || ""));
  const existing = await Order.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Order not found" });

  if (isCancelledStatus(existing.status)) {
    return res.status(400).json({ message: "This order is already cancelled" });
  }

  if (nextStatus === ORDER_STATUS.CONFIRMED && !canAdminConfirm(existing.status)) {
    return res.status(400).json({ message: "Only pending orders can be confirmed" });
  }

  if (nextStatus === ORDER_STATUS.CANCELLED_BY_ADMIN && !canAdminCancel(existing.status)) {
    return res.status(400).json({ message: "Only pending orders can be cancelled by admin" });
  }

  const order = await Order.findByIdAndUpdate(req.params.id, { status: nextStatus }, { new: true });

  if (nextStatus === ORDER_STATUS.CANCELLED_BY_ADMIN) {
    await restoreStockForOrder(existing.items);
  }

  await syncOrderStatus(order._id, nextStatus, { userId: order.userId });
  res.json(order);
});

router.get("/promo-videos", async (_req, res) => {
  const videos = await PromoVideo.find().sort({ displayOrder: 1, createdAt: -1 });
  res.json(videos);
});

router.post("/promo-videos", validatePromoVideo, async (req, res) => {
  if (!req.body.video) {
    return res.status(400).json({ message: "Video file is required" });
  }
  const video = await PromoVideo.create(normalizePromoVideoBody(req.body));
  res.status(201).json(video);
});

router.post("/promo-videos/upload", (req, res) => {
  uploadPromoVideoFile(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Video upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }
    return res.status(201).json({
      video: promoVideoPath(req.file.filename),
      filename: req.file.filename
    });
  });
});

router.put("/promo-videos/:id", validatePromoVideo, async (req, res) => {
  const video = await PromoVideo.findByIdAndUpdate(req.params.id, normalizePromoVideoBody(req.body), { new: true });
  if (!video) return res.status(404).json({ message: "Promo video not found" });
  res.json(video);
});

router.delete("/promo-videos/:id", async (req, res) => {
  const video = await PromoVideo.findByIdAndDelete(req.params.id);
  if (!video) return res.status(404).json({ message: "Promo video not found" });
  res.status(204).send();
});

function normalizePromoVideoBody(body) {
  return {
    title: body.title,
    description: body.description || "",
    video: body.video,
    type: body.type === "sponsor" ? "sponsor" : "festival",
    active: body.active !== false,
    displayOrder: Number(body.displayOrder) || 0
  };
}

export default router;
