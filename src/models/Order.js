import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    customer: customerSchema,
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    platformCharge: { type: Number, default: 9 },
    handbagCharge: { type: Number, default: 10 },
    deliveryCharge: { type: Number, default: 29 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled_by_user", "cancelled_by_admin", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
