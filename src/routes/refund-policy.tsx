import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  staticData: { sitemap: true },
  head: () =>
    legalHead("/refund-policy", "Refund Policy — LoadLoom", "LoadLoom paid plans are non-refundable once activated. How unverified payments and billing questions are handled."),
  component: () => (
    <LegalPage title="Refund Policy" lead="Clear rules for paid plans." sections={SECTIONS} />
  ),
});

const SECTIONS = [
  { title: "No refunds after activation", body: "Starter, Growth and Fleet plans are non-refundable once they have been activated on your account. Try the Free plan and the demo first to make sure LoadLoom fits your business." },
  { title: "Payments we can't verify", body: "If we cannot match your UPI payment to the screenshot you uploaded, we reject it, notify you in the app, and return any amount we received to the same UPI account." },
  { title: "Duplicate payments", body: "If you pay twice for the same plan by mistake, tell us and we will return the duplicate amount." },
  { title: "Cancelling", body: "You can stop using a paid plan at any time; it will not renew without a new payment from you." },
  { title: "Contact", body: `Billing questions: ${BUSINESS.email}` },
];
