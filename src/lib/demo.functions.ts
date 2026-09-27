import { createServerFn } from "@tanstack/react-start";
import { DEMO_EMAIL } from "./demo";

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

/** Ensures the shared read-only demo account exists with sample data and returns a one-time sign-in token. */
export const startDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

  const link = await db.auth.admin.generateLink({ type: "magiclink", email: DEMO_EMAIL });
  let userId = link.data?.user?.id;
  if (!userId) {
    const created = await db.auth.admin.createUser({ email: DEMO_EMAIL, email_confirm: true, user_metadata: { requested_plan: "fleet" } });
    if (created.error) throw created.error;
    userId = created.data.user.id;
  }
  await db.from("demo_users").upsert({ user_id: userId });
  await db.from("subscriptions").update({ plan: "fleet", requested_plan: "fleet", status: "active", business_name: "LoadLoom Demo Yard" }).eq("user_id", userId);

  const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("owner_id", userId);
  if (!count) await seed(db, userId);

  const token = link.data?.properties?.hashed_token ?? (await db.auth.admin.generateLink({ type: "magiclink", email: DEMO_EMAIL })).data?.properties?.hashed_token;
  if (!token) throw new Error("Demo is unavailable right now");
  return { token };
});

async function seed(db: any, owner_id: string) {
  const ins = async (table: string, rows: Record<string, unknown>[]) => {
    const { data, error } = await db.from(table).insert(rows.map((r) => ({ owner_id, ...r }))).select();
    if (error) throw error;
    return data as any[];
  };
  await db.from("business_profiles").upsert({ owner_id, business_name: "LoadLoom Demo Yard", owner_name: "Rahul Deshmukh", phone: "+91 98220 00000", email: "demo@loadloom.app", gstin: "27ABCDE1234F1Z5", city: "Pune", state: "Maharashtra", pincode: "411057", bank_name: "HDFC Bank", ifsc: "HDFC0001234", upi_id: "demoyard@hdfc" }, { onConflict: "owner_id" });
  await ins("materials", [
    { name: "M-Sand", unit: "tonnes", rate: 1800 },
    { name: "20mm Aggregate", unit: "tonnes", rate: 1450 },
    { name: "River Sand", unit: "brass", rate: 2800 },
    { name: "Red Bricks", unit: "nos", rate: 8 },
    { name: "Cement (OPC 53)", unit: "bags", rate: 390 },
  ]);
  const c = await ins("customers", [
    { name: "Patil Constructions", contact_name: "Sanjay Patil", phone: "9822011111", address: "Hinjewadi, Pune" },
    { name: "Skyline Builders", contact_name: "Amit Shah", phone: "9822022222", address: "Wakad, Pune" },
    { name: "Shinde Infra", contact_name: "Pooja Shinde", phone: "9822033333", address: "Baner, Pune" },
    { name: "Greenfield Homes", contact_name: "Kiran Rao", phone: "9822044444", address: "Kharadi, Pune" },
  ]);
  const s = await ins("delivery_sites", [
    { name: "Hinjewadi Ph 3", address: "Phase 3, Hinjewadi, Pune", contact_name: "Site engineer Nitin", phone: "9822055555" },
    { name: "Wakad", address: "Wakad Chowk, Pune", contact_name: "Supervisor Ravi", phone: "9822066666" },
    { name: "Baner", address: "Baner Road, Pune", contact_name: "Engineer Meera", phone: "9822077777" },
    { name: "Kharadi", address: "EON IT Park Road, Kharadi", contact_name: "Supervisor Joseph", phone: "9822088888" },
  ]);
  const v = await ins("vehicles", [
    { registration: "MH 12 AB 4521", vehicle_type: "Tipper", capacity_tonnes: 16, status: "on_trip" },
    { registration: "MH 14 CD 7788", vehicle_type: "Tipper", capacity_tonnes: 10, status: "on_trip" },
    { registration: "MH 12 EF 1203", vehicle_type: "Transit mixer", capacity_tonnes: 8, status: "available" },
    { registration: "MH 42 GH 9090", vehicle_type: "Trailer", capacity_tonnes: 25, status: "maintenance" },
    { registration: "MH 12 JK 3344", vehicle_type: "Tipper", capacity_tonnes: 16, status: "available" },
  ]);
  const veh = (r: string) => v.find((x) => x.registration === r).id;
  const d = await ins("drivers", [
    { name: "Ramesh Jadhav", phone: "9890011111", licence_number: "MH12 2015 0012345", vehicle_id: veh("MH 12 AB 4521"), status: "on_trip" },
    { name: "Suresh Pawar", phone: "9890022222", licence_number: "MH14 2017 0045678", vehicle_id: veh("MH 14 CD 7788"), status: "on_trip" },
    { name: "Anil More", phone: "9890033333", licence_number: "MH12 2012 0078901", vehicle_id: veh("MH 12 JK 3344"), status: "available" },
    { name: "Vijay Kale", phone: "9890044444", licence_number: "MH12 2019 0011223", status: "off_duty" },
  ]);
  const cust = (n: string) => c.find((x) => x.name === n);
  const site = (n: string) => s.find((x) => x.name === n);
  const drv = (n: string) => d.find((x) => x.name === n).id;
  const order = (no: string, cn: string, sn: string, material: string, quantity: number, unit: string, rate: number, freight: number, gst: number, advance: number, status: string, off: number, vr?: string, dn?: string) => {
    const amount = quantity * rate + freight + (quantity * rate + freight) * (gst / 100);
    return { order_no: no, customer_name: cn, customer_id: cust(cn).id, site: sn, site_id: site(sn).id, material, quantity, unit, rate, haulage_freight: freight, gst_percent: gst, advance_amount: advance, amount, status, order_date: day(off), delivery_date: day(off), target_window: "08:30", vehicle_id: vr ? veh(vr) : null, driver_id: dn ? drv(dn) : null };
  };
  const o = await ins("orders", [
    order("ORD-1044", "Shinde Infra", "Baner", "20mm Aggregate", 10, "tonnes", 1450, 1500, 5, 0, "confirmed", 0),
    order("ORD-1043", "Greenfield Homes", "Kharadi", "M-Sand", 16, "tonnes", 1800, 2000, 5, 5000, "confirmed", 0),
    order("ORD-1042", "Patil Constructions", "Hinjewadi Ph 3", "M-Sand", 16, "tonnes", 1800, 0, 0, 10000, "dispatched", 0, "MH 12 AB 4521", "Ramesh Jadhav"),
    order("ORD-1041", "Skyline Builders", "Wakad", "20mm Aggregate", 10, "tonnes", 1450, 0, 0, 0, "assigned", 0, "MH 14 CD 7788", "Suresh Pawar"),
    order("ORD-1040", "Shinde Infra", "Baner", "River Sand", 12, "brass", 2800, 0, 0, 0, "confirmed", -1),
    order("ORD-1039", "Patil Constructions", "Hinjewadi Ph 3", "Red Bricks", 8000, "nos", 8, 0, 0, 0, "delivered", -1, "MH 12 JK 3344", "Anil More"),
    order("ORD-1038", "Greenfield Homes", "Kharadi", "Cement (OPC 53)", 200, "bags", 390, 0, 0, 0, "invoiced", -3, "MH 12 EF 1203", "Vijay Kale"),
    order("ORD-1037", "Skyline Builders", "Wakad", "M-Sand", 32, "tonnes", 1800, 0, 0, 0, "closed", -6),
    order("ORD-1036", "Patil Constructions", "Hinjewadi Ph 3", "20mm Aggregate", 20, "tonnes", 1450, 0, 0, 0, "closed", -35),
    order("ORD-1035", "Skyline Builders", "Wakad", "River Sand", 8, "brass", 2800, 0, 0, 0, "closed", -65),
  ]);
  const ord = (n: string) => o.find((x) => x.order_no === n).id;
  const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  await ins("deliveries", [
    { order_id: ord("ORD-1042"), vehicle_id: veh("MH 12 AB 4521"), driver_name: "Ramesh Jadhav", status: "on_road", dispatched_at: ago(1) },
    { order_id: ord("ORD-1041"), vehicle_id: veh("MH 14 CD 7788"), driver_name: "Suresh Pawar", status: "loading" },
    { order_id: ord("ORD-1039"), vehicle_id: veh("MH 12 JK 3344"), driver_name: "Anil More", status: "delivered", dispatched_at: ago(26), delivered_at: ago(23) },
    { order_id: ord("ORD-1038"), vehicle_id: veh("MH 12 EF 1203"), driver_name: "Vijay Kale", status: "delivered", dispatched_at: ago(74), delivered_at: ago(71) },
  ]);
  const inv = await ins("invoices", [
    { order_id: ord("ORD-1039"), invoice_no: "INV-2207", customer_name: "Patil Constructions", amount: 64000, due_date: day(14), status: "sent" },
    { order_id: ord("ORD-1038"), invoice_no: "INV-2206", customer_name: "Greenfield Homes", amount: 78000, due_date: day(-2), status: "overdue" },
    { order_id: ord("ORD-1037"), invoice_no: "INV-2205", customer_name: "Skyline Builders", amount: 57600, due_date: day(-1), status: "paid" },
    { order_id: ord("ORD-1036"), invoice_no: "INV-2204", customer_name: "Patil Constructions", amount: 29000, due_date: day(-20), status: "paid" },
    { order_id: ord("ORD-1035"), invoice_no: "INV-2203", customer_name: "Skyline Builders", amount: 22400, due_date: day(-50), status: "paid" },
  ]);
  const invId = (n: string) => inv.find((x) => x.invoice_no === n).id;
  await ins("payments", [
    { invoice_id: invId("INV-2205"), customer_name: "Skyline Builders", amount: 57600, method: "Bank transfer", reference: "NEFT 88213", paid_on: day(-1) },
    { invoice_id: invId("INV-2206"), customer_name: "Greenfield Homes", amount: 20000, method: "UPI", reference: "UPI 4471", paid_on: day(0) },
    { invoice_id: invId("INV-2204"), customer_name: "Patil Constructions", amount: 29000, method: "Cheque", reference: "CHQ 004512", paid_on: day(-18) },
    { invoice_id: invId("INV-2203"), customer_name: "Skyline Builders", amount: 22400, method: "Cash", paid_on: day(-48) },
  ]);
  await ins("quotations", [
    { quote_no: "QT-301", customer_name: "Shinde Infra", site: "Baner", material: "M-Sand", quantity: 48, unit: "tonnes", rate: 1750, haulage_freight: 4000, gst_percent: 5, amount: (48 * 1750 + 4000) * 1.05, valid_until: day(7), status: "sent" },
    { quote_no: "QT-300", customer_name: "Greenfield Homes", site: "Kharadi", material: "20mm Aggregate", quantity: 30, unit: "tonnes", rate: 1400, haulage_freight: 2500, gst_percent: 5, amount: (30 * 1400 + 2500) * 1.05, valid_until: day(3), status: "draft" },
  ]);
}
