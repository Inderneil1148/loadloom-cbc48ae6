import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — LoadLoom" },
      {
        name: "description",
        content: "The terms that apply when your business uses LoadLoom for dispatch and operations.",
      },
      { property: "og:title", content: "Terms of Service — LoadLoom" },
      { property: "og:description", content: "LoadLoom terms of service for supplier accounts." },
    ],
  }),
  component: Terms,
});

const SECTIONS = [
  {
    title: "Your account",
    body: "One organization per supplier business. The owner account is responsible for the users it invites and the roles it grants them.",
  },
  {
    title: "Acceptable use",
    body: "Use LoadLoom to run your own material supply operation. Do not attempt to access another organization's data or resell access to the platform.",
  },
  {
    title: "Your records",
    body: "Your operational records remain yours. You are responsible for their accuracy, including rates, quantities, tax treatment and invoices issued to your customers.",
  },
  {
    title: "Plans and limits",
    body: "Each plan carries limits on users, vehicles, drivers, customers, materials and document storage. Features outside your plan stay visible but locked until you upgrade.",
  },
  {
    title: "Billing",
    body: "Billing integration is coming soon. Until it is live, plans are configured on your organization and no payment is collected through the platform.",
  },
  {
    title: "Availability",
    body: "We work to keep LoadLoom available during operating hours, and maintenance is scheduled outside peak dispatch times wherever possible.",
  },
];

function Terms() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Terms of Service" lead="The agreement for using LoadLoom." />
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
          This is a plain-language summary and is not legal advice. Have it reviewed before you rely on
          it commercially.
        </p>
      </section>
    </SiteShell>
  );
}
