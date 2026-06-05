import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getAuth, initFirebase } from "../src/config/firebase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run set-admin -- <admin-email@example.com>");
  process.exit(1);
}

try {
  initFirebase();
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { role: "admin" });
  console.log(`Admin role granted for ${email} (${user.uid})`);
  console.log("Log out of the admin portal and sign in again to refresh your token.");
} catch (error) {
  console.error("Failed to set admin role:", error.message);
  process.exit(1);
}
