import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    image: { type: String, default: "" },
    isMostOrdered: { type: Boolean, default: false },
    isJustArrived: { type: Boolean, default: false },
    isFreshlyBaked: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    deliveryZones: { type: [String], default: ["default"] }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
