"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { BarChart3, ClipboardList, Clock3, LayoutDashboard, Moon, Plus, Printer, Search, Settings, Sun, UtensilsCrossed, X, ReceiptText, CalendarDays, Star } from "lucide-react";
import InstallButton from "./install-button";

type Product = { id: number; name: string; category: string; price: number };
type CartItem = Product & { qty: number };
type Bill = { id: string; date: string; items: CartItem[]; total: number; payment: string; status: string; table: string; createdAt?: string; };
type ActiveOrder = { table_name: string; items: CartItem[]; created_at: string };

const initialMenu: Product[] = [
  { id: 1, name: "Puneri Misal", category: "Misal", price: 90 },
  { id: 2, name: "Gavran Misal", category: "Misal", price: 100 },
  { id: 3, name: "Special Misal Pav", category: "Misal", price: 130 },
  { id: 4, name: "Sada Dosa", category: "South Indian", price: 80 },
  { id: 5, name: "Masala Dosa", category: "South Indian", price: 110 },
  { id: 6, name: "Cheese Masala Dosa", category: "South Indian", price: 150 },
  { id: 7, name: "Pav Bhaji", category: "Snacks", price: 120 },
  { id: 8, name: "Cheese Pav Bhaji", category: "Snacks", price: 150 },
  { id: 9, name: "Pohe", category: "Snacks", price: 40 },
  { id: 10, name: "Rassa Pohe", category: "Snacks", price: 50 },
  { id: 11, name: "Tea", category: "Beverages", price: 10 },
  { id: 12, name: "Lassi", category: "Beverages", price: 30 },
  { id: 13, name: "Solkadhi", category: "Beverages", price: 50 },
  { id: 14, name: "Taak", category: "Beverages", price: 30 },
  { id: 15, name: "Gulab Jamun", category: "Snacks", price: 15 },
  { id: 16, name: "Idli (3 pcs)", category: "South Indian", price: 50 },
  { id: 17, name: "Medu Wada (3 pcs)", category: "South Indian", price: 80 },
  { id: 18, name: "Sada Uttapam", category: "South Indian", price: 100 },
];
const categories = ["All", "Misal", "Pav Bhaji", "South Indian", "Snacks", "Beverages", "Desserts", "Others"];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export default function Home() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState("Billing");
  const [category, setCategory] = useState("All");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [menuItems, setMenuItems] = useState<Product[]>(initialMenu);
  const [editingMenuItem, setEditingMenuItem] = useState<number | null>(null);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [menuAdminCategory, setMenuAdminCategory] = useState("Favorites");
  const [menuForm, setMenuForm] = useState({name:"", category:"Misal", price:""});
  const [search, setSearch] = useState("");
  const [table, setTable] = useState("—");
  const [showTableOrderModal, setShowTableOrderModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [clockNow, setClockNow] = useState(Date.now());
  const [tableNames, setTableNames] = useState(["A1","A2","A3","A4","A5","B1","B2","B3","B4","B5","C1","C2","C3"]);
  const [dbReady, setDbReady] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [newTableName, setNewTableName] = useState("");
  const [restaurant, setRestaurant] = useState({name:"MORYA MISAL", address:"", phone:"", footer:"Thank you for visiting!"});
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [payment, setPayment] = useState("Cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [historyEditing, setHistoryEditing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  useEffect(() => { const timer = window.setInterval(() => setClockNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); }).catch(() => setAuthLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => {
    if (!supabase) { setNotice("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."); return; }
    if (authLoading) return;
    if (!session) { setDbReady(false); return; }
    let cancelled = false;
    (async () => {
      const [menuResult, tableResult, settingsResult, billResult, activeResult] = await Promise.all([
        supabase.from("pos_menu_items").select("*").order("id"),
        supabase.from("pos_restaurant_tables").select("name").order("name"),
        supabase.from("pos_restaurant_settings").select("value").eq("key", "receipt").maybeSingle(),
        supabase.from("pos_bills").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("pos_active_orders").select("table_name,items,created_at,updated_at"),
      ]);
      if (cancelled) return;
      const failed = [menuResult.error, tableResult.error, settingsResult.error, billResult.error, activeResult.error].find(Boolean);
      if (failed) { setNotice("Database setup is incomplete. Run supabase/pos-workflow.sql in the Supabase SQL Editor, then reload this page. Details: " + failed.message); return; }
      if (menuResult.data?.length) setMenuItems(menuResult.data.map((p: any) => ({ id: Number(p.id), name: p.name, category: p.category, price: Number(p.price) })));
      else await supabase.from("pos_menu_items").upsert(initialMenu.map(p => ({ ...p, is_favorite: false })), { onConflict: "id" });
      if (menuResult.data?.length) setFavoriteIds(menuResult.data.filter((p: any) => p.is_favorite).map((p: any) => Number(p.id)));
      if (tableResult.data?.length) setTableNames(tableResult.data.map((t: any) => t.name).filter((name: string) => !/^parcel\s*\d*$/i.test(name.trim())));
      if (settingsResult.data?.value) setRestaurant({ name: settingsResult.data.value.name ?? "MORYA MISAL", address: settingsResult.data.value.address ?? "", phone: settingsResult.data.value.phone ?? "", footer: settingsResult.data.value.footer ?? "Thank you for visiting!" });
      if (billResult.data) setBills(billResult.data.map((b: any) => ({ id: b.id, date: new Date(b.created_at).toLocaleString("en-IN"), createdAt: b.created_at, items: b.items as CartItem[], total: Number(b.total), payment: b.payment ?? "Not recorded", status: b.status ?? "Saved", table: b.table_name })));
      if (activeResult.data) setActiveOrders(activeResult.data.map((o: any) => ({ table_name: o.table_name, items: (o.items ?? []) as CartItem[], created_at: o.created_at ?? o.updated_at ?? new Date().toISOString() })));
      setDbReady(true);
    })().catch(error => { if (!cancelled) setNotice("Unable to load saved data from Supabase: " + (error?.message ?? "Unknown error")); });
    return () => { cancelled = true; };
  }, [supabase, session, authLoading]);
  useEffect(() => {
    if (!supabase || !dbReady || draftLoading || table === "—") return;
    const timer = window.setTimeout(async () => {
      const result = cart.length
        ? await supabase.from("pos_active_orders").upsert({ table_name: table, items: cart, created_at: activeOrders.find(o => o.table_name === table)?.created_at ?? bills.find(b => b.table === table && b.status.toLowerCase() !== "paid" && b.status.toLowerCase() !== "cancelled" && b.status.toLowerCase() !== "saved")?.createdAt ?? new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "table_name" })
        : await supabase.from("pos_active_orders").delete().eq("table_name", table);
      if (result.error) setNotice("Could not save the draft for table " + table + ": " + result.error.message);
      else if (cart.length) setActiveOrders(old => { const found = old.find(o => o.table_name === table); return [...old.filter(o => o.table_name !== table), { table_name: table, items: cart.map(i => ({ ...i })), created_at: found?.created_at ?? new Date().toISOString() }]; });
      else setActiveOrders(old => old.filter(o => o.table_name !== table));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [cart, table, dbReady, draftLoading, supabase]);
  const selectTable = async (nextTable: string) => {
    if (!nextTable || nextTable === "—") return;
    const loadingStartedAt = Date.now();
    const previousTable = table;
    const previousCart = cart.map(item => ({ ...item }));
    setDraftLoading(true);
    setTable(nextTable);
    setCart([]);
    setEditingBillId(null);
    // Preserve the previous table draft in the background; do not make the new table popup wait for this save.
    if (supabase && previousTable !== "—" && previousCart.length) {
      void supabase.from("pos_active_orders").upsert({ table_name: previousTable, items: previousCart, created_at: activeOrders.find(o => o.table_name === previousTable)?.created_at ?? bills.find(b => b.table === previousTable && b.status.toLowerCase() !== "paid" && b.status.toLowerCase() !== "cancelled" && b.status.toLowerCase() !== "saved")?.createdAt ?? new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "table_name" }).then(({error}) => {
        if (error) setNotice("Could not preserve the order for " + previousTable + ": " + error.message);
        else setActiveOrders(old => { const found = old.find(o => o.table_name === previousTable); return [...old.filter(o => o.table_name !== previousTable), { table_name: previousTable, items: previousCart, created_at: found?.created_at ?? new Date().toISOString() }]; });
      });
    }
    try {
      if (supabase) {
        const { data, error } = await supabase.from("pos_active_orders").select("items").eq("table_name", nextTable).maybeSingle();
        if (error) setNotice("Could not load the draft for " + nextTable + ": " + error.message);
        const draftItems = (data?.items as CartItem[] | undefined) ?? [];
        if (data) { setCart(draftItems); setEditingBillId(null); }
        else { const unpaid = bills.find(b => b.table === nextTable && b.status.toLowerCase() !== "paid" && b.status.toLowerCase() !== "cancelled" && b.status.toLowerCase() !== "saved"); setCart(unpaid?.items.map(i => ({ ...i })) ?? []); setEditingBillId(unpaid?.id ?? null); }
        setActiveOrders(old => data ? [...old.filter(o => o.table_name !== nextTable), { table_name: nextTable, items: draftItems, created_at: old.find(o => o.table_name === nextTable)?.created_at ?? new Date().toISOString() }] : old.filter(o => o.table_name !== nextTable));
      } else { setCart([]); setEditingBillId(null); }
    } finally { window.setTimeout(() => setDraftLoading(false), Math.max(0, 1500 - (Date.now() - loadingStartedAt))); }
  };
  const openTable = (name: string) => {
    // Open immediately for a responsive client-side feel, then hydrate the selected table's draft.
    setTable(name);
    setCart([]);
    setEditingBillId(null);
    setSearch("");
    setCategory("All");
    setFavoritesOnly(favoriteIds.length > 0);
    setShowTableOrderModal(true);
    void selectTable(name);
  };
  const markPaid = async (bill: Bill) => {
    if (!supabase) { setNotice("Supabase is not configured."); return; }
    const paidAt = new Date().toISOString();
    const { error } = await supabase.from("pos_bills").update({ status: "Paid", payment, paid_at: paidAt, updated_at: paidAt }).eq("id", bill.id);
    if (error) { setNotice("Payment was not recorded. The table remains occupied. " + error.message); return; }
    const draftResult = await supabase.from("pos_active_orders").delete().eq("table_name", bill.table);
    if (draftResult.error) setNotice("Payment recorded, but the draft could not be cleared: " + draftResult.error.message);
    setActiveOrders(old => old.filter(o => o.table_name !== bill.table));
    if (table === bill.table) { setCart([]); setEditingBillId(null); setShowTableOrderModal(false); }
    setBills(old => old.map(b => b.id === bill.id ? { ...b, status: "Paid", payment } : b));
    setNotice(`Bill ${bill.id} marked paid. Table ${bill.table} is now available.`);
  };
  const elapsed = (start?: string) => { if (!start) return "00:00:00"; const seconds = Math.max(0, Math.floor((clockNow - new Date(start).getTime()) / 1000)); return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":"); };
  const tableInfo = (name: string) => { const draft = activeOrders.find(o => o.table_name === name && o.items.length > 0); const unpaid = bills.find(b => b.table === name && b.status.toLowerCase() !== "paid" && b.status.toLowerCase() !== "cancelled" && b.status.toLowerCase() !== "saved"); const items = draft?.items ?? unpaid?.items ?? []; const started = draft?.created_at ?? unpaid?.createdAt; return { occupied: items.length > 0, items, total: items.reduce((sum, item) => sum + item.price * item.qty, 0) || unpaid?.total || 0, started }; };
  const filtered = menuItems.filter(p => (!favoritesOnly || favoriteIds.includes(p.id)) && (category === "All" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));
  const salesByItem = useMemo(() => { const totals = new Map<number, { id:number; name:string; category:string; qty:number; revenue:number }>(); bills.filter(b => !["cancelled","void"].includes(b.status.toLowerCase())).forEach(b => b.items.forEach(item => { const current = totals.get(item.id) ?? { id:item.id, name:item.name, category:item.category, qty:0, revenue:0 }; current.qty += Number(item.qty) || 0; current.revenue += (Number(item.qty) || 0) * (Number(item.price) || 0); current.name = item.name; current.category = item.category; totals.set(item.id, current); })); return [...totals.values()].sort((a,b)=>b.qty-a.qty || b.revenue-a.revenue); }, [bills]);
  const salesForMenuItem = (id:number) => salesByItem.find(item=>item.id===id)?.qty ?? 0;
  const bestSellingItem = salesByItem[0];
  const toggleFavorite = (id:number) => { const next = !favoriteIds.includes(id); setFavoriteIds(old => next ? [...old,id] : old.filter(x=>x!==id)); if (supabase) void supabase.from("pos_menu_items").update({ is_favorite: next }).eq("id", id).then(({ error }) => { if (error) setNotice("Could not save favorite: " + error.message); }); };
  const saveMenuItem = (e: any) => { e.preventDefault(); const name = menuForm.name.trim(); const price = Number(menuForm.price); if (!name || !Number.isFinite(price) || price < 0) { setNotice("Enter a valid dish name and price."); return; } if (editingMenuItem !== null) { setMenuItems(old => old.map(p => p.id === editingMenuItem ? { ...p, name, category: menuForm.category, price } : p)); if (supabase) void supabase.from("pos_menu_items").update({ name, category: menuForm.category, price }).eq("id", editingMenuItem).then(({ error }) => { if (error) setNotice("Menu update failed: " + error.message); }); setNotice("Menu item updated."); setEditingMenuItem(null); } else { const newId = Math.max(0, ...menuItems.map(p => p.id)) + 1; setMenuItems(old => [...old, { id: newId, name, category: menuForm.category, price }]); if (supabase) void supabase.from("pos_menu_items").insert({ id: newId, name, category: menuForm.category, price, is_favorite: false }).then(({ error }) => { if (error) setNotice("Menu item save failed: " + error.message); }); setNotice("Menu item added."); setShowAddMenuItem(false); } setMenuForm({ name: "", category: "Misal", price: "" }); };
  const add = (p: Product) => { if (table === "—") { setNotice("Select a table before adding menu items."); return; } setCart(old => { const found = old.find(i => i.id === p.id); return found ? old.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...old, { ...p, qty: 1 }]; }); };
  const changeQty = (id: number, delta: number) => setCart(old => old.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const printReceipt = (bill?: Bill, targetWindow?: Window | null) => {
    const items = bill?.items ?? cart;
    if (!items.length) { setNotice("Add items before printing."); targetWindow?.close(); return; }
    const billId = bill?.id ?? editingBillId ?? "DRAFT";
    const billDate = bill?.date ?? new Date().toLocaleString("en-IN");
    const billTotal = bill?.total ?? total;
    const billTable = bill?.table ?? table;
    const serialNo = Math.max(1, bills.length + (bill ? 0 : 1));
    const safe = (value: string) => value.replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch] ?? ch));
    const rows = items.map(item => `<tr><td class="item">${safe(item.name)}</td><td class="qty">${item.qty}</td><td class="rate">${money(item.price)}</td><td class="amount">${money(item.price * item.qty)}</td></tr>`).join("");
    const receipt = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(billId)} - Morya Misal</title><style>@page{size:80mm auto;margin:3mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111}body{font:11px "Courier New",monospace;width:74mm;max-width:100%;margin:0 auto}.receipt{padding:1mm 0 3mm;text-align:center}h1{font:700 18px "Courier New",monospace;margin:0 0 4px;letter-spacing:.2px}.sub{margin:2px 0;font-size:11px}.rule{border-top:1px dashed #222;margin:7px 0}.meta{text-align:left;line-height:1.55;font-size:10px}.meta-row{display:flex;justify-content:space-between;gap:5px}.items{width:100%;border-collapse:collapse;text-align:left;table-layout:fixed;font-size:10px}.items th{font-weight:700;border-bottom:1px dashed #222;padding:4px 0}.items td{padding:5px 0;vertical-align:top;overflow-wrap:anywhere}.items .item{width:43%}.items .qty{width:12%;text-align:right;padding-right:3px}.items .rate{width:20%;text-align:right;padding-right:3px}.items .amount{width:25%;text-align:right;white-space:nowrap}.net{display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:700;margin-top:5px}.thanks{font-weight:700;margin:10px 0 0;font-size:11px}@media screen{body{margin:12px auto;padding:10px;border:1px solid #ddd;min-height:120px}}</style></head><body><div class="receipt"><h1>${safe(restaurant.name || "MORYA MISAL")}</h1>${restaurant.address ? `<p class="sub">${safe(restaurant.address)}</p>` : ""}${restaurant.phone ? `<p class="sub">CONTACT NO.: ${safe(restaurant.phone)}</p>` : ""}<div class="rule"></div><p class="sub">DINE-IN · TABLE NO.: ${safe(billTable)}</p><div class="rule"></div><div class="meta"><div class="meta-row"><span>SERIAL NO. ${serialNo}</span><span>${safe(billDate)}</span></div><div>BILL NO. ${safe(billId)}</div></div><div class="rule"></div><table class="items"><thead><tr><th class="item">ITEM_NAME</th><th class="qty">QTY</th><th class="rate">RATE</th><th class="amount">TOTAL</th></tr></thead><tbody>${rows}</tbody></table><div class="rule"></div><div class="net"><span>NET</span><span>${money(billTotal)}</span></div><div class="rule"></div><p class="thanks">${safe(restaurant.footer || "THANK YOU! VISIT AGAIN !!")}</p></div><script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();</script></body></html>`;
    const win = targetWindow ?? window.open("", "_blank", "width=420,height=720");
    if (!win) { setNotice("The receipt window was blocked. Allow pop-ups for this site, then try Print again."); return; }
    win.document.open(); win.document.write(receipt); win.document.close();
  };
  const saveBill = async (printAfterSave = false) => {
    const printWindow = printAfterSave ? window.open("", "_blank", "width=420,height=720") : null;
    if (!table || table === "—") { printWindow?.close(); setNotice("Select a table before saving the order."); return; }
    if (!cart.length) { printWindow?.close(); setNotice("Add at least one item before saving a bill."); return; }
    if (!supabase) { printWindow?.close(); setNotice("Supabase is not configured. Set the Vercel environment variables before saving bills."); return; }
    if (savingRef.current) { printWindow?.close(); return; }
    savingRef.current = true;
    setSaving(true);
    const now = new Date().toISOString();
    const billId = editingBillId ?? ("MB-" + Date.now().toString().slice(-7));
    const payload = { id: billId, table_name: table, items: cart, subtotal: total, discount: 0, total, payment, status: "Paid", paid_at: now, updated_at: now, ...(editingBillId ? {} : { created_at: now }) };
    const { error } = await supabase.from("pos_bills").upsert(payload, { onConflict: "id" });
    if (error) { printWindow?.close(); setNotice("Order was not saved. Please try again. " + error.message); savingRef.current = false; setSaving(false); return; }
    const draftDelete = await supabase.from("pos_active_orders").delete().eq("table_name", table);
    const originalBill = editingBillId ? bills.find(b => b.id === editingBillId) : undefined;
    const saved: Bill = { id: billId, date: originalBill?.date ?? new Date(now).toLocaleString("en-IN"), createdAt: originalBill?.createdAt ?? now, items: cart.map(i => ({ ...i })), total, payment, status: "Paid", table };
    setBills(old => editingBillId ? old.map(b => b.id === billId ? saved : b) : [saved, ...old]);
    setCart([]); setEditingBillId(null); setShowCheckout(false); setShowMobileCart(false); setShowTableOrderModal(false); setHistoryEditing(false); setActiveOrders(old => old.filter(o => o.table_name !== table));
    setNotice(draftDelete.error ? "Bill saved, but its draft could not be cleared: " + draftDelete.error.message : "Bill " + billId + " saved. Table " + table + " is now available.");
    if (printAfterSave && printWindow) printReceipt(saved, printWindow);
    savingRef.current = false;
    setSaving(false);
  };
  const startEdit = (b: Bill) => {
    setEditingBillId(b.id); setTable(b.table); setCart(b.items.map(i=>({...i}))); setPayment(b.payment === "Not recorded" ? "Cash" : b.payment); setHistoryEditing(true); setShowTableOrderModal(true); setNotice("");
  };
    const nav = [{name:"Billing",icon:LayoutDashboard},{name:"Menu",icon:UtensilsCrossed},{name:"Bill History",icon:ClipboardList},{name:"Reports",icon:BarChart3},{name:"Settings",icon:Settings}];
  if (authLoading) return <main className={dark ? "app dark auth-screen" : "app light auth-screen"}><section className="auth-card"><div className="brand-mark"><UtensilsCrossed size={24}/></div><h1>MoryaBilling</h1><p>Checking secure sign-in…</p></section></main>;
  if (!supabase) return <main className={dark ? "app dark auth-screen" : "app light auth-screen"}><section className="auth-card"><div className="brand-mark"><UtensilsCrossed size={24}/></div><h1>MoryaBilling</h1><p>Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel to continue.</p></section></main>;
  if (!session) return <main className={dark ? "app dark auth-screen" : "app light auth-screen"}><form className="auth-card" onSubmit={async e=>{e.preventDefault();setAuthError("");const {error}=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});if(error)setAuthError(error.message);}}><div className="brand-mark"><UtensilsCrossed size={24}/></div><h1>Morya<span className="orange">Billing</span></h1><p>Sign in to manage restaurant bills and saved orders.</p>{authError && <div className="notice">{authError}</div>}<label>Email address<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} autoComplete="username" required/></label><label>Password<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} autoComplete="current-password" required/></label><button className="checkout-btn" type="submit">Sign in <span>→</span></button><small>Create the owner account in Supabase Authentication first. Public sign-ups are not enabled here.</small></form></main>;
  return <main className={dark ? "app dark" : "app light"}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><UtensilsCrossed size={22}/></div><div><strong>Morya<span>Billing</span></strong><small>RESTAURANT POS</small></div></div>
      <div className="branch-label">WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.name} className={active === n.name ? "nav-item active" : "nav-item"} onClick={() => {setActive(n.name);setNotice("");}}><n.icon size={18}/><span>{n.name}</span>{n.name==="Bill History" && bills.length>0 && <em>{bills.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="status-dot"/> <span>POS ready</span><span className="version">v0.1</span></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><div><div className="eyebrow">MORYA MISAL · WORKSPACE</div><h1>{active === "Billing" ? "Create a bill" : active}</h1></div><div className="top-actions"><InstallButton/><span className="today"><Clock3 size={15}/>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span><button className="icon-btn" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="avatar">M</div></div></header>
      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}
      {active === "Billing" && <section className="tables-dashboard">
        <div className="section-title"><div><h2>Table dashboard</h2><p>Open any table to create or continue its dine-in order.</p></div><span className="count-pill">{tableNames.length} tables</span></div>
        <div className="table-status-legend"><span><i className="available-dot"/> Available</span><span><i className="occupied-dot"/> Occupied</span><span><i className="paid-dot"/> Bill paid</span></div>
        <div className="table-card-grid">{tableNames.map(name => { const info = tableInfo(name); const lastBill = bills.find(b => b.table === name); const isPaid = !info.occupied && lastBill?.status === "Paid"; return <button type="button" key={name} className={`table-dashboard-card ${info.occupied ? "table-occupied" : isPaid ? "table-paid" : "table-available"}`} onClick={() => void openTable(name)}>
          <div className="table-card-top"><strong>{name}</strong><span className={info.occupied ? "table-state occupied-state" : isPaid ? "table-state paid-state" : "table-state available-state"}>{info.occupied ? "Occupied" : isPaid ? "Bill paid" : "Available"}</span></div>
          <div className="table-card-total">{info.occupied ? money(info.total) : "Ready for guests"}</div>
          <div className="table-card-bottom"><span>{info.occupied ? info.items.reduce((sum,item)=>sum+item.qty,0)+" items" : isPaid ? "Last bill paid" : "No active order"}</span>{info.occupied && <span className="table-elapsed"><Clock3 size={13}/>{elapsed(info.started)}</span>}</div>
          <span className="table-card-action">{info.occupied ? "Continue order →" : "Open table →"}</span>
        </button>; })}</div>
      </section>}
      {(active === "Billing" || historyEditing) && showTableOrderModal && <div className="table-order-backdrop" onClick={() => setShowTableOrderModal(false)}><section className="table-order-modal" onClick={e => e.stopPropagation()}>
        <header className="table-order-header"><div><span className="eyebrow">DINE-IN ORDER</span><h2>Table {table}</h2><p>{tableInfo(table).occupied ? "Occupied · " + elapsed(tableInfo(table).started) : "New table order"} · {cart.reduce((s,i)=>s+i.qty,0)} items</p></div><div className="table-order-header-actions">{cart.length>0 && <button className="primary-small mobile-preview-action" onClick={()=>setShowCheckout(true)}>Order preview · {money(total)}</button>}<button className="icon-btn" onClick={() => {setShowTableOrderModal(false);setHistoryEditing(false);}} aria-label="Close table order"><X size={19}/></button></div></header>
        {draftLoading && <div className="table-draft-loading" role="status"><span className="culinary-loader" aria-hidden="true"><UtensilsCrossed size={34} strokeWidth={2.2}/><span className="culinary-loader-orbit"/></span><strong>Preparing Table {table}…</strong><small>Getting your order ready</small></div>}<div className={"billing-layout table-order-layout"+(draftLoading?" is-loading-draft":"")}>
          <div className="menu-area">
            <div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search menu items…"/>{search && <button onClick={()=>setSearch("")}><X size={15}/></button>}<kbd>⌕</kbd></div>
            <div className="categories"><button onClick={()=>setFavoritesOnly(v=>!v)} className={favoritesOnly?"category favorite-category active-category":"category favorite-category"}><Star size={15} fill={favoritesOnly?"currentColor":"none"}/> Favorites ({favoriteIds.length})</button>{categories.map(c=><button key={c} onClick={()=>{setCategory(c);setFavoritesOnly(false);}} className={!favoritesOnly&&category===c?"category active-category":"category"}>{c}</button>)}</div>
            <div className="menu-grid">{filtered.map(p=><div key={p.id} className="menu-card-wrap"><span className={"favorite-star"+(favoriteIds.includes(p.id)?" is-favorite":"")} aria-hidden="true"><Star size={18} fill={favoriteIds.includes(p.id)?"currentColor":"none"}/></span><button className="menu-card" onClick={()=>add(p)}><span className="menu-card-top"><span className="item-icon"><UtensilsCrossed size={17}/></span>{cart.find(i=>i.id===p.id) ? <span className="added-qty">{cart.find(i=>i.id===p.id)?.qty} added</span> : <Plus size={16} className="add-icon"/>}</span><strong>{p.name}</strong><small>{p.category}</small><b>{money(p.price)}</b></button>{cart.some(i=>i.id===p.id) && <div className="menu-qty-control"><button type="button" aria-label={"Decrease "+p.name} onClick={()=>changeQty(p.id,-1)}>−</button><span>{cart.find(i=>i.id===p.id)?.qty}</span><button type="button" aria-label={"Increase "+p.name} onClick={()=>changeQty(p.id,1)}>+</button></div>}</div>)}</div>
            {filtered.length===0 && <div className="empty"><Search size={26}/><strong>No menu items found</strong><span>Try another search or category.</span></div>}
          </div>
          <aside className="cart-panel">
            <div className="cart-head"><div><span className="eyebrow">TABLE {table}</span><h2>Order summary</h2></div><button className="clear-btn" onClick={()=>setCart([])} disabled={!cart.length}>Clear</button></div>
            <div className="cart-items">{cart.length===0 ? <div className="cart-empty"><div className="empty-receipt"><ReceiptText size={27}/></div><strong>Your order is empty</strong><span>Tap a menu item to add it here.</span></div> : cart.map(item=><div className="cart-row" key={item.id}><div className="cart-item-info"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)} aria-label="Decrease quantity">−</button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)} aria-label="Increase quantity">+</button></div></div><b>{money(item.price*item.qty)}</b></div>)}</div>
            <div className="totals"><div><span>Subtotal</span><span>{money(total)}</span></div><div><span>Discount</span><span>—</span></div><div className="grand-total"><strong>Total payable</strong><strong>{money(total)}</strong></div></div>
            <button className="checkout-btn" disabled={!cart.length} onClick={()=>setShowCheckout(true)}>{editingBillId ? "Preview bill changes" : "Preview order"} <span>→</span></button><button className="print-btn" disabled={!cart.length} onClick={()=>printReceipt()}><Printer size={16}/> Print bill</button>
            <p className="cart-footnote">Dine-in only · Prices in INR · Taxes not applied</p>
          </aside>
        </div>
      </section></div>}
      {active === "Bill History" && <section className="content-card"><div className="section-title"><div><h2>Bill history</h2><p>Saved bills are recorded as paid.</p></div><span className="count-pill">{bills.length} bills</span></div>{bills.length===0?<div className="empty"><ReceiptText size={28}/><strong>No bills yet</strong><span>Saved bills will appear here.</span><button className="primary-small" onClick={()=>setActive("Billing")}>Create first bill</button></div>:<div className="table-wrap"><table><thead><tr><th>Bill number</th><th>Date & time</th><th>Table</th><th>Payment</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead><tbody>{bills.map(b=><tr key={b.id}><td><strong>{b.id}</strong></td><td>{b.date}</td><td>{b.table}</td><td>{b.payment}</td><td><span className={b.status === "Paid" ? "paid-pill" : "count-pill"}>{b.status}</span></td><td><strong>{money(b.total)}</strong></td><td><button className="table-action" onClick={()=>startEdit(b)}>View / edit</button><button className="table-action" onClick={()=>printReceipt(b)}><Printer size={13}/> Reprint</button></td></tr>)}</tbody></table></div>}</section>}
      {active === "Reports" && <section className="content-card"><div className="section-title"><div><h2>Reports & daily summary</h2><p>Sales totals and best-selling menu items.</p></div><span className="count-pill">{new Date().toLocaleDateString("en-IN")}</span></div><div className="summary-list">{[["Total sales",money(bills.reduce((s,b)=>s+b.total,0))],["Number of bills",String(bills.length)],["Cash sales",money(bills.filter(b=>b.payment==="Cash").reduce((s,b)=>s+b.total,0))],["UPI sales",money(bills.filter(b=>b.payment==="UPI").reduce((s,b)=>s+b.total,0))],["Other payment",money(bills.filter(b=>b.payment==="Card").reduce((s,b)=>s+b.total,0))]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><div className="best-seller-panel"><div className="best-seller-heading"><div><span className="eyebrow">TOP SELLER</span><h3>Best-selling item</h3></div>{bestSellingItem && <span className="best-seller-badge"><Star size={14} fill="currentColor"/> Best seller</span>}</div>{bestSellingItem ? <div className="best-seller-feature"><div><strong>{bestSellingItem.name}</strong><small>{bestSellingItem.category}</small></div><div className="best-seller-metrics"><strong>{bestSellingItem.qty}</strong><small>units sold</small></div><div className="best-seller-metrics"><strong>{money(bestSellingItem.revenue)}</strong><small>sales revenue</small></div></div> : <p className="best-seller-empty">No saved bill items yet. Sales rankings will appear after bills are saved.</p>}<div className="best-seller-list"><div className="best-seller-list-head"><strong>Item sales ranking</strong><span>Units sold</span></div>{salesByItem.slice(0,10).map((item,index)=><div className="best-seller-row" key={item.id}><span className="best-seller-rank">{index+1}</span><div className="best-seller-name"><strong>{item.name}</strong><small>{item.category}</small></div><div className="best-seller-bar-wrap"><span style={{width:`${Math.max(4,(item.qty/(bestSellingItem?.qty||1))*100)}%`}}/></div><strong className="best-seller-qty">{item.qty}</strong><span className="best-seller-revenue">{money(item.revenue)}</span></div>)}</div></div><div className="report-cards"><button className="report-card" onClick={()=>setNotice("Daily report selected. Persistent Supabase reporting is not connected yet.")}><span>Daily report</span><strong>Today</strong><small>Sales and bill count</small></button><button className="report-card" onClick={()=>setNotice("Monthly report selected. Persistent Supabase reporting is not connected yet.")}><span>Monthly report</span><strong>This month</strong><small>Monthly sales overview</small></button><button className="report-card" onClick={()=>setNotice("Yearly report selected. Persistent Supabase reporting is not connected yet.")}><span>Yearly report</span><strong>This year</strong><small>Yearly sales overview</small></button></div><p className="report-note">Totals currently reflect bills saved in this browser session, not permanent database records.</p></section>}
      {active === "Menu" && <section className="content-card menu-management">
        <div className="section-title"><div><h2>Menu</h2><p>Manage dishes, prices and favourites.</p></div><span className="count-pill">{menuItems.length} items</span></div>
        <div className="menu-add-toolbar"><p>Organised by food type</p><button className="primary-small" type="button" onClick={()=>{setEditingMenuItem(null);setMenuForm({name:"",category:"Misal",price:""});setShowAddMenuItem(true);}}><Plus size={16}/> Add new item</button></div>
        <div className="menu-admin-category-tabs" role="tablist" aria-label="Filter menu by food category">
          <button type="button" role="tab" aria-selected={menuAdminCategory==="Favorites"} className={"menu-admin-category-tab menu-admin-favorites-tab"+(menuAdminCategory==="Favorites"?" active":"")} onClick={()=>setMenuAdminCategory("Favorites")}><Star size={16} fill="currentColor"/> Favorites ({favoriteIds.length})</button>
          <button type="button" role="tab" aria-selected={menuAdminCategory==="All"} className={"menu-admin-category-tab"+(menuAdminCategory==="All"?" active":"")} onClick={()=>setMenuAdminCategory("All")}>All</button>
          {categories.filter(cat=>cat!=="All").map(cat=><button type="button" role="tab" aria-selected={menuAdminCategory===cat} key={cat} className={"menu-admin-category-tab"+(menuAdminCategory===cat?" active":"")} onClick={()=>setMenuAdminCategory(cat)}>{cat}</button>)}
        </div>
        <div className="menu-admin-categories">
          {(() => { const products=menuItems.filter(p => menuAdminCategory==="Favorites" ? favoriteIds.includes(p.id) : menuAdminCategory==="All" ? true : menuAdminCategory==="Pav Bhaji" ? p.category==="Pav Bhaji" || p.name.toLowerCase().includes("pav bhaji") : p.category===menuAdminCategory); return products.length ? <section className="menu-category-section"><header><h3>{menuAdminCategory==="Favorites"?"Favourite items":menuAdminCategory==="All"?"All menu items":menuAdminCategory}</h3><span>{products.length} items</span></header><div className="menu-admin-list">{products.map(p=><article className="menu-admin-row" key={p.id}>
            <div className="menu-admin-icon"><UtensilsCrossed size={19}/></div>
            <div className="menu-admin-info"><strong>{p.name}</strong><span>{p.category}</span><b>{money(p.price)}</b></div>
            <div className="menu-admin-actions"><button type="button" className={"menu-admin-favorite"+(favoriteIds.includes(p.id)?" is-favorite":"")} aria-label={favoriteIds.includes(p.id)?"Remove favorite":"Mark favorite"} onClick={()=>toggleFavorite(p.id)}><Star size={19} fill={favoriteIds.includes(p.id)?"currentColor":"none"}/></button><button type="button" className="menu-admin-edit" onClick={()=>{setShowAddMenuItem(false);setEditingMenuItem(p.id);setMenuForm({name:p.name,category:p.category,price:String(p.price)});}}>Edit</button></div>
            <div className="menu-admin-sales"><strong>{salesForMenuItem(p.id)} sold</strong>{salesForMenuItem(p.id)>0 && salesByItem[0]?.id===p.id && <span className="best-seller-badge"><Star size={10} fill="currentColor"/> Best seller</span>}</div>
          </article>)}</div></section> : <div className="menu-admin-empty">{menuAdminCategory==="Favorites"?"No favourite items yet. Tap a star on any item to add it here.":"No items in this category yet. Add an item and choose this category."}</div>; })()}
        </div>
        {(editingMenuItem !== null || showAddMenuItem) && <div className="menu-editor-backdrop" onClick={()=>{setEditingMenuItem(null);setShowAddMenuItem(false);setMenuForm({name:"",category:"Misal",price:""});}}><section className="menu-editor-modal" onClick={e=>e.stopPropagation()}>
          <header className="menu-editor-modal-head"><div className="menu-editor-modal-icon"><UtensilsCrossed size={21}/></div><div><span className="eyebrow">MENU MANAGEMENT</span><h2>{editingMenuItem!==null?"Edit item":"Add new item"}</h2></div><button type="button" className="icon-btn" onClick={()=>{setEditingMenuItem(null);setShowAddMenuItem(false);setMenuForm({name:"",category:"Misal",price:""});}} aria-label="Close menu form"><X size={18}/></button></header>
          <form className="menu-editor-form" onSubmit={saveMenuItem}>
            <label>Item name<input value={menuForm.name} onChange={e=>setMenuForm({...menuForm,name:e.target.value})} placeholder="Dish name" required/></label>
            <div className="menu-editor-fields"><label>Category<select value={menuForm.category} onChange={e=>setMenuForm({...menuForm,category:e.target.value})}>{categories.filter(x=>x!=="All").map(x=><option key={x}>{x}</option>)}</select></label><label>Rate (₹)<input type="number" min="0" step="0.5" value={menuForm.price} onChange={e=>setMenuForm({...menuForm,price:e.target.value})} placeholder="Price ₹" required/></label></div>
            {editingMenuItem!==null && <button type="button" className={"menu-setting-toggle"+(favoriteIds.includes(editingMenuItem)?" toggle-on":"")} onClick={()=>toggleFavorite(editingMenuItem)}><span className="ios-switch"><i/></span><span><strong>Favourite</strong><small>Show this item first when taking orders</small></span></button>}
            <p className="menu-editor-note">All menu items are vegetarian, so a separate vegetarian switch isn’t needed.</p>
            <button className="menu-save-btn" type="submit">{editingMenuItem!==null?"Save changes":"Add item"}</button>
            <button className="menu-cancel-btn" type="button" onClick={()=>{setEditingMenuItem(null);setShowAddMenuItem(false);setMenuForm({name:"",category:"Misal",price:""});}}>Cancel</button>
            {editingMenuItem !== null && <button className="menu-delete-btn" type="button" onClick={()=>{const item=menuItems.find(x=>x.id===editingMenuItem);if(!item)return;if(!window.confirm("Delete "+item.name+" from the menu?"))return;setMenuItems(old=>old.filter(x=>x.id!==editingMenuItem));if(supabase)void supabase.from("pos_menu_items").delete().eq("id",editingMenuItem).then(({error})=>{if(error)setNotice("Menu delete failed: "+error.message);});setEditingMenuItem(null);setNotice("Menu item deleted.");}}>Delete item</button>}
          </form>
        </section></div>}
      </section>}
      {active === "Settings" && <section className="content-card"><div className="section-title"><div><h2>Settings</h2><p>Configure the billing workspace.</p></div></div><div className="settings-row"><div><strong>Appearance</strong><span>Switch between dark and light themes.</span></div><button className="secondary-btn" onClick={()=>setDark(!dark)}>{dark?<Sun size={16}/>:<Moon size={16}/>} Switch to {dark?"light":"dark"} mode</button></div><div className="settings-row"><div><strong>Currency</strong><span>Indian Rupee (INR)</span></div><span className="count-pill">₹ INR</span></div><div className="table-settings"><div><h3>Bill / receipt details</h3><p>These details will appear on newly printed bills.</p></div><form className="restaurant-settings" onSubmit={e=>{e.preventDefault();if(supabase)void supabase.from("pos_restaurant_settings").upsert({key:"receipt",value:restaurant,updated_at:new Date().toISOString()},{onConflict:"key"}).then(({error})=>setNotice(error?"Could not save receipt settings: "+error.message:"Restaurant bill details saved."));else setNotice("Supabase is not configured.");}}><label>Restaurant name<input value={restaurant.name} onChange={e=>setRestaurant({...restaurant,name:e.target.value})} placeholder="MORYA MISAL" required/></label><label>Address<input value={restaurant.address} onChange={e=>setRestaurant({...restaurant,address:e.target.value})} placeholder="Shop address"/></label><label>Phone number<input value={restaurant.phone} onChange={e=>setRestaurant({...restaurant,phone:e.target.value})} placeholder="Contact number" inputMode="tel"/></label><label>Bill footer message<input value={restaurant.footer} onChange={e=>setRestaurant({...restaurant,footer:e.target.value})} placeholder="Thank you for visiting!"/></label><button className="primary-small" type="submit">Save bill details</button></form></div><div className="table-settings"><div><h3>Table management</h3><p>Add or rename tables for dine-in orders.</p></div><div className="add-table-row"><input value={newTableName} onChange={e=>setNewTableName(e.target.value)} placeholder="e.g. Family Table" aria-label="New table name"/><button className="primary-small" onClick={()=>{const name=newTableName.trim();if(!name){setNotice("Enter a table name first.");return;}if(tableNames.some(t=>t.toLowerCase()===name.toLowerCase())){setNotice("That table name already exists.");return;}setTableNames(old=>[...old,name]);setNewTableName("");if(supabase)void supabase.from("pos_restaurant_tables").insert({name}).then(({error})=>{if(error)setNotice("Table add failed: "+error.message);});setNotice(`${name} added.`);}}>Add table</button></div><div className="table-name-list">{tableNames.map((name,index)=><div key={name}><span>{name}</span><button className="table-action" onClick={()=>{const renamed=window.prompt("Enter the new table name",name)?.trim();if(!renamed)return;if(tableNames.some((t,i)=>i!==index&&t.toLowerCase()===renamed.toLowerCase())){setNotice("That table name already exists.");return;}setTableNames(old=>old.map((t,i)=>i===index?renamed:t));if(table===name)setTable(renamed);if(supabase)void supabase.from("pos_restaurant_tables").update({name:renamed}).eq("name",name).then(({error})=>{if(error)setNotice("Table rename failed: "+error.message);});setNotice("Table name updated.");}}>Rename</button><button className="table-action danger-text" disabled={tableNames.length<=1} onClick={()=>{if(!window.confirm(`Remove ${name} from the table list?`))return;setTableNames(old=>old.filter((_,i)=>i!==index));if(table===name)setTable("—");if(supabase)void supabase.from("pos_restaurant_tables").delete().eq("name",name).then(({error})=>{if(error)setNotice("Table removal failed: "+error.message);});}}>Remove</button></div>)}</div></div></section>}
    </section>
    {/* Global bill preview modal */}
    {showCheckout && <div className="modal-backdrop" onClick={()=>setShowCheckout(false)}><section className="checkout-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCheckout(false)} aria-label="Close preview"><X size={18}/></button><div className="modal-icon"><ReceiptText size={23}/></div><h2>Preview bill</h2><p>Check the items and total, then print or save the bill.</p><div className="order-preview-meta"><span>Table</span><strong>{table}</strong></div><div className="preview-items">{cart.map(item=><div key={item.id}><span>{item.name} × {item.qty}</span><strong>{money(item.price*item.qty)}</strong></div>)}</div><div className="checkout-total"><span>Total payable</span><strong>{money(total)}</strong></div><button className="checkout-btn" disabled={saving} onClick={()=>void saveBill(true)}><Printer size={16}/>{saving ? "Saving bill…" : "Print & save bill"} <span>→</span></button><button className="print-btn" disabled={saving} onClick={()=>void saveBill(false)}>Save bill</button><p className="modal-disclaimer">Saving marks the bill as paid and releases the table for the next order.</p></section></div>}
    {cart.length>0 && <button className="mobile-cart" onClick={()=>{setShowMobileCart(false);setShowCheckout(true);}}><ReceiptText size={17}/>{cart.reduce((s,i)=>s+i.qty,0)} items · {money(total)}<span>Preview bill →</span></button>}
    {showMobileCart && cart.length>0 && <div className="mobile-order-backdrop" onClick={()=>setShowMobileCart(false)}><section className="mobile-order-sheet" onClick={e=>e.stopPropagation()}><div className="mobile-sheet-head"><div><span className="eyebrow">CURRENT ORDER</span><h2>Order summary</h2></div><button className="icon-btn" onClick={()=>setShowMobileCart(false)} aria-label="Close order"><X size={18}/></button></div><div className="mobile-sheet-items">{cart.map(item=><div className="cart-row" key={item.id}><div className="cart-item-info"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)}>−</button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)}>+</button></div></div><b>{money(item.price*item.qty)}</b></div>)}</div><div className="totals"><div><span>Subtotal</span><span>{money(total)}</span></div><div className="grand-total"><strong>Total payable</strong><strong>{money(total)}</strong></div></div><button className="checkout-btn" onClick={()=>{setShowMobileCart(false);setShowCheckout(true);}}>Proceed to payment <span>→</span></button><button className="print-btn" onClick={()=>printReceipt()}><Printer size={16}/> Print receipt</button></section></div>}
  </main>;
}
