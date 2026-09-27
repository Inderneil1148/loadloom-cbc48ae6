/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppHeader } from "./AppHeader";

type Row = any;
type Option = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "datetime" | "select" | "ref";
  required?: boolean;
  options?: Option[];
  /** for type "ref": table + label column */
  ref?: { table: string; label: string; value?: string };
  default?: () => string;
};

export type Column = { label: string; render: (r: Row) => ReactNode; className?: string };

const TONE: Record<string, string> = {
  good: "border-success/30 bg-success/10 text-success",
  warn: "border-warning/30 bg-warning/10 text-warning",
  bad: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-accent/30 bg-accent/10 text-accent",
  muted: "border-border bg-muted text-muted-foreground",
};
const STATUS_TONE: Record<string, string> = {
  delivered: "good", paid: "good", closed: "good", available: "good",
  on_road: "info", dispatched: "info", on_trip: "info", loading: "info", arrived: "info", assigned: "info",
  confirmed: "warn", scheduled: "warn", sent: "warn", partially_paid: "warn", invoiced: "warn",
  overdue: "bad", maintenance: "bad", cancelled: "bad",
};
export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${TONE[STATUS_TONE[value] ?? "muted"]}`}>
      {value.replace(/_/g, " ")}
    </Badge>
  );
}
export const opts = (...v: string[]): Option[] => v.map((x) => ({ value: x, label: x.replace(/_/g, " ") }));
export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const today = () => new Date().toISOString().slice(0, 10);

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function RefSelect({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({
    queryKey: ["ref", field.ref!.table],
    queryFn: async () => {
      const { data, error } = await supabase.from(field.ref!.table as any).select(`id, ${field.ref!.label}`).order(field.ref!.label);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  return (
    <select id={field.name} className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{field.ref!.value ? "— Select —" : "— None —"}</option>
      {value && field.ref!.value && !data?.some((r) => r[field.ref!.value!] === value) && (
        <option value={value}>{value}</option>
      )}
      {data?.map((r) => (
        <option key={r.id} value={r[field.ref!.value ?? "id"]}>{r[field.ref!.label]}</option>
      ))}
    </select>
  );
}

const toInput = (f: Field, v: any) =>
  v == null ? "" : f.type === "datetime" ? new Date(v).toISOString().slice(0, 16) : String(v);

export function RecordManager({
  table, title, singular, select = "*", orderBy, fields, columns, mobileTitle, mobileMeta, embedded, hint, actions,
  customForm, dialogTitle, dialogDescription, dialogClassName, submitLabel, preparePayload, afterSave,
}: {
  embedded?: boolean;
  hint?: ReactNode;
  table: string;
  title: string;
  singular: string;
  select?: string;
  orderBy: { column: string; ascending?: boolean };
  fields: Field[];
  columns: Column[];
  mobileTitle: (r: Row) => ReactNode;
  mobileMeta: (r: Row) => ReactNode;
  actions?: (r: Row) => ReactNode;
  customForm?: (props: { form: Record<string, string>; setForm: (form: Record<string, string>) => void; editing: Row | null }) => ReactNode;
  dialogTitle?: string;
  dialogDescription?: string;
  dialogClassName?: string;
  submitLabel?: string;
  preparePayload?: (payload: Row, form: Record<string, string>, editing: Row | null) => Row;
  afterSave?: (saved: Row, form: Record<string, string>, editing: Row | null) => Promise<void>;
}) {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["records", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as any)
        .select(select)
        .order(orderBy.column, { ascending: orderBy.ascending ?? false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["records"] });
    qc.invalidateQueries({ queryKey: ["ref"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const f of fields) {
        const v = form[f.name]?.trim() ?? "";
        if (f.required && !v) throw new Error(`${f.label} is required`);
        if (f.type === "number") {
          if (v && Number.isNaN(Number(v))) throw new Error(`${f.label} must be a number`);
          payload[f.name] = v ? Number(v) : 0;
        } else if (f.type === "datetime") payload[f.name] = v ? new Date(v).toISOString() : null;
        else payload[f.name] = v || null;
      }
      const finalPayload = preparePayload ? preparePayload(payload, form, editing) : payload;
      const q = editing
        ? supabase.from(table as any).update(finalPayload).eq("id", editing.id).select().single()
        : supabase.from(table as any).insert(finalPayload).select().single();
      const { data: saved, error } = await q;
      if (error) throw error;
      if (afterSave) await afterSave(saved, form, editing);
    },
    onSuccess: () => {
      toast.success(editing ? `${singular} updated` : `${singular} added`);
      setOpen(false);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${singular} deleted`);
      setToDelete(null);
      refresh();
    },
    onError: (e) =>
      toast.error(
        e instanceof Error && e.message.includes("foreign key")
          ? `This ${singular.toLowerCase()} is linked to other records. Remove those links first.`
          : e instanceof Error ? e.message : "Couldn't delete",
      ),
  });

  function openForm(row: Row | null) {
    setEditing(row);
    const init: Record<string, string> = {};
    for (const f of fields)
      init[f.name] = row ? toInput(f, row[f.name]) : f.default?.() ?? (f.type === "select" ? f.options![0]?.value ?? "" : "");
    setForm(init);
    setOpen(true);
  }

  useEffect(() => {
    if (new URLSearchParams(location.searchStr).get("new") === "true") {
      openForm(null);
      navigate({ to: location.pathname, search: {}, replace: true });
    }
  }, [location.searchStr]);

  const statuses = [...new Set((data ?? []).map((r) => r.status).filter(Boolean))] as string[];
  const customers = [...new Set((data ?? []).map((r) => r.customer_name).filter(Boolean))] as string[];
  const materials = [...new Set((data ?? []).map((r) => r.material).filter(Boolean))] as string[];
  const filtered = (data ?? []).filter((r) =>
    (!statusFilter || r.status === statusFilter) &&
    (!customerFilter || r.customer_name === customerFilter) &&
    (!materialFilter || r.material === materialFilter) &&
    (!search || Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(search.toLowerCase()))),
  );

  function exportCsv() {
    if (!filtered.length) return;
    const keys = fields.map((f) => f.name);
    const csv = [keys.join(","), ...filtered.map((r) => keys.map((key) => `"${String(r[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const rowActions = (r: Row) => (
    <div className="flex justify-end gap-1">
      {actions?.(r)}
      <Button variant="ghost" size="icon" aria-label={`Edit ${singular}`} onClick={() => openForm(r)}><Pencil /></Button>
      <Button variant="ghost" size="icon" aria-label={`Delete ${singular}`} onClick={() => setToDelete(r)}>
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );

  const Wrap = embedded ? "div" : "main";
  return (
    <div className={embedded ? "" : "min-h-screen bg-background pb-20 lg:pb-0"}>
      {!embedded && <AppHeader />}
      <Wrap className={embedded ? "" : "mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:ml-60 lg:w-auto lg:px-7"}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            {embedded ? <h2 className="mt-1 text-xl font-extrabold">{title}</h2> : <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h1>}
            {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
          </div>
          <Button variant="action" size="sm" className="shrink-0" onClick={() => openForm(null)}><Plus /> <span className="hidden min-[380px]:inline">Add </span>{singular}</Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1 basis-48 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label={`Search ${title}`} placeholder={`Search ${title.toLowerCase()}…`} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {statuses.length > 0 && <select aria-label="Filter by status" className={selectCls + " w-auto max-w-full flex-1 basis-32 sm:flex-none"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>}
          {table === "orders" && <select aria-label="Filter by customer" className={selectCls + " w-auto max-w-full flex-1 basis-32 sm:flex-none"} value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}><option value="">All customers</option>{customers.map((s) => <option key={s} value={s}>{s}</option>)}</select>}
          {table === "orders" && <select aria-label="Filter by material" className={selectCls + " w-auto max-w-full flex-1 basis-32 sm:flex-none"} value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)}><option value="">All materials</option>{materials.map((s) => <option key={s} value={s}>{s}</option>)}</select>}
          {(table === "orders" || table === "payments" || table === "invoices") && <Button variant="outline" size="icon" aria-label="Export CSV" title="Export CSV" disabled={!filtered.length} onClick={exportCsv}><Download /></Button>}
        </div>

        <section className="mt-4 overflow-hidden rounded-md border border-border bg-card shadow-panel">
          {isPending ? (
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">Couldn't load {title.toLowerCase()}. Please refresh.</p>
          ) : !filtered.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-muted-foreground">{data?.length ? "No matching records." : `No ${title.toLowerCase()} yet.`}</p>
              {!data?.length && <Button variant="outline" className="mt-4" onClick={() => openForm(null)}><Plus /> Add the first one</Button>}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border sm:hidden">
                {filtered.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0 space-y-1">
                      <div className="font-semibold">{mobileTitle(r)}</div>
                      <div className="text-sm text-muted-foreground">{mobileMeta(r)}</div>
                    </div>
                     {rowActions(r)}
                  </li>
                ))}
              </ul>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => <TableHead key={c.label} className={c.className}>{c.label}</TableHead>)}
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filtered.map((r) => (
                      <TableRow key={r.id}>
                        {columns.map((c) => <TableCell key={c.label} className={c.className}>{c.render(r)}</TableCell>)}
                         <TableCell>{rowActions(r)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>
      </Wrap>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={dialogClassName ?? "max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${singular.toLowerCase()}` : dialogTitle ?? `New ${singular.toLowerCase()}`}</DialogTitle>
            {dialogDescription && !editing && <DialogDescription>{dialogDescription}</DialogDescription>}
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          >
            {customForm ? <div className="sm:col-span-2">{customForm({ form, setForm, editing })}</div> : fields.map((f) => {
              const set = (v: string) => setForm((s) => ({ ...s, [f.name]: v }));
              return (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name}>{f.label}{f.required && " *"}</Label>
                  {f.type === "select" ? (
                    <select id={f.name} className={selectCls} value={form[f.name] ?? ""} onChange={(e) => set(e.target.value)}>
                      {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "ref" ? (
                    <RefSelect field={f} value={form[f.name] ?? ""} onChange={set} />
                  ) : (
                    <Input
                      id={f.name}
                      type={f.type === "datetime" ? "datetime-local" : f.type === "number" ? "text" : f.type}
                      inputMode={f.type === "number" ? "decimal" : undefined}
                      value={form[f.name] ?? ""}
                      onChange={(e) => set(e.target.value)}
                    />
                  )}
                </div>
              );
            })}
            <DialogFooter className={customForm ? "sticky bottom-0 z-10 -mx-4 -mb-4 border-t border-border bg-background px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6" : "sm:col-span-2"}>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="action" disabled={save.isPending}>
                {!save.isPending && !editing && customForm && <Plus />}
                {save.isPending ? "Saving…" : editing ? "Save changes" : submitLabel ?? "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); if (toDelete) remove.mutate(toDelete.id); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
