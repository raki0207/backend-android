import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { slugify } from "../utils/slugify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const promoVideoUploadsDir = path.join(__dirname, "../../uploads/videos");

function ensureUploadDir() {
  if (!fs.existsSync(promoVideoUploadsDir)) {
    fs.mkdirSync(promoVideoUploadsDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, promoVideoUploadsDir);
  },
  filename(req, file, cb) {
    const baseName = slugify(req.body.title || "promo-video");
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    cb(null, `${baseName}-${Date.now()}${ext}`);
  }
});

export const uploadPromoVideoFile = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only video files are allowed"));
  }
}).single("video");

export function promoVideoPath(filename) {
  return `/uploads/videos/${filename}`;
}
