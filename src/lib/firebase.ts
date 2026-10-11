// Firebase Analytics — loaded from the CDN only after cookie consent (see consent.ts).
const SDK = "https://www.gstatic.com/firebasejs/13.0.0";

// Web config is a public client identifier, not a secret.
const firebaseConfig = {
  apiKey: "AIzaSyDXeLGvIWlzwayPppVoDWY7BY5L-3IQA_4",
  authDomain: "loadloom-511309.firebaseapp.com",
  projectId: "loadloom-511309",
  storageBucket: "loadloom-511309.firebasestorage.app",
  messagingSenderId: "40176873176",
  appId: "1:40176873176:web:1906a2816371bf0abbf1ad",
  measurementId: "G-ZCPB02J24P",
};

let started = false;

export async function initFirebase() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const appUrl = `${SDK}/firebase-app.js`;
    const analyticsUrl = `${SDK}/firebase-analytics.js`;
    const { initializeApp } = await import(/* @vite-ignore */ appUrl);
    const { getAnalytics, isSupported } = await import(/* @vite-ignore */ analyticsUrl);
    const app = initializeApp(firebaseConfig);
    if (await isSupported()) getAnalytics(app);
  } catch (err) {
    started = false;
    console.warn("Firebase Analytics failed to load", err);
  }
}
