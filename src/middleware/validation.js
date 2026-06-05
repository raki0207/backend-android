const VALID_ADMIN_ORDER_STATUS = new Set(["confirmed", "cancelled_by_admin", "cancelled"]);
const VALID_PAYMENT_METHOD = new Set(["cod", "online"]);

export function validateCheckout(req, res, next) {
  const { items, paymentMethod = "cod" } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Checkout requires at least one item" });
  }
  for (const item of items) {
    if (!item || !item.productId || Number(item.qty) <= 0 || Number(item.price) < 0) {
      return res.status(400).json({ message: "Invalid checkout item payload" });
    }
  }
  if (!VALID_PAYMENT_METHOD.has(String(paymentMethod))) {
    return res.status(400).json({ message: "Invalid payment method" });
  }
  return next();
}

export function validateOrderStatus(req, res, next) {
  const status = String(req.body?.status || "");
  if (!VALID_ADMIN_ORDER_STATUS.has(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  return next();
}

export function validateProduct(req, res, next) {
  const { name, price, originalPrice, discountPercent } = req.body || {};
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ message: "Product name is required" });
  }
  if (Number(price) < 0 || Number.isNaN(Number(price))) {
    return res.status(400).json({ message: "Product price must be valid" });
  }
  if (originalPrice !== undefined && (Number(originalPrice) < 0 || Number.isNaN(Number(originalPrice)))) {
    return res.status(400).json({ message: "Original price must be valid" });
  }
  if (discountPercent !== undefined) {
    const percent = Number(discountPercent);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      return res.status(400).json({ message: "Discount percent must be between 0 and 100" });
    }
  }
  return next();
}

export function validatePromoVideo(req, res, next) {
  const { title, type } = req.body || {};
  if (!title || String(title).trim().length < 2) {
    return res.status(400).json({ message: "Video title is required" });
  }
  if (type && !["sponsor", "festival"].includes(String(type))) {
    return res.status(400).json({ message: "Type must be sponsor or festival" });
  }
  return next();
}

export function validateCategory(req, res, next) {
  const { name, slug } = req.body || {};
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ message: "Category name is required" });
  }
  if (!slug || String(slug).trim().length < 2) {
    return res.status(400).json({ message: "Category slug is required" });
  }
  return next();
}

export function validateProfile(req, res, next) {
  const { name, phone, address, city, state, pincode } = req.body || {};
  if (!name || !phone || !address || !city || !state || !pincode) {
    return res.status(400).json({ message: "Profile fields are required" });
  }
  return next();
}
