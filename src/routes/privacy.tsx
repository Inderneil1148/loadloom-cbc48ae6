import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Policy — LoadLoom" },
      {
        name: "description",
        content:
          "How LoadLoom collects, stores and protects your business, customer, delivery and payment data.",
      },
      { property: "og:title", content: "Privacy Policy — LoadLoom" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "LoadLoom privacy policy for supplier accounts." },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    title: "What we store",
    body: "Your business profile, users, customers, sites, materials, vehicles, drivers, orders, trips, delivery proof, invoices and payments — the records you create while operating LoadLoom.",
  },
  {
    title: "Organization isolation",
    body: "Every record belongs to one organization. Users can only read and write data inside the organization they were invited to, enforced on the server and in the database.",
  },
  {
    title: "Documents and images",
    body: "Delivery photos, signatures and weighbridge slips are stored as private files linked to the trip they belong to. They are not public.",
  },
  {
    title: "Who can see your data",
    body: "Your own users, according to their role. We do not sell your data and we do not share your customer list with other suppliers.",
  },
  {
    title: "Retention and deletion",
    body: "Your records stay available while your account is active. On request we delete your organization's data, subject to statutory record-keeping requirements.",
  },
  {
    title: "Contact",
    body: "For any privacy request, reach us through the contact page and we will respond to the account owner.",
  },
];

function Privacy() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Privacy Policy" lead="How your operational data is handled." />
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <div className="space-y-9">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          This policy is a plain-language summary and is not legal advice. Have it reviewed before you
          publish it to customers.
        </p>
      </section>
    </SiteShell>
  );
}
