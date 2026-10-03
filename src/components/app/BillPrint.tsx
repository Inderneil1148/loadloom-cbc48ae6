import { Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/plans";
import { inWords } from "@/lib/inwords";
import { fmtDate } from "./RecordManager";

export type BillData =
  | { kind: "payment"; id: string; customer: string; amount: number; method: string; reference?: string | null; paidOn: string; invoiceNo?: string | null }
  | { kind: "invoice"; id: string; invoiceNo: string; customer: string; amount: number; dueDate: string; status: string; orderNo?: string | null };

function useBusinessName(enabled: boolean) {
  return useQuery({
    queryKey: ["biz-profile-name"],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.from("business_profiles").select("business_name, city, state, gstin").maybeSingle();
      return data;
    },
  });
}

/** One common bill template for payments and invoices. Prints only the bill via the #ll-bill print CSS. */
export function BillPrint({ bill, onClose }: { bill: BillData | null; onClose: () => void }) {
  const { data: biz } = useBusinessName(!!bill);
  return (
    <Dialog open={!!bill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{bill?.kind === "invoice" ? "Invoice" : "Payment receipt"}</DialogTitle></DialogHeader>
        {bill && (
          <div className="space-y-4 text-sm" id="ll-bill">
            <div className="border-b border-border pb-3 text-center">
              <p className="text-lg font-extrabold tracking-tight">{biz?.business_name ?? "LoadLoom"}</p>
              {biz?.city && <p className="text-xs text-muted-foreground">{[biz.city, biz.state].filter(Boolean).join(", ")}</p>}
              {biz?.gstin && <p className="text-xs text-muted-foreground">GSTIN: {biz.gstin}</p>}
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-accent">
                {bill.kind === "invoice" ? "Invoice" : "Payment receipt"}
              </p>
            </div>
            <dl className="space-y-2">
              {(bill.kind === "invoice"
                ? [
                    ["Invoice no.", bill.invoiceNo],
                    ["Customer", bill.customer],
                    ["Order", bill.orderNo ?? "—"],
                    ["Due date", fmtDate(bill.dueDate)],
                    ["Status", bill.status.replace(/_/g, " ")],
                  ]
                : [
                    ["Receipt no.", bill.id.slice(0, 8).toUpperCase()],
                    ["Customer", bill.customer],
                    ["Invoice", bill.invoiceNo ?? "—"],
                    ["Paid on", fmtDate(bill.paidOn)],
                    ["Method", bill.method],
                    ["Reference", bill.reference ?? "—"],
                  ]
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold capitalize">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold">{bill.kind === "invoice" ? "Invoice amount" : "Amount received"}</dt>
                <dd className="text-lg font-extrabold">{formatINR(Number(bill.amount))}</dd>
              </div>
              <p className="text-xs italic text-muted-foreground">{inWords(Number(bill.amount))}</p>
            </dl>
            <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground">
              {bill.kind === "invoice" ? "Please pay by the due date. Thank you for your business." : "Received with thanks."}
            </p>
            <Button className="w-full print:hidden" variant="action" onClick={() => window.print()}>
              <Printer className="size-4" /> Print / save as PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
