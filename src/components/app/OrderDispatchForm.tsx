import type { ReactNode } from "react";
import { Calculator, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/plans";

type FormValues = Record<string, string>;
type OptionRow = { id: string; [key: string]: string | number | null };

const selectClass = "flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const units = ["tonnes", "brass", "cft", "bags", "nos", "trips", "load"];
const gstRates = [0, 5, 12, 18, 28];

const numberValue = (value: string | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function OrderDispatchForm({ values, onChange }: { values: FormValues; onChange: (values: FormValues) => void }) {
  const { data, isPending } = useQuery({
    queryKey: ["dispatch-order-options"],
    queryFn: async () => {
      const [customers, sites, materials, vehicles, drivers] = await Promise.all([
        supabase.from("customers").select("id, name, contact_name").order("name"),
        supabase.from("delivery_sites").select("id, name, address").order("name"),
        supabase.from("materials").select("id, name, unit, rate").order("name"),
        supabase.from("vehicles").select("id, registration, vehicle_type, capacity_tonnes, status").order("registration"),
        supabase.from("drivers").select("id, name, vehicle_id, status").order("name"),
      ]);
      const failure = [customers, sites, materials, vehicles, drivers].find((result) => result.error)?.error;
      if (failure) throw failure;
      return {
        customers: (customers.data ?? []) as OptionRow[],
        sites: (sites.data ?? []) as OptionRow[],
        materials: (materials.data ?? []) as OptionRow[],
        vehicles: (vehicles.data ?? []) as OptionRow[],
        drivers: (drivers.data ?? []) as OptionRow[],
      };
    },
  });

  const set = (name: string, value: string) => onChange({ ...values, [name]: value });
  const quantity = numberValue(values.quantity);
  const rate = numberValue(values.rate);
  const freight = numberValue(values.haulage_freight);
  const gstPercent = numberValue(values.gst_percent);
  const advance = numberValue(values.advance_amount);
  const materialSubtotal = quantity * rate;
  const gstAmount = (materialSubtotal + freight) * (gstPercent / 100);
  const total = materialSubtotal + freight + gstAmount;
  const balance = Math.max(total - advance, 0);

  function selectCustomer(id: string) {
    const selected = data?.customers.find((row) => row.id === id);
    onChange({ ...values, customer_id: id, customer_name: String(selected?.name ?? "") });
  }

  function selectSite(id: string) {
    const selected = data?.sites.find((row) => row.id === id);
    onChange({ ...values, site_id: id, site: String(selected?.name ?? "") });
  }

  function selectMaterial(name: string) {
    const selected = data?.materials.find((row) => row.name === name);
    onChange({
      ...values,
      material: name,
      unit: String(selected?.unit ?? values.unit ?? "tonnes"),
      rate: String(selected?.rate ?? values.rate ?? "0"),
    });
  }

  function selectTruck(id: string) {
    const nextStatus = id && values.status === "confirmed" ? "assigned" : values.status;
    onChange({ ...values, vehicle_id: id, status: nextStatus });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contractor / Buyer" required>
          <select className={selectClass} value={values.customer_id ?? ""} onChange={(event) => selectCustomer(event.target.value)} disabled={isPending}>
            <option value="">Select customer</option>
            {data?.customers.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}
          </select>
        </Field>
        <Field label="Project Delivery Destination Site" required>
          <select className={selectClass} value={values.site_id ?? ""} onChange={(event) => selectSite(event.target.value)} disabled={isPending}>
            <option value="">Select delivery site</option>
            {data?.sites.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}
          </select>
        </Field>
      </div>

      <section className="rounded-md border border-border bg-secondary/30 p-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)]">
          <Field label="Material Product" required>
            <select className={selectClass} value={values.material ?? ""} onChange={(event) => selectMaterial(event.target.value)} disabled={isPending}>
              <option value="">Select material</option>
              {values.material && !data?.materials.some((row) => row.name === values.material) && <option value={values.material}>{values.material}</option>}
              {data?.materials.map((row) => <option key={row.id} value={String(row.name)}>{String(row.name)} — {formatINR(Number(row.rate ?? 0))}/{String(row.unit)}</option>)}
            </select>
          </Field>
          <Field label="Unit of Measure">
            <select className={selectClass} value={values.unit ?? "tonnes"} onChange={(event) => set("unit", event.target.value)}>
              {units.map((unit) => <option key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Quantity" name="quantity" value={values.quantity} onChange={set} />
          <NumberField label="Unit Rate (₹)" name="rate" value={values.rate} onChange={set} />
          <NumberField label="Haulage Freight (₹)" name="haulage_freight" value={values.haulage_freight} onChange={set} />
          <Field label="GST Tax">
            <select className={selectClass} value={values.gst_percent ?? "0"} onChange={(event) => set("gst_percent", event.target.value)}>
              {gstRates.map((rateOption) => <option key={rateOption} value={rateOption}>{rateOption}%{rateOption === 0 ? " (Exempt)" : ""}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assign Dispatch Truck">
          <select className={selectClass} value={values.vehicle_id ?? ""} onChange={(event) => selectTruck(event.target.value)} disabled={isPending}>
            <option value="">Assign truck later…</option>
            {data?.vehicles.map((row) => <option key={row.id} value={row.id}>{String(row.registration)} · {String(row.vehicle_type)} · {Number(row.capacity_tonnes)} t{row.status !== "available" ? ` · ${String(row.status).replace(/_/g, " ")}` : ""}</option>)}
          </select>
        </Field>
        <Field label="Assign Driver">
          <select className={selectClass} value={values.driver_id ?? ""} onChange={(event) => set("driver_id", event.target.value)} disabled={isPending}>
            <option value="">Assign driver later…</option>
            {data?.drivers.map((row) => <option key={row.id} value={row.id}>{String(row.name)}{row.status !== "available" ? ` · ${String(row.status).replace(/_/g, " ")}` : ""}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Delivery Date">
          <Input type="date" value={values.delivery_date ?? ""} onChange={(event) => set("delivery_date", event.target.value)} />
        </Field>
        <Field label="Target Window">
          <Input type="time" value={values.target_window ?? ""} onChange={(event) => set("target_window", event.target.value)} />
        </Field>
        <div className="col-span-2 sm:col-span-1">
          <NumberField label="Advance Received (₹)" name="advance_amount" value={values.advance_amount} onChange={set} tone="success" />
        </div>
      </div>

      <section className="rounded-md border border-border bg-secondary/25 p-4">
        <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase"><Calculator className="size-4" /> Transparent commercial ledger</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Total label="Material Subtotal" value={materialSubtotal} />
          <Total label="Haulage + Tax" value={freight + gstAmount} />
          <Total label="Total Load Amount" value={total} accent />
          <Total label="Balance Pending" value={balance} danger={balance > 0} />
        </div>
        <input type="hidden" value={String(total)} readOnly aria-label="Calculated total amount" />
      </section>

      {!data?.customers.length || !data?.sites.length || !data?.materials.length ? (
        <p className="text-xs text-muted-foreground">Add customers, delivery sites, and materials from their menu pages before authorizing a dispatch.</p>
      ) : null}
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Truck className="size-4" /> Truck and driver can be assigned now or later from Deliveries.</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <div className="min-w-0 space-y-1.5"><Label>{label}{required ? " *" : ""}</Label>{children}</div>;
}

function NumberField({ label, name, value, onChange, tone }: { label: string; name: string; value?: string; onChange: (name: string, value: string) => void; tone?: "success" }) {
  return <Field label={label}><Input type="text" inputMode="decimal" className={tone === "success" ? "text-success" : ""} value={value ?? ""} onChange={(event) => onChange(name, event.target.value)} /></Field>;
}

function Total({ label, value, accent, danger }: { label: string; value: number; accent?: boolean; danger?: boolean }) {
  return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 break-words font-display text-base font-extrabold tabular-nums ${accent ? "text-accent" : danger ? "text-destructive" : "text-foreground"}`}>{formatINR(value)}</p></div>;
}