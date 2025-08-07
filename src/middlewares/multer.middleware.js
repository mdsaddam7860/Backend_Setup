import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Re-create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define absolute temp directory path
const tempDir = path.join(__dirname, "..", "..", "public", "temp");

// Ensure the directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    console.log("multer file :", file);
  },
});

export const upload = multer({
  storage: storage,
});
