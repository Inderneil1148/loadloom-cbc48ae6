import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () =>
    legalHead("/privacy", "Privacy Policy — LoadLoom", "What LoadLoom collects, why, who processes it, and how to request deletion of your data."),
  component: () => (
    <LegalPage title="Privacy Policy" lead="What we collect, why, and the choices you have." sections={SECTIONS} />
  ),
});

const SECTIONS = [
  { title: "Who we are", body: `LoadLoom is operated by ${BUSINESS.name} (India). We are responsible for the personal data described here. Contact: ${BUSINESS.email}.` },
  { title: "What we collect", body: "Account: email, password (stored only as a secure hash by our sign-in service), business name.\nBusiness records you enter: profile, customers, delivery sites, drivers, vehicles, materials, orders, deliveries, quotations, invoices and payments.\nPlan payments: the UPI reference and screenshot you upload.\nContact form: name, business, phone, email and message.\nOptional: usage analytics, only if you accept analytics cookies." },
  { title: "Why we collect it", body: "To provide the service you signed up for, verify plan payments, answer enquiries, send transactional emails (sign-in, receipts, plan updates), and — with consent — understand how the site is used. We collect only what these purposes need." },
  { title: "Services that process data for us", body: "Lovable Cloud (hosting, database, sign-in, file storage, email delivery and the AI problem-diagnosis feature).\nGoogle and Apple (only if you choose to sign in with them).\nGoogle Maps (resolving map links you paste for delivery sites).\nGoogle Analytics and Google AdSense (only after you choose \"Accept all\" on the cookie banner).\nWe do not sell your data or share your customer list with other suppliers." },
  { title: "Data isolation", body: "Every record belongs to your account. Other users cannot read or change it; this is enforced in the database." },
  { title: "Retention", body: "We keep your data while your account is active. Payment records may be retained as required by Indian tax law after an account is deleted." },
  { title: "Your rights and deletion", body: "You can view and edit your records in the app at any time. To delete your account and all its data, use Settings → Account → Request account deletion, or email us. We process requests promptly and confirm by email." },
  { title: "Age", body: "LoadLoom is a business tool for people aged 18 or over. We do not knowingly collect data from children. If you believe a child has created an account, contact us and we will delete it." },
  { title: "Changes", body: "We will update the date at the top of this page when this policy changes, and notify account holders of significant changes." },
];
