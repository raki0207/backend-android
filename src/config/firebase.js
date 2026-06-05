import admin from "firebase-admin";

let app;

export function initFirebase() {
  if (app) {
    return app;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });

  return app;
}

export function getFirestore() {
  if (!app) {
    initFirebase();
  }
  return admin.firestore();
}

export function getAuth() {
  if (!app) {
    initFirebase();
  }
  return admin.auth();
}
