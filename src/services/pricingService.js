export function calculateTotals({ items, coupon }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const platformCharge = 9;
  const handbagCharge = 10;
  const deliveryCharge = 29;

  let discount = 0;
  if (coupon && subtotal >= coupon.minOrder) {
    if (coupon.discountType === "percent") {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.value;
    }
  }

  const total = Math.max(subtotal + platformCharge + handbagCharge + deliveryCharge - discount, 0);
  return { subtotal, platformCharge, handbagCharge, deliveryCharge, discount, total };
}
