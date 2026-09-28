import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app/AppHeader";
import { RecordManager, opts } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/settings")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Settings — LoadLoom" },
      { name: "description", content: "Enterprise profile and material catalog." },
      { property: "og:title", content: "Settings — LoadLoom" },
      { property: "og:description", content: "Manage your enterprise profile and material catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const UNITS = opts("tonnes", "brass", "cft", "bags", "nos", "trips");

type ProfileKey =
  | "business_name" | "owner_name" | "phone" | "email" | "gstin" | "pan" | "address" | "city"
  | "state" | "pincode" | "bank_name" | "bank_account" | "ifsc" | "upi_id";

const GROUPS: { title: string; fields: { key: ProfileKey; label: string; area?: boolean }[] }[] = [
  { title: "Business", fields: [
    { key: "business_name", label: "Business name *" }, { key: "owner_name", label: "Owner / contact person" },
    { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
    { key: "gstin", label: "GSTIN" }, { key: "pan", label: "PAN" },
  ] },
  { title: "Address", fields: [
    { key: "address", label: "Street address", area: true }, { key: "city", label: "City" },
    { key: "state", label: "State" }, { key: "pincode", label: "PIN code" },
  ] },
  { title: "Bank & payments", fields: [
    { key: "bank_name", label: "Bank name" }, { key: "bank_account", label: "Account number" },
    { key: "ifsc", label: "IFSC" }, { key: "upi_id", label: "UPI ID" },
  ] },
];

function EnterpriseProfile() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["business_profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!data) return;
    const f: Record<string, string> = {};
    for (const g of GROUPS) for (const x of g.fields) f[x.key] = (data[x.key] as string | null) ?? "";
    setForm(f);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form["business_name"]?.trim()) throw new Error("Business name is required");
      const { data: u } = await supabase.auth.getUser();
      const payload: Record<string, string | null> = {};
      for (const g of GROUPS) for (const x of g.fields) payload[x.key] = form[x.key]?.trim() || null;
      const { error } = await supabase
        .from("business_profiles")
        .upsert({ ...payload, business_name: payload["business_name"]!, owner_id: u.user!.id }, { onConflict: "owner_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["business_profile"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  if (isPending) return <Skeleton className="h-64 w-full" />;

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-md border border-border bg-card p-4 shadow-panel sm:p-5">
          <h2 className="font-bold">{g.title}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {g.fields.map((x) => (
              <div key={x.key} className={`space-y-1.5 ${x.area ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={x.key}>{x.label}</Label>
                {x.area ? (
                  <Textarea id={x.key} value={form[x.key] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [x.key]: e.target.value }))} />
                ) : (
                  <Input id={x.key} value={form[x.key] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [x.key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="action" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save profile"}</Button>
      </div>
    </form>
  );
}

function SettingsPage() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-5 sm:py-8 lg:ml-60 lg:w-auto lg:px-7">
        <p className="eyebrow text-accent">Defaults</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Settings</h1>
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="profile" className="flex-1">Enterprise Profile</TabsTrigger>
            <TabsTrigger value="materials" className="flex-1">Material Catalog</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6"><EnterpriseProfile /></TabsContent>
          <TabsContent value="materials" className="mt-6">
            <RecordManager
              embedded
              table="materials"
              title="Material Catalog"
              singular="Material"
              hint="Materials you add here appear in the Material dropdown when creating orders."
              orderBy={{ column: "name", ascending: true }}
              fields={[
                { name: "name", label: "Material name", type: "text", required: true },
                { name: "unit", label: "Default unit", type: "select", options: UNITS },
                { name: "rate", label: "Rate per unit (₹)", type: "number" },
              ]}
              columns={[
                { label: "Material", render: (r) => <span className="font-semibold">{r.name}</span> },
                { label: "Unit", render: (r) => r.unit },
                { label: "Rate", render: (r) => `${formatINR(r.rate)} / ${r.unit}`, className: "text-right tabular-nums" },
              ]}
              mobileTitle={(r) => r.name}
              mobileMeta={(r) => `${formatINR(r.rate)} per ${r.unit}`}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
