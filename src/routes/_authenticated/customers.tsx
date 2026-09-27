import { createFileRoute } from "@tanstack/react-router";
import { RecordManager } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { MessageCircle, UsersRound } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [
    { title: "Customers 360 — LoadLoom" }, { name: "description", content: "Manage customer contacts and addresses." },
    { property: "og:title", content: "Customers 360 — LoadLoom" }, { property: "og:description", content: "Manage customer contacts and addresses." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <RecordManager table="customers" title="Customer Directory & Accounts" singular="Customer" orderBy={{ column: "name", ascending: true }}
    fields={[
      { name: "name", label: "Company name", type: "text", required: true },
      { name: "contact_name", label: "Contact person", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "address", label: "Address", type: "text" },
    ]}
    columns={[
      { label: "Customer", render: (r) => <span className="font-semibold">{r.name}</span> },
      { label: "Contact", render: (r) => r.contact_name ?? "—" },
      { label: "Phone", render: (r) => r.phone ?? "—" },
      { label: "WhatsApp", render: (r) => r.phone ? <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${r.name}`}><MessageCircle /> Message</a></Button> : "—" },
    ]}
    actions={(r) => <Button asChild variant="outline" size="sm"><Link to="/customer-360" search={{ id: r.id }}><UsersRound /> 360</Link></Button>}
    mobileTitle={(r) => r.name}
    mobileMeta={(r) => <span className="flex flex-wrap items-center gap-2">{r.contact_name ?? r.phone ?? "No contact"}{r.phone && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>}</span>}
  />,
});