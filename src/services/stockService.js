import { Product } from "../models/Product.js";

export async function validateAndDecrementStock(items) {
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).select("_id name stock").lean();
  const productMap = Object.fromEntries(products.map((product) => [String(product._id), product]));

  for (const item of items) {
    const product = productMap[String(item.productId)];
    if (!product) {
      throw new Error(`Product not found: ${item.name || item.productId}`);
    }
    if ((product.stock ?? 0) < item.qty) {
      throw new Error(`Not enough stock for ${product.name}. Only ${product.stock ?? 0} left.`);
    }
  }

  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } },
      { new: true }
    );
    if (!updated) {
      const product = productMap[String(item.productId)];
      throw new Error(`Not enough stock for ${product?.name || item.name}`);
    }
  }
}

export async function restoreStockForOrder(items) {
  await Promise.all(
    items.map((item) => Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } }))
  );
}
