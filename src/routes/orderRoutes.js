import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateCheckout } from "../middleware/validation.js";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { UserProfile } from "../models/UserProfile.js";
import { calculateTotals } from "../services/pricingService.js";
import { validateAndDecrementStock } from "../services/stockService.js";
import { syncOrderStatus } from "../services/realtimeService.js";
import { restoreStockForOrder } from "../services/stockService.js";
import { canUserCancel, isCancelledStatus, ORDER_STATUS } from "../utils/orderStatus.js";

const router = Router();

router.post("/checkout", requireAuth, validateCheckout, async (req, res) => {
  const { items = [], couponCode, paymentMethod = "cod" } = req.body;
  const coupon = couponCode ? await Coupon.findOne({ code: couponCode, active: true }) : null;

  if (couponCode && !coupon) {
    return res.status(400).json({ message: "Invalid coupon code" });
  }

  const totals = calculateTotals({ items, coupon });

  if (coupon && totals.discount === 0) {
    return res.status(400).json({
      message: `Add items worth ₹${coupon.minOrder} or more to use ${coupon.code}`
    });
  }

  const profile = await UserProfile.findOne({ uid: req.user.uid });
  if (!profile) {
    return res.status(400).json({ message: "Complete your profile before placing an order" });
  }

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).select("_id image name stock").lean();
  const imageMap = Object.fromEntries(products.map((product) => [String(product._id), product.image || ""]));

  try {
    await validateAndDecrementStock(items);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const orderItems = items.map((item) => ({
    ...item,
    image: item.image || imageMap[String(item.productId)] || ""
  }));

  const order = await Order.create({
    userId: req.user.uid,
    customer: {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode
    },
    items: orderItems,
    paymentMethod,
    status: "pending",
    ...totals
  });

  await syncOrderStatus(order._id, "pending", { userId: req.user.uid });
  res.status(201).json(order);
});

router.get("/my-orders", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.uid }).sort({ createdAt: -1 }).lean();
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

  const enriched = orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      image: item.image || imageMap[String(item.productId)] || ""
    }))
  }));

  res.json(enriched);
});

router.post("/:id/cancel", requireAuth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.uid });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (!canUserCancel(order.status)) {
    return res.status(400).json({
      message: order.status === ORDER_STATUS.CONFIRMED
        ? "This order is confirmed and can no longer be cancelled"
        : "This order cannot be cancelled"
    });
  }

  const updated = await Order.findByIdAndUpdate(
    order._id,
    { status: ORDER_STATUS.CANCELLED_BY_USER },
    { new: true }
  );

  await restoreStockForOrder(order.items);
  await syncOrderStatus(updated._id, ORDER_STATUS.CANCELLED_BY_USER, { userId: order.userId });
  res.json(updated);
});

router.post("/:id/reorder", requireAuth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.uid });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (isCancelledStatus(order.status)) {
    return res.status(400).json({ message: "Cancelled orders cannot be reordered" });
  }
  res.json({ items: order.items });
});

export default router;
