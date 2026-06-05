import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./config/db.js";
import { initFirebase } from "./config/firebase.js";
import { seedCategories } from "./services/seedCategories.js";
import { seedCoupons } from "./services/seedCoupons.js";
import adminRoutes from "./routes/adminRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "slv-api" });
});

app.use("/api/catalog", catalogRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled API error", err);
  res.status(500).json({ message: "Internal server error" });
});

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDb(process.env.MONGODB_URI);
  initFirebase();
  await seedCategories();
  await seedCoupons();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on ${port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  process.exit(1);
});
