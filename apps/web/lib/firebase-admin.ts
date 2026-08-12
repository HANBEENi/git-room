import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

function getFirebaseAdminApp(): App {
  if (app) return app;

  app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // .env에는 \n이 리터럴 문자열로 저장되어 있어서 실제 줄바꿈으로 변환
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

  return app;
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
