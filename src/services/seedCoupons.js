import { Coupon } from "../models/Coupon.js";

export const DEFAULT_COUPONS = [
  {
    code: "SAVE30",
    title: "Get ₹30 Off",
    discountType: "flat",
    value: 30,
    minOrder: 199,
    active: true
  },
  {
    code: "SAVE49",
    title: "Get ₹49 Off",
    discountType: "flat",
    value: 49,
    minOrder: 499,
    active: true
  },
  {
    code: "SAVE80",
    title: "Get ₹80 Off",
    discountType: "flat",
    value: 80,
    minOrder: 1000,
    active: true
  }
];

export async function seedCoupons() {
  for (const coupon of DEFAULT_COUPONS) {
    await Coupon.findOneAndUpdate({ code: coupon.code }, coupon, { upsert: true, new: true });
  }
  // eslint-disable-next-line no-console
  console.log("Coupons ready (SAVE30 / SAVE49 / SAVE80)");
}
