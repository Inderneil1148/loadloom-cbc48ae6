import { initAnalytics } from "./analytics";
import { initFirebase } from "./firebase";

export type Consent = "all" | "essential";
const KEY = "loadloom-cookie-consent";
export const CONSENT_EVENT = "loadloom-consent-open";

export function getConsent(): Consent | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function setConsent(v: Consent) {
  localStorage.setItem(KEY, v);
  if (v === "all") loadOptionalScripts();
}

export function openConsent() {
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function loadOptionalScripts() {
  initAnalytics();
  void initFirebase();
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2111917614213434";
  document.head.appendChild(s);
}
