import mongoose from "mongoose";

const promoVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    video: { type: String, required: true },
    type: { type: String, enum: ["sponsor", "festival"], default: "festival" },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const PromoVideo = mongoose.model("PromoVideo", promoVideoSchema);
