"use client";

import { useMemo, useState } from "react";
import { BarChart3, ClipboardList, Clock3, LayoutDashboard, Menu as MenuIcon, Moon, Plus, Printer, Search, Settings, Sun, UtensilsCrossed, X, ReceiptText, CalendarDays } from "lucide-react";

type Product = { id: number; name: string; category: string; price: number };
type CartItem = Product & { qty: number };

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
const categories = ["All", "Misal", "South Indian", "Snacks", "Beverages"];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export default function Home() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState("Billing");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("Parcel");
  const [table, setTable] = useState("—");
  const [tableNames, setTableNames] = useState(Array.from({length:12}, (_, i) => `Table ${i + 1}`));
  const [newTableName, setNewTableName] = useState("");
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [payment, setPayment] = useState("Cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState("");
  const [bills, setBills] = useState<{id:string;date:string;items:CartItem[];total:number;payment:string;status:string}[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const filtered = initialMenu.filter(p => (category === "All" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));
  const add = (p: Product) => setCart(old => { const found = old.find(i => i.id === p.id); return found ? old.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...old, { ...p, qty: 1 }]; });
  const changeQty = (id: number, delta: number) => setCart(old => old.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const saveBill = () => {
    if (!cart.length) { setNotice("Add at least one item before saving a bill."); return; }
    const bill = { id: "MB-" + Date.now().toString().slice(-7), date: new Date().toLocaleString("en-IN"), items: cart, total, payment, status: "Paid" };
    setBills(old => [bill, ...old]); setCart([]); setShowCheckout(false); setShowMobileCart(false); setNotice("Bill saved in this browser session. Connect Supabase to store it permanently.");
    setActive("Bill History");
  };
  const printCart = () => { if (!cart.length) { setNotice("Add items before printing."); return; } window.print(); };
  const nav = [{name:"Billing",icon:LayoutDashboard},{name:"Bill History",icon:ClipboardList},{name:"Reports",icon:BarChart3},{name:"Day Summary",icon:CalendarDays},{name:"Menu Management",icon:UtensilsCrossed},{name:"Settings",icon:Settings}];
  return <main className={dark ? "app dark" : "app light"}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><UtensilsCrossed size={22}/></div><div><strong>Morya<span>Billing</span></strong><small>RESTAURANT POS</small></div></div>
      <div className="branch-label">WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.name} className={active === n.name ? "nav-item active" : "nav-item"} onClick={() => {setActive(n.name);setNotice("");}}><n.icon size={18}/><span>{n.name}</span>{n.name==="Bill History" && bills.length>0 && <em>{bills.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="status-dot"/> <span>POS ready</span><span className="version">v0.1</span></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><div><div className="eyebrow">MORYA MISAL · WORKSPACE</div><h1>{active === "Billing" ? "Create a bill" : active}</h1></div><div className="top-actions"><span className="today"><Clock3 size={15}/>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span><button className="icon-btn" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="avatar">M</div></div></header>
      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}
      {active === "Billing" && <div className="billing-layout">
        <div className="menu-area">
          <div className="order-toolbar"><div className="order-heading"><span className="live-dot"/><strong>{editingBillId ? `Editing ${editingBillId}` : "New order"}</strong><span className="muted">· {cart.reduce((s,i)=>s+i.qty,0)} items</span></div><div className="order-types">{["Dine-in","Parcel"].map(t=><button key={t} className={orderType===t?"type-btn selected":"type-btn"} onClick={()=>setOrderType(t)}>{t}</button>)}</div></div>
          {orderType==="Dine-in" && <div className="table-select"><label>TABLE</label><select value={table} onChange={e=>setTable(e.target.value)}><option>—</option>{tableNames.map(name=><option key={name}>{name}</option>)}</select></div>}
          <div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search menu items…"/>{search && <button onClick={()=>setSearch("")}><X size={15}/></button>}<kbd>⌕</kbd></div>
          <div className="categories">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={category===c?"category active-category":"category"}>{c}</button>)}</div>
          <div className="menu-grid">{filtered.map(p=><button key={p.id} className="menu-card" onClick={()=>add(p)}><span className="menu-card-top"><span className="item-icon"><UtensilsCrossed size={17}/></span><Plus size={16} className="add-icon"/></span><strong>{p.name}</strong><small>{p.category}</small><b>{money(p.price)}</b></button>)}</div>
          {filtered.length===0 && <div className="empty"><Search size={26}/><strong>No menu items found</strong><span>Try another search or category.</span></div>}
        </div>
        <aside className="cart-panel">
          <div className="cart-head"><div><span className="eyebrow">CURRENT ORDER</span><h2>Order summary</h2></div><button className="clear-btn" onClick={()=>setCart([])} disabled={!cart.length}>Clear</button></div>
          <div className="order-meta"><span>{orderType==="Parcel"?"Takeaway order":table==="—"?"Dine-in order":table}</span><span className="order-number">{editingBillId ?? "NEW ORDER"}</span></div>
          <div className="cart-items">{cart.length===0 ? <div className="cart-empty"><div className="empty-receipt"><ReceiptText size={27}/></div><strong>Your order is empty</strong><span>Tap a menu item to add it here.</span></div> : cart.map(item=><div className="cart-row" key={item.id}><div className="cart-item-info"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)} aria-label="Decrease quantity">−</button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)} aria-label="Increase quantity">+</button></div></div><b>{money(item.price*item.qty)}</b></div>)}</div>
          <div className="totals"><div><span>Subtotal</span><span>{money(total)}</span></div><div><span>Discount</span><span>—</span></div><div className="grand-total"><strong>Total payable</strong><strong>{money(total)}</strong></div></div>
          <button className="checkout-btn" disabled={!cart.length} onClick={()=>setShowCheckout(true)}>{editingBillId ? "Update bill" : "Proceed to payment"} <span>→</span></button><button className="print-btn" disabled={!cart.length} onClick={()=>printReceipt()}><Printer size={16}/> Print receipt</button>
          <p className="cart-footnote">Prices shown in INR · Taxes not applied</p>
        </aside>
      </div>}
      {active === "Bill History" && <section className="content-card"><div className="section-title"><div><h2>Bill history</h2><p>Find and reprint bills created in this session.</p></div><span className="count-pill">{bills.length} bills</span></div>{bills.length===0?<div className="empty"><ReceiptText size={28}/><strong>No bills yet</strong><span>Saved bills will appear here.</span><button className="primary-small" onClick={()=>setActive("Billing")}>Create first bill</button></div>:<div className="table-wrap"><table><thead><tr><th>Bill number</th><th>Date & time</th><th>Payment</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead><tbody>{bills.map(b=><tr key={b.id}><td><strong>{b.id}</strong></td><td>{b.date}</td><td>{b.payment}</td><td><span className="paid-pill">{b.status}</span></td><td><strong>{money(b.total)}</strong></td><td><button className="table-action" onClick={()=>startEdit(b)}>View / edit</button><button className="table-action" onClick={()=>printReceipt(b)}><Printer size={13} inline/> Reprint</button></td></tr>)}</tbody></table></div>}</section>}
      {active === "Reports" && <section className="content-card"><div className="section-title"><div><h2>Sales reports</h2><p>Review sales totals and bill activity.</p></div></div><div className="report-cards"><div className="report-card"><span>Today's recorded sales</span><strong>{money(bills.reduce((s,b)=>s+b.total,0))}</strong><small>From bills saved in this session</small></div><div className="report-card"><span>Bills recorded</span><strong>{bills.length}</strong><small>All statuses in this session</small></div><div className="report-card"><span>Average bill value</span><strong>{money(bills.length?bills.reduce((s,b)=>s+b.total,0)/bills.length:0)}</strong><small>Recorded sales ÷ bill count</small></div></div><div className="report-note">Daily, monthly, yearly, item-wise, payment-wise, and date-range reports will use persisted Supabase data after database setup.</div></section>}
      {active === "Day Summary" && <section className="content-card"><div className="section-title"><div><h2>Day summary</h2><p>Cashier-style summary of recorded bills.</p></div><span className="count-pill">{new Date().toLocaleDateString("en-IN")}</span></div><div className="summary-list">{[["Total sales",money(bills.reduce((s,b)=>s+b.total,0))],["Number of bills",String(bills.length)],["Cash sales",money(bills.filter(b=>b.payment==="Cash").reduce((s,b)=>s+b.total,0))],["UPI sales",money(bills.filter(b=>b.payment==="UPI").reduce((s,b)=>s+b.total,0))],["Other payment",money(bills.filter(b=>b.payment==="Card").reduce((s,b)=>s+b.total,0))]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><p className="report-note">This is a session preview, not a verified end-of-day close. Persistent summaries and expense/refund entries require Supabase.</p></section>}
      {active === "Menu Management" && <section className="content-card"><div className="section-title"><div><h2>Menu management</h2><p>Reference menu based on your Morya Misal sample photos.</p></div><span className="count-pill">{initialMenu.length} items</span></div><div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>State</th></tr></thead><tbody>{initialMenu.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{money(p.price)}</td><td><span className="paid-pill">Active · demo</span></td></tr>)}</tbody></table></div><p className="report-note">Prices are editable once the menu management form and Supabase database are connected. Verify all prices against your current printed menu.</p></section>}
      {active === "Settings" && <section className="content-card"><div className="section-title"><div><h2>Settings</h2><p>Configure the billing workspace.</p></div></div><div className="settings-row"><div><strong>Appearance</strong><span>Switch between dark and light themes.</span></div><button className="secondary-btn" onClick={()=>setDark(!dark)}>{dark?<Sun size={16}/>:<Moon size={16}/>} Switch to {dark?"light":"dark"} mode</button></div><div className="settings-row"><div><strong>Currency</strong><span>Indian Rupee (INR)</span></div><span className="count-pill">₹ INR</span></div><div className="table-settings"><div><h3>Table management</h3><p>Add or rename tables for dine-in orders.</p></div><div className="add-table-row"><input value={newTableName} onChange={e=>setNewTableName(e.target.value)} placeholder="e.g. Family Table" aria-label="New table name"/><button className="primary-small" onClick={()=>{const name=newTableName.trim();if(!name){setNotice("Enter a table name first.");return;}if(tableNames.some(t=>t.toLowerCase()===name.toLowerCase())){setNotice("That table name already exists.");return;}setTableNames(old=>[...old,name]);setNewTableName("");setNotice(`${name} added to this session.`);}}>Add table</button></div><div className="table-name-list">{tableNames.map((name,index)=><div key={name}><span>{name}</span><button className="table-action" onClick={()=>{const renamed=window.prompt("Enter the new table name",name)?.trim();if(!renamed)return;if(tableNames.some((t,i)=>i!==index&&t.toLowerCase()===renamed.toLowerCase())){setNotice("That table name already exists.");return;}setTableNames(old=>old.map((t,i)=>i===index?renamed:t));if(table===name)setTable(renamed);setNotice("Table name updated for this session.");}}>Rename</button><button className="table-action danger-text" disabled={tableNames.length<=1} onClick={()=>{if(!window.confirm(`Remove ${name} from the table list?`))return;setTableNames(old=>old.filter((_,i)=>i!==index));if(table===name)setTable("—");}}>Remove</button></div>)}</div></div><div className="settings-row"><div><strong>Database connection</strong><span>Supabase has not been configured yet.</span></div><span className="warning-pill">Setup required</span></div><div className="settings-row"><div><strong>Deployment</strong><span>Designed for GitHub and Vercel.</span></div><span className="count-pill">Next.js</span></div></section>}
      <footer className="footer"><span>© {new Date().getFullYear()} MoryaBilling</span><span>Made for faster service <span className="orange">●</span></span></footer>
    </section>
    {showCheckout && <div className="modal-backdrop" onClick={()=>setShowCheckout(false)}><section className="checkout-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCheckout(false)}><X size={18}/></button><div className="modal-icon"><ReceiptText size={23}/></div><h2>Complete payment</h2><p>Confirm the payment method and save this bill.</p><div className="checkout-total"><span>Total payable</span><strong>{money(total)}</strong></div><label className="field-label">PAYMENT METHOD</label><div className="payment-options">{["Cash","UPI","Card"].map(p=><button key={p} className={payment===p?"payment-option chosen":"payment-option"} onClick={()=>setPayment(p)}>{p}</button>)}</div><button className="checkout-btn" onClick={saveBill}>Confirm & save bill <span>→</span></button><p className="modal-disclaimer">Demo only: bills are stored in memory until you refresh. Supabase setup is the next step.</p></section></div>}
    {cart.length>0 && <button className="mobile-cart" onClick={()=>setShowMobileCart(!showMobileCart)}><ReceiptText size={17}/>{cart.reduce((s,i)=>s+i.qty,0)} items · {money(total)}<span>{showMobileCart?"Close":"View order"} {showMobileCart?"↓":"↑"}</span></button>}
    {showMobileCart && cart.length>0 && <div className="mobile-order-backdrop" onClick={()=>setShowMobileCart(false)}><section className="mobile-order-sheet" onClick={e=>e.stopPropagation()}><div className="mobile-sheet-head"><div><span className="eyebrow">CURRENT ORDER</span><h2>Order summary</h2></div><button className="icon-btn" onClick={()=>setShowMobileCart(false)} aria-label="Close order"><X size={18}/></button></div><div className="mobile-sheet-items">{cart.map(item=><div className="cart-row" key={item.id}><div className="cart-item-info"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)}>−</button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)}>+</button></div></div><b>{money(item.price*item.qty)}</b></div>)}</div><div className="totals"><div><span>Subtotal</span><span>{money(total)}</span></div><div className="grand-total"><strong>Total payable</strong><strong>{money(total)}</strong></div></div><button className="checkout-btn" onClick={()=>{setShowMobileCart(false);setShowCheckout(true);}}>Proceed to payment <span>→</span></button><button className="print-btn" onClick={()=>printReceipt()}><Printer size={16}/> Print receipt</button></section></div>}
  </main>;
}
