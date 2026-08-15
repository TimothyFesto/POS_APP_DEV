import { useState, useEffect, useRef } from "react";
import {
  LayoutGrid, Receipt, History, Settings, Plus, Minus, X, Search,
  DoorOpen, CreditCard, Banknote, Users, Clock, Check, ChevronLeft,
  UtensilsCrossed, ChefHat, Pencil, Trash2, ArrowLeftRight, BedDouble,
  BedSingle, Printer, Calendar, Phone,
} from "lucide-react";

/* ---------------------------------- data ---------------------------------- */

const DEFAULT_SETTINGS = {
  venueName: "G2 Guest House",
  currency: "USh ",
  decimals: 0,
  taxRate: 0,
  serviceRate: 0,
};

const DEFAULT_CATEGORIES = [
  "Snacks", "Hot Drinks", "Cold Drinks", "Chicken Dishes", "Goat Dishes",
  "Fish Dishes", "Beef Dishes", "Pork Dishes", "Vegetarian Dishes",
  "Liver Dishes", "Sides", "Desserts",
];

const DEFAULT_MENU_ITEMS = [
  { id: "m1", name: "Chapati", category: "Snacks", price: 2000, description: "" },
  { id: "m2", name: "Mandazi", category: "Snacks", price: 1000, description: "" },
  { id: "m3", name: "Cake", category: "Snacks", price: 6000, description: "" },
  { id: "m4", name: "Rolex", category: "Snacks", price: 4000, description: "" },
  { id: "m5", name: "Beef Samosa (2 pieces)", category: "Snacks", price: 4000, description: "" },
  { id: "m6", name: "Meat Pie", category: "Snacks", price: 4000, description: "" },
  { id: "m7", name: "Kebab", category: "Snacks", price: 6000, description: "" },
  { id: "m8", name: "Spanish Omelette", category: "Snacks", price: 3000, description: "" },
  { id: "m9", name: "Fried Eggs", category: "Snacks", price: 2000, description: "" },
  { id: "m10", name: "Boiled Eggs", category: "Snacks", price: 2000, description: "" },
  { id: "m11", name: "Toast Bread", category: "Snacks", price: 2000, description: "" },
  { id: "m12", name: "Sausage", category: "Snacks", price: 4000, description: "" },
  { id: "m13", name: "Vegetable Spring Rolls", category: "Snacks", price: 4000, description: "" },
  { id: "m14", name: "Veggie Chapati", category: "Snacks", price: 4000, description: "With onions, carrots, green pepper" },
  { id: "m15", name: "Avocado", category: "Snacks", price: 1200, description: "" },
  { id: "m16", name: "Banana (ripe)", category: "Snacks", price: 800, description: "" },
  { id: "m17", name: "Katogo", category: "Snacks", price: 5000, description: "" },
  { id: "m18", name: "Milk Tea", category: "Hot Drinks", price: 2500, description: "" },
  { id: "m19", name: "Black Tea", category: "Hot Drinks", price: 2000, description: "" },
  { id: "m20", name: "Lemon Tea", category: "Hot Drinks", price: 2000, description: "" },
  { id: "m21", name: "Hot Chocolate", category: "Hot Drinks", price: 4000, description: "" },
  { id: "m22", name: "Dawa Tea", category: "Hot Drinks", price: 6000, description: "" },
  { id: "m23", name: "Black Coffee", category: "Hot Drinks", price: 3500, description: "" },
  { id: "m24", name: "White Coffee", category: "Hot Drinks", price: 4000, description: "" },
  { id: "m25", name: "Porridge", category: "Hot Drinks", price: 2000, description: "" },
  { id: "m26", name: "Bottled Mineral Water 500ml", category: "Cold Drinks", price: 1000, description: "" },
  { id: "m27", name: "Bottled Mineral Water 1.5L", category: "Cold Drinks", price: 2500, description: "" },
  { id: "m28", name: "Soda 300ml (glass bottle)", category: "Cold Drinks", price: 1500, description: "Coke, Fanta, Sprite, Stoney, Novida" },
  { id: "m29", name: "Soda 500ml (glass bottle)", category: "Cold Drinks", price: 2500, description: "Coke, Fanta, Sprite, Stoney, Novida" },
  { id: "m30", name: "Soda 330ml (plastic bottle)", category: "Cold Drinks", price: 1500, description: "Coke, Fanta, Sprite, Stoney" },
  { id: "m31", name: "Soda 500ml (plastic bottle)", category: "Cold Drinks", price: 2500, description: "Coke, Fanta, Sprite, Stoney" },
  { id: "m32", name: "Soda 300ml", category: "Cold Drinks", price: 1500, description: "Pepsi, Mirinda, Mountain Dew" },
  { id: "m33", name: "Soda 1L", category: "Cold Drinks", price: 5500, description: "Pepsi, Mirinda, Mountain Dew" },
  { id: "m34", name: "Minute Maid 400ml", category: "Cold Drinks", price: 2500, description: "" },
  { id: "m35", name: "Minute Maid 1L", category: "Cold Drinks", price: 5500, description: "" },
  { id: "m36", name: "Fresh Fruit Juice", category: "Cold Drinks", price: 5000, description: "" },
  { id: "m37", name: "Chicken Stew & Matoke", category: "Chicken Dishes", price: 14000, description: "Chicken stew served with matoke" },
  { id: "m38", name: "Chicken Stew & Rice", category: "Chicken Dishes", price: 14000, description: "Chicken stew served with rice" },
  { id: "m39", name: "Chicken Stew & Posho/Kalo", category: "Chicken Dishes", price: 14000, description: "Chicken stew served with posho" },
  { id: "m40", name: "Chicken Stew & Chapati", category: "Chicken Dishes", price: 14000, description: "Chicken stew served with chapati" },
  { id: "m41", name: "Chicken Stew & Irish Potato", category: "Chicken Dishes", price: 14000, description: "Chicken stew served with Irish potato" },
  { id: "m42", name: "Chicken & Chips", category: "Chicken Dishes", price: 16000, description: "¼ chicken served with french fries and kachumbari" },
  { id: "m43", name: "Pilau with Fried Chicken", category: "Chicken Dishes", price: 16000, description: "East African-style spiced rice with golden fried chicken" },
  { id: "m44", name: "¼ Chicken (Kienyeji)", category: "Chicken Dishes", price: 12000, description: "" },
  { id: "m45", name: "¼ Chicken", category: "Chicken Dishes", price: 10000, description: "" },
  { id: "m46", name: "Fried Goat Meat with Chips", category: "Goat Dishes", price: 15000, description: "Tender goat pieces served with raw tomato-onion salad & chips" },
  { id: "m47", name: "Goat Stew with Chapati", category: "Goat Dishes", price: 12000, description: "Tender goat pieces stew served with chapati" },
  { id: "m48", name: "Goat Stew with Posho/Kalo", category: "Goat Dishes", price: 12000, description: "Tender goat pieces stew served with posho" },
  { id: "m49", name: "Goat Stew with Rice", category: "Goat Dishes", price: 12000, description: "Tender goat pieces stew served with rice" },
  { id: "m50", name: "Goat Stew with Matoke", category: "Goat Dishes", price: 12000, description: "Tender goat pieces served with fried or mashed matoke" },
  { id: "m51", name: "Goat Stew with Irish Potato", category: "Goat Dishes", price: 12000, description: "Tender goat pieces stew served with Irish potato" },
  { id: "m52", name: "Choma (Goat Meat)", category: "Goat Dishes", price: 15000, description: "1/2 kg goat meat served with kachumbari" },
  { id: "m53", name: "Goat Meat (Plain)", category: "Goat Dishes", price: 10000, description: "Goat meat only" },
  { id: "m54", name: "Fish Stew & Matoke", category: "Fish Dishes", price: 18000, description: "Grilled whole tilapia served with fried or mashed matoke" },
  { id: "m55", name: "Fish Stew & Posho/Kalo", category: "Fish Dishes", price: 18000, description: "Fresh whole tilapia, grilled and served with greens & posho" },
  { id: "m56", name: "Fish & Chips", category: "Fish Dishes", price: 20000, description: "Grilled whole tilapia served with kachumbari and chips" },
  { id: "m57", name: "Fish (Plain)", category: "Fish Dishes", price: 15000, description: "Fish only" },
  { id: "m58", name: "Beef Choma & Chips", category: "Beef Dishes", price: 13000, description: "Beef choma served with chips" },
  { id: "m59", name: "Beef & Matoke", category: "Beef Dishes", price: 10000, description: "Beef stew served with fried or mashed matoke" },
  { id: "m60", name: "Beef & Chapati", category: "Beef Dishes", price: 10000, description: "Beef stew served with chapati" },
  { id: "m61", name: "Beef & Irish Potato", category: "Beef Dishes", price: 10000, description: "Beef stew served with Irish potato" },
  { id: "m62", name: "Beef & Posho/Kalo", category: "Beef Dishes", price: 10000, description: "Beef stew served with posho" },
  { id: "m63", name: "Beef & Rice", category: "Beef Dishes", price: 10000, description: "Beef stew served with rice" },
  { id: "m64", name: "Pilau with Beef", category: "Beef Dishes", price: 12000, description: "East African-style spiced rice with golden fried beef" },
  { id: "m65", name: "Beef (Plain)", category: "Beef Dishes", price: 8000, description: "Beef only" },
  { id: "m66", name: "Pork Ribs", category: "Pork Dishes", price: 16000, description: "Pork ribs served with chips" },
  { id: "m67", name: "Pork & Matoke", category: "Pork Dishes", price: 15000, description: "Pork served with matoke" },
  { id: "m68", name: "Pork & Posho/Kalo", category: "Pork Dishes", price: 15000, description: "Pork served with posho" },
  { id: "m69", name: "Pork & Rice", category: "Pork Dishes", price: 15000, description: "Pork served with rice" },
  { id: "m70", name: "Pork & Chapati", category: "Pork Dishes", price: 14500, description: "Pork served with chapati" },
  { id: "m71", name: "Pork & Irish Potato", category: "Pork Dishes", price: 14000, description: "Pork served with Irish potato" },
  { id: "m72", name: "Pork (Plain)", category: "Pork Dishes", price: 10000, description: "Pork meat only" },
  { id: "m73", name: "Chapati and Beans", category: "Vegetarian Dishes", price: 5500, description: "" },
  { id: "m74", name: "Posho with Local Vegetables", category: "Vegetarian Dishes", price: 5000, description: "Posho served with cabbage, sukuma or kienyeji" },
  { id: "m75", name: "Rice and Peas Stew", category: "Vegetarian Dishes", price: 5000, description: "" },
  { id: "m76", name: "Veggie Rice", category: "Vegetarian Dishes", price: 5000, description: "Rice cooked with peas, tomato, carrots & green pepper" },
  { id: "m77", name: "Chapati and Peas Stew", category: "Vegetarian Dishes", price: 5500, description: "" },
  { id: "m78", name: "Liver & Chapati", category: "Liver Dishes", price: 7000, description: "Liver served with chapati" },
  { id: "m79", name: "Liver & Chips", category: "Liver Dishes", price: 10000, description: "Liver served with chips" },
  { id: "m80", name: "Liver & Matoke", category: "Liver Dishes", price: 8000, description: "Liver served with matoke" },
  { id: "m81", name: "Liver & Posho/Kalo", category: "Liver Dishes", price: 7000, description: "Liver served with posho" },
  { id: "m82", name: "Liver & Rice", category: "Liver Dishes", price: 7000, description: "Liver served with rice" },
  { id: "m83", name: "Liver (Plain)", category: "Liver Dishes", price: 6000, description: "Liver only" },
  { id: "m84", name: "Chips", category: "Sides", price: 6000, description: "" },
  { id: "m85", name: "Rice", category: "Sides", price: 2500, description: "" },
  { id: "m86", name: "Pilau Rice", category: "Sides", price: 4000, description: "" },
  { id: "m87", name: "Beans", category: "Sides", price: 2000, description: "" },
  { id: "m88", name: "Macaroni", category: "Sides", price: 5500, description: "" },
  { id: "m89", name: "Spaghetti", category: "Sides", price: 5500, description: "" },
  { id: "m90", name: "Green Peas", category: "Sides", price: 2000, description: "" },
  { id: "m91", name: "Sukumawiki", category: "Sides", price: 2000, description: "" },
  { id: "m92", name: "Posho/Kalo", category: "Sides", price: 2000, description: "" },
  { id: "m93", name: "Tropical Fruit Platter", category: "Desserts", price: 3500, description: "Ask for available fruit platter" },
  { id: "m94", name: "Ice Cream", category: "Desserts", price: 3000, description: "2 scoops, ask for available flavours" },
  { id: "m95", name: "Cake", category: "Desserts", price: 6000, description: "Ask for available flavours" },
];

const DEFAULT_TABLES = [
  { id: "t1", name: "T1", section: "Main Dining", seats: 4, shape: "square", status: "available" },
  { id: "t2", name: "T2", section: "Main Dining", seats: 4, shape: "square", status: "available" },
  { id: "t3", name: "T3", section: "Main Dining", seats: 2, shape: "round", status: "available" },
  { id: "t4", name: "T4", section: "Main Dining", seats: 6, shape: "square", status: "available" },
  { id: "t5", name: "T5", section: "Main Dining", seats: 2, shape: "round", status: "available" },
  { id: "t6", name: "T6", section: "Main Dining", seats: 4, shape: "square", status: "available" },
  { id: "b1", name: "B1", section: "Bar", seats: 2, shape: "round", status: "available" },
  { id: "b2", name: "B2", section: "Bar", seats: 2, shape: "round", status: "available" },
  { id: "b3", name: "B3", section: "Bar", seats: 2, shape: "round", status: "available" },
  { id: "b4", name: "B4", section: "Bar", seats: 2, shape: "round", status: "available" },
  { id: "p1", name: "P1", section: "Patio", seats: 4, shape: "square", status: "available" },
  { id: "p2", name: "P2", section: "Patio", seats: 2, shape: "round", status: "available" },
  { id: "p3", name: "P3", section: "Patio", seats: 6, shape: "square", status: "available" },
];

const DEFAULT_ROOMS = [
  ...Array.from({ length: 18 }, (_, i) => ({ id: `r${i + 1}`, name: String(i + 1), type: "single", rate: 50000, status: "vacant" })),
  { id: "r19", name: "19", type: "double", rate: 80000, status: "vacant" },
  { id: "r20", name: "20", type: "double", rate: 80000, status: "vacant" },
];

