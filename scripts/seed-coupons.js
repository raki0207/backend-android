import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "../src/config/db.js";
import { seedCoupons } from "../src/services/seedCoupons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

await connectDb(process.env.MONGODB_URI);
await seedCoupons();
process.exit(0);
