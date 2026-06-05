import { getFirestore } from "../config/firebase.js";

export async function syncOrderStatus(orderId, status, extra = {}) {
  try {
    const db = getFirestore();
    await db.collection("order_status").doc(String(orderId)).set(
      {
        orderId: String(orderId),
        status,
        updatedAt: new Date().toISOString(),
        ...extra
      },
      { merge: true }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Firestore sync skipped:", error.message);
    // Orders still save in MongoDB; enable Firestore in Firebase Console for live status updates.
  }
}