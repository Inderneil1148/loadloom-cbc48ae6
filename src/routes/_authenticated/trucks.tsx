import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, StatusBadge, opts } from "@/components/app/RecordManager";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/trucks")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Trucks — LoadLoom" }, { name: "description", content: "Add, edit and delete trucks." }, { property: "og:title", content: "Trucks — LoadLoom" }, { property: "og:description", content: "Manage your fleet and vehicle availability." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: TrucksPage,
});

function TrucksPage() {
  const qc = useQueryClient();
  const available = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").update({ status: "available" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["records", "vehicles"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Truck set available"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update truck"),
  });
  return (
    <RecordManager
      table="vehicles"
      title="Trucks"
      singular="Truck"
      orderBy={{ column: "registration", ascending: true }}
      fields={[
        { name: "registration", label: "Registration no.", type: "text", required: true },
        { name: "vehicle_type", label: "Type", type: "select", options: opts("Tipper", "Transit mixer", "Trailer", "Tractor", "Pickup") },
        { name: "capacity_tonnes", label: "Capacity (tonnes)", type: "number" },
        { name: "status", label: "Status", type: "select", options: opts("available", "on_trip", "maintenance") },
      ]}
      columns={[
        { label: "Registration", render: (r) => <span className="font-semibold">{r.registration}</span> },
        { label: "Type", render: (r) => r.vehicle_type },
        { label: "Capacity", render: (r) => `${r.capacity_tonnes} t` },
        { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      ]}
      mobileTitle={(r) => <span className="flex flex-wrap items-center gap-2">{r.registration} <StatusBadge value={r.status} /></span>}
      mobileMeta={(r) => `${r.vehicle_type} · ${r.capacity_tonnes} t`}
      actions={(r) => r.status !== "available" && <Button variant="outline" size="sm" disabled={available.isPending} onClick={() => available.mutate(r.id)}>Set Available</Button>}
    />
  );
}
