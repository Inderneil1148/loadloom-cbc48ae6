import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">Coming Soon</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]!);
  const text = [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export function CsvButton({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return (
    <Button size="sm" variant="outline" disabled={!rows.length} onClick={() => downloadCsv(name, rows)}>
      <Download className="size-4" /> CSV
    </Button>
  );
}

export const fmtBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1073741824).toFixed(2)} GB`;

export const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
