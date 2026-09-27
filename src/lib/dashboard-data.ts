import { supabase } from "@/integrations/supabase/client";

export async function fetchDashboard() {
  const [orders, vehicles, deliveries, invoices, payments] = await Promise.all([
    supabase.from("orders").select("*").order("order_date", { ascending: false }).limit(100),
    supabase.from("vehicles").select("*").order("registration"),
    supabase
      .from("deliveries")
      .select("*, orders(order_no, customer_name, site, material), vehicles(registration)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("invoices").select("*").order("due_date", { ascending: true }).limit(100),
    supabase.from("payments").select("*").order("paid_on", { ascending: false }).limit(100),
  ]);
  for (const r of [orders, vehicles, deliveries, invoices, payments]) if (r.error) throw r.error;
  return {
    orders: orders.data ?? [],
    vehicles: vehicles.data ?? [],
    deliveries: deliveries.data ?? [],
    invoices: invoices.data ?? [],
    payments: payments.data ?? [],
  };
}

export type DashboardData = Awaited<ReturnType<typeof fetchDashboard>>;

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

/** Inserts a small set of sample records for the signed-in user (user-triggered only). */
export async function loadSampleData() {
  const { data: v, error: ve } = await supabase
    .from("vehicles")
    .insert([
      { registration: "MH 12 AB 4521", vehicle_type: "Tipper", capacity_tonnes: 16, status: "on_trip" },
      { registration: "MH 14 CD 7788", vehicle_type: "Tipper", capacity_tonnes: 10, status: "on_trip" },
      { registration: "MH 12 EF 1203", vehicle_type: "Transit mixer", capacity_tonnes: 8, status: "available" },
      { registration: "MH 42 GH 9090", vehicle_type: "Trailer", capacity_tonnes: 25, status: "maintenance" },
      { registration: "MH 12 JK 3344", vehicle_type: "Tipper", capacity_tonnes: 16, status: "available" },
    ])
    .select();
  if (ve) throw ve;

  const { data: o, error: oe } = await supabase
    .from("orders")
    .insert([
      { order_no: "ORD-1042", customer_name: "Patil Constructions", site: "Hinjewadi Ph 3", material: "M-Sand", quantity: 16, amount: 28800, status: "dispatched", order_date: day(0) },
      { order_no: "ORD-1041", customer_name: "Skyline Builders", site: "Wakad", material: "20mm Aggregate", quantity: 10, amount: 14500, status: "dispatched", order_date: day(0) },
      { order_no: "ORD-1040", customer_name: "Shinde Infra", site: "Baner", material: "River Sand", quantity: 12, amount: 33600, status: "confirmed", order_date: day(0) },
      { order_no: "ORD-1039", customer_name: "Patil Constructions", site: "Hinjewadi Ph 3", material: "Red Bricks", quantity: 8000, unit: "nos", amount: 64000, status: "delivered", order_date: day(-1) },
      { order_no: "ORD-1038", customer_name: "Greenfield Homes", site: "Kharadi", material: "Cement (OPC 53)", quantity: 200, unit: "bags", amount: 78000, status: "invoiced", order_date: day(-3) },
      { order_no: "ORD-1037", customer_name: "Skyline Builders", site: "Wakad", material: "M-Sand", quantity: 32, amount: 57600, status: "closed", order_date: day(-6) },
    ])
    .select();
  if (oe) throw oe;
  const ord = (n: string) => o!.find((x) => x.order_no === n)!.id;
  const veh = (r: string) => v!.find((x) => x.registration === r)!.id;
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();

  const { error: de } = await supabase.from("deliveries").insert([
    { order_id: ord("ORD-1042"), vehicle_id: veh("MH 12 AB 4521"), driver_name: "Ramesh Jadhav", status: "on_road", dispatched_at: ago(1) },
    { order_id: ord("ORD-1041"), vehicle_id: veh("MH 14 CD 7788"), driver_name: "Suresh Pawar", status: "loading" },
    { order_id: ord("ORD-1039"), vehicle_id: veh("MH 12 JK 3344"), driver_name: "Anil More", status: "delivered", dispatched_at: ago(26), delivered_at: ago(23) },
    { order_id: ord("ORD-1038"), vehicle_id: veh("MH 12 EF 1203"), driver_name: "Vijay Kale", status: "delivered", dispatched_at: ago(74), delivered_at: ago(71) },
  ]);
  if (de) throw de;

  const { data: inv, error: ie } = await supabase
    .from("invoices")
    .insert([
      { order_id: ord("ORD-1039"), invoice_no: "INV-2207", customer_name: "Patil Constructions", amount: 64000, due_date: day(14), status: "sent" },
      { order_id: ord("ORD-1038"), invoice_no: "INV-2206", customer_name: "Greenfield Homes", amount: 78000, due_date: day(-2), status: "overdue" },
      { order_id: ord("ORD-1037"), invoice_no: "INV-2205", customer_name: "Skyline Builders", amount: 57600, due_date: day(-1), status: "paid" },
    ])
    .select();
  if (ie) throw ie;
  const invId = (n: string) => inv!.find((x) => x.invoice_no === n)!.id;

  const { error: pe } = await supabase.from("payments").insert([
    { invoice_id: invId("INV-2205"), customer_name: "Skyline Builders", amount: 57600, method: "Bank transfer", reference: "NEFT 88213", paid_on: day(-1) },
    { invoice_id: invId("INV-2206"), customer_name: "Greenfield Homes", amount: 20000, method: "UPI", reference: "UPI 4471", paid_on: day(0) },
  ]);
  if (pe) throw pe;
}
