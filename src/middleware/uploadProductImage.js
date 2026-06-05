import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { slugify } from "../utils/slugify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const productUploadsDir = path.join(__dirname, "../../uploads/products");

function ensureUploadDir() {
  if (!fs.existsSync(productUploadsDir)) {
    fs.mkdirSync(productUploadsDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, productUploadsDir);
  },
  filename(req, file, cb) {
    const baseName = slugify(req.body.name || "product");
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${baseName}${ext}`);
  }
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image files are allowed"));
  }
}).single("image");

export function productImagePath(filename) {
  return `/uploads/products/${filename}`;
}
