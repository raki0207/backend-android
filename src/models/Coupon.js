import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: Number,
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", couponSchema);
