import { SiteShell, PageHeader } from "./SiteShell";

export const BUSINESS = {
  name: "The Social INK",
  brand: "LoadLoom",
  email: "inderneilkanagali@gmail.com",
  country: "India",
};
export const LEGAL_UPDATED = "11 October 2026";

export function LegalPage({
  title,
  lead,
  sections,
}: {
  title: string;
  lead: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title={title} lead={lead} />
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <p className="text-xs text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>
        <div className="mt-8 space-y-9">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-bold">{s.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          {BUSINESS.brand} is operated by {BUSINESS.name}, {BUSINESS.country}. Questions:{" "}
          <a className="underline" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </p>
      </section>
    </SiteShell>
  );
}

export function legalHead(path: string, title: string, description: string) {
  const url = `https://loadloom.online${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