/* --------------------------------- helpers --------------------------------- */

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const money = (n, cur, decimals = 2) =>
  `${cur}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

function elapsed(ts) {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function nightsBetween(startDateStr, endTs) {
  const start = new Date(startDateStr + "T00:00:00").getTime();
  const diff = Math.ceil((endTs - start) / 86400000);
  return Math.max(1, diff);
}

async function loadJSON(key, shared) {
  try {
    if (window.posAPI?.storage?.get) {
      const value = await window.posAPI.storage.get(key);
      return value ? JSON.parse(value) : null;
    }
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
async function saveJSON(key, obj, shared) {
  try {
    if (window.posAPI?.storage?.set) {
      await window.posAPI.storage.set(key, JSON.stringify(obj));
      return true;
    }
    window.localStorage.setItem(key, JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

function calcTotals(items, taxRate, serviceRate) {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = subtotal * taxRate;
  const service = subtotal * serviceRate;
  return { subtotal, tax, service, total: subtotal + tax + service };
}

function buildOrderReceipt(order, table, settings) {
  const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);
  return {
    kind: "Restaurant",
    label: table ? `Table ${table.name}` : `Room ${order.roomNumber} — room service`,
    sub: null,
    date: order.closedAt || Date.now(),
    items: order.items.map((it) => ({ qty: it.qty, name: it.name, amount: it.price * it.qty })),
    subtotal: totals.subtotal,
    tax: totals.tax,
    service: totals.service,
    total: totals.total,
    paymentMethod: order.paymentMethod,
    roomCharged: order.roomCharged,
    receiptNo: order.id,
  };
}
function buildStayReceipt(stay) {
  const total = stay.charges.reduce((s, c) => s + c.amount, 0);
  return {
    kind: "Accommodation",
    label: `Room ${stay.roomName}`,
    sub: stay.guestName,
    date: stay.closedAt || Date.now(),
    items: stay.charges.map((c) => ({ qty: 1, name: c.description, amount: c.amount })),
    subtotal: total,
    tax: 0,
    service: 0,
    total,
    paymentMethod: stay.paymentMethod,
    roomCharged: null,
    receiptNo: stay.id,
  };
}

/* --------------------------------- toast --------------------------------- */

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="hp-toast" role="status">
      <Check size={15} /> {toast}
    </div>
  );
}

/* --------------------------------- modal --------------------------------- */

function Modal({ title, onClose, children, width = 380 }) {
  return (
    <div className="hp-modal-veil" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hp-modal" style={{ width }}>
        <div className="hp-modal-head">
          <span>{title}</span>
          <button className="hp-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="hp-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------- print receipt ---------------------------- */

function PrintReceipt({ data, settings }) {
  if (!data) return null;
  return (
    <div className="hp-receipt-paper">
      <div className="hp-receipt-venue">{settings.venueName}</div>
      <div className="hp-receipt-kind">{data.kind} receipt</div>
      <div className="hp-receipt-meta">{data.label}{data.sub ? ` · ${data.sub}` : ""}</div>
      <div className="hp-receipt-meta">{new Date(data.date).toLocaleString()}</div>
      <div className="hp-receipt-rule" />
      {data.items.map((it, i) => (
        <div key={i} className="hp-receipt-line">
          <span>{it.qty > 1 ? `${it.qty} × ` : ""}{it.name}</span>
          <span>{money(it.amount, settings.currency, settings.decimals)}</span>
        </div>
      ))}
      <div className="hp-receipt-rule" />
      {data.tax > 0 && <div className="hp-receipt-line"><span>Tax</span><span>{money(data.tax, settings.currency, settings.decimals)}</span></div>}
      {data.service > 0 && <div className="hp-receipt-line"><span>Service</span><span>{money(data.service, settings.currency, settings.decimals)}</span></div>}
      <div className="hp-receipt-line hp-receipt-total"><span>Total</span><span>{money(data.total, settings.currency, settings.decimals)}</span></div>
      <div className="hp-receipt-rule" />
      <div className="hp-receipt-meta">Paid via {data.paymentMethod === "room" ? `room charge${data.roomCharged ? ` (room ${data.roomCharged})` : ""}` : data.paymentMethod}</div>
      <div className="hp-receipt-meta">Receipt #{data.receiptNo}</div>
      <div className="hp-receipt-thanks">Thank you</div>
    </div>
  );
}

/* --------------------------------- sidebar -------------------------------- */

function Sidebar({ view, setView, openRoomCount, occupiedRoomCount }) {
  const items = [
    { id: "floor", label: "Restaurant", icon: LayoutGrid, badge: openRoomCount },
    { id: "rooms", label: "Accommodation", icon: BedDouble, badge: occupiedRoomCount },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="hp-sidebar">
      <div className="hp-brand">
        <div className="hp-brand-mark"><ChefHat size={18} /></div>
        <div className="hp-brand-text">POS</div>
      </div>
      <div className="hp-nav">
        {items.map((it) => (
          <button
            key={it.id}
            className={`hp-nav-item ${view === it.id ? "active" : ""}`}
            onClick={() => setView(it.id)}
          >
            <it.icon size={18} />
            <span>{it.label}</span>
            {!!it.badge && <span className="hp-nav-badge">{it.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- topbar --------------------------------- */

function TopBar({ venueName, saveStatus }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hp-topbar">
      <div className="hp-topbar-venue">{venueName}</div>
      <div className="hp-topbar-right">
        <span className={`hp-save-dot ${saveStatus}`} />
        <span className="hp-save-label">{saveStatus === "saving" ? "Saving…" : "Saved"}</span>
        <span className="hp-topbar-clock">
          {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- floor view ------------------------------- */

function statusMeta(status) {
  switch (status) {
    case "available": return { label: "Available", cls: "avail" };
    case "occupied": return { label: "Ordering", cls: "occ" };
    case "bill": return { label: "Bill requested", cls: "bill" };
    default: return { label: status, cls: "" };
  }
}

function TableCard({ table, order, currency, decimals, onClick }) {
  const meta = statusMeta(table.status);
  const totals = order ? calcTotals(order.items, 0, 0) : null;
  return (
    <button className={`hp-table hp-table-${table.shape} hp-status-${meta.cls}`} onClick={onClick}>
      <div className="hp-table-name">{table.name}</div>
      <div className="hp-table-seats"><Users size={12} /> {table.seats}</div>
      {order && (
        <div className="hp-table-info">
          <div className="hp-table-total">{money(totals.subtotal, currency, decimals)}</div>
          <div className="hp-table-time"><Clock size={11} /> {elapsed(order.createdAt)}</div>
        </div>
      )}
      <div className="hp-table-status">{meta.label}</div>
    </button>
  );
}

function RoomChargeCard({ order, currency, decimals, onClick }) {
  const totals = calcTotals(order.items, 0, 0);
  const meta = statusMeta(order.status === "bill" ? "bill" : "occupied");
  return (
    <button className={`hp-table hp-table-room hp-status-${meta.cls}`} onClick={onClick}>
      <div className="hp-table-name"><DoorOpen size={14} /> {order.roomNumber}</div>
      <div className="hp-table-info">
        <div className="hp-table-total">{money(totals.subtotal, currency, decimals)}</div>
        <div className="hp-table-time"><Clock size={11} /> {elapsed(order.createdAt)}</div>
      </div>
      <div className="hp-table-status">{meta.label}</div>
    </button>
  );
}

function FloorView({ tables, orders, settings, checkedInStays, openTable, openRoomOrder, startRoomCharge }) {
  const sections = [...new Set(tables.map((t) => t.section))];
  const openOrderFor = (tableId) => orders.find((o) => o.tableId === tableId && (o.status === "occupied" || o.status === "bill"));
  const roomOrders = orders.filter((o) => !o.tableId && (o.status === "occupied" || o.status === "bill"));
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedStayId, setSelectedStayId] = useState("");

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <h1>Restaurant Floor</h1>
        <button className="hp-btn hp-btn-accent" onClick={() => setShowRoomModal(true)}>
          <DoorOpen size={15} /> New room service order
        </button>
      </div>

      {sections.map((sec) => (
        <div key={sec} className="hp-floor-section">
          <div className="hp-section-label">{sec}</div>
          <div className="hp-table-grid">
            {tables.filter((t) => t.section === sec).map((t) => (
              <TableCard
                key={t.id}
                table={t}
                order={openOrderFor(t.id)}
                currency={settings.currency}
                decimals={settings.decimals}
                onClick={() => openTable(t)}
              />
            ))}
          </div>
        </div>
      ))}

      {roomOrders.length > 0 && (
        <div className="hp-floor-section">
          <div className="hp-section-label">Room service orders</div>
          <div className="hp-table-grid">
            {roomOrders.map((o) => (
              <RoomChargeCard key={o.id} order={o} currency={settings.currency} decimals={settings.decimals} onClick={() => openRoomOrder(o)} />
            ))}
          </div>
        </div>
      )}

      {showRoomModal && (
        <Modal title="New room service order" onClose={() => setShowRoomModal(false)} width={340}>
          {checkedInStays.length === 0 ? (
            <div className="hp-empty">No guests are currently checked in. Check a guest in under Accommodation first.</div>
          ) : (
            <>
              <label className="hp-field-label">Guest room</label>
              <div className="hp-stay-picker">
                {checkedInStays.map((s) => (
                  <button
                    key={s.id}
                    className={`hp-stay-option ${selectedStayId === s.id ? "active" : ""}`}
                    onClick={() => setSelectedStayId(s.id)}
                  >
                    <span className="hp-stay-room">Room {s.roomName}</span>
                    <span className="hp-stay-guest">{s.guestName}</span>
                  </button>
                ))}
              </div>
              <button
                className="hp-btn hp-btn-accent hp-btn-block"
                disabled={!selectedStayId}
                onClick={() => { startRoomCharge(checkedInStays.find((s) => s.id === selectedStayId)); setShowRoomModal(false); setSelectedStayId(""); }}
              >
                Start order
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------- order view ------------------------------- */

function OrderScreen({ order, table, categories, menuItems, settings, updateOrder, goBack, requestBill, voidOrder }) {
  const [activeCat, setActiveCat] = useState(categories[0] || "");
  const [search, setSearch] = useState("");

  const addItem = (mi) => {
    const items = [...order.items];
    const existing = items.find((it) => it.menuItemId === mi.id && !it.note);
    if (existing) existing.qty += 1;
    else items.push({ id: uid("li"), menuItemId: mi.id, name: mi.name, price: mi.price, qty: 1, note: "" });
    updateOrder({ ...order, items });
  };
  const setQty = (lineId, qty) => {
    const items = order.items.map((it) => (it.id === lineId ? { ...it, qty } : it)).filter((it) => it.qty > 0);
    updateOrder({ ...order, items });
  };
  const removeItem = (lineId) => updateOrder({ ...order, items: order.items.filter((it) => it.id !== lineId) });

  const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);
  const filteredItems = menuItems.filter(
    (mi) => mi.category === activeCat && mi.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hp-order-layout">
      <div className="hp-order-ticket">
        <div className="hp-view-head">
          <button className="hp-icon-btn" onClick={goBack}><ChevronLeft size={18} /></button>
          <h1>{table ? table.name : `Room ${order.roomNumber}`}</h1>
        </div>
        <div className="hp-ticket-lines">
          {order.items.length === 0 && <div className="hp-empty">No items yet — add from the menu.</div>}
          {order.items.map((it) => (
            <div key={it.id} className="hp-ticket-line">
              <div className="hp-ticket-line-main">
                <span className="hp-ticket-name">{it.name}</span>
                <span className="hp-ticket-price">{money(it.price * it.qty, settings.currency, settings.decimals)}</span>
              </div>
              <div className="hp-ticket-line-controls">
                <button className="hp-stepper-btn" onClick={() => setQty(it.id, it.qty - 1)}><Minus size={13} /></button>
                <span className="hp-stepper-qty">{it.qty}</span>
                <button className="hp-stepper-btn" onClick={() => setQty(it.id, it.qty + 1)}><Plus size={13} /></button>
                <button className="hp-stepper-btn hp-stepper-remove" onClick={() => removeItem(it.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="hp-ticket-totals">
          <div className="hp-total-row"><span>Subtotal</span><span>{money(totals.subtotal, settings.currency, settings.decimals)}</span></div>
          <div className="hp-total-row"><span>Tax</span><span>{money(totals.tax, settings.currency, settings.decimals)}</span></div>
          <div className="hp-total-row"><span>Service</span><span>{money(totals.service, settings.currency, settings.decimals)}</span></div>
          <div className="hp-total-row hp-total-grand"><span>Total</span><span>{money(totals.total, settings.currency, settings.decimals)}</span></div>
        </div>
        <div className="hp-ticket-actions">
          <button className="hp-btn hp-btn-ghost" onClick={() => voidOrder(order)}>Void order</button>
          <button className="hp-btn hp-btn-accent" disabled={order.items.length === 0} onClick={() => requestBill(order)}>
            <Receipt size={15} /> Request bill
          </button>
        </div>
      </div>

      <div className="hp-order-menu">
        <div className="hp-search-row">
          <Search size={15} />
          <input className="hp-search-input" placeholder="Search menu…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="hp-cat-tabs">
          {categories.map((c) => (
            <button key={c} className={`hp-cat-tab ${activeCat === c ? "active" : ""}`} onClick={() => setActiveCat(c)}>{c}</button>
          ))}
        </div>
        <div className="hp-menu-grid">
          {filteredItems.map((mi) => (
            <button key={mi.id} className="hp-menu-item" onClick={() => addItem(mi)}>
              <div className="hp-menu-item-name">{mi.name}</div>
              {mi.description && <div className="hp-menu-item-desc">{mi.description}</div>}
              <div className="hp-menu-item-price">{money(mi.price, settings.currency, settings.decimals)}</div>
            </button>
          ))}
          {filteredItems.length === 0 && <div className="hp-empty">No items match.</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- billing view ------------------------------ */

function BillingScreen({ order, table, settings, checkedInStays, backToOrder, closeBill }) {
  const [method, setMethod] = useState(null);
  const [selectedStayId, setSelectedStayId] = useState("");
  const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);

  return (
    <div className="hp-view hp-billing">
      <div className="hp-view-head">
        <button className="hp-icon-btn" onClick={backToOrder}><ChevronLeft size={18} /></button>
        <h1>Bill — {table ? table.name : `Room ${order.roomNumber}`}</h1>
      </div>

      <div className="hp-bill-card">
        {order.items.map((it) => (
          <div key={it.id} className="hp-total-row">
            <span>{it.qty} × {it.name}</span>
            <span>{money(it.price * it.qty, settings.currency, settings.decimals)}</span>
          </div>
        ))}
        <div className="hp-divider" />
        <div className="hp-total-row"><span>Subtotal</span><span>{money(totals.subtotal, settings.currency, settings.decimals)}</span></div>
        <div className="hp-total-row"><span>Tax</span><span>{money(totals.tax, settings.currency, settings.decimals)}</span></div>
        <div className="hp-total-row"><span>Service</span><span>{money(totals.service, settings.currency, settings.decimals)}</span></div>
        <div className="hp-total-row hp-total-grand"><span>Total due</span><span>{money(totals.total, settings.currency, settings.decimals)}</span></div>
      </div>

      <div className="hp-pay-methods">
        <button className={`hp-pay-btn ${method === "cash" ? "active" : ""}`} onClick={() => setMethod("cash")}><Banknote size={18} /> Cash</button>
        <button className={`hp-pay-btn ${method === "card" ? "active" : ""}`} onClick={() => setMethod("card")}><CreditCard size={18} /> Card</button>
        <button className={`hp-pay-btn ${method === "room" ? "active" : ""}`} onClick={() => setMethod("room")}><DoorOpen size={18} /> Charge to room</button>
      </div>

      {method === "room" && (
        <div className="hp-room-input-row">
          <label className="hp-field-label">Which room?</label>
          {checkedInStays.length === 0 ? (
            <div className="hp-empty">No guests currently checked in.</div>
          ) : (
            <div className="hp-stay-picker">
              {checkedInStays.map((s) => (
                <button
                  key={s.id}
                  className={`hp-stay-option ${selectedStayId === s.id ? "active" : ""}`}
                  onClick={() => setSelectedStayId(s.id)}
                >
                  <span className="hp-stay-room">Room {s.roomName}</span>
                  <span className="hp-stay-guest">{s.guestName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="hp-ticket-actions">
        <button className="hp-btn hp-btn-ghost" onClick={backToOrder}><ArrowLeftRight size={15} /> Back to order</button>
        <button
          className="hp-btn hp-btn-accent"
          disabled={!method || (method === "room" && !selectedStayId)}
          onClick={() => closeBill(order, method, method === "room" ? checkedInStays.find((s) => s.id === selectedStayId) : null)}
        >
          <Check size={15} /> Confirm payment
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- receipt view ------------------------------ */

function ReceiptScreen({ data, settings, onPrint, onDone }) {
  return (
    <div className="hp-view hp-billing">
      <div className="hp-view-head"><h1>Payment received</h1></div>
      <div className="hp-bill-card">
        <div className="hp-receipt-kind-inline">{data.kind} · {data.label}{data.sub ? ` · ${data.sub}` : ""}</div>
        {data.items.map((it, i) => (
          <div key={i} className="hp-total-row"><span>{it.qty > 1 ? `${it.qty} × ` : ""}{it.name}</span><span>{money(it.amount, settings.currency, settings.decimals)}</span></div>
        ))}
        <div className="hp-divider" />
        {data.tax > 0 && <div className="hp-total-row"><span>Tax</span><span>{money(data.tax, settings.currency, settings.decimals)}</span></div>}
        {data.service > 0 && <div className="hp-total-row"><span>Service</span><span>{money(data.service, settings.currency, settings.decimals)}</span></div>}
        <div className="hp-total-row hp-total-grand"><span>Total paid</span><span>{money(data.total, settings.currency, settings.decimals)}</span></div>
      </div>
      <div className="hp-ticket-actions">
        <button className="hp-btn hp-btn-ghost" onClick={onDone}>Done</button>
        <button className="hp-btn hp-btn-accent" onClick={onPrint}><Printer size={15} /> Print receipt</button>
      </div>
    </div>
  );
}

/* ------------------------------- history view ------------------------------ */

function HistoryScreen({ orders, stays, settings, onPrint }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const orderRows = orders
    .filter((o) => o.status === "paid" || o.status === "void")
    .map((o) => ({ type: "Restaurant", id: o.id, label: o.tableName || `Room ${o.roomNumber}`, status: o.status, closedAt: o.closedAt, total: calcTotals(o.items, settings.taxRate, settings.serviceRate).total, record: o, receiptFn: () => buildOrderReceipt(o, o.tableId ? { name: o.tableName } : null, settings) }));

  const stayRows = stays
    .filter((s) => s.status === "checked_out" || s.status === "void")
    .map((s) => ({ type: "Accommodation", id: s.id, label: `Room ${s.roomName} — ${s.guestName}`, status: s.status === "checked_out" ? "paid" : "void", closedAt: s.closedAt, total: s.charges.reduce((sum, c) => sum + c.amount, 0), record: s, receiptFn: () => buildStayReceipt(s) }));

  const rows = [...orderRows, ...stayRows]
    .filter((r) => tab === "all" || r.type.toLowerCase() === tab)
    .filter((r) => r.label.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  const [open, setOpen] = useState(null);

  return (
    <div className="hp-view">
      <div className="hp-view-head"><h1>History</h1></div>
      <div className="hp-cat-tabs">
        {["all", "restaurant", "accommodation"].map((t) => (
          <button key={t} className={`hp-cat-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      <div className="hp-search-row hp-history-search">
        <Search size={15} />
        <input className="hp-search-input" placeholder="Search by table or room…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="hp-history-list">
        {rows.length === 0 && <div className="hp-empty">No closed bills yet.</div>}
        {rows.map((r) => {
          const isOpen = open === r.id;
          return (
            <div key={r.id} className="hp-history-row">
              <button className="hp-history-summary" onClick={() => setOpen(isOpen ? null : r.id)}>
                <span className="hp-history-type">{r.type}</span>
                <span className="hp-history-label">{r.label}</span>
                <span className={`hp-history-badge hp-history-${r.status}`}>{r.status}</span>
                <span className="hp-history-date">{r.closedAt ? new Date(r.closedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                <span className="hp-history-total">{money(r.total, settings.currency, settings.decimals)}</span>
              </button>
              {isOpen && (
                <div className="hp-history-detail">
                  {r.type === "Restaurant"
                    ? r.record.items.map((it) => (
                        <div key={it.id} className="hp-total-row"><span>{it.qty} × {it.name}</span><span>{money(it.price * it.qty, settings.currency, settings.decimals)}</span></div>
                      ))
                    : r.record.charges.map((c) => (
                        <div key={c.id} className="hp-total-row"><span>{c.description}</span><span>{money(c.amount, settings.currency, settings.decimals)}</span></div>
                      ))}
                  <div className="hp-divider" />
                  <div className="hp-total-row hp-total-grand"><span>Total</span><span>{money(r.total, settings.currency, settings.decimals)}</span></div>
                  {r.record.paymentMethod && <div className="hp-history-meta">Paid via {r.record.paymentMethod}{r.record.roomCharged ? ` · room ${r.record.roomCharged}` : ""}</div>}
                  {r.status !== "void" && (
                    <button className="hp-btn hp-btn-ghost" style={{ marginTop: 10 }} onClick={() => onPrint(r.receiptFn())}>
                      <Printer size={14} /> Print receipt
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- menu view -------------------------------- */

function MenuManager({ categories, menuItems, settings, setCategories, setMenuItems }) {
  const [activeCat, setActiveCat] = useState(categories[0] || "");
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);

  useEffect(() => { if (!categories.includes(activeCat)) setActiveCat(categories[0] || ""); }, [categories]);

  const itemsInCat = menuItems.filter((mi) => mi.category === activeCat);

  const saveItem = (item) => {
    if (menuItems.find((mi) => mi.id === item.id)) {
      setMenuItems(menuItems.map((mi) => (mi.id === item.id ? item : mi)));
    } else {
      setMenuItems([...menuItems, item]);
    }
    setEditing(null);
  };
  const deleteItem = (id) => setMenuItems(menuItems.filter((mi) => mi.id !== id));

  const addCategory = () => {
    const c = newCat.trim();
    if (c && !categories.includes(c)) setCategories([...categories, c]);
    setNewCat("");
    setShowCatModal(false);
  };
  const deleteCategory = (c) => {
    if (menuItems.some((mi) => mi.category === c)) return;
    setCategories(categories.filter((x) => x !== c));
  };

  return (
    <div className="hp-view hp-menu-manager">
      <div className="hp-view-head"><h1>Menu</h1></div>
      <div className="hp-menu-manager-layout">
        <div className="hp-cat-sidebar">
          {categories.map((c) => (
            <div key={c} className={`hp-cat-sidebar-item ${activeCat === c ? "active" : ""}`}>
              <button className="hp-cat-sidebar-btn" onClick={() => setActiveCat(c)}>{c}</button>
              <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => deleteCategory(c)}><X size={12} /></button>
            </div>
          ))}
          <button className="hp-btn hp-btn-ghost hp-btn-block" onClick={() => setShowCatModal(true)}><Plus size={14} /> Category</button>
        </div>
        <div className="hp-menu-items-panel">
          <div className="hp-view-head">
            <h2 className="hp-h2">{activeCat}</h2>
            <button className="hp-btn hp-btn-accent" onClick={() => setEditing({ id: uid("m"), name: "", category: activeCat, price: 0, description: "" })}>
              <Plus size={15} /> Item
            </button>
          </div>
          <div className="hp-menu-manage-grid">
            {itemsInCat.map((mi) => (
              <div key={mi.id} className="hp-menu-manage-card">
                <div className="hp-menu-item-name">{mi.name}</div>
                {mi.description && <div className="hp-menu-item-desc">{mi.description}</div>}
                <div className="hp-menu-item-price">{money(mi.price, settings.currency, settings.decimals)}</div>
                <div className="hp-menu-manage-actions">
                  <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => setEditing(mi)}><Pencil size={13} /></button>
                  <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => deleteItem(mi.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {itemsInCat.length === 0 && <div className="hp-empty">No items in this category yet.</div>}
          </div>
        </div>
      </div>

      {editing && (
        <Modal title={menuItems.find((mi) => mi.id === editing.id) ? "Edit item" : "New item"} onClose={() => setEditing(null)}>
          <label className="hp-field-label">Name</label>
          <input className="hp-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <label className="hp-field-label">Price</label>
          <input className="hp-input" type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} />
          <label className="hp-field-label">Description</label>
          <input className="hp-input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!editing.name.trim()} onClick={() => saveItem(editing)}>Save item</button>
        </Modal>
      )}

      {showCatModal && (
        <Modal title="New category" onClose={() => setShowCatModal(false)} width={300}>
          <label className="hp-field-label">Name</label>
          <input autoFocus className="hp-input" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!newCat.trim()} onClick={addCategory}>Add category</button>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ accommodation ------------------------------ */

function RoomCard({ room, stay, onClick }) {
  const occupied = room.status === "occupied";
  const Icon = room.type === "double" ? BedDouble : BedSingle;
  return (
    <button className={`hp-table hp-room-card hp-status-${occupied ? "occ" : "avail"}`} onClick={onClick}>
      <div className="hp-table-name"><Icon size={15} /> {room.name}</div>
      <div className="hp-table-seats">{room.type === "double" ? "Double" : "Single"}</div>
      {occupied && stay && (
        <div className="hp-table-info">
          <div className="hp-table-total">{stay.guestName}</div>
          <div className="hp-table-time"><Clock size={11} /> {nightsBetween(stay.checkInDate, Date.now())} night(s)</div>
        </div>
      )}
      <div className="hp-table-status">{occupied ? "Occupied" : "Vacant"}</div>
    </button>
  );
}

function RoomBoard({ rooms, stays, settings, openRoom, checkIn }) {
  const singles = rooms.filter((r) => r.type === "single");
  const doubles = rooms.filter((r) => r.type === "double");
  const [checkInRoom, setCheckInRoom] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  const stayFor = (roomId) => stays.find((s) => s.roomId === roomId && s.status === "checked_in");

  const submitCheckIn = () => {
    if (!guestName.trim()) return;
    checkIn(checkInRoom, { guestName: guestName.trim(), phone: phone.trim(), checkOutDate });
    setCheckInRoom(null); setGuestName(""); setPhone(""); setCheckOutDate("");
  };

  return (
    <div className="hp-view">
      <div className="hp-view-head"><h1>Accommodation</h1></div>

      <div className="hp-floor-section">
        <div className="hp-section-label">Single rooms</div>
        <div className="hp-table-grid">
          {singles.map((r) => (
            <RoomCard key={r.id} room={r} stay={stayFor(r.id)} onClick={() => (r.status === "vacant" ? setCheckInRoom(r) : openRoom(r))} />
          ))}
        </div>
      </div>

      <div className="hp-floor-section">
        <div className="hp-section-label">Double rooms</div>
        <div className="hp-table-grid">
          {doubles.map((r) => (
            <RoomCard key={r.id} room={r} stay={stayFor(r.id)} onClick={() => (r.status === "vacant" ? setCheckInRoom(r) : openRoom(r))} />
          ))}
        </div>
      </div>

      {checkInRoom && (
        <Modal title={`Check in — Room ${checkInRoom.name}`} onClose={() => setCheckInRoom(null)}>
          <label className="hp-field-label">Guest name</label>
          <input autoFocus className="hp-input" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          <label className="hp-field-label">Phone (optional)</label>
          <input className="hp-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="hp-field-label">Expected check-out date</label>
          <input className="hp-input" type="date" min={todayStr()} value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
          <div className="hp-field-label" style={{ marginTop: 10 }}>Rate: {money(checkInRoom.rate, settings.currency, settings.decimals)} / night</div>
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!guestName.trim()} onClick={submitCheckIn}>Check in</button>
        </Modal>
      )}
    </div>
  );
}

function RoomFolio({ stay, room, settings, goBack, addNote, checkOutStay, voidStay }) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [method, setMethod] = useState(null);
  const nights = nightsBetween(stay.checkInDate, Date.now());
  const runningRoomCharge = nights * room.rate;
  const chargesTotal = stay.charges.reduce((s, c) => s + c.amount, 0);
  const estimatedTotal = runningRoomCharge + chargesTotal;

  return (
    <div className="hp-view hp-billing">
      <div className="hp-view-head">
        <button className="hp-icon-btn" onClick={goBack}><ChevronLeft size={18} /></button>
        <h1>Room {stay.roomName} — {stay.guestName}</h1>
      </div>

      <div className="hp-bill-card">
        <div className="hp-total-row"><span><Calendar size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Checked in</span><span>{stay.checkInDate}</span></div>
        {stay.checkOutDate && <div className="hp-total-row"><span>Expected check-out</span><span>{stay.checkOutDate}</span></div>}
        {stay.phone && <div className="hp-total-row"><span><Phone size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Phone</span><span>{stay.phone}</span></div>}
        <div className="hp-divider" />
        <div className="hp-total-row"><span>Room charge — {nights} night(s) × {money(room.rate, settings.currency, settings.decimals)}</span><span>{money(runningRoomCharge, settings.currency, settings.decimals)}</span></div>
        {stay.charges.map((c) => (
          <div key={c.id} className="hp-total-row"><span>{c.description}</span><span>{money(c.amount, settings.currency, settings.decimals)}</span></div>
        ))}
        <div className="hp-divider" />
        <div className="hp-total-row hp-total-grand"><span>Estimated total</span><span>{money(estimatedTotal, settings.currency, settings.decimals)}</span></div>
      </div>

      {!checkingOut ? (
        <div className="hp-ticket-actions">
          {stay.charges.length === 0 && nights <= 1 && (
            <button className="hp-btn hp-btn-ghost" onClick={() => voidStay(stay)}>Cancel check-in</button>
          )}
          <button className="hp-btn hp-btn-accent" onClick={() => setCheckingOut(true)}><Receipt size={15} /> Check out & bill</button>
        </div>
      ) : (
        <>
          <div className="hp-pay-methods" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <button className={`hp-pay-btn ${method === "cash" ? "active" : ""}`} onClick={() => setMethod("cash")}><Banknote size={18} /> Cash</button>
            <button className={`hp-pay-btn ${method === "card" ? "active" : ""}`} onClick={() => setMethod("card")}><CreditCard size={18} /> Card</button>
          </div>
          <div className="hp-ticket-actions">
            <button className="hp-btn hp-btn-ghost" onClick={() => setCheckingOut(false)}><ArrowLeftRight size={15} /> Back</button>
            <button className="hp-btn hp-btn-accent" disabled={!method} onClick={() => checkOutStay(stay, room, method)}>
              <Check size={15} /> Confirm check-out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------- settings view ------------------------------ */

function SettingsScreen({ settings, setSettings, tables, setTables, rooms, setRooms }) {
  const [dbMessage, setDbMessage] = useState("");
  const [updateState, setUpdateState] = useState({
    state: "",
    currentVersion: "",
    version: "",
    message: "",
    percent: 0,
    transferred: 0,
    total: 0,
    bytesPerSecond: 0,
    releaseNotes: "",
  });
  const [local, setLocal] = useState(settings);
  const [showTableModal, setShowTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: "", section: "Main Dining", seats: 2, shape: "round" });
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", type: "single", rate: 50000 });

  useEffect(() => {
    const unsubscribe = window.posAPI?.updates?.status?.((data) => {
      setUpdateState((prev) => ({
        ...prev,
        ...data,
      }));
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);
  useEffect(() => setLocal(settings), [settings]);

  const addTable = () => {
    if (!newTable.name.trim()) return;
    setTables([...tables, { id: uid("tb"), ...newTable, status: "available" }]);
    setNewTable({ name: "", section: "Main Dining", seats: 2, shape: "round" });
    setShowTableModal(false);
  };
  const removeTable = (id) => {
    const t = tables.find((x) => x.id === id);
    if (t && t.status !== "available") return;
    setTables(tables.filter((x) => x.id !== id));
  };

  const addRoom = () => {
    if (!newRoom.name.trim()) return;
    setRooms([...rooms, { id: uid("r"), ...newRoom, status: "vacant" }]);
    setNewRoom({ name: "", type: "single", rate: 50000 });
    setShowRoomModal(false);
  };
  const removeRoom = (id) => {
    const r = rooms.find((x) => x.id === id);
    if (r && r.status !== "vacant") return;
    setRooms(rooms.filter((x) => x.id !== id));
  };
  const updateRoomRate = (id, rate) => setRooms(rooms.map((r) => (r.id === id ? { ...r, rate } : r)));
  const checkForUpdates = async () => {
    setUpdateState((prev) => ({
      ...prev,
      state: "checking",
      message: "",
    }));

    const result = await window.posAPI?.updates?.check?.();

    if (result) {
      setUpdateState((prev) => ({
        ...prev,
        ...result,
      }));
    }
  };
  const downloadUpdate = async () => {
    setUpdateState((prev) => ({
      ...prev,
      state: "downloading",
      percent: 0,
    }));

    await window.posAPI?.updates?.download?.();
  };

  const installUpdate = async () => {
    setUpdateState((prev) => ({
      ...prev,
      state: "installing",
    }));

    await window.posAPI?.updates?.install?.();
  };

  return (
    <div className="hp-view">
      <div className="hp-view-head"><h1>Settings</h1></div>

      <div className="hp-settings-card">
        <div className="hp-section-label">Database & Updates</div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:10}}>
          <button className="hp-btn" onClick={async () => { const r = await window.posAPI?.database?.backup?.(); if (r && !r.canceled) setDbMessage("Database backup created successfully."); }}>Back up database</button>
          <button className="hp-btn" onClick={async () => { const r = await window.posAPI?.database?.restore?.(); if (r && !r.canceled) { setDbMessage("Database restored. Restart the POS to reload all data."); } }}>Restore database</button>
          <button
            className="hp-btn hp-btn-accent"
            onClick={checkForUpdates}
            disabled={updateState.state === "checking" || updateState.state === "downloading" || updateState.state === "installing"}
          >
            {updateState.state === "checking" ? "Checking..." : "Check for updates"}
          </button>
          <button className="hp-btn" onClick={async () => { const info = await window.posAPI?.database?.info?.(); if (info) setDbMessage(`SQLite schema v${info.schemaVersion} (supported v${info.supportedSchemaVersion}).`); }}>Database status</button>
        </div>
        {updateState.state === "checking" && (
          <div className="hp-muted" style={{ marginTop: 12 }}>
            Checking for updates...
          </div>
        )}
        {updateState.state === "disabled" && (
          <div className="hp-muted" style={{ marginTop: 12 }}>
            {updateState.message || "Update checking is unavailable."}
          </div>
        )}

        {updateState.state === "up-to-date" && (
          <div className="hp-muted" style={{ marginTop: 12 }}>
            You are up to date. Version {updateState.currentVersion || "current"} is installed.
          </div>
        )}

        {updateState.state === "available" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Update available
            </div>

            <div className="hp-muted" style={{ marginTop: 5 }}>
              A new version of M Generation II POS is available.
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Current version:</strong> {updateState.currentVersion}
              <br />
              <strong>New version:</strong> {updateState.version}
            </div>

            {updateState.releaseDate && (
              <div className="hp-muted" style={{ marginTop: 5 }}>
                Released: {new Date(updateState.releaseDate).toLocaleDateString()}
              </div>
            )}

            {updateState.releaseNotes && (
              <div className="hp-muted" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {typeof updateState.releaseNotes === "string"
                  ? updateState.releaseNotes
                  : updateState.releaseNotes?.body || ""}
              </div>
            )}

            <button
              className="hp-btn hp-btn-accent"
              style={{ marginTop: 12 }}
              onClick={downloadUpdate}
            >
              Download Update
            </button>
          </div>
        )}

        {updateState.state === "downloading" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700 }}>
              Downloading update {updateState.version ? `v${updateState.version}` : ""}
            </div>

            <div
              style={{
                width: "100%",
                height: 10,
                background: "#ddd",
                borderRadius: 5,
                overflow: "hidden",
                marginTop: 10,
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, updateState.percent || 0))}%`,
                  height: "100%",
                  background: "#8B5E34",
                  transition: "width 0.2s ease",
                }}
              />
            </div>

            <div className="hp-muted" style={{ marginTop: 6 }}>
              {Math.round(updateState.percent || 0)}%
            </div>
          </div>
        )}

        {updateState.state === "downloaded" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700 }}>
              Update ready
            </div>

            <div className="hp-muted" style={{ marginTop: 5 }}>
              Version {updateState.version} has been downloaded and is ready to install.
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className="hp-btn hp-btn-accent"
                onClick={installUpdate}
              >
                Install & Restart
              </button>

              <button
                className="hp-btn"
                onClick={() =>
                  setUpdateState((prev) => ({
                    ...prev,
                    state: "idle",
                  }))
                }
              >
                Later
              </button>
            </div>
          </div>
        )}

        {updateState.state === "installing" && (
          <div className="hp-muted" style={{ marginTop: 14 }}>
            Installing update... The POS will restart shortly.
          </div>
        )}

        {updateState.state === "error" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700 }}>
              Update failed
            </div>

            <div className="hp-muted" style={{ marginTop: 5 }}>
              {updateState.message || "An unknown update error occurred."}
            </div>
          </div>
        )}
        {dbMessage && <div className="hp-muted" style={{marginTop:9}}>{dbMessage}</div>}
        <div className="hp-muted" style={{marginTop:8}}>Application updates replace the POS software, not the SQLite database. Database backups are kept separately.</div>
      </div>

      <div className="hp-settings-card">
        <div className="hp-section-label">Venue</div>
        <label className="hp-field-label">Name</label>
        <input className="hp-input" value={local.venueName} onChange={(e) => setLocal({ ...local, venueName: e.target.value })} onBlur={() => setSettings(local)} />
        <div className="hp-settings-row">
          <div>
            <label className="hp-field-label">Currency symbol</label>
            <input className="hp-input hp-input-sm" value={local.currency} onChange={(e) => setLocal({ ...local, currency: e.target.value })} onBlur={() => setSettings(local)} />
          </div>
          <div>
            <label className="hp-field-label">Decimal places</label>
            <input className="hp-input hp-input-sm" type="number" min="0" max="4" value={local.decimals} onChange={(e) => setLocal({ ...local, decimals: Math.max(0, parseInt(e.target.value) || 0) })} onBlur={() => setSettings(local)} />
          </div>
          <div>
            <label className="hp-field-label">Tax rate %</label>
            <input className="hp-input hp-input-sm" type="number" step="0.1" value={(local.taxRate * 100).toFixed(1)} onChange={(e) => setLocal({ ...local, taxRate: (parseFloat(e.target.value) || 0) / 100 })} onBlur={() => setSettings(local)} />
          </div>
          <div>
            <label className="hp-field-label">Service rate %</label>
            <input className="hp-input hp-input-sm" type="number" step="0.1" value={(local.serviceRate * 100).toFixed(1)} onChange={(e) => setLocal({ ...local, serviceRate: (parseFloat(e.target.value) || 0) / 100 })} onBlur={() => setSettings(local)} />
          </div>
        </div>
      </div>

      <div className="hp-settings-card">
        <div className="hp-view-head">
          <div className="hp-section-label">Tables</div>
          <button className="hp-btn hp-btn-accent" onClick={() => setShowTableModal(true)}><Plus size={14} /> Table</button>
        </div>
        <div className="hp-table-list">
          {tables.map((t) => (
            <div key={t.id} className="hp-table-list-row">
              <span>{t.name}</span><span className="hp-muted">{t.section}</span><span className="hp-muted">{t.seats} seats</span>
              <button className="hp-icon-btn hp-icon-btn-sm" disabled={t.status !== "available"} onClick={() => removeTable(t.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="hp-settings-card">
        <div className="hp-view-head">
          <div className="hp-section-label">Rooms</div>
          <button className="hp-btn hp-btn-accent" onClick={() => setShowRoomModal(true)}><Plus size={14} /> Room</button>
        </div>
        <div className="hp-table-list">
          {rooms.map((r) => (
            <div key={r.id} className="hp-room-list-row">
              <span>{r.name}</span><span className="hp-muted">{r.type}</span>
              <input className="hp-input hp-input-sm" type="number" value={r.rate} onChange={(e) => updateRoomRate(r.id, parseInt(e.target.value) || 0)} />
              <button className="hp-icon-btn hp-icon-btn-sm" disabled={r.status !== "vacant"} onClick={() => removeRoom(r.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>

      {showTableModal && (
        <Modal title="New table" onClose={() => setShowTableModal(false)}>
          <label className="hp-field-label">Name</label>
          <input autoFocus className="hp-input" value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} />
          <label className="hp-field-label">Section</label>
          <input className="hp-input" value={newTable.section} onChange={(e) => setNewTable({ ...newTable, section: e.target.value })} />
          <label className="hp-field-label">Seats</label>
          <input className="hp-input" type="number" value={newTable.seats} onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) || 1 })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" onClick={addTable}>Add table</button>
        </Modal>
      )}

      {showRoomModal && (
        <Modal title="New room" onClose={() => setShowRoomModal(false)}>
          <label className="hp-field-label">Room number</label>
          <input autoFocus className="hp-input" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} />
          <label className="hp-field-label">Type</label>
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${newRoom.type === "single" ? "active" : ""}`} onClick={() => setNewRoom({ ...newRoom, type: "single" })}>Single</button>
            <button className={`hp-cat-tab ${newRoom.type === "double" ? "active" : ""}`} onClick={() => setNewRoom({ ...newRoom, type: "double" })}>Double</button>
          </div>
          <label className="hp-field-label">Nightly rate</label>
          <input className="hp-input" type="number" value={newRoom.rate} onChange={(e) => setNewRoom({ ...newRoom, rate: parseInt(e.target.value) || 0 })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" onClick={addRoom}>Add room</button>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- app ----------------------------------- */

export default function HotelPOS() {
  const [ready, setReady] = useState(false);
  const [tables, setTables] = useState(DEFAULT_TABLES);
  const [orders, setOrders] = useState([]);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [stays, setStays] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [view, setView] = useState("floor");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [billingOrderId, setBillingOrderId] = useState(null);
  const [activeStayId, setActiveStayId] = useState(null);
  const [receipt, setReceipt] = useState(null); // { kind: 'order'|'stay', id }
  const [printPayload, setPrintPayload] = useState(null);
  const [toast, setToast] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const toastTimer = useRef(null);
  const skipSave = useRef(true);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    (async () => {
      const [fo, menu, sett, ra] = await Promise.all([
        loadJSON("pos:floor-orders", true),
        loadJSON("pos:menu", true),
        loadJSON("pos:settings", true),
        loadJSON("pos:rooms-stays", true),
      ]);
      if (fo) { setTables(fo.tables || DEFAULT_TABLES); setOrders(fo.orders || []); }
      if (menu) { setCategories(menu.categories || DEFAULT_CATEGORIES); setMenuItems(menu.menuItems || DEFAULT_MENU_ITEMS); }
      if (sett) setSettings({ ...DEFAULT_SETTINGS, ...sett });
      if (ra) { setRooms(ra.rooms || DEFAULT_ROOMS); setStays(ra.stays || []); }
      skipSave.current = false;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => { await saveJSON("pos:floor-orders", { tables, orders }, true); setSaveStatus("saved"); }, 350);
    return () => clearTimeout(t);
  }, [tables, orders]);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => { await saveJSON("pos:rooms-stays", { rooms, stays }, true); setSaveStatus("saved"); }, 350);
    return () => clearTimeout(t);
  }, [rooms, stays]);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => { await saveJSON("pos:menu", { categories, menuItems }, true); setSaveStatus("saved"); }, 350);
    return () => clearTimeout(t);
  }, [categories, menuItems]);

  useEffect(() => {
    if (skipSave.current) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => { await saveJSON("pos:settings", settings, true); setSaveStatus("saved"); }, 350);
    return () => clearTimeout(t);
  }, [settings]);

  if (!ready) return <div className="hp-loading">Loading…</div>;

  const activeOrder = orders.find((o) => o.id === activeOrderId) || null;
  const billingOrder = orders.find((o) => o.id === billingOrderId) || null;
  const activeStay = stays.find((s) => s.id === activeStayId) || null;
  const tableFor = (order) => (order && order.tableId ? tables.find((t) => t.id === order.tableId) : null);
  const checkedInStays = stays.filter((s) => s.status === "checked_in");

  /* ---- restaurant flows ---- */
  const openTable = (table) => {
    let order = orders.find((o) => o.tableId === table.id && (o.status === "occupied" || o.status === "bill"));
    if (!order) {
      order = { id: uid("o"), tableId: table.id, tableName: table.name, roomNumber: null, roomStayId: null, items: [], status: "occupied", createdAt: Date.now(), closedAt: null, paymentMethod: null, roomCharged: null };
      setOrders([...orders, order]);
      setTables(tables.map((t) => (t.id === table.id ? { ...t, status: "occupied" } : t)));
    }
    setActiveOrderId(order.id);
    setView(order.status === "bill" ? "billing" : "order");
    setBillingOrderId(order.status === "bill" ? order.id : null);
  };
  const openRoomOrder = (order) => {
    setActiveOrderId(order.id);
    if (order.status === "bill") { setBillingOrderId(order.id); setView("billing"); }
    else setView("order");
  };
  const startRoomCharge = (stay) => {
    const order = { id: uid("o"), tableId: null, tableName: null, roomNumber: stay.roomName, roomStayId: stay.id, items: [], status: "occupied", createdAt: Date.now(), closedAt: null, paymentMethod: null, roomCharged: null };
    setOrders([...orders, order]);
    setActiveOrderId(order.id);
    setView("order");
  };
  const updateOrder = (updated) => setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
  const requestBill = (order) => {
    setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: "bill" } : o)));
    if (order.tableId) setTables(tables.map((t) => (t.id === order.tableId ? { ...t, status: "bill" } : t)));
    setBillingOrderId(order.id);
    setView("billing");
  };
  const backToOrder = (order) => {
    setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: "occupied" } : o)));
    if (order.tableId) setTables(tables.map((t) => (t.id === order.tableId ? { ...t, status: "occupied" } : t)));
    setView("order");
  };
  const closeBill = (order, method, chosenStay) => {
    const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);
    const updated = { ...order, status: "paid", closedAt: Date.now(), paymentMethod: method, roomCharged: method === "room" ? chosenStay.roomName : null };
    setOrders(orders.map((o) => (o.id === order.id ? updated : o)));
    if (order.tableId) setTables(tables.map((t) => (t.id === order.tableId ? { ...t, status: "available" } : t)));
    if (method === "room" && chosenStay) {
      setStays(stays.map((s) => s.id === chosenStay.id
        ? { ...s, charges: [...s.charges, { id: uid("chg"), type: "restaurant", description: `Restaurant — ${order.tableId ? `Table ${order.tableName}` : "Room service"}`, amount: totals.total, date: Date.now() }] }
        : s));
    }
    showToast("Payment received");
    setActiveOrderId(null);
    setBillingOrderId(null);
    setReceipt({ kind: "order", id: order.id, snapshot: updated });
    setView("receipt");
  };
  const voidOrder = (order) => {
    setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: "void", closedAt: Date.now() } : o)));
    if (order.tableId) setTables(tables.map((t) => (t.id === order.tableId ? { ...t, status: "available" } : t)));
    showToast("Order voided");
    setActiveOrderId(null);
    setView("floor");
  };
  const goToFloor = () => { setActiveOrderId(null); setBillingOrderId(null); setView("floor"); };

  /* ---- accommodation flows ---- */
  const openRoom = (room) => {
    const stay = stays.find((s) => s.roomId === room.id && s.status === "checked_in");
    if (stay) { setActiveStayId(stay.id); setView("room-folio"); }
  };
  const checkIn = (room, { guestName, phone, checkOutDate }) => {
    const stay = { id: uid("s"), roomId: room.id, roomName: room.name, guestName, phone, checkInDate: todayStr(), checkOutDate, checkedInAt: Date.now(), checkedOutAt: null, status: "checked_in", charges: [], paymentMethod: null, closedAt: null };
    setStays([...stays, stay]);
    setRooms(rooms.map((r) => (r.id === room.id ? { ...r, status: "occupied" } : r)));
    showToast(`${guestName} checked into room ${room.name}`);
  };
  const checkOutStay = (stay, room, method) => {
    const nights = nightsBetween(stay.checkInDate, Date.now());
    const roomCharge = { id: uid("chg"), type: "room", description: `Room charge — ${nights} night(s) × ${money(room.rate, settings.currency, settings.decimals)}`, amount: nights * room.rate, date: Date.now() };
    const finalCharges = [roomCharge, ...stay.charges];
    const updated = { ...stay, status: "checked_out", checkedOutAt: Date.now(), closedAt: Date.now(), paymentMethod: method, charges: finalCharges };
    setStays(stays.map((s) => (s.id === stay.id ? updated : s)));
    setRooms(rooms.map((r) => (r.id === room.id ? { ...r, status: "vacant" } : r)));
    showToast("Guest checked out");
    setActiveStayId(null);
    setReceipt({ kind: "stay", id: stay.id, snapshot: updated });
    setView("receipt");
  };
  const voidStay = (stay) => {
    setStays(stays.map((s) => (s.id === stay.id ? { ...s, status: "void", closedAt: Date.now() } : s)));
    setRooms(rooms.map((r) => (r.id === stay.roomId ? { ...r, status: "vacant" } : r)));
    showToast("Check-in cancelled");
    setActiveStayId(null);
    setView("rooms");
  };
  const goToRooms = () => { setActiveStayId(null); setView("rooms"); };

  /* ---- printing ---- */
  const printNow = (data) => {
    setPrintPayload(data);
    setTimeout(() => window.print(), 60);
  };

  const openRoomCount = orders.filter((o) => !o.tableId && (o.status === "occupied" || o.status === "bill")).length;
  const occupiedRoomCount = rooms.filter((r) => r.status === "occupied").length;
  const activeStayRoom = activeStay ? rooms.find((r) => r.id === activeStay.roomId) : null;
  const receiptData = receipt
    ? (receipt.kind === "order" ? buildOrderReceipt(receipt.snapshot, receipt.snapshot.tableId ? { name: receipt.snapshot.tableName } : null, settings) : buildStayReceipt(receipt.snapshot))
    : null;

  return (
    <div className="hp-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .hp-shell {
          --bg: #1B1815; --panel: #24201C; --panel-raised: #2E2822;
          --accent: #C1874F; --accent-soft: #8A6239;
          --text: #F3ECE2; --text-muted: #9C9186; --border: #3A332C;
          --avail: #4E5B4F; --occ: #C1874F; --billc: #D4A24C; --danger: #B5483D;
          font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg);
          display: flex; height: 100vh; min-height: 640px; overflow: hidden; border-radius: 8px;
        }
        .hp-shell * { box-sizing: border-box; }
        .hp-shell h1, .hp-shell h2 { font-family: 'Space Grotesk', sans-serif; margin: 0; }
        .hp-shell input:focus, .hp-shell button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

        .hp-loading { padding: 40px; color: var(--text-muted); font-family: 'Inter', sans-serif; }

        .hp-sidebar { width: 176px; background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 16px 10px; flex-shrink: 0; }
        .hp-brand { display: flex; align-items: center; gap: 8px; padding: 6px 8px 20px; }
        .hp-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #1B1815; }
        .hp-brand-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: 0.06em; font-size: 14px; }
        .hp-nav { display: flex; flex-direction: column; gap: 3px; }
        .hp-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; background: none; border: none; color: var(--text-muted); border-radius: 7px; cursor: pointer; font-size: 13.5px; font-family: inherit; text-align: left; position: relative; }
        .hp-nav-item:hover { background: var(--panel-raised); color: var(--text); }
        .hp-nav-item.active { background: var(--panel-raised); color: var(--accent); }
        .hp-nav-badge { margin-left: auto; background: var(--billc); color: #1B1815; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 1px 6px; }

        .hp-topbar { height: 52px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 22px; flex-shrink: 0; }
        .hp-topbar-venue { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; }
        .hp-topbar-right { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 12.5px; }
        .hp-save-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--avail); }
        .hp-save-dot.saving { background: var(--billc); }
        .hp-topbar-clock { margin-left: 10px; font-variant-numeric: tabular-nums; }

        .hp-main-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .hp-view { padding: 22px 26px; overflow-y: auto; flex: 1; }
        .hp-view-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .hp-view-head h1 { font-size: 20px; }
        .hp-h2 { font-size: 15px; color: var(--text-muted); }

        .hp-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--panel); color: var(--text); padding: 8px 14px; border-radius: 7px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .hp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .hp-btn-accent { background: var(--accent); border-color: var(--accent); color: #1B1815; }
        .hp-btn-ghost { background: transparent; }
        .hp-btn-block { width: 100%; justify-content: center; margin-top: 14px; }
        .hp-icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 6px; border-radius: 6px; display: flex; }
        .hp-icon-btn:hover { background: var(--panel-raised); color: var(--text); }
        .hp-icon-btn-sm { padding: 4px; }

        .hp-section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 10px; font-weight: 600; }
        .hp-floor-section { margin-bottom: 26px; }
        .hp-table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 12px; }

        .hp-table { background: var(--panel); border: 1.5px solid var(--border); color: var(--text); cursor: pointer; padding: 12px 10px; display: flex; flex-direction: column; gap: 6px; text-align: left; font-family: inherit; min-height: 92px; }
        .hp-table-square { border-radius: 12px; }
        .hp-table-round { border-radius: 50% / 38%; }
        .hp-table-room { border-radius: 12px; border-style: dashed; }
        .hp-room-card { border-radius: 10px; }
        .hp-table-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 5px; }
        .hp-table-seats { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
        .hp-table-info { margin-top: auto; }
        .hp-table-total { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 13px; }
        .hp-table-time { display: flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--text-muted); }
        .hp-table-status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
        .hp-status-avail { border-color: var(--border); }
        .hp-status-avail .hp-table-status { color: var(--avail); }
        .hp-status-occ { border-color: var(--accent); background: linear-gradient(180deg, var(--panel-raised), var(--panel)); }
        .hp-status-occ .hp-table-status { color: var(--accent); }
        .hp-status-bill { border-color: var(--billc); animation: hp-pulse 1.8s ease-in-out infinite; }
        .hp-status-bill .hp-table-status { color: var(--billc); }
        @keyframes hp-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,162,74,0.35); } 50% { box-shadow: 0 0 0 5px rgba(212,162,74,0); } }

        .hp-empty { color: var(--text-muted); font-size: 13px; padding: 14px 0; }
        .hp-muted { color: var(--text-muted); }

        .hp-order-layout { display: flex; height: 100%; }
        .hp-order-ticket { width: 320px; border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; flex-shrink: 0; }
        .hp-order-ticket .hp-view-head { gap: 4px; }
        .hp-order-ticket h1 { font-size: 17px; }
        .hp-ticket-lines { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .hp-ticket-line { border-bottom: 1px solid var(--border); padding-bottom: 8px; }
        .hp-ticket-line-main { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 5px; }
        .hp-ticket-price { font-variant-numeric: tabular-nums; color: var(--text-muted); }
        .hp-ticket-line-controls { display: flex; align-items: center; gap: 6px; }
        .hp-stepper-btn { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel-raised); color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .hp-stepper-qty { min-width: 18px; text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; font-size: 13px; }
        .hp-stepper-remove { margin-left: auto; color: var(--danger); border-color: var(--danger); background: none; }
        .hp-ticket-totals { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 10px; }
        .hp-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); padding: 3px 0; font-variant-numeric: tabular-nums; }
        .hp-total-grand { color: var(--text); font-weight: 700; font-size: 15.5px; font-family: 'Space Grotesk', sans-serif; border-top: 1px solid var(--border); margin-top: 4px; padding-top: 8px; }
        .hp-ticket-actions { display: flex; gap: 8px; margin-top: 14px; }
        .hp-ticket-actions .hp-btn { flex: 1; justify-content: center; }

        .hp-order-menu { flex: 1; padding: 20px; display: flex; flex-direction: column; min-width: 0; }
        .hp-search-row { display: flex; align-items: center; gap: 8px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text-muted); margin-bottom: 12px; }
        .hp-search-input { background: none; border: none; color: var(--text); font-family: inherit; font-size: 13.5px; flex: 1; }
        .hp-search-input:focus { outline: none; }
        .hp-cat-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .hp-cat-tab { background: var(--panel); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 12px; border-radius: 999px; font-size: 12.5px; cursor: pointer; font-family: inherit; }
        .hp-cat-tab.active { background: var(--accent); border-color: var(--accent); color: #1B1815; font-weight: 600; }
        .hp-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; overflow-y: auto; align-content: start; }
        .hp-menu-item { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px; text-align: left; cursor: pointer; color: var(--text); font-family: inherit; display: flex; flex-direction: column; gap: 4px; }
        .hp-menu-item:hover { border-color: var(--accent); }
        .hp-menu-item-name { font-weight: 600; font-size: 13.5px; }
        .hp-menu-item-desc { font-size: 11.5px; color: var(--text-muted); line-height: 1.3; }
        .hp-menu-item-price { margin-top: auto; font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 700; font-size: 13px; }

        .hp-billing { max-width: 460px; }
        .hp-bill-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; }
        .hp-divider { height: 1px; background: var(--border); margin: 8px 0; }
        .hp-pay-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
        .hp-pay-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; background: var(--panel); border: 1.5px solid var(--border); border-radius: 10px; color: var(--text-muted); cursor: pointer; font-size: 12px; font-weight: 600; font-family: inherit; }
        .hp-pay-btn.active { border-color: var(--accent); color: var(--accent); background: var(--panel-raised); }
        .hp-room-input-row { margin-bottom: 12px; }
        .hp-stay-picker { display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto; }
        .hp-stay-option { display: flex; justify-content: space-between; align-items: center; background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 12px; cursor: pointer; color: var(--text); font-family: inherit; }
        .hp-stay-option.active { border-color: var(--accent); background: var(--panel-raised); }
        .hp-stay-room { font-weight: 600; font-size: 13px; }
        .hp-stay-guest { color: var(--text-muted); font-size: 12px; }
        .hp-receipt-kind-inline { color: var(--text-muted); font-size: 12.5px; margin-bottom: 8px; }

        .hp-field-label { display: block; font-size: 11.5px; color: var(--text-muted); margin: 10px 0 5px; text-transform: uppercase; letter-spacing: 0.04em; }
        .hp-input { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 9px 11px; color: var(--text); font-family: inherit; font-size: 13.5px; }
        .hp-input:focus { outline: none; border-color: var(--accent); }
        .hp-input-sm { padding: 7px 9px; }
        .hp-settings-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        .hp-history-search { max-width: 340px; }
        .hp-history-list { display: flex; flex-direction: column; gap: 8px; }
        .hp-history-row { background: var(--panel); border: 1px solid var(--border); border-radius: 9px; overflow: hidden; }
        .hp-history-summary { width: 100%; display: grid; grid-template-columns: 92px 1fr 90px 130px 100px; align-items: center; gap: 10px; padding: 12px 16px; background: none; border: none; color: var(--text); cursor: pointer; font-family: inherit; text-align: left; }
        .hp-history-type { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em; }
        .hp-history-label { font-weight: 600; font-size: 13.5px; }
        .hp-history-badge { font-size: 10.5px; text-transform: uppercase; font-weight: 700; padding: 2px 8px; border-radius: 999px; width: fit-content; }
        .hp-history-paid { color: var(--avail); background: rgba(78,91,79,0.25); }
        .hp-history-void { color: var(--danger); background: rgba(181,72,61,0.2); }
        .hp-history-date { color: var(--text-muted); font-size: 12px; }
        .hp-history-total { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
        .hp-history-detail { padding: 0 16px 14px; }
        .hp-history-meta { color: var(--text-muted); font-size: 12px; margin-top: 6px; }

        .hp-menu-manager-layout { display: flex; gap: 22px; }
        .hp-cat-sidebar { width: 170px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .hp-cat-sidebar-item { display: flex; align-items: center; background: var(--panel); border: 1px solid var(--border); border-radius: 7px; }
        .hp-cat-sidebar-item.active { border-color: var(--accent); }
        .hp-cat-sidebar-btn { flex: 1; background: none; border: none; color: var(--text); text-align: left; padding: 8px 10px; font-family: inherit; font-size: 13px; cursor: pointer; }
        .hp-menu-items-panel { flex: 1; min-width: 0; }
        .hp-menu-manage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
        .hp-menu-manage-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px; position: relative; }
        .hp-menu-manage-actions { display: flex; gap: 2px; position: absolute; top: 8px; right: 8px; }

        .hp-table-list { display: flex; flex-direction: column; gap: 4px; }
        .hp-table-list-row { display: grid; grid-template-columns: 60px 1fr 80px 30px; align-items: center; gap: 8px; padding: 7px 4px; border-bottom: 1px solid var(--border); font-size: 13px; }
        .hp-room-list-row { display: grid; grid-template-columns: 60px 80px 110px 30px; align-items: center; gap: 8px; padding: 7px 4px; border-bottom: 1px solid var(--border); font-size: 13px; }
        .hp-settings-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; max-width: 640px; }

        .hp-modal-veil { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .hp-modal { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; }
        .hp-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 600; font-family: 'Space Grotesk', sans-serif; }
        .hp-modal-body { padding: 6px 16px 16px; }

        .hp-toast { position: fixed; bottom: 20px; right: 20px; background: var(--panel-raised); border: 1px solid var(--accent); color: var(--text); padding: 10px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 13px; z-index: 60; }

        .hp-print-only { display: none; }
        @media print {
          .hp-shell { height: auto !important; overflow: visible !important; background: #fff !important; border-radius: 0 !important; }
          .hp-shell > *:not(.hp-print-only) { display: none !important; }
          .hp-print-only { display: block !important; }
          .hp-receipt-paper { width: 280px; margin: 0 auto; color: #111; font-family: 'Space Grotesk', monospace; padding: 12px 0; }
          .hp-receipt-venue { font-weight: 700; font-size: 15px; text-align: center; }
          .hp-receipt-kind { text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #555; margin-bottom: 6px; }
          .hp-receipt-meta { font-size: 11px; color: #333; text-align: center; }
          .hp-receipt-rule { border-top: 1px dashed #999; margin: 8px 0; }
          .hp-receipt-line { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
          .hp-receipt-total { font-weight: 700; font-size: 13.5px; }
          .hp-receipt-thanks { text-align: center; margin-top: 10px; font-size: 12px; }
        }
      `}</style>

      <Sidebar
        view={view === "order" || view === "billing" || view === "receipt" && receipt?.kind === "order" ? "floor" : (view === "room-folio" || (view === "receipt" && receipt?.kind === "stay") ? "rooms" : view)}
        setView={(v) => { setActiveOrderId(null); setBillingOrderId(null); setActiveStayId(null); setReceipt(null); setView(v); }}
        openRoomCount={openRoomCount}
        occupiedRoomCount={occupiedRoomCount}
      />

      <div className="hp-main-col">
        <TopBar venueName={settings.venueName} saveStatus={saveStatus} />

        {view === "floor" && (
          <FloorView tables={tables} orders={orders} settings={settings} checkedInStays={checkedInStays} openTable={openTable} openRoomOrder={openRoomOrder} startRoomCharge={startRoomCharge} />
        )}

        {view === "order" && activeOrder && (
          <OrderScreen
            order={activeOrder}
            table={tableFor(activeOrder)}
            categories={categories}
            menuItems={menuItems}
            settings={settings}
            updateOrder={updateOrder}
            goBack={goToFloor}
            requestBill={requestBill}
            voidOrder={voidOrder}
          />
        )}

        {view === "billing" && billingOrder && (
          <BillingScreen
            order={billingOrder}
            table={tableFor(billingOrder)}
            settings={settings}
            checkedInStays={checkedInStays}
            backToOrder={() => backToOrder(billingOrder)}
            closeBill={closeBill}
          />
        )}

        {view === "rooms" && (
          <RoomBoard rooms={rooms} stays={stays} settings={settings} openRoom={openRoom} checkIn={checkIn} />
        )}

        {view === "room-folio" && activeStay && activeStayRoom && (
          <RoomFolio stay={activeStay} room={activeStayRoom} settings={settings} goBack={goToRooms} checkOutStay={checkOutStay} voidStay={voidStay} />
        )}

        {view === "receipt" && receiptData && (
          <ReceiptScreen
            data={receiptData}
            settings={settings}
            onPrint={() => printNow(receiptData)}
            onDone={() => { setReceipt(null); setView(receipt.kind === "order" ? "floor" : "rooms"); }}
          />
        )}

        {view === "history" && <HistoryScreen orders={orders} stays={stays} settings={settings} onPrint={printNow} />}

        {view === "menu" && (
          <MenuManager categories={categories} menuItems={menuItems} settings={settings} setCategories={setCategories} setMenuItems={setMenuItems} />
        )}

        {view === "settings" && (
          <SettingsScreen settings={settings} setSettings={setSettings} tables={tables} setTables={setTables} rooms={rooms} setRooms={setRooms} />
        )}
      </div>

      <div className="hp-print-only">
        <PrintReceipt data={printPayload} settings={settings} />
      </div>

      <Toast toast={toast} />
    </div>
  );
}
