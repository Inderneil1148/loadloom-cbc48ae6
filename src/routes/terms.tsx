import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage, legalHead } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () =>
    legalHead("/terms", "Terms of Service — LoadLoom", "The terms that apply when your business uses LoadLoom for dispatch, invoicing and payments."),
  component: () => (
    <LegalPage title="Terms of Service" lead="The agreement for using LoadLoom." sections={SECTIONS} />
  ),
});

const SECTIONS = [
  { title: "The service", body: `LoadLoom is provided by ${BUSINESS.name}, India. By creating an account you agree to these terms and our Privacy Policy.` },
  { title: "Eligibility", body: "You must be at least 18 years old and able to enter a contract on behalf of your business." },
  { title: "Your account", body: "Keep your sign-in details secure. You are responsible for activity under your account." },
  { title: "Acceptable use", body: "Use LoadLoom to run your own material-supply operation. Do not attempt to access other accounts' data, disrupt the service, or resell access." },
  { title: "Your records", body: "Your records remain yours. You are responsible for their accuracy, including rates, quantities, taxes and invoices issued to your customers." },
  { title: "Plans and billing", body: "The Free plan costs nothing. Paid plans (Starter, Growth, Fleet) are paid by UPI at the price shown on the Pricing page, with no hidden charges. After you upload your payment screenshot we verify it, normally within 24 hours, and then activate your plan. Until then you stay on Free." },
  { title: "Refunds", body: "Paid plans are non-refundable once activated. Payments we cannot verify are rejected and returned. See the Refund Policy for details." },
  { title: "Availability and liability", body: "We work to keep LoadLoom available but do not guarantee uninterrupted service. To the extent allowed by law, our liability is limited to the amount you paid in the previous three months." },
  { title: "Ending your account", body: "You may request account deletion at any time from Settings. We may suspend accounts that break these terms." },
  { title: "Governing law", body: "These terms are governed by the laws of India." },
];
