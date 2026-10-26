"use client";

import { useMemo, useState } from "react";
import { BarChart3, ClipboardList, Clock3, LayoutDashboard, Moon, Plus, Printer, Search, Settings, Sun, UtensilsCrossed, X, ReceiptText, CalendarDays } from "lucide-react";
import InstallButton from "./install-button";

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
  const [menuItems, setMenuItems] = useState<Product[]>(initialMenu);
  const [editingMenuItem, setEditingMenuItem] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState({name:"", category:"Misal", price:""});
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("Parcel");
  const [table, setTable] = useState("—");
  const [tableNames, setTableNames] = useState(["A1","A2","A3","A4","A5","B1","B2","B3","B4","B5","Parcel"]);
  const [newTableName, setNewTableName] = useState("");
  const [restaurant, setRestaurant] = useState({name:"MORYA MISAL", address:"", phone:"", footer:"Thank you for visiting!"});
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [payment, setPayment] = useState("Cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState("");
  const [bills, setBills] = useState<{id:string;date:string;items:CartItem[];total:number;payment:string;status:string}[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const filtered = menuItems.filter(p => (category === "All" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));
  const add = (p: Product) => setCart(old => { const found = old.find(i => i.id === p.id); return found ? old.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...old, { ...p, qty: 1 }]; });
  const changeQty = (id: number, delta: number) => setCart(old => old.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const printReceipt = (bill?: {id:string;date:string;items:CartItem[];total:number;payment:string;status:string}) => {
    const items = bill?.items ?? cart;
    if (!items.length) { setNotice("Add items before printing."); return; }
    const billId = bill?.id ?? editingBillId ?? "DRAFT";
    const billDate = bill?.date ?? new Date().toLocaleString("en-IN");
    const billTotal = bill?.total ?? total;
    const billPayment = bill?.payment ?? payment;
    const safe = (s: string) => s.replace(/[&<>"\']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#39;"}[ch] ?? ch));
    const rows = items.map(item => `<tr><td>${safe(item.name)}<small>${money(item.price)} × ${item.qty}</small></td><td class="num">${money(item.price * item.qty)}</td></tr>`).join("");
    const receipt = `<!doctype html><html><head><meta charset="utf-8"><title>${safe(billId)} - Morya Misal</title><style>@page{size:80mm auto;margin:4mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#111;width:100%;margin:0}.receipt{text-align:center}h1{font-size:20px;margin:0 0 4px}p{margin:3px 0}.rule{border-top:1px dashed #333;margin:9px 0}table{width:100%;border-collapse:collapse;text-align:left}td{padding:5px 0;vertical-align:top}td.num{text-align:right;white-space:nowrap}small{display:block;color:#444;font-size:10px;margin-top:2px}.total{font-size:16px;font-weight:bold;display:flex;justify-content:space-between;margin-top:8px}.meta{text-align:left;line-height:1.6;font-size:11px}.thanks{margin-top:14px;font-weight:bold}@media screen{body{max-width:320px;margin:20px auto;padding:12px;border:1px solid #ddd}}</style></head><body><div class="receipt"><h1>${safe(restaurant.name || "MORYA MISAL")}</h1>${restaurant.address ? `<p>${safe(restaurant.address)}</p>` : ""}${restaurant.phone ? `<p>Ph: ${safe(restaurant.phone)}</p>` : ""}<p>${safe(restaurant.footer || "Thank you for visiting!")}</p><div class="rule"></div><div class="meta"><div>Bill: ${safe(billId)}</div><div>Date: ${safe(billDate)}</div><div>Order: ${orderType === "Dine-in" ? safe(table) : "Parcel"}</div><div>Payment: ${safe(billPayment)}</div></div><div class="rule"></div><table>${rows}</table><div class="rule"></div><div class="total"><span>TOTAL</span><span>${money(billTotal)}</span></div><p class="thanks">धन्यवाद! पुन्हा भेट द्या.</p></div><script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();</script></body></html>`;
    const win = window.open("", "_blank", "width=420,height=720");
    if (!win) { setNotice("The receipt window was blocked. Allow pop-ups for this site, then try Print again."); return; }
    win.document.open(); win.document.write(receipt); win.document.close();
  };
  const saveBill = () => {
    if (!cart.length) { setNotice("Add at least one item before saving a bill."); return; }
    if (editingBillId) {
      setBills(old => old.map(b => b.id === editingBillId ? {...b, items:cart, total, payment, date:new Date().toLocaleString("en-IN")} : b));
      setNotice(`Bill ${editingBillId} updated in this browser session. Supabase persistence is not connected yet.`);
    } else {
      const bill = { id: "MB-" + Date.now().toString().slice(-7), date: new Date().toLocaleString("en-IN"), items: cart, total, payment, status: "Paid" };
      setBills(old => [bill, ...old]);
      setNotice("Bill saved in this browser session. Supabase persistence is not connected yet.");
    }
    setCart([]); setEditingBillId(null); setShowCheckout(false); setShowMobileCart(false); setActive("Bill History");
  };
  const startEdit = (b: {id:string;items:CartItem[];payment:string}) => {
    setEditingBillId(b.id); setCart(b.items.map(i=>({...i}))); setPayment(b.payment); setActive("Billing"); setNotice(`Editing ${b.id}. Confirm and save to update this session\'s bill record.`);
  };
    const nav = [{name:"Billing",icon:LayoutDashboard},{name:"Bill History",icon:ClipboardList},{name:"Reports",icon:BarChart3},{name:"Menu",icon:UtensilsCrossed},{name:"Settings",icon:Settings}];
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
          <button className="checkout-btn" disabled={!cart.length} onClick={()=>setShowCheckout(true)}>{editingBillId ? "Preview bill changes" : "Preview order"} <span>→</span></button><button className="print-btn" disabled={!cart.length} onClick={()=>printReceipt()}><Printer size={16}/> Print receipt</button>
          <p className="cart-footnote">Prices shown in INR · Taxes not applied</p>
        </aside>
      </div>}
      {active === "Bill History" && <section className="content-card"><div className="section-title"><div><h2>Bill history</h2><p>Find and reprint bills created in this session.</p></div><span className="count-pill">{bills.length} bills</span></div>{bills.length===0?<div className="empty"><ReceiptText size={28}/><strong>No bills yet</strong><span>Saved bills will appear here.</span><button className="primary-small" onClick={()=>setActive("Billing")}>Create first bill</button></div>:<div className="table-wrap"><table><thead><tr><th>Bill number</th><th>Date & time</th><th>Payment</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead><tbody>{bills.map(b=><tr key={b.id}><td><strong>{b.id}</strong></td><td>{b.date}</td><td>{b.payment}</td><td><span className="paid-pill">{b.status}</span></td><td><strong>{money(b.total)}</strong></td><td><button className="table-action" onClick={()=>startEdit(b)}>View / edit</button><button className="table-action" onClick={()=>printReceipt(b)}><Printer size={13}/> Reprint</button></td></tr>)}</tbody></table></div>}</section>}
      {active === "Reports" && <section className="content-card"><div className="section-title"><div><h2>Reports & daily summary</h2><p>Daily totals and report periods in one place.</p></div><span className="count-pill">{new Date().toLocaleDateString("en-IN")}</span></div><div className="summary-list">{[["Total sales",money(bills.reduce((s,b)=>s+b.total,0))],["Number of bills",String(bills.length)],["Cash sales",money(bills.filter(b=>b.payment==="Cash").reduce((s,b)=>s+b.total,0))],["UPI sales",money(bills.filter(b=>b.payment==="UPI").reduce((s,b)=>s+b.total,0))],["Other payment",money(bills.filter(b=>b.payment==="Card").reduce((s,b)=>s+b.total,0))]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><div className="report-cards"><button className="report-card" onClick={()=>setNotice("Daily report selected. Persistent Supabase reporting is not connected yet.")}><span>Daily report</span><strong>Today</strong><small>Sales and bill count</small></button><button className="report-card" onClick={()=>setNotice("Monthly report selected. Persistent Supabase reporting is not connected yet.")}><span>Monthly report</span><strong>This month</strong><small>Monthly sales overview</small></button><button className="report-card" onClick={()=>setNotice("Yearly report selected. Persistent Supabase reporting is not connected yet.")}><span>Yearly report</span><strong>This year</strong><small>Yearly sales overview</small></button></div><p className="report-note">Totals currently reflect bills saved in this browser session, not permanent database records.</p></section>}
      {active === "Menu" && <section className="content-card"><div className="section-title"><div><h2>Menu management</h2><p>Add or edit dishes and prices.</p></div><span className="count-pill">{menuItems.length} items</span></div><form className="menu-editor" onSubmit={e=>{e.preventDefault();const name=menuForm.name.trim();const price=Number(menuForm.price);if(!name||!Number.isFinite(price)||price<0){setNotice("Enter a valid dish name and price.");return;}if(editingMenuItem!==null){setMenuItems(old=>old.map(p=>p.id===editingMenuItem?{...p,name,category:menuForm.category,price}:p));setNotice("Menu item updated for this session.");}else{setMenuItems(old=>[...old,{id:Math.max(0,...old.map(p=>p.id))+1,name,category:menuForm.category,price}]);setNotice("Menu item added for this session.");}setMenuForm({name:"",category:"Misal",price:""});setEditingMenuItem(null);}}><input value={menuForm.name} onChange={e=>setMenuForm({...menuForm,name:e.target.value})} placeholder="Dish name" aria-label="Dish name" required/><select value={menuForm.category} onChange={e=>setMenuForm({...menuForm,category:e.target.value})} aria-label="Category">{categories.filter(x=>x!=="All").map(x=><option key={x}>{x}</option>)}</select><input type="number" min="0" step="0.5" value={menuForm.price} onChange={e=>setMenuForm({...menuForm,price:e.target.value})} placeholder="Price ₹" aria-label="Price" required/><button className="primary-small" type="submit">{editingMenuItem!==null?"Update item":"Add item"}</button>{editingMenuItem!==null&&<button type="button" className="secondary-btn" onClick={()=>{setEditingMenuItem(null);setMenuForm({name:"",category:"Misal",price:""});}}>Cancel</button>}</form><div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead><tbody>{menuItems.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{money(p.price)}</td><td><button className="table-action" onClick={()=>{setEditingMenuItem(p.id);setMenuForm({name:p.name,category:p.category,price:String(p.price)});}}>Edit</button><button className="table-action danger-text" onClick={()=>{if(window.confirm("Remove "+p.name+" from the menu?"))setMenuItems(old=>old.filter(item=>item.id!==p.id));}}>Delete</button></td></tr>)}</tbody></table></div><p className="report-note">Changes currently stay in this browser session; Supabase menu storage is not connected yet.</p></section>}
      {active === "Settings" && <section className="content-card"><div className="section-title"><div><h2>Settings</h2><p>Configure the billing workspace.</p></div></div><div className="settings-row"><div><strong>Appearance</strong><span>Switch between dark and light themes.</span></div><button className="secondary-btn" onClick={()=>setDark(!dark)}>{dark?<Sun size={16}/>:<Moon size={16}/>} Switch to {dark?"light":"dark"} mode</button></div><div className="settings-row"><div><strong>Currency</strong><span>Indian Rupee (INR)</span></div><span className="count-pill">₹ INR</span></div><div className="table-settings"><div><h3>Bill / receipt details</h3><p>These details will appear on newly printed bills.</p></div><form className="restaurant-settings" onSubmit={e=>{e.preventDefault();setNotice("Restaurant bill details updated for this browser session.");}}><label>Restaurant name<input value={restaurant.name} onChange={e=>setRestaurant({...restaurant,name:e.target.value})} placeholder="MORYA MISAL" required/></label><label>Address<input value={restaurant.address} onChange={e=>setRestaurant({...restaurant,address:e.target.value})} placeholder="Shop address"/></label><label>Phone number<input value={restaurant.phone} onChange={e=>setRestaurant({...restaurant,phone:e.target.value})} placeholder="Contact number" inputMode="tel"/></label><label>Bill footer message<input value={restaurant.footer} onChange={e=>setRestaurant({...restaurant,footer:e.target.value})} placeholder="Thank you for visiting!"/></label><button className="primary-small" type="submit">Save bill details</button></form></div><div className="table-settings"><div><h3>Table management</h3><p>Add or rename tables for dine-in orders.</p></div><div className="add-table-row"><input value={newTableName} onChange={e=>setNewTableName(e.target.value)} placeholder="e.g. Family Table" aria-label="New table name"/><button className="primary-small" onClick={()=>{const name=newTableName.trim();if(!name){setNotice("Enter a table name first.");return;}if(tableNames.some(t=>t.toLowerCase()===name.toLowerCase())){setNotice("That table name already exists.");return;}setTableNames(old=>[...old,name]);setNewTableName("");setNotice(`${name} added to this session.`);}}>Add table</button></div><div className="table-name-list">{tableNames.map((name,index)=><div key={name}><span>{name}</span><button className="table-action" onClick={()=>{const renamed=window.prompt("Enter the new table name",name)?.trim();if(!renamed)return;if(tableNames.some((t,i)=>i!==index&&t.toLowerCase()===renamed.toLowerCase())){setNotice("That table name already exists.");return;}setTableNames(old=>old.map((t,i)=>i===index?renamed:t));if(table===name)setTable(renamed);setNotice("Table name updated for this session.");}}>Rename</button><button className="table-action danger-text" disabled={tableNames.length<=1} onClick={()=>{if(!window.confirm(`Remove ${name} from the table list?`))return;setTableNames(old=>old.filter((_,i)=>i!==index));if(table===name)setTable("—");}}>Remove</button></div>)}</div></div><div className="settings-row"><div><strong>Database connection</strong><span>Supabase has not been configured yet.</span></div><span className="warning-pill">Setup required</span></div><div className="settings-row"><div><strong>Deployment</strong><span>Designed for GitHub and Vercel.</span></div><span className="count-pill">Next.js</span></div><div className="settings-row logout-row"><div><strong>Logout</strong><span>Sign out of the billing account.</span></div><button className="logout-btn" onClick={()=>{if(window.confirm("Do you want to log out?"))setNotice("Account sign-out is not active yet because login/authentication has not been configured.");}}><span>↪</span> Logout</button></div><p className="report-note">Note: bill details and table changes currently last only for this browser session. Login/logout requires authentication setup.</p></section>}
      <footer className="footer"><span>© {new Date().getFullYear()} MoryaBilling</span><span>Made for faster service <span className="orange">●</span></span></footer>
    </section>
    {showCheckout && <div className="modal-backdrop" onClick={()=>setShowCheckout(false)}><section className="checkout-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCheckout(false)}><X size={18}/></button><div className="modal-icon"><ReceiptText size={23}/></div><h2>Preview order</h2><p>Review the table, items, quantities, and total before printing or saving.</p><div className="order-preview-meta"><span>Order type</span><strong>{orderType==="Dine-in" ? "Dine-in · "+table : "Parcel"}</strong></div><div className="preview-items">{cart.map(item=><div key={item.id}><span>{item.name} × {item.qty}</span><strong>{money(item.price*item.qty)}</strong></div>)}</div><div className="checkout-total"><span>Total payable</span><strong>{money(total)}</strong></div><label className="field-label">PAYMENT METHOD</label><div className="payment-options">{["Cash","UPI","Card"].map(p=><button key={p} className={payment===p?"payment-option chosen":"payment-option"} onClick={()=>setPayment(p)}>{p}</button>)}</div><button className="checkout-btn" onClick={saveBill}>Save order <span>→</span></button><button className="print-btn" onClick={()=>printReceipt()}><Printer size={16}/> Print bill</button><p className="modal-disclaimer">Prototype: saved bills currently stay in this browser session. Supabase storage is not connected yet.</p></section></div>}
    {cart.length>0 && <button className="mobile-cart" onClick={()=>setShowMobileCart(!showMobileCart)}><ReceiptText size={17}/>{cart.reduce((s,i)=>s+i.qty,0)} items · {money(total)}<span>{showMobileCart?"Close":"View order"} {showMobileCart?"↓":"↑"}</span></button>}
    {showMobileCart && cart.length>0 && <div className="mobile-order-backdrop" onClick={()=>setShowMobileCart(false)}><section className="mobile-order-sheet" onClick={e=>e.stopPropagation()}><div className="mobile-sheet-head"><div><span className="eyebrow">CURRENT ORDER</span><h2>Order summary</h2></div><button className="icon-btn" onClick={()=>setShowMobileCart(false)} aria-label="Close order"><X size={18}/></button></div><div className="mobile-sheet-items">{cart.map(item=><div className="cart-row" key={item.id}><div className="cart-item-info"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="qty-control"><button onClick={()=>changeQty(item.id,-1)}>−</button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)}>+</button></div></div><b>{money(item.price*item.qty)}</b></div>)}</div><div className="totals"><div><span>Subtotal</span><span>{money(total)}</span></div><div className="grand-total"><strong>Total payable</strong><strong>{money(total)}</strong></div></div><button className="checkout-btn" onClick={()=>{setShowMobileCart(false);setShowCheckout(true);}}>Proceed to payment <span>→</span></button><button className="print-btn" onClick={()=>printReceipt()}><Printer size={16}/> Print receipt</button></section></div>}
  </main>;
}
