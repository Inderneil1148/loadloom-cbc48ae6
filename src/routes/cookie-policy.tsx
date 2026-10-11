import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/cookie-policy")({
  staticData: { sitemap: true },
  head: () =>
    legalHead("/cookie-policy", "Cookie Policy — LoadLoom", "Which cookies and storage LoadLoom uses, which are optional, and how to change your choice."),
  component: () => (
    <LegalPage title="Cookie Policy" lead="What we store in your browser and why." sections={SECTIONS} />
  ),
});

const SECTIONS = [
  { title: "Essential (always on)", body: "Sign-in session storage that keeps you logged in, your cookie choice, and small preferences such as a dismissed install prompt. The site cannot work without these." },
  { title: "Analytics (optional)", body: "Google Analytics measures page visits so we can improve LoadLoom. It loads only if you choose \"Accept all\"." },
  { title: "Advertising (optional)", body: "Google AdSense may set cookies to show and measure ads. It loads only if you choose \"Accept all\"." },
  { title: "Changing your choice", body: "Use \"Cookie settings\" in the site footer at any time. Choosing \"Essential only\" stops optional scripts from loading on your next visit; you can also clear cookies in your browser." },
];
