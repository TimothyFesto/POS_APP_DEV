import { useState, useEffect, useRef, Fragment } from "react";
import {
  LayoutGrid, Receipt, History, Settings, Plus, Minus, X, Search,
  DoorOpen, CreditCard, Banknote, Users, Clock, Check, ChevronLeft,
  UtensilsCrossed, ChefHat, Pencil, Trash2, ArrowLeftRight, BedDouble,
  BedSingle, Printer, Calendar, Phone, Soup, Package, CalendarDays,
  UsersRound, BookUser, ListChecks, Wallet, ArrowLeft, Sparkles,
  FileText, Upload, Star, ShieldCheck, DatabaseBackup, LogOut,
  TrendingUp, AlertTriangle, RotateCcw, FolderOpen, UserPlus, Lock,
  Mail, Briefcase, Download, CalendarPlus, CircleCheck, Circle,
  Presentation, Zap, Wrench, LayoutDashboard, Crown, Eye, EyeOff, Building2, Code, GripVertical,
  Sun, Moon, Monitor, Smartphone,
} from "lucide-react";
import loginBg from "./assets/login-bg.png";

/* ---------------------------------- data ---------------------------------- */

const DEFAULT_SETTINGS = {
  venueName: "G2 Guest House",
  currency: "USh ",
  decimals: 0,
  taxRate: 0,
  serviceRate: 0,
  documentNumberDigits: 5,
  receiptWidth: "80mm",
};

// mm→px at 96dpi, minus a small margin for the printer's own unprintable
// edge — used both for the on-screen/PDF preview width and, via @page,
// for actual thermal roll printing (see the print-time <style> injection
// in the App component).
const RECEIPT_WIDTHS = { "80mm": 296, "58mm": 213 };

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
  { id: "t3", name: "T3", section: "Main Dining", seats: 4, shape: "square", status: "available" },
  { id: "t4", name: "T4", section: "Main Dining", seats: 4, shape: "square", status: "available" },
  { id: "t5", name: "T5", section: "Main Dining", seats: 4, shape: "round", status: "available" },
  { id: "t6", name: "T6", section: "Main Dining", seats: 4, shape: "round", status: "available" },
  { id: "t7", name: "T7", section: "Main Dining", seats: 4, shape: "round", status: "available" },
  { id: "t8", name: "T8", section: "Main Dining", seats: 4, shape: "round", status: "available" },
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

const APPS = [
  { id: "floor", label: "Restaurant", icon: Soup, color: "#C1874F", implemented: true, blurb: "Tables, orders & bills" },
  { id: "rooms", label: "Accommodation", icon: BedDouble, color: "#6B8F71", implemented: true, blurb: "Rooms, check-in & folios" },
  { id: "menu", label: "Menu", icon: UtensilsCrossed, color: "#B5843D", implemented: true, blurb: "Dishes, prices & categories" },
  { id: "documents", label: "Documents", icon: FileText, color: "#5E7A8C", implemented: true, blurb: "Templates & letterheads" },
  { id: "inventory", label: "Inventory", icon: Package, color: "#5B7DB1", implemented: true, blurb: "Stock, purchases & recipes" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, color: "#A65D57", implemented: true, blurb: "Reservations & availability" },
  { id: "hr", label: "Human Resources", icon: UsersRound, color: "#7D6BA6", implemented: true, blurb: "Staff directory" },
  { id: "contacts", label: "Contacts", icon: BookUser, color: "#4E8577", implemented: true, blurb: "Guests & suppliers" },
  { id: "todo", label: "To-do", icon: ListChecks, color: "#C2703D", implemented: true, blurb: "Tasks & reminders" },
  { id: "accounting", label: "Reports & Accounting", icon: Wallet, color: "#597A45", implemented: true, blurb: "Sales, revenue & lookups" },
  { id: "conference", label: "Conference Facility", icon: Presentation, color: "#6B5B95", implemented: true, blurb: "Meeting room bookings" },
  { id: "runningcosts", label: "Running Costs", icon: Zap, color: "#B5651D", implemented: true, blurb: "Utilities & operating bills" },
  { id: "maintenance", label: "Maintenance & Repairs", icon: Wrench, color: "#5C6B73", implemented: true, blurb: "Renovations & repairs" },
  { id: "dashboard", label: "Business Dashboard", icon: LayoutDashboard, color: "#3E6B8A", implemented: true, blurb: "Revenue trends & profit" },
  { id: "attendance", label: "Attendance", icon: Clock, color: "#6B7A5E", implemented: true, blurb: "Clock in/out & timesheets" },
];

// Which Home tiles each role sees — matches the role/access table agreed
// on for the login proposal. `null` means "sees everything" (admin).
// "staff" is kept as a legacy default (existing accounts not yet
// reassigned to a specific role) and given the same narrow view as
// Cashier, the most common day-to-day case. This only controls what's
// *shown* on Home — the backend still enforces its own permission
// checks independently, so this is a convenience filter, not the
// security boundary itself.
const ROLE_ACCESS = {
  admin: null,
  manager: ["floor", "rooms", "menu", "documents", "inventory", "calendar", "contacts", "todo", "accounting", "conference", "runningcosts", "maintenance", "dashboard", "attendance"],
  hr: ["hr", "attendance", "calendar"],
  cashier: ["floor", "menu", "documents", "calendar"],
  receptionist: ["rooms", "calendar", "contacts", "conference", "documents"],
  staff: ["floor", "menu", "documents", "calendar"],
};
const appsForRole = (role, accessMap = ROLE_ACCESS, extraTileIds = []) => {
  if (role === "admin") return APPS;
  const allowed = accessMap[role];
  const baseIds = allowed === null || allowed === undefined ? APPS.map((a) => a.id) : allowed;
  const allIds = new Set([...baseIds, ...extraTileIds]);
  return APPS.filter((a) => allIds.has(a.id));
};

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const money = (n, cur, decimals = 2) =>
  `${cur}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

// Payment methods are stored as short lowercase codes ("cash", "card",
// "mobile_money", "room") since those are also what backend reports
// group by — this is the one place that turns a code into what someone
// actually reads on a receipt or in a report.
const PAYMENT_METHOD_LABELS = { cash: "cash", card: "card", mobile_money: "Mobile Money", transfer: "bank transfer" };
const formatPaymentMethod = (pm, roomCharged) => {
  if (pm === "room") return `room charge${roomCharged ? ` (room ${roomCharged})` : ""}`;
  return PAYMENT_METHOD_LABELS[pm] || pm || "—";
};

// Rounds a monetary value to whole cents (2dp) regardless of display
// decimals, so repeated addition/multiplication (line totals, tax,
// service, recipe costs) never accumulates floating-point drift in
// what actually gets stored in the ledger.
const roundMoney = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Local calendar date as YYYY-MM-DD — deliberately NOT toISOString(),
// which is UTC and can silently roll over to the wrong day near
// midnight in any timezone ahead or behind UTC.
function toLocalDateStr(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const todayStr = () => toLocalDateStr(Date.now());

function elapsed(ts) {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// Nights stayed = difference between calendar DATES, not elapsed hours.
// A guest who checks in on the 10th and checks out any time on the 11th
// has stayed 1 night — not 2, even though more than 24 raw hours may
// have passed. This matches standard hotel billing convention. Minimum
// is always 1 night (no such thing as a zero-night stay).
function nightsBetween(checkInDateStr, referenceTs) {
  const checkIn = new Date(`${checkInDateStr}T00:00:00`);
  const reference = new Date(`${toLocalDateStr(referenceTs)}T00:00:00`);
  const diffDays = Math.round((reference - checkIn) / 86400000);
  return Math.max(1, diffDays);
}

// The nights figure shown while a stay is still active should reflect
// whichever is longer: nights actually elapsed, or the planned length of
// stay implied by the checkout date given at check-in. Without this, a
// guest booked for a week still shows "1 night" on day one.
function currentStayNights(stay) {
  const elapsed = nightsBetween(stay.checkInDate, Date.now());
  if (!stay.checkOutDate) return elapsed;
  const planned = nightsBetween(stay.checkInDate, new Date(`${stay.checkOutDate}T00:00:00`).getTime());
  return Math.max(elapsed, planned);
}

// Hours between two "HH:MM" time strings — used to bill hourly conference
// bookings by actual occupied duration rather than a flat rate. Returns
// null for missing/invalid/non-positive ranges, so the caller can fall
// back to the flat hourly rate instead of silently computing zero.
function computeHours(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff / 60 : null;
}

async function loadJSON(key, shared) {
  try {
    const r = await window.storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function saveJSON(key, obj, shared) {
  try {
    await window.storage.set(key, JSON.stringify(obj), shared);
    return true;
  } catch {
    return false;
  }
}

// True only inside the desktop (Electron) build — the browser preview
// has no window.api, so documents/reports/users/backups gracefully
// stay unavailable there rather than pretending to work.
const isDesktop = typeof window !== "undefined" && !!window.api;

async function syncTransactionToLedger(order, table, settings, user) {
  if (!isDesktop) return null;
  const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);
  try {
    const result = await window.api.ledger.recordTransaction({
      id: order.id,
      kind: "restaurant",
      refLabel: table ? `Table ${table.name}` : `Room ${order.roomNumber} (room service)`,
      guestName: null,
      subtotal: totals.subtotal, tax: totals.tax, service: totals.service, total: totals.total,
      paymentMethod: order.paymentMethod, roomCharged: order.roomCharged,
      status: order.status === "void" ? "void" : "paid",
      userId: user?.id, userName: user?.name,
      items: order.items.map((it) => ({ name: it.name, qty: it.qty, amount: it.price * it.qty, menuItemId: it.menuItemId })),
      createdAt: order.createdAt, closedAt: order.closedAt || Date.now(),
    });
    return result?.receiptRef || null;
  } catch { return null; /* non-fatal: local state already has the record */ }
}

async function syncStayToLedger(stay, user) {
  if (!isDesktop) return null;
  const total = stay.charges.reduce((s, c) => s + c.amount, 0);
  try {
    const result = await window.api.ledger.recordTransaction({
      id: stay.id,
      kind: "accommodation",
      refLabel: `Room ${stay.roomName}`,
      guestName: stay.guestName,
      subtotal: total, tax: 0, service: 0, total,
      paymentMethod: stay.paymentMethod, roomCharged: null,
      status: stay.status === "void" ? "void" : "paid",
      userId: user?.id, userName: user?.name,
      items: stay.charges.map((c) => ({ name: c.description, qty: 1, amount: c.amount })),
      createdAt: stay.checkedInAt, closedAt: stay.closedAt || Date.now(),
    });
    return result?.receiptRef || null;
  } catch { return null; /* non-fatal */ }
}

function calcTotals(items, taxRate, serviceRate) {
  const subtotal = roundMoney(items.reduce((s, it) => s + it.price * it.qty, 0));
  const tax = roundMoney(subtotal * taxRate);
  const service = roundMoney(subtotal * serviceRate);
  return { subtotal, tax, service, total: roundMoney(subtotal + tax + service) };
}

function buildOrderReceipt(order, table, settings) {
  const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);
  return {
    kind: "Restaurant",
    label: table ? `Table ${table.name}` : order.isTakeaway ? "Take-away" : `Room ${order.roomNumber} — room service`,
    sub: null,
    date: order.closedAt || Date.now(),
    items: order.items.map((it) => ({ qty: it.qty, name: it.name, amount: it.price * it.qty })),
    subtotal: totals.subtotal,
    tax: totals.tax,
    service: totals.service,
    total: totals.total,
    paymentMethod: order.paymentMethod,
    roomCharged: order.roomCharged,
    receiptNo: order.receiptRef || order.id,
    transactionId: order.id,
    invoiceRef: order.invoiceRef || null,
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
    receiptNo: stay.receiptRef || stay.id,
    transactionId: stay.id,
    invoiceRef: stay.invoiceRef || null,
  };
}

function buildConferenceReceipt(booking, settings) {
  const label = `${booking.room_name} — ${booking.event_date}${booking.start_time ? ` (${booking.start_time}–${booking.end_time || ""})` : ""}`;
  return {
    kind: "Conference",
    label: booking.room_name,
    sub: booking.client_name,
    date: booking.closedAt || Date.now(),
    items: [{ qty: 1, name: label, amount: booking.amount }],
    subtotal: booking.amount,
    tax: 0,
    service: 0,
    total: booking.amount,
    paymentMethod: booking.paymentMethod,
    roomCharged: null,
    receiptNo: booking.receiptRef || booking.id,
    transactionId: booking.id,
    invoiceRef: null,
  };
}

// Builds and downloads a CSV file entirely client-side — no IPC needed,
// works the same in the browser preview and the desktop app.
function downloadCSV(filename, headers, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* --------------------------------- date bucketing (dashboard) ------------- */

function bucketKeyFor(ts, granularity) {
  const d = new Date(ts);
  if (granularity === "day") return toLocalDateStr(ts);
  if (granularity === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (granularity === "year") return String(d.getFullYear());
  // week: keyed by that week's Monday
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
  return toLocalDateStr(monday.getTime());
}
const bucketLabel = (key, granularity) => (granularity === "day" || granularity === "week" ? key.slice(5) : key);

function generateBuckets(granularity) {
  const counts = { day: 30, week: 12, month: 12, year: 5 };
  const count = counts[granularity];
  const now = new Date();
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (granularity === "day") d.setDate(d.getDate() - i);
    else if (granularity === "week") d.setDate(d.getDate() - i * 7);
    else if (granularity === "month") d.setMonth(d.getMonth() - i, 1);
    else if (granularity === "year") d.setFullYear(d.getFullYear() - i, 0, 1);
    keys.push(bucketKeyFor(d.getTime(), granularity));
  }
  return [...new Set(keys)];
}

function boundsForGranularity(granularity) {
  const now = new Date();
  let start;
  if (granularity === "day") { start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0); }
  else if (granularity === "week") { start = new Date(now); start.setDate(start.getDate() - 11 * 7); start.setHours(0, 0, 0, 0); }
  else if (granularity === "month") { start = new Date(now.getFullYear(), now.getMonth() - 11, 1); }
  else { start = new Date(now.getFullYear() - 4, 0, 1); }
  return { from: start.getTime(), to: Date.now() };
}

function bucketRevenue(rows, granularity, bucketKeys) {
  const map = {};
  for (const k of bucketKeys) map[k] = { restaurant: 0, accommodation: 0, conference: 0, total: 0 };
  for (const r of rows) {
    const k = bucketKeyFor(r.closed_at, granularity);
    if (!map[k]) continue;
    map[k][r.kind] = (map[k][r.kind] || 0) + r.total;
    map[k].total += r.total;
  }
  return bucketKeys.map((k) => ({ key: k, ...map[k] }));
}
function bucketCogs(rows, granularity, bucketKeys) {
  const map = {};
  for (const k of bucketKeys) map[k] = 0;
  for (const r of rows) {
    const k = bucketKeyFor(r.closed_at, granularity);
    if (map[k] === undefined) continue;
    map[k] += r.cogs;
  }
  return bucketKeys.map((k) => map[k]);
}
function bucketExpenses(rows, granularity, bucketKeys) {
  const map = {};
  for (const k of bucketKeys) map[k] = 0;
  for (const r of rows) {
    const k = bucketKeyFor(new Date(`${r.date}T00:00:00`).getTime(), granularity);
    if (map[k] === undefined) continue;
    map[k] += r.amount;
  }
  return bucketKeys.map((k) => map[k]);
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

function PrintReceipt({ data, settings, letterheadPath }) {
  if (!data) return null;
  const docLabel = data.docType || `${data.kind} receipt`;
  const showPrices = data.docType !== "Delivery Note";
  return (
    <div className="hp-receipt-paper" style={{ "--receipt-width": `${RECEIPT_WIDTHS[settings.receiptWidth] || RECEIPT_WIDTHS["80mm"]}px` }}>
      {letterheadPath && <img className="hp-receipt-logo" src={`file://${letterheadPath}`} alt="" />}
      <div className="hp-receipt-venue">{settings.venueName}</div>
      <div className="hp-receipt-kind">{docLabel}</div>
      <div className="hp-receipt-meta">{data.label}{data.sub ? ` · ${data.sub}` : ""}</div>
      <div className="hp-receipt-meta">{new Date(data.date).toLocaleString()}</div>
      <div className="hp-receipt-rule" />
      {showPrices && (
        <div className="hp-receipt-item-row hp-receipt-item-head">
          <span>Item</span><span>Qty</span><span>Amount</span>
        </div>
      )}
      {data.items.map((it, i) => (
        showPrices ? (
          <div key={i} className="hp-receipt-item-row">
            <span>{it.name}</span>
            <span>{it.qty}</span>
            <span>{money(it.amount, settings.currency, settings.decimals)}</span>
          </div>
        ) : (
          <div key={i} className="hp-receipt-line">
            <span>{it.qty > 1 ? `${it.qty} × ` : ""}{it.name}</span>
          </div>
        )
      ))}
      <div className="hp-receipt-rule" />
      {showPrices && <div className="hp-receipt-line"><span>Subtotal</span><span>{money(data.subtotal, settings.currency, settings.decimals)}</span></div>}
      {showPrices && <div className="hp-receipt-line"><span>Tax</span><span>{money(data.tax, settings.currency, settings.decimals)}</span></div>}
      {showPrices && <div className="hp-receipt-line"><span>Service</span><span>{money(data.service, settings.currency, settings.decimals)}</span></div>}
      {showPrices && <div className="hp-receipt-line hp-receipt-total"><span>Total</span><span>{money(data.total, settings.currency, settings.decimals)}</span></div>}
      <div className="hp-receipt-rule" />
      {showPrices && <div className="hp-receipt-meta">Paid via {formatPaymentMethod(data.paymentMethod, data.roomCharged)}</div>}
      <div className="hp-receipt-meta">Reference #{data.receiptNo}</div>
      {data.docType === "Delivery Note" && (
        <div className="hp-receipt-signature">
          <div>Received by: ______________________</div>
          <div style={{ marginTop: 10 }}>Signature: ______________________</div>
        </div>
      )}
      <div className="hp-receipt-thanks">Thank you</div>
    </div>
  );
}

/* --------------------------------- home ----------------------------------- */

function HomeView({ venueName, openApp, openRoomCount, occupiedRoomCount, role, roleAccessConfig, grantedTiles, grantExpiresAt, currentUser }) {
  const baseApps = appsForRole(role, roleAccessConfig || ROLE_ACCESS, grantedTiles || []);
  const orderKey = currentUser?.id ? `pos:tile-order:${currentUser.id}` : null;

  const [order, setOrder] = useState(null); // saved id order, or null = default
  const [editMode, setEditMode] = useState(false);
  const dragIdRef = useRef(null);

  useEffect(() => {
    if (!orderKey) { setOrder(null); return; }
    loadJSON(orderKey, false).then((saved) => setOrder(Array.isArray(saved) ? saved : null));
  }, [orderKey]);

  // Tiles in the saved order first, then anything not in that saved list
  // appended afterward in its normal default position — so a tile that
  // becomes newly visible (a role change, a fresh temporary grant) never
  // silently disappears just because an older saved layout predates it.
  const apps = (() => {
    if (!order) return baseApps;
    const byId = Object.fromEntries(baseApps.map((a) => [a.id, a]));
    const ordered = order.map((id) => byId[id]).filter(Boolean);
    const remaining = baseApps.filter((a) => !order.includes(a.id));
    return [...ordered, ...remaining];
  })();

  const persistOrder = (nextApps) => {
    const ids = nextApps.map((a) => a.id);
    setOrder(ids);
    if (orderKey) saveJSON(orderKey, ids, false);
  };

  const handleDrop = (targetId) => {
    const dragId = dragIdRef.current;
    dragIdRef.current = null;
    if (!dragId || dragId === targetId) return;
    const current = apps.slice();
    const from = current.findIndex((a) => a.id === dragId);
    const to = current.findIndex((a) => a.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    persistOrder(current);
  };

  const resetOrder = () => {
    setOrder(null);
    if (orderKey) window.storage.delete(orderKey, false);
  };

  return (
    <div className="hp-view hp-home">
      <div className="hp-home-head">
        <div className="hp-home-eyebrow">Welcome back</div>
        <h1>{venueName}</h1>
        <div className="hp-home-toolbar">
          {editMode ? (
            <>
              <button className="hp-btn hp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={resetOrder}>Reset order</button>
              <button className="hp-btn hp-btn-accent" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setEditMode(false)}>Done</button>
            </>
          ) : (
            <button className="hp-btn hp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setEditMode(true)}><GripVertical size={13} /> Rearrange</button>
          )}
        </div>
      </div>
      {editMode && <div className="hp-empty" style={{ marginBottom: 4 }}>Drag a tile to move it — your layout is saved just for you.</div>}
      {grantedTiles && grantedTiles.length > 0 && (
        <div className="hp-grant-banner">
          <ShieldCheck size={14} />
          Temporary access: {grantedTiles.map((t) => APPS.find((a) => a.id === t)?.label || t).join(", ")}
          {grantExpiresAt && <> — until {new Date(grantExpiresAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</>}
        </div>
      )}
      <div className="hp-app-grid">
        {apps.map((app) => (
          <button
            key={app.id}
            className={`hp-app-tile ${editMode ? "hp-app-tile-editing" : ""}`}
            draggable={editMode}
            onDragStart={() => { dragIdRef.current = app.id; }}
            onDragOver={(e) => { if (editMode) e.preventDefault(); }}
            onDrop={(e) => { if (editMode) { e.preventDefault(); handleDrop(app.id); } }}
            onClick={() => { if (!editMode) openApp(app); }}
          >
            {editMode && <div className="hp-app-drag-handle"><GripVertical size={14} /></div>}
            <div className="hp-app-icon" style={{ background: app.color }}>
              <app.icon size={26} color="#fff" />
              {app.id === "floor" && openRoomCount > 0 && <span className="hp-app-badge">{openRoomCount}</span>}
              {app.id === "rooms" && occupiedRoomCount > 0 && <span className="hp-app-badge">{occupiedRoomCount}</span>}
            </div>
            <div className="hp-app-label">{app.label}</div>
            <div className="hp-app-blurb">{app.blurb}</div>
            {!app.implemented && <div className="hp-app-soon">Coming soon</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaceholderView({ app, goHome }) {
  return (
    <div className="hp-view hp-placeholder">
      <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /> </button>
      <div className="hp-placeholder-icon" style={{ background: app.color }}>
        <app.icon size={32} color="#fff" />
      </div>
      <h1>{app.label}</h1>
      <p className="hp-placeholder-text"><Sparkles size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />This department isn't built out yet — just say the word and it can be added next.</p>
      <button className="hp-btn hp-btn-accent" onClick={goHome}>Back to Home</button>
    </div>
  );
}

/* --------------------------------- login (desktop) ------------------------ */

function LoginGate({ onLogin, settings }) {
  const [hasUsers, setHasUsers] = useState(null);
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [forgotMsg, setForgotMsg] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupPin2, setSetupPin2] = useState("");
  const [bootstrapped, setBootstrapped] = useState(null);
  const [version, setVersion] = useState("");

  useEffect(() => { window.api.users.hasAny().then(setHasUsers); }, []);
  useEffect(() => { window.api.app.getVersion().then(setVersion).catch(() => {}); }, []);

  const submitLogin = async () => {
    if (!staffId.trim() || pin.length < 4) return;
    const user = await window.api.users.login({ staffId: staffId.trim(), pin });
    if (user) onLogin(user);
    else { setError("Incorrect Staff ID or PIN"); setPin(""); }
  };
  const submitSetup = async () => {
    if (!setupName.trim() || setupPin.length < 4) { setError("Enter a name and a PIN of at least 4 digits"); return; }
    if (setupPin !== setupPin2) { setError("PINs don't match"); return; }
    const user = await window.api.users.create({ name: setupName.trim(), pin: setupPin, role: "admin" });
    setBootstrapped(user);
  };

  if (hasUsers === null) return <div className="hp-loading">Loading…</div>;

  // Right after creating the very first account, show the assigned
  // Staff ID clearly before proceeding — otherwise there'd be no way to
  // know it for next time.
  if (bootstrapped) {
    return (
      <div className="hp-login-shell">
        <div className="hp-login-bg" style={{ backgroundImage: `url(${loginBg})` }} />
        <div className="hp-login-card" style={{ position: "relative", zIndex: 1 }}>
          <div className="hp-login-mark"><Crown size={26} color="#fff" /></div>
          <h1>Account created</h1>
          <p className="hp-login-sub">Your Staff ID is <strong style={{ color: "var(--accent)" }}>{bootstrapped.staffId}</strong> — you'll use this together with your PIN to sign in from now on.</p>
          <button className="hp-btn hp-btn-accent hp-btn-block" onClick={() => onLogin(bootstrapped)}>Continue <ArrowLeftRight size={15} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-login-shell">
      <div className="hp-login-bg" style={{ backgroundImage: `url(${loginBg})` }} />
      <div className="hp-login-content">
        <div className="hp-login-main">
          <div className="hp-login-brandmark">
            <Crown size={28} color="var(--accent)" />
            <h1 className="hp-login-wordmark">{settings.venueName?.toUpperCase() || "M GENERATION II"} <span style={{ color: "var(--accent)" }}>POS</span></h1>
            <div className="hp-login-tagline">Hospitality Management System</div>
          </div>

          <div className="hp-login-card">
            {hasUsers ? (
              <>
                <label className="hp-field-label">Staff ID</label>
                <div className="hp-login-input-wrap">
                  <Users size={16} className="hp-login-input-icon" />
                  <input
                    autoFocus className="hp-input hp-login-input" inputMode="numeric" placeholder="Enter staff ID"
                    value={staffId} onChange={(e) => { setStaffId(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && document.getElementById("hp-login-pin-input")?.focus()}
                  />
                </div>
                <label className="hp-field-label">Password / PIN</label>
                <div className="hp-login-input-wrap">
                  <Lock size={16} className="hp-login-input-icon" />
                  <input
                    id="hp-login-pin-input"
                    className="hp-input hp-login-input" type={showPin ? "text" : "password"} inputMode="numeric" maxLength={8} placeholder="Enter password or PIN"
                    value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && submitLogin()}
                  />
                  <button type="button" className="hp-login-eye" onClick={() => setShowPin((s) => !s)} tabIndex={-1}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <div className="hp-login-error">{error}</div>}
                <button className="hp-btn hp-btn-accent hp-btn-block hp-login-submit" disabled={!staffId.trim() || pin.length < 4} onClick={submitLogin}>
                  SIGN IN <ArrowLeftRight size={15} />
                </button>
                <button type="button" className="hp-login-forgot" onClick={() => setForgotMsg(true)}>Forgot password?</button>
                {forgotMsg && <div className="hp-login-sub" style={{ marginTop: 8 }}>Ask an admin to reset your PIN from Settings → Staff & Security — there's no self-service reset, by design, since this app can run fully offline.</div>}
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 16, marginBottom: 4 }}>Set up the first admin account</h1>
                <p className="hp-login-sub">This account can manage staff, backups, and settings.</p>
                <label className="hp-field-label">Name</label>
                <input className="hp-input" value={setupName} onChange={(e) => setSetupName(e.target.value)} />
                <label className="hp-field-label">PIN (4+ digits)</label>
                <input className="hp-input" type="password" inputMode="numeric" value={setupPin} onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))} />
                <label className="hp-field-label">Confirm PIN</label>
                <input className="hp-input" type="password" inputMode="numeric" value={setupPin2} onChange={(e) => setSetupPin2(e.target.value.replace(/\D/g, ""))} />
                {error && <div className="hp-login-error">{error}</div>}
                <button className="hp-btn hp-btn-accent hp-btn-block" onClick={submitSetup}>Create account & continue</button>
              </>
            )}
          </div>
        </div>

        <div className="hp-login-footer">
          <div className="hp-login-footer-venue">
            <Building2 size={18} />
            <div>
              <div className="hp-login-footer-name">{settings.venueName || "G2 Guest House"}</div>
              <div className="hp-login-footer-sub">Hospitality Management System</div>
            </div>
          </div>
          <div className="hp-login-footer-links">
            <span><Code size={13} /> Developed by Tim</span>
          </div>
          <div className="hp-login-footer-meta">
            {version && <div>v{version}</div>}
            <div>© {new Date().getFullYear()} All rights reserved.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- documents ------------------------------- */

const DOC_CATEGORIES = [
  { id: "letterhead", label: "Letterhead / Logo" },
  { id: "receipt", label: "Receipt template" },
  { id: "invoice", label: "Invoice template" },
  { id: "delivery_note", label: "Delivery note template" },
  { id: "other", label: "Other documents" },
];

function DocumentsView({ currentUser, goHome, showToast, onLetterheadChange }) {
  const [docs, setDocs] = useState([]);

  const refresh = async () => setDocs(await window.api.documents.list());
  useEffect(() => { refresh(); }, []);

  const upload = async (category) => {
    const doc = await window.api.documents.add({ category, actingUser: currentUser });
    if (doc) { showToast(`${doc.filename} uploaded`); refresh(); }
  };
  const setActive = async (doc) => {
    await window.api.documents.setActive({ id: doc.id, category: doc.category, actingUser: currentUser });
    refresh();
    if (doc.category === "letterhead") { onLetterheadChange?.(); showToast(`${doc.filename} is now the active letterhead — it'll appear on receipts right away`); }
  };
  const remove = async (doc) => {
    await window.api.documents.remove({ id: doc.id, actingUser: currentUser });
    refresh();
    if (doc.category === "letterhead" && doc.is_active) onLetterheadChange?.();
  };

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Documents</h1>
        </div>
      </div>
      <p className="hp-doc-intro">Store company templates and letterheads here. After uploading a logo, click "Set active" next to it — only the active letterhead per category appears on printed receipts, invoices, and delivery notes.</p>
      {DOC_CATEGORIES.map((cat) => {
        const items = docs.filter((d) => d.category === cat.id);
        return (
          <div key={cat.id} className="hp-floor-section">
            <div className="hp-view-head">
              <div className="hp-section-label" style={{ marginBottom: 0 }}>{cat.label}</div>
              <button className="hp-btn hp-btn-ghost" onClick={() => upload(cat.id)}><Upload size={14} /> Upload</button>
            </div>
            {items.length === 0 && <div className="hp-empty">No files yet.</div>}
            <div className="hp-doc-list">
              {items.map((d) => (
                <div key={d.id} className="hp-doc-row">
                  <FileText size={15} />
                  <span className="hp-doc-name" onClick={() => window.api.documents.open(d.stored_path)}>{d.filename}</span>
                  <span className="hp-muted">{new Date(d.uploaded_at).toLocaleDateString()}</span>
                  {d.is_active ? <span className="hp-doc-active"><Star size={12} fill="currentColor" /> Active</span>
                    : <button className="hp-btn hp-btn-ghost" onClick={() => setActive(d)}>Set active</button>}
                  <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => remove(d)}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- reports --------------------------------- */

function bucketByLocalDate(rows) {
  const map = {};
  for (const r of rows) {
    const day = toLocalDateStr(r.closed_at);
    if (!map[day]) map[day] = { day, revenue: 0, cogs: 0 };
    map[day].revenue += r.revenue;
    map[day].cogs += r.cogs;
  }
  return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
}

/* --------------------------------- charts (no library, plain SVG) --------- */

// Formats large numbers compactly for axis labels: 1500000 -> "1.5M".
function formatCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

// Smooth curve through a set of {x,y} points via Catmull-Rom-to-Bezier
// conversion — gives the rounded, continuous line professional dashboards
// use instead of a jagged polyline, with no charting library required.
function smoothPath(points) {
  if (points.length < 2) return points.length === 1 ? `M ${points[0].x} ${points[0].y}` : "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

let chartIdCounter = 0;
const nextChartId = () => `chart-${++chartIdCounter}-${Math.random().toString(36).slice(2, 7)}`;

function LineChartSVG({ points, width = 640, height = 200, color = "var(--accent)", xLabel, yLabel }) {
  const gradientIdRef = useRef(nextChartId());
  if (!points.length) return <div className="hp-empty">No data yet.</div>;
  const max = Math.max(1, ...points.map((p) => p.value));
  const min = Math.min(0, ...points.map((p) => p.value));
  const padL = 42, padR = 8, padT = 12, padB = 8;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const stepX = points.length > 1 ? plotW / (points.length - 1) : 0;
  const scaleY = (v) => padT + plotH * (1 - (v - min) / (max - min || 1));
  const coords = points.map((p, i) => ({ x: padL + i * stepX, y: scaleY(p.value) }));
  const linePath = smoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;
  const gridVals = [0, 1 / 3, 2 / 3, 1].map((t) => min + (max - min) * t);
  const gradientId = gradientIdRef.current;

  return (
    <div className="hp-chart-card">
      <div style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
        {yLabel && <div className="hp-chart-axis-label hp-chart-axis-label-y">{yLabel}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {gridVals.map((v, i) => (
              <g key={i}>
                <line x1={padL} x2={width - padR} y1={scaleY(v)} y2={scaleY(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3,3"} />
                <text x={padL - 8} y={scaleY(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--text-muted)">{formatCompact(v)}</text>
              </g>
            ))}
            <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r="2.4" fill={color} stroke="var(--panel)" strokeWidth="1" />)}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: padL, paddingRight: padR, fontSize: 9.5, color: "var(--text-muted)", marginTop: 4 }}>
            {points.filter((_, i) => points.length <= 7 || i % Math.ceil(points.length / 7) === 0).map((p, i) => <span key={i}>{p.label}</span>)}
          </div>
        </div>
      </div>
      {xLabel && <div className="hp-chart-axis-label hp-chart-axis-label-x" style={{ marginLeft: padL }}>{xLabel}</div>}
    </div>
  );
}

function BarChartSVG({ bars, width = 320, height = 200, xLabel, yLabel, minHeight }) {
  if (!bars.length) return <div className="hp-empty">No data yet.</div>;
  const padL = 42, padR = 8, padT = 12, padB = 8;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const gap = plotW / bars.length;
  const barWidth = gap * 0.5;
  const gridVals = [0, 1 / 3, 2 / 3, 1].map((t) => max * t);
  const scaleY = (v) => padT + plotH * (1 - v / max);

  return (
    <div className="hp-chart-card" style={minHeight ? { minHeight, display: "flex", flexDirection: "column", justifyContent: "center" } : undefined}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
        {yLabel && <div className="hp-chart-axis-label hp-chart-axis-label-y">{yLabel}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
            {gridVals.map((v, i) => (
              <g key={i}>
                <line x1={padL} x2={width - padR} y1={scaleY(v)} y2={scaleY(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3,3"} />
                <text x={padL - 8} y={scaleY(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--text-muted)">{formatCompact(v)}</text>
              </g>
            ))}
            {bars.map((b, i) => {
              // A genuinely nonzero value that's just small relative to the
              // tallest bar could round down to a 1px sliver — effectively
              // invisible rather than a bar someone can actually see and
              // read. Floor it at a height that's still clearly a bar, but
              // only for values that aren't truly zero.
              const rawH = plotH * (b.value / max);
              const h = b.value > 0 ? Math.max(4, rawH) : 0;
              const x = padL + i * gap + (gap - barWidth) / 2;
              return <rect key={b.label} x={x} y={padT + plotH - h} width={barWidth} height={h} rx="4" fill={b.color} />;
            })}
          </svg>
          <div style={{ display: "flex", paddingLeft: padL, paddingRight: padR, marginTop: 4 }}>
            {bars.map((b) => (
              <span key={b.label} className="hp-truncate" style={{ flex: 1, textAlign: "center", fontSize: 10.5, color: "var(--text-muted)" }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>
      {xLabel && <div className="hp-chart-axis-label hp-chart-axis-label-x" style={{ marginLeft: padL }}>{xLabel}</div>}
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap", paddingLeft: padL }}>
        {bars.map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: b.color, display: "inline-block" }} />
            <span className="hp-muted">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartSVG({ slices, size = 140 }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let angle = -90;
  const r = size / 2 - 6, cx = size / 2, cy = size / 2;
  const toXY = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const paths = slices.map((s) => {
    const startAngle = angle;
    const sweep = (s.value / total) * 360;
    angle += sweep;
    const [x1, y1] = toXY(startAngle);
    const [x2, y2] = toXY(angle);
    const largeArc = sweep > 180 ? 1 : 0;
    const d = sweep >= 359.99
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, color: s.color };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))" }}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} stroke="var(--panel)" strokeWidth="2" />)}
      <circle cx={size / 2} cy={size / 2} r={r * 0.52} fill="var(--panel)" />
    </svg>
  );
}

function GroupedBarChartSVG({ buckets, series, width = 640, height = 220 }) {
  if (!buckets.length) return <div className="hp-empty">No data yet.</div>;
  const padL = 46, padR = 8, padT = 12, padB = 8;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const allValues = buckets.flatMap((b) => series.map((s) => b[s.key] || 0));
  const max = Math.max(1, ...allValues, 0);
  const min = Math.min(0, ...allValues);
  const scaleY = (v) => padT + plotH * (1 - (v - min) / (max - min || 1));
  const groupWidth = plotW / buckets.length;
  const barWidth = Math.max(2, (groupWidth * 0.68) / series.length);
  const gridVals = [0, 1 / 3, 2 / 3, 1].map((t) => min + (max - min) * t);

  return (
    <div className="hp-chart-card">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={width - padR} y1={scaleY(v)} y2={scaleY(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray={Math.abs(v) < 0.01 ? "0" : "3,3"} />
            <text x={padL - 8} y={scaleY(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--text-muted)">{formatCompact(v)}</text>
          </g>
        ))}
        {buckets.map((b, bi) => (
          <g key={bi}>
            {series.map((s, si) => {
              const v = b[s.key] || 0;
              const x = padL + bi * groupWidth + (groupWidth - barWidth * series.length) / 2 + si * barWidth;
              const y0 = scaleY(0), y1 = scaleY(v);
              const y = Math.min(y0, y1), h = Math.max(1, Math.abs(y1 - y0));
              return <rect key={s.key} x={x} y={y} width={Math.max(1, barWidth - 1)} height={h} fill={s.color} rx="1.5" />;
            })}
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap", paddingLeft: padL }}>
        {series.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: "inline-block" }} />
            <span className="hp-muted">{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: padL, paddingRight: padR, fontSize: 9.5, color: "var(--text-muted)", marginTop: 4 }}>
        {buckets.filter((_, i) => buckets.length <= 8 || i % Math.ceil(buckets.length / 8) === 0).map((b) => <span key={b.label}>{b.label}</span>)}
      </div>
    </div>
  );
}

/* --------------------------------- report printing / export --------------- */

function PrintReport({ data, settings }) {
  if (!data) return null;
  return (
    <div className="hp-report-paper">
      <div className="hp-receipt-venue">{settings.venueName}</div>
      <div className="hp-receipt-kind">{data.title}</div>
      {data.subtitle && <div className="hp-receipt-meta">{data.subtitle}</div>}
      <div className="hp-receipt-rule" />
      <table className="hp-report-table">
        <thead><tr>{data.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {data.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
      {data.totalsRow && (
        <div className="hp-receipt-line hp-receipt-total" style={{ marginTop: 10 }}>
          <span>{data.totalsRow.label}</span><span>{data.totalsRow.value}</span>
        </div>
      )}
      <div className="hp-receipt-thanks">Generated {new Date().toLocaleString()}</div>
    </div>
  );
}

function CorrectionReasonModal({ title, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <label className="hp-field-label">Reason</label>
      <input autoFocus className="hp-input" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())}>Confirm</button>
    </Modal>
  );
}

function ReportsView({ settings, stays, rooms, currentUser, goHome, showToast, printReport, exportReportPdf }) {
  const [section, setSection] = useState("overview");
  const [range, setRange] = useState("today");
  const [kindFilter, setKindFilter] = useState("all");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [lookupResults, setLookupResults] = useState(null);

  const [foodCostRows, setFoodCostRows] = useState([]);
  const [profitDays, setProfitDays] = useState([]);
  const [wastageSummary, setWastageSummary] = useState(null);
  const [wastageTopItems, setWastageTopItems] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [varianceTrend, setVarianceTrend] = useState([]);
  const [varianceByItem, setVarianceByItem] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [thresholds, setThresholds] = useState({ priceJumpPct: 15, foodCostTargetPct: 35, varianceQtyPct: 10 });
  const [thresholdsReady, setThresholdsReady] = useState(false);

  useEffect(() => {
    loadJSON("pos:alert-thresholds", true).then((t) => { if (t) setThresholds(t); setThresholdsReady(true); });
  }, []);

  const bounds = () => {
    const now = new Date();
    if (range === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { from: start, to: start + 86400000 - 1 };
    }
    if (range === "year") {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      const end = new Date(now.getFullYear() + 1, 0, 1).getTime() - 1;
      return { from: start, to: end };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1;
    return { from: start, to: end };
  };

  const load = async () => {
    const { from, to } = bounds();
    const [s, r] = await Promise.all([window.api.ledger.summary({ from, to }), window.api.ledger.listRange({ from, to })]);
    setSummary(s); setRows(r);
  };
  useEffect(() => { load(); }, [range]);

  const filteredRows = kindFilter === "all" ? rows : rows.filter((r) => r.kind === kindFilter);
  const rangeLabel = range === "today" ? "today" : range === "year" ? "this-year" : "this-month";

  const exportCsv = () => {
    downloadCSV(
      `transactions-${kindFilter}-${rangeLabel}.csv`,
      ["Reference", "Type", "Label", "Status", "Date", "Total"],
      filteredRows.map((r) => [r.receipt_ref || r.id, r.kind, r.ref_label || r.guest_name || "", r.status, new Date(r.closed_at).toLocaleString(), r.total])
    );
  };
  const exportPdf = () => {
    exportReportPdf({
      title: `Transactions — ${kindFilter === "all" ? "All sections" : kindFilter}`,
      subtitle: `${range === "today" ? "Today" : range === "year" ? "This year" : "This month"} · ${filteredRows.length} transactions`,
      columns: ["Reference", "Type", "Label", "Status", "Date", "Total"],
      rows: filteredRows.map((r) => [r.receipt_ref || r.id, r.kind, r.ref_label || r.guest_name || "", r.status, new Date(r.closed_at).toLocaleString(), money(r.total, settings.currency, settings.decimals)]),
      totalsRow: { label: "Total", value: money(filteredRows.filter((r) => r.status === "paid").reduce((s, r) => s + r.total, 0), settings.currency, settings.decimals) },
    }, `transactions-${kindFilter}-${rangeLabel}.pdf`);
  };

  useEffect(() => {
    const { from, to } = bounds();
    if (section === "foodcost") {
      Promise.all([window.api.ledger.foodCostReport({ from, to }), window.api.ledger.profitSeries({ from, to })])
        .then(([fc, series]) => { setFoodCostRows(fc); setProfitDays(bucketByLocalDate(series)); });
    } else if (section === "wastage") {
      Promise.all([window.api.wastage.summary({ from, to }), window.api.wastage.byItem({ from, to })])
        .then(([s, items]) => { setWastageSummary(s); setWastageTopItems(items); });
    } else if (section === "variance") {
      Promise.all([window.api.stock.inventoryValue(), window.api.stockCounts.varianceTrend(), window.api.stockCounts.varianceByItem()])
        .then(([iv, trend, byItem]) => { setInventoryValue(iv.value); setVarianceTrend(trend); setVarianceByItem(byItem); });
    } else if (section === "alerts" && thresholdsReady) {
      window.api.alerts.list(thresholds).then(setAlerts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, range, thresholdsReady]);

  const saveThresholdsAndRefresh = async () => {
    await saveJSON("pos:alert-thresholds", thresholds, true);
    setAlerts(await window.api.alerts.list(thresholds));
    showToast("Alert thresholds saved");
  };

  const runLookup = async () => {
    if (!query.trim()) { setLookupResults(null); return; }
    setLookupResults(await window.api.ledger.lookup({ query: query.trim() }));
  };

  const outstanding = stays.filter((s) => s.status === "checked_in").map((s) => {
    const room = rooms.find((r) => r.id === s.roomId);
    const nights = currentStayNights(s);
    const running = (room ? nights * room.rate : 0) + s.charges.reduce((sum, c) => sum + c.amount, 0);
    return { ...s, running };
  });
  const outstandingTotal = outstanding.reduce((s, o) => s + o.running, 0);

  const [correctingRow, setCorrectingRow] = useState(null);
  const submitCorrection = async (reason) => {
    await window.api.ledger.voidTransaction({ id: correctingRow.id, reason, actingUser: currentUser });
    showToast("Transaction corrected");
    setCorrectingRow(null);
    load();
    if (lookupResults) runLookup();
  };

  const txnRow = (r, withCorrect) => (
    <div key={r.id} className="hp-history-row">
      <div className="hp-history-summary" style={{ gridTemplateColumns: "100px minmax(0,1fr) 90px 130px 100px" }}>
        <span className="hp-history-type hp-truncate">{r.receipt_ref || r.kind}</span>
        <span className="hp-history-label hp-truncate">{r.ref_label || r.guest_name}</span>
        <span className={`hp-history-badge hp-history-${r.status}`}>{r.status}</span>
        <span className="hp-history-date">{new Date(r.closed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        <span className="hp-history-total">{money(r.total, settings.currency, settings.decimals)}</span>
      </div>
      {withCorrect && r.status === "paid" && (
        <div style={{ padding: "0 16px 12px" }}>
          <button className="hp-btn hp-btn-ghost" onClick={() => setCorrectingRow(r)}><RotateCcw size={13} /> Correct / void with reason</button>
        </div>
      )}
    </div>
  );

  const reportSections = [
    { id: "overview", label: "Overview" },
    { id: "foodcost", label: "Food Cost" },
    { id: "wastage", label: "Wastage" },
    { id: "variance", label: "Variance" },
    { id: "alerts", label: "Alerts" },
  ];

  const maxRevenue = Math.max(1, ...profitDays.map((d) => d.revenue));
  const severityColor = { danger: "var(--danger)", warning: "var(--billc)", info: "var(--text-muted)" };
  const severityIcon = { danger: AlertTriangle, warning: AlertTriangle, info: TrendingUp };

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Reports & Accounting</h1>
        </div>
        {(section === "overview" || section === "foodcost" || section === "wastage") && (
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${range === "today" ? "active" : ""}`} onClick={() => setRange("today")}>Today</button>
            <button className={`hp-cat-tab ${range === "month" ? "active" : ""}`} onClick={() => setRange("month")}>This month</button>
            <button className={`hp-cat-tab ${range === "year" ? "active" : ""}`} onClick={() => setRange("year")}>This year</button>
          </div>
        )}
      </div>

      <div className="hp-cat-tabs" style={{ marginBottom: 18 }}>
        {reportSections.map((s) => (
          <button key={s.id} className={`hp-cat-tab ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>{s.label}</button>
        ))}
      </div>

      {section === "overview" && (
        <>
          {summary && (
            <div className="hp-report-grid">
              <div className="hp-report-card"><TrendingUp size={16} /><div className="hp-report-value">{money(summary.restaurantTotal + summary.roomTotal + summary.conferenceTotal, settings.currency, settings.decimals)}</div><div className="hp-report-label">Total sales · {summary.count} txns</div></div>
              <div className="hp-report-card"><Soup size={16} /><div className="hp-report-value">{money(summary.restaurantTotal, settings.currency, settings.decimals)}</div><div className="hp-report-label">Restaurant revenue</div></div>
              <div className="hp-report-card"><BedDouble size={16} /><div className="hp-report-value">{money(summary.roomTotal, settings.currency, settings.decimals)}</div><div className="hp-report-label">Room revenue</div></div>
              <div className="hp-report-card"><Presentation size={16} /><div className="hp-report-value">{money(summary.conferenceTotal, settings.currency, settings.decimals)}</div><div className="hp-report-label">Conference revenue</div></div>
              <div className="hp-report-card"><Banknote size={16} /><div className="hp-report-value">{money(summary.cash, settings.currency, settings.decimals)}</div><div className="hp-report-label">Cash</div></div>
              <div className="hp-report-card"><CreditCard size={16} /><div className="hp-report-value">{money(summary.card, settings.currency, settings.decimals)}</div><div className="hp-report-label">Card</div></div>
              <div className="hp-report-card"><Smartphone size={16} /><div className="hp-report-value">{money(summary.mobileMoney, settings.currency, settings.decimals)}</div><div className="hp-report-label">Mobile Money</div></div>
              <div className="hp-report-card"><DoorOpen size={16} /><div className="hp-report-value">{money(summary.roomCharge, settings.currency, settings.decimals)}</div><div className="hp-report-label">Charged to room</div></div>
            </div>
          )}

          <div className="hp-floor-section">
            <div className="hp-section-label"><AlertTriangle size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Outstanding room charges (not yet paid)</div>
            {outstanding.length === 0 ? <div className="hp-empty">No open balances right now.</div> : (
              <div className="hp-history-list">
                {outstanding.map((o) => (
                  <div key={o.id} className="hp-history-row">
                    <div className="hp-history-summary" style={{ gridTemplateColumns: "minmax(0,1fr) 120px" }}>
                      <span className="hp-history-label hp-truncate">Room {o.roomName} — {o.guestName}</span>
                      <span className="hp-history-total">{money(o.running, settings.currency, settings.decimals)}</span>
                    </div>
                  </div>
                ))}
                <div className="hp-total-row hp-total-grand" style={{ padding: "8px 4px" }}><span>Total outstanding</span><span>{money(outstandingTotal, settings.currency, settings.decimals)}</span></div>
              </div>
            )}
          </div>

          <div className="hp-floor-section">
            <div className="hp-section-label">Receipt lookup</div>
            <div className="hp-search-row hp-history-search">
              <Search size={15} />
              <input className="hp-search-input" placeholder="Search by ID, table, room or guest name…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runLookup()} />
              <button className="hp-btn hp-btn-ghost" onClick={runLookup}>Search</button>
            </div>
            {lookupResults && (
              <div className="hp-history-list">
                {lookupResults.length === 0 && <div className="hp-empty">No matches.</div>}
                {lookupResults.map((r) => txnRow(r, true))}
              </div>
            )}
          </div>

          <div className="hp-floor-section">
            <div className="hp-view-head">
              <div className="hp-section-label" style={{ marginBottom: 0 }}>{range === "today" ? "Today's" : range === "year" ? "This year's" : "This month's"} transactions ({filteredRows.length})</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="hp-btn hp-btn-ghost" onClick={exportCsv}><Download size={14} /> CSV</button>
                <button className="hp-btn hp-btn-ghost" onClick={exportPdf}><FileText size={14} /> PDF</button>
              </div>
            </div>
            <div className="hp-cat-tabs">
              {["all", "restaurant", "accommodation", "conference"].map((k) => (
                <button key={k} className={`hp-cat-tab ${kindFilter === k ? "active" : ""}`} onClick={() => setKindFilter(k)}>{k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}</button>
              ))}
            </div>
            <div className="hp-history-list">
              {filteredRows.length === 0 && <div className="hp-empty">No transactions in this range yet.</div>}
              {filteredRows.slice(0, 50).map((r) => txnRow(r, false))}
            </div>
          </div>
        </>
      )}

      {section === "foodcost" && (
        <>
          <div className="hp-floor-section">
            <div className="hp-section-label">Daily revenue vs. cost of goods sold</div>
            {profitDays.length === 0 && <div className="hp-empty">No restaurant sales with recipe costs in this range yet.</div>}
            {profitDays.length > 0 && (
              <>
                <div className="hp-muted" style={{ fontSize: 11, marginBottom: 6 }}>Bar = revenue · darker overlay = cost of goods sold</div>
                {profitDays.map((d) => (
                  <div key={d.day} className="hp-bar-row">
                    <span className="hp-muted hp-truncate">{d.day.slice(5)}</span>
                    <div className="hp-bar-track">
                      <div className="hp-bar-fill-revenue" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}>
                        <div className="hp-bar-fill-cogs" style={{ width: `${d.revenue > 0 ? (d.cogs / d.revenue) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <span className="hp-muted hp-truncate">{money(d.revenue, settings.currency, settings.decimals)}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="hp-floor-section">
            <div className="hp-section-label">Food cost by dish — {range === "today" ? "today" : "this month"}</div>
            {foodCostRows.length === 0 && <div className="hp-empty">No restaurant sales in this range yet.</div>}
            <div className="hp-doc-list">
              {foodCostRows.map((r) => (
                <div key={r.menu_item_id || r.name} className="hp-doc-row">
                  <span className="hp-doc-name hp-truncate" style={{ flex: 1, cursor: "default" }}>{r.name}</span>
                  <span className="hp-muted">{r.qtySold} sold</span>
                  <span className="hp-muted">rev {money(r.revenue, settings.currency, settings.decimals)}</span>
                  <span className="hp-muted">cogs {money(r.cogs, settings.currency, settings.decimals)}</span>
                  <span style={{ fontWeight: 700, fontSize: 12.5, color: r.foodCostPct != null && r.foodCostPct >= thresholds.foodCostTargetPct ? "var(--danger)" : "var(--text)" }}>
                    {r.foodCostPct != null ? `${r.foodCostPct.toFixed(1)}%` : "no cost data"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === "wastage" && (
        <>
          {wastageSummary && (
            <div className="hp-report-grid">
              <div className="hp-report-card"><AlertTriangle size={16} /><div className="hp-report-value">{money(wastageSummary.total, settings.currency, settings.decimals)}</div><div className="hp-report-label">Total wastage · {wastageSummary.count} entries</div></div>
              {Object.entries(wastageSummary.byReason).map(([reason, amt]) => (
                <div key={reason} className="hp-report-card"><div className="hp-report-value">{money(amt, settings.currency, settings.decimals)}</div><div className="hp-report-label">{WASTAGE_REASONS.find((r) => r.value === reason)?.label || reason}</div></div>
              ))}
            </div>
          )}
          <div className="hp-floor-section">
            <div className="hp-section-label">Most-wasted items — {range === "today" ? "today" : "this month"}</div>
            {wastageTopItems.length === 0 && <div className="hp-empty">No wastage logged in this range.</div>}
            <div className="hp-doc-list">
              {wastageTopItems.map((i) => (
                <div key={i.name} className="hp-doc-row">
                  <span className="hp-doc-name hp-truncate" style={{ flex: 1, cursor: "default" }}>{i.name}</span>
                  <span className="hp-muted">{i.qty} {i.unit}</span>
                  <span className="hp-muted">{money(i.cost, settings.currency, settings.decimals)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === "variance" && (
        <>
          {inventoryValue != null && (
            <div className="hp-report-grid">
              <div className="hp-report-card"><Package size={16} /><div className="hp-report-value">{money(inventoryValue, settings.currency, settings.decimals)}</div><div className="hp-report-label">Current inventory value</div></div>
            </div>
          )}
          <div className="hp-floor-section">
            <div className="hp-section-label">Recent finalized counts</div>
            {varianceTrend.length === 0 && <div className="hp-empty">No finalized stock counts yet.</div>}
            <div className="hp-history-list">
              {varianceTrend.map((c) => (
                <div key={c.id} className="hp-history-row">
                  <div className="hp-history-summary" style={{ gridTemplateColumns: "minmax(0,1fr) 130px 130px" }}>
                    <span className="hp-history-label hp-truncate">{c.note || "Stock count"}</span>
                    <span className="hp-muted">±{money(c.totalAbsVarianceCost, settings.currency, settings.decimals)}</span>
                    <span className="hp-history-date">{new Date(c.finalized_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hp-floor-section">
            <div className="hp-section-label">Items that drift most</div>
            {varianceByItem.length === 0 && <div className="hp-empty">Not enough count history yet.</div>}
            <div className="hp-doc-list">
              {varianceByItem.map((i) => (
                <div key={i.name} className="hp-doc-row">
                  <span className="hp-doc-name hp-truncate" style={{ flex: 1, cursor: "default" }}>{i.name}</span>
                  <span className="hp-muted">counted {i.timesCounted}×</span>
                  <span className="hp-muted">±{i.totalAbsVarianceQty} {i.unit}</span>
                  <span className="hp-muted">{money(i.totalCostImpact, settings.currency, settings.decimals)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === "alerts" && (
        <>
          <div className="hp-floor-section">
            <div className="hp-section-label">Alert thresholds</div>
            <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div>
                <label className="hp-field-label">Price jump %</label>
                <input className="hp-input hp-input-sm" type="number" value={thresholds.priceJumpPct} onChange={(e) => setThresholds({ ...thresholds, priceJumpPct: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="hp-field-label">Food cost target %</label>
                <input className="hp-input hp-input-sm" type="number" value={thresholds.foodCostTargetPct} onChange={(e) => setThresholds({ ...thresholds, foodCostTargetPct: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="hp-field-label">Variance %</label>
                <input className="hp-input hp-input-sm" type="number" value={thresholds.varianceQtyPct} onChange={(e) => setThresholds({ ...thresholds, varianceQtyPct: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <button className="hp-btn hp-btn-accent" style={{ marginTop: 12 }} onClick={saveThresholdsAndRefresh}>Save & refresh alerts</button>
          </div>
          <div className="hp-floor-section">
            <div className="hp-section-label">Active alerts (last 30 days)</div>
            {alerts.length === 0 && <div className="hp-empty">Nothing needs attention right now.</div>}
            <div className="hp-doc-list">
              {alerts.map((a, i) => {
                const Icon = severityIcon[a.severity] || AlertTriangle;
                return (
                  <div key={i} className="hp-doc-row">
                    <Icon size={14} color={severityColor[a.severity]} />
                    <span className="hp-doc-name hp-truncate" style={{ flex: 1, cursor: "default" }}>{a.message}</span>
                    <span className="hp-muted">{new Date(a.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {correctingRow && (
        <CorrectionReasonModal
          title="Reason for this correction (voids the transaction and logs an audit entry)"
          onClose={() => setCorrectingRow(null)}
          onSubmit={submitCorrection}
        />
      )}
    </div>
  );
}

/* --------------------------------- inventory / store ------------------------ */

// Full unit catalog, grouped for the dropdown. `family` groups units that
// can be numerically converted into one another (weight, volume, or the
// literal count family pcs/pair/dozen/gross); everything else is its own
// singleton family, meaning it only "converts" to an identical unit —
// deliberately, since a "carton" and a "bunch" aren't a fixed ratio apart,
// and pretending otherwise would quietly corrupt costing.
const UNIT_CATALOG = [
  // Cooking / kitchen units
  { category: "Cooking / kitchen", value: "pinch", label: "pinch (~0.3 ml, approximate)", family: "volume", toBase: 0.3 },
  { category: "Cooking / kitchen", value: "dash", label: "dash (~0.6 ml, approximate)", family: "volume", toBase: 0.6 },
  { category: "Cooking / kitchen", value: "tsp", label: "tsp — teaspoon", family: "volume", toBase: 5 },
  { category: "Cooking / kitchen", value: "tbsp", label: "tbsp — tablespoon", family: "volume", toBase: 15 },
  { category: "Cooking / kitchen", value: "cup", label: "cup (250 ml)", family: "volume", toBase: 250 },

  // Weight — metric
  { category: "Weight (metric)", value: "mg", label: "mg — milligram", family: "weight", toBase: 0.001 },
  { category: "Weight (metric)", value: "g", label: "g — gram", family: "weight", toBase: 1 },
  { category: "Weight (metric)", value: "kg", label: "kg — kilogram", family: "weight", toBase: 1000 },

  // Weight — imperial (regional use, East Africa)
  { category: "Weight (imperial)", value: "oz", label: "oz — ounce", family: "weight", toBase: 28.3495 },
  { category: "Weight (imperial)", value: "lb", label: "lb — pound", family: "weight", toBase: 453.592 },

  // Volume — metric
  { category: "Volume (metric)", value: "ml", label: "ml — millilitre", family: "volume", toBase: 1 },
  { category: "Volume (metric)", value: "l", label: "l — litre", family: "volume", toBase: 1000 },

  // Volume — imperial (regional use, East Africa)
  { category: "Volume (imperial)", value: "fl_oz", label: "fl oz — fluid ounce", family: "volume", toBase: 29.5735 },
  { category: "Volume (imperial)", value: "pint", label: "pint", family: "volume", toBase: 568.261 },
  { category: "Volume (imperial)", value: "quart", label: "quart", family: "volume", toBase: 1136.52 },
  { category: "Volume (imperial)", value: "gallon", label: "gallon", family: "volume", toBase: 4546.09 },

  // Count / piece units
  { category: "Count / piece", value: "pcs", label: "pcs — piece", family: "count", toBase: 1 },
  { category: "Count / piece", value: "pair", label: "pair", family: "count", toBase: 2 },
  { category: "Count / piece", value: "dozen", label: "dozen", family: "count", toBase: 12 },
  { category: "Count / piece", value: "gross", label: "gross (144)", family: "count", toBase: 144 },

  // Food portion units
  { category: "Food portion", value: "portion", label: "portion", family: "portion", toBase: 1 },
  { category: "Food portion", value: "serving", label: "serving", family: "serving", toBase: 1 },
  { category: "Food portion", value: "scoop", label: "scoop", family: "scoop", toBase: 1 },

  // Produce units
  { category: "Produce", value: "bunch", label: "bunch", family: "bunch", toBase: 1 },
  { category: "Produce", value: "head", label: "head", family: "head", toBase: 1 },
  { category: "Produce", value: "punnet", label: "punnet", family: "punnet", toBase: 1 },

  // Meat / seafood units
  { category: "Meat / seafood", value: "fillet", label: "fillet", family: "fillet", toBase: 1 },
  { category: "Meat / seafood", value: "whole", label: "whole", family: "whole", toBase: 1 },
  { category: "Meat / seafood", value: "side", label: "side", family: "side", toBase: 1 },
  { category: "Meat / seafood", value: "slab", label: "slab", family: "slab", toBase: 1 },

  // Bakery / pastry units
  { category: "Bakery / pastry", value: "loaf", label: "loaf", family: "loaf", toBase: 1 },
  { category: "Bakery / pastry", value: "batch", label: "batch", family: "batch", toBase: 1 },
  { category: "Bakery / pastry", value: "sheet", label: "sheet", family: "sheet", toBase: 1 },

  // Beverage units
  { category: "Beverage", value: "shot", label: "shot (44 ml)", family: "volume", toBase: 44 },
  { category: "Beverage", value: "glass", label: "glass", family: "glass", toBase: 1 },
  { category: "Beverage", value: "keg", label: "keg", family: "keg", toBase: 1 },

  // Inventory packaging / purchasing units
  { category: "Packaging / purchasing", value: "pack", label: "pack", family: "pack", toBase: 1 },
  { category: "Packaging / purchasing", value: "packet", label: "packet", family: "packet", toBase: 1 },
  { category: "Packaging / purchasing", value: "carton", label: "carton", family: "carton", toBase: 1 },
  { category: "Packaging / purchasing", value: "case", label: "case", family: "case", toBase: 1 },
  { category: "Packaging / purchasing", value: "box", label: "box", family: "box", toBase: 1 },
  { category: "Packaging / purchasing", value: "bag", label: "bag", family: "bag", toBase: 1 },
  { category: "Packaging / purchasing", value: "sack", label: "sack", family: "sack", toBase: 1 },
  { category: "Packaging / purchasing", value: "crate", label: "crate", family: "crate", toBase: 1 },
  { category: "Packaging / purchasing", value: "pallet", label: "pallet", family: "pallet", toBase: 1 },
  { category: "Packaging / purchasing", value: "bottle", label: "bottle", family: "bottle", toBase: 1 },
  { category: "Packaging / purchasing", value: "can", label: "can", family: "can", toBase: 1 },
  { category: "Packaging / purchasing", value: "tin", label: "tin", family: "tin", toBase: 1 },
  { category: "Packaging / purchasing", value: "jar", label: "jar", family: "jar", toBase: 1 },
  { category: "Packaging / purchasing", value: "drum", label: "drum", family: "drum", toBase: 1 },
  { category: "Packaging / purchasing", value: "roll", label: "roll", family: "roll", toBase: 1 },
];
const UNIT_CATEGORIES = [...new Set(UNIT_CATALOG.map((u) => u.category))];
const unitDef = (value) => UNIT_CATALOG.find((u) => u.value === value);
const unitLabel = (value) => unitDef(value)?.label.split(" (")[0].split(" — ")[0] || value;

// Converts a quantity from one unit into another, or returns null if the
// two units aren't in a numerically related family (e.g. weight vs.
// volume, or two different descriptive units like "bunch" and "carton").
// A null result means the caller should require the units to match
// exactly rather than silently guessing a ratio.
function convertQty(qty, fromUnit, toUnit) {
  if (fromUnit === toUnit) return qty;
  const from = unitDef(fromUnit);
  const to = unitDef(toUnit);
  if (!from || !to || from.family !== to.family) return null;
  return (qty * from.toBase) / to.toBase;
}

function UnitSelect({ value, onChange, className = "hp-input" }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {UNIT_CATEGORIES.map((cat) => (
        <optgroup key={cat} label={cat}>
          {UNIT_CATALOG.filter((u) => u.category === cat).map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}


function RecordPurchaseModal({ item, onClose, onSaved, currentUser, settings, showToast }) {
  const hasPurchaseUnit = !!(item.purchase_unit && item.purchase_to_base_factor);
  const [mode, setMode] = useState(hasPurchaseUnit ? "purchase" : "base");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState(item.cost_per_unit || "");
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const qtyNum = parseFloat(qty) || 0;
  const costNum = unitCost !== "" ? parseFloat(unitCost) || 0 : 0;
  const usingPurchaseUnit = mode === "purchase";
  const factor = item.purchase_to_base_factor || 1;
  const baseQty = usingPurchaseUnit ? qtyNum * factor : qtyNum;
  const baseUnitCost = usingPurchaseUnit ? (costNum > 0 ? costNum / factor : 0) : costNum;
  const totalCost = usingPurchaseUnit ? qtyNum * costNum : qtyNum * costNum;

  const submit = async () => {
    if (!qtyNum || qtyNum <= 0) return;
    setError("");
    try {
      await window.api.stock.purchase({
        stockItemId: item.id,
        ...(usingPurchaseUnit
          ? { purchaseUnitQty: qtyNum, purchaseUnitCost: unitCost !== "" ? costNum : null }
          : { qty: qtyNum, unitCost: unitCost !== "" ? costNum : null }),
        supplier: supplier.trim() || null, invoiceNumber: invoiceNumber.trim() || null, note: note.trim() || null,
        actingUser: currentUser,
      });
      showToast(usingPurchaseUnit ? `${qtyNum} ${item.purchase_unit} (${baseQty} ${item.unit}) of ${item.name} added` : `${qtyNum} ${item.unit} of ${item.name} added to stock`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't record that purchase.");
    }
  };

  return (
    <Modal title={`Goods received — ${item.name}`} onClose={onClose}>
      {hasPurchaseUnit && (
        <>
          <label className="hp-field-label">Entering quantity in</label>
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${mode === "purchase" ? "active" : ""}`} onClick={() => setMode("purchase")}>{item.purchase_unit}</button>
            <button className={`hp-cat-tab ${mode === "base" ? "active" : ""}`} onClick={() => setMode("base")}>{item.unit} (base unit)</button>
          </div>
        </>
      )}
      <label className="hp-field-label">Supplier (optional)</label>
      <input className="hp-input" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
      <label className="hp-field-label">Invoice number (optional)</label>
      <input className="hp-input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
      <label className="hp-field-label">Quantity ({usingPurchaseUnit ? item.purchase_unit : item.unit})</label>
      <input autoFocus className="hp-input" type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
      <label className="hp-field-label">{usingPurchaseUnit ? `Cost per ${item.purchase_unit} (optional)` : "Unit cost (optional)"}</label>
      <input className="hp-input" type="number" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
      {usingPurchaseUnit && qtyNum > 0 && (
        <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          = {baseQty} {item.unit}{costNum > 0 && <> at {money(baseUnitCost, settings.currency, settings.decimals + 4)}/{item.unit}</>}
        </div>
      )}
      {qtyNum > 0 && costNum > 0 && (
        <div className="hp-total-row hp-total-grand" style={{ marginTop: 8 }}>
          <span>Total cost</span><span>{money(totalCost, settings.currency, settings.decimals)}</span>
        </div>
      )}
      <label className="hp-field-label">Note (optional)</label>
      <input className="hp-input" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 8 }}>Received by {currentUser?.name || "—"}, recorded now.</div>
      {error && <div className="hp-login-error" style={{ marginTop: 8 }}>{error}</div>}
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!qtyNum || qtyNum <= 0} onClick={submit}>Record purchase</button>
    </Modal>
  );
}

function StockItemModal({ item, onClose, onSaved, currentUser, showToast }) {
  const [name, setName] = useState(item?.name || "");
  const [unit, setUnit] = useState(item?.unit || "kg");
  const [reorderLevel, setReorderLevel] = useState(item?.reorder_level ?? 0);
  const [initialQty, setInitialQty] = useState(item?.current_qty ?? 0);
  const [costPerUnit, setCostPerUnit] = useState(item?.cost_per_unit ?? "");
  const [sameUnit, setSameUnit] = useState(!item || !item.purchase_unit);
  const [purchaseUnit, setPurchaseUnit] = useState(item?.purchase_unit ?? "");
  const [purchaseToBaseFactor, setPurchaseToBaseFactor] = useState(item?.purchase_to_base_factor ?? "");
  const [error, setError] = useState("");

  const factorNum = parseFloat(purchaseToBaseFactor) || 0;

  const submit = async () => {
    if (!name.trim()) return;
    if (!sameUnit && (!purchaseUnit.trim() || !(factorNum > 0))) {
      setError(`Enter what it's purchased in and how many ${unit || "base units"} that equals.`);
      return;
    }
    setError("");
    const payload = {
      name: name.trim(), unit, reorderLevel: parseFloat(reorderLevel) || 0,
      costPerUnit: costPerUnit !== "" ? parseFloat(costPerUnit) : null,
      purchaseUnit: sameUnit ? null : purchaseUnit.trim(),
      purchaseToBaseFactor: sameUnit ? null : factorNum,
      actingUser: currentUser,
    };
    try {
      if (item) {
        await window.api.stock.update({ id: item.id, ...payload });
        showToast("Stock item updated");
      } else {
        await window.api.stock.create({ ...payload, initialQty: parseFloat(initialQty) || 0 });
        showToast(`${name.trim()} added to the store`);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't save that.");
    }
  };

  return (
    <Modal title={item ? "Edit stock item" : "New stock item"} onClose={onClose}>
      <div>
        <label className="hp-field-label">Name</label>
        <input autoFocus className="hp-input" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="hp-field-label">Unit used in recipes</label>
        <UnitSelect value={unit} onChange={setUnit} />
        {!item && (
          <>
            <label className="hp-field-label">Starting quantity</label>
            <input className="hp-input" type="number" step="0.01" value={initialQty} onChange={(e) => setInitialQty(e.target.value)} />
          </>
        )}
        <label className="hp-field-label">Reorder level (alert below this)</label>
        <input className="hp-input" type="number" step="0.01" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
        <label className="hp-field-label">Cost per {unit || "base unit"}</label>
        <input className="hp-input" type="number" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} />

        <label className="hp-field-label" style={{ marginTop: 10 }}>Purchased in the same unit it's used in?</label>
        <div className="hp-cat-tabs">
          <button className={`hp-cat-tab ${sameUnit ? "active" : ""}`} onClick={() => setSameUnit(true)}>Yes</button>
          <button className={`hp-cat-tab ${!sameUnit ? "active" : ""}`} onClick={() => setSameUnit(false)}>No</button>
        </div>
        {!sameUnit && (
          <>
            <label className="hp-field-label">Purchased as</label>
            <input className="hp-input" value={purchaseUnit} onChange={(e) => setPurchaseUnit(e.target.value)} placeholder="Tray, Carton, Pack, Jerrycan" />
            <label className="hp-field-label">{unit || "Base unit"} per {purchaseUnit.trim() || "purchase unit"}</label>
            <input className="hp-input" type="number" step="0.0001" value={purchaseToBaseFactor} onChange={(e) => setPurchaseToBaseFactor(e.target.value)} />
            {factorNum > 0 && purchaseUnit.trim() && (
              <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                1 {purchaseUnit.trim()} = {factorNum} {unit}
              </div>
            )}
          </>
        )}
        {error && <div className="hp-login-error" style={{ marginTop: 8 }}>{error}</div>}
        <button className="hp-btn hp-btn-accent hp-btn-block" style={{ marginTop: 10 }} disabled={!name.trim()} onClick={submit}>{item ? "Save changes" : "Add stock item"}</button>
      </div>
    </Modal>
  );
}

function RecipeEditorModal({ menuItem, stockItems, settings, onClose, onSaved, currentUser, showToast }) {
  const [lines, setLines] = useState([]);
  const [addingStockId, setAddingStockId] = useState("");
  const [addingQty, setAddingQty] = useState("");
  const [addingUnit, setAddingUnit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.recipe.get({ menuItemId: menuItem.id }).then((rows) =>
      setLines(rows.map((r) => ({
        stockItemId: r.stock_item_id, name: r.stock_name, stockUnit: r.unit, costPerUnit: r.cost_per_unit,
        displayQty: String(r.display_qty), displayUnit: r.display_unit,
      })))
    );
  }, [menuItem.id]);

  // Cost for a line uses the quantity converted into the stock item's own
  // unit — the same math the backend uses for actual costing/consumption —
  // so what's shown here always matches what gets saved and charged.
  const lineConverted = (l) => convertQty(parseFloat(l.displayQty) || 0, l.displayUnit, l.stockUnit);
  const lineCost = (l) => {
    const converted = lineConverted(l);
    return converted == null ? null : converted * (l.costPerUnit || 0);
  };
  const lineIncompatible = (l) => lineConverted(l) == null;

  const addLine = () => {
    const stock = stockItems.find((s) => s.id === addingStockId);
    const q = parseFloat(addingQty);
    if (!stock || !q || q <= 0 || !addingUnit) return;
    setLines([...lines.filter((l) => l.stockItemId !== stock.id), {
      stockItemId: stock.id, name: stock.name, stockUnit: stock.unit, costPerUnit: stock.cost_per_unit,
      displayQty: addingQty, displayUnit: addingUnit,
    }]);
    setAddingStockId(""); setAddingQty(""); setAddingUnit("");
  };
  const removeLine = (stockItemId) => setLines(lines.filter((l) => l.stockItemId !== stockItemId));
  const updateLine = (stockItemId, patch) => setLines(lines.map((l) => (l.stockItemId === stockItemId ? { ...l, ...patch } : l)));

  const anyIncompatible = lines.some(lineIncompatible);
  const costPerServing = roundMoney(lines.reduce((sum, l) => sum + (lineCost(l) || 0), 0));
  const missingCosts = lines.some((l) => !l.costPerUnit);
  const sellPrice = menuItem.price || 0;
  const margin = sellPrice > 0 ? sellPrice - costPerServing : null;

  const save = async () => {
    if (anyIncompatible) { showToast?.("Fix the highlighted ingredient(s) — their unit can't convert to the stock item's unit."); return; }
    setSaving(true);
    await window.api.recipe.set({
      menuItemId: menuItem.id,
      lines: lines.map((l) => ({ stockItemId: l.stockItemId, qty: lineConverted(l), displayQty: parseFloat(l.displayQty), displayUnit: l.displayUnit })),
      actingUser: currentUser,
    });
    setSaving(false);
    showToast?.(`Recipe saved for ${menuItem.name}`);
    onSaved();
    onClose();
  };

  return (
    <Modal title={`Recipe — ${menuItem.name}`} width={460} onClose={onClose}>
      <div>
        <div className="hp-empty" style={{ padding: "0 0 10px" }}>How much of each ingredient one serving of this dish uses. Quantity and unit are independent of how the ingredient is stocked.</div>
        {lines.length === 0 && <div className="hp-empty">No ingredients linked yet.</div>}
        <div className="hp-doc-list" style={{ marginBottom: 10 }}>
          {lines.map((l) => {
            const incompatible = lineIncompatible(l);
            const cost = lineCost(l);
            return (
              <div key={l.stockItemId} className="hp-recipe-line-row" style={{ borderLeftColor: incompatible ? "var(--danger)" : "transparent" }}>
                <span className="hp-doc-name" style={{ cursor: "default" }}>{l.name}</span>
                <input className="hp-input hp-input-sm" type="number" step="0.01" value={l.displayQty} onChange={(e) => updateLine(l.stockItemId, { displayQty: e.target.value })} />
                <UnitSelect className="hp-input hp-input-sm" value={l.displayUnit} onChange={(v) => updateLine(l.stockItemId, { displayUnit: v })} />
                <span className="hp-muted" style={{ fontSize: 11.5 }}>
                  {incompatible ? `can't convert to ${unitLabel(l.stockUnit)}` : l.costPerUnit ? money(cost, settings.currency, settings.decimals) : "no cost set"}
                </span>
                <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => removeLine(l.stockItemId)}><Trash2 size={13} /></button>
              </div>
            );
          })}
        </div>
        <label className="hp-field-label">Add ingredient</label>
        <div className="hp-stay-picker" style={{ maxHeight: 140, marginBottom: 8 }}>
          {stockItems.filter((s) => !lines.some((l) => l.stockItemId === s.id)).map((s) => (
            <button key={s.id} className={`hp-stay-option ${addingStockId === s.id ? "active" : ""}`} onClick={() => { setAddingStockId(s.id); setAddingUnit(s.unit); }}>
              <span className="hp-stay-room">{s.name}</span>
              <span className="hp-stay-guest">{s.unit}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="hp-input" type="number" step="0.01" placeholder="Quantity" value={addingQty} onChange={(e) => setAddingQty(e.target.value)} />
          <UnitSelect value={addingUnit || "g"} onChange={setAddingUnit} />
          <button className="hp-btn hp-btn-ghost" disabled={!addingStockId || !addingQty} onClick={addLine}>Add</button>
        </div>

        {lines.length > 0 && (
          <div className="hp-bill-card" style={{ marginBottom: 12 }}>
            <div className="hp-total-row"><span>Cost to make one serving</span><span>{anyIncompatible ? "—" : money(costPerServing, settings.currency, settings.decimals)}</span></div>
            {sellPrice > 0 && !anyIncompatible && (
              <div className="hp-total-row hp-total-grand"><span>Margin at {money(sellPrice, settings.currency, settings.decimals)} menu price</span><span>{money(margin, settings.currency, settings.decimals)}</span></div>
            )}
            {anyIncompatible && <div className="hp-login-error" style={{ fontSize: 11.5, marginTop: 6 }}>One or more ingredients has a unit that can't convert to how it's stocked — pick a compatible unit or match the stock item's own unit.</div>}
            {!anyIncompatible && missingCosts && <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 6 }}>Some ingredients have no cost recorded yet (set it on the stock item or its next purchase) — this estimate is a floor, not the full cost.</div>}
          </div>
        )}

        <div className="hp-ticket-actions">
          <button className="hp-btn hp-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="hp-btn hp-btn-accent" onClick={save} disabled={saving || anyIncompatible}>{saving ? "Saving…" : "Save recipe"}</button>
        </div>
      </div>
    </Modal>
  );
}

function StockAdjustModal({ item, onClose, onSaved, currentUser, showToast }) {
  const [newQty, setNewQty] = useState(String(item.current_qty));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const delta = (parseFloat(newQty) || 0) - item.current_qty;

  const submit = async () => {
    if (newQty === "" || !reason.trim()) return;
    setSaving(true);
    try {
      await window.api.stock.adjust({ stockItemId: item.id, newQty: parseFloat(newQty), reason: reason.trim(), actingUser: currentUser });
      showToast(`${item.name} adjusted to ${newQty} ${item.unit}`);
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't adjust that item.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Adjust stock — ${item.name}`} onClose={onClose}>
      <div className="hp-empty" style={{ padding: "0 0 10px" }}>Use this to correct the count after a physical stock check — always with a reason, always logged.</div>
      <div className="hp-total-row"><span>Current recorded quantity</span><span>{item.current_qty} {item.unit}</span></div>
      <label className="hp-field-label">Actual quantity ({item.unit})</label>
      <input autoFocus className="hp-input" type="number" step="0.01" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
      {newQty !== "" && !Number.isNaN(parseFloat(newQty)) && (
        <div className="hp-muted" style={{ fontSize: 12, margin: "6px 0" }}>
          {delta === 0 ? "No change." : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} ${item.unit} ${delta > 0 ? "added" : "removed"}`}
        </div>
      )}
      <label className="hp-field-label">Reason (required)</label>
      <input className="hp-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || newQty === "" || !reason.trim()} onClick={submit}>{saving ? "Saving…" : "Save adjustment"}</button>
    </Modal>
  );
}

const WASTAGE_REASONS = [
  { value: "spoilage", label: "Spoilage", group: "waste" },
  { value: "expired", label: "Expired", group: "waste" },
  { value: "prep_error", label: "Preparation error", group: "waste" },
  { value: "spillage", label: "Spillage", group: "waste" },
  { value: "damaged", label: "Damaged", group: "waste" },
  { value: "other", label: "Other waste", group: "waste" },
  { value: "staff_meal", label: "Staff meal", group: "internal" },
  { value: "complimentary", label: "Complimentary", group: "internal" },
];
const wastageReasonLabel = (value) => WASTAGE_REASONS.find((r) => r.value === value)?.label || value;

function WastageModal({ item, mode: initialMode = "waste", onClose, onSaved, currentUser, showToast }) {
  const [mode, setMode] = useState(initialMode);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(initialMode === "internal" ? "staff_meal" : "spoilage");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const reasonOptions = WASTAGE_REASONS.filter((r) => r.group === mode);
  const switchMode = (m) => { setMode(m); setReason(m === "internal" ? "staff_meal" : "spoilage"); };

  const submit = async () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) return;
    setSaving(true);
    try {
      const res = await window.api.wastage.create({ stockItemId: item.id, qty: q, reason, location: location.trim() || null, note: note.trim() || null, actingUser: currentUser });
      showToast(`${res.reference} — ${q} ${item.unit} ${wastageReasonLabel(reason).toLowerCase()} logged for ${item.name}`);
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't log that entry.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Log wastage or internal use — ${item.name}`} onClose={onClose}>
      <div className="hp-cat-tabs">
        <button className={`hp-cat-tab ${mode === "waste" ? "active" : ""}`} onClick={() => switchMode("waste")}>Waste</button>
        <button className={`hp-cat-tab ${mode === "internal" ? "active" : ""}`} onClick={() => switchMode("internal")}>Staff / Complimentary</button>
      </div>
      {mode === "internal" && (
        <div className="hp-empty" style={{ padding: "0 0 10px" }}>
          Tracked as a real cost, just kept separate from the wastage figure — this isn't spoilage, so it shouldn't count toward that number.
        </div>
      )}
      <label className="hp-field-label">Quantity ({item.unit})</label>
      <input autoFocus className="hp-input" type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
      <label className="hp-field-label">Reason</label>
      <div className="hp-cat-tabs">
        {reasonOptions.map((r) => (
          <button key={r.value} className={`hp-cat-tab ${reason === r.value ? "active" : ""}`} onClick={() => setReason(r.value)}>{r.label}</button>
        ))}
      </div>
      <label className="hp-field-label">Location (optional)</label>
      <input className="hp-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
      <label className="hp-field-label">Note (optional)</label>
      <input className="hp-input" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || !qty || parseFloat(qty) <= 0} onClick={submit}>{saving ? "Saving…" : "Log entry"}</button>
    </Modal>
  );
}

function StockCountsPanel({ currentUser, settings, showToast }) {
  const isAdmin = currentUser?.role === "admin";
  const [counts, setCounts] = useState([]);
  const [activeCount, setActiveCount] = useState(null);
  const [starting, setStarting] = useState(false);
  const [note, setNote] = useState("");

  const refreshList = async () => setCounts(await window.api.stockCounts.list());
  useEffect(() => { refreshList(); }, []);

  const openCount = async (id) => setActiveCount(await window.api.stockCounts.get({ id }));

  const startCount = async () => {
    setStarting(true);
    const res = await window.api.stockCounts.start({ note: note.trim() || null, actingUser: currentUser });
    setStarting(false);
    setNote("");
    showToast("Stock count started");
    await refreshList();
    openCount(res.id);
  };

  const recordCount = async (stockItemId, countedQty) => {
    if (countedQty === "" || Number.isNaN(parseFloat(countedQty))) return;
    await window.api.stockCounts.recordCount({ countId: activeCount.id, stockItemId, countedQty: parseFloat(countedQty), actingUser: currentUser });
    openCount(activeCount.id);
  };

  const finalize = async () => {
    try {
      await window.api.stockCounts.finalize({ id: activeCount.id, actingUser: currentUser });
      showToast("Stock count finalized — stock reconciled");
      setActiveCount(null);
      refreshList();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't finalize.");
    }
  };
  const cancelCount = async () => {
    await window.api.stockCounts.cancel({ id: activeCount.id, actingUser: currentUser });
    showToast("Stock count cancelled");
    setActiveCount(null);
    refreshList();
  };

  if (activeCount) {
    const countedItems = activeCount.items.filter((i) => i.counted_qty != null);
    const totalVarianceCost = roundMoney(countedItems.reduce((s, i) => s + (i.cost_impact || 0), 0));
    return (
      <div className="hp-floor-section">
        <div className="hp-view-head">
          <div className="hp-section-label" style={{ marginBottom: 0 }}>
            Stock count {activeCount.status === "finalized" ? "(finalized)" : "— in progress"}
          </div>
          <button className="hp-btn hp-btn-ghost" onClick={() => setActiveCount(null)}>Back to list</button>
        </div>
        <div className="hp-doc-list" style={{ marginBottom: 12 }}>
          {activeCount.items.map((it) => (
            <div key={it.id} className="hp-doc-row">
              <span className="hp-doc-name" style={{ flex: 1, cursor: "default" }}>{it.item_name}</span>
              <span className="hp-muted">theoretical {it.theoretical_qty} {it.unit}</span>
              <input
                className="hp-input hp-input-sm"
                type="number"
                step="0.01"
                placeholder="counted"
                defaultValue={it.counted_qty ?? ""}
                disabled={activeCount.status === "finalized"}
                onBlur={(e) => recordCount(it.stock_item_id, e.target.value)}
                style={{ width: 90 }}
              />
              {it.counted_qty != null && (
                <span className={it.variance === 0 ? "hp-doc-active" : "hp-history-badge hp-history-void"}>
                  {it.variance > 0 ? "+" : ""}{it.variance} {it.unit}
                </span>
              )}
            </div>
          ))}
        </div>
        {countedItems.length > 0 && (
          <div className="hp-bill-card" style={{ marginBottom: 12 }}>
            <div className="hp-total-row hp-total-grand"><span>Total variance cost impact</span><span>{money(totalVarianceCost, settings.currency, settings.decimals)}</span></div>
          </div>
        )}
        {activeCount.status !== "finalized" && (
          <div className="hp-ticket-actions">
            <button className="hp-btn hp-btn-ghost" onClick={cancelCount}>Cancel count</button>
            {isAdmin
              ? <button className="hp-btn hp-btn-accent" onClick={finalize}>Finalize & reconcile stock</button>
              : <div className="hp-muted" style={{ fontSize: 11.5, alignSelf: "center" }}>Only an admin can finalize this count.</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hp-floor-section">
      <div className="hp-section-label">Physical stock counts</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input className="hp-input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="hp-btn hp-btn-accent" disabled={starting} onClick={startCount}>{starting ? "Starting…" : "Start new count"}</button>
      </div>
      {counts.length === 0 && <div className="hp-empty">No stock counts yet.</div>}
      <div className="hp-history-list">
        {counts.map((c) => (
          <div key={c.id} className="hp-history-row">
            <button className="hp-history-summary" style={{ gridTemplateColumns: "110px minmax(0,1fr) 130px" }} onClick={() => openCount(c.id)}>
              <span className={`hp-history-badge hp-history-${c.status === "finalized" ? "paid" : "void"}`}>{c.status === "finalized" ? "finalized" : "in progress"}</span>
              <span className="hp-history-label">{c.note || "Stock count"}</span>
              <span className="hp-history-date">{new Date(c.started_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryView({ menuItems, categories, settings, currentUser, goHome, showToast, exportReportPdf }) {
  const canManage = currentUser?.role === "admin" || currentUser?.role === "manager" || (currentUser?.grantedTiles || []).includes("inventory");
  const [tab, setTab] = useState("stock");
  const [stockItems, setStockItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [recipeInfo, setRecipeInfo] = useState({});
  const [purchaseFor, setPurchaseFor] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [addingItem, setAddingItem] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [wastageItem, setWastageItem] = useState(null);
  const [wastageMode, setWastageMode] = useState("waste");
  const [wastePickerMode, setWastePickerMode] = useState(null);
  const [wastePickerSearch, setWastePickerSearch] = useState("");
  const [consumptionEntries, setConsumptionEntries] = useState([]);
  const [movementRange, setMovementRange] = useState("month");
  const [movementReport, setMovementReport] = useState([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [consumptionReport, setConsumptionReport] = useState([]);
  const [consumptionLoading, setConsumptionLoading] = useState(false);
  const [internalSummary, setInternalSummary] = useState(null);
  const [wasteReport, setWasteReport] = useState([]);
  const [wasteReportLoading, setWasteReportLoading] = useState(false);
  const [internalReport, setInternalReport] = useState([]);
  const [internalReportLoading, setInternalReportLoading] = useState(false);
  const [adjustmentsReport, setAdjustmentsReport] = useState([]);
  const [adjustmentsReportLoading, setAdjustmentsReportLoading] = useState(false);
  const [ledgerItemId, setLedgerItemId] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [recipeMenuItem, setRecipeMenuItem] = useState(null);
  const [activeCat, setActiveCat] = useState(categories[0] || "");
  const [recipeSearch, setRecipeSearch] = useState("");

  const refresh = async () => {
    const [items, purch, info, cons] = await Promise.all([
      window.api.stock.list(), window.api.stock.purchasesList({ limit: 50 }), window.api.recipe.allWithCost(), window.api.stock.consumptionList({ limit: 60 }),
    ]);
    setStockItems(items); setPurchases(purch); setRecipeInfo(info); setConsumptionEntries(cons);
  };
  useEffect(() => { refresh(); }, []);

  const movementBounds = () => {
    const now = new Date();
    if (movementRange === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { from: start, to: start + 86400000 - 1 };
    }
    if (movementRange === "year") {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      const end = new Date(now.getFullYear() + 1, 0, 1).getTime() - 1;
      return { from: start, to: end };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1;
    return { from: start, to: end };
  };
  const loadMovementReport = async () => {
    setMovementLoading(true);
    const { from, to } = movementBounds();
    setMovementReport(await window.api.stock.movementReport({ from, to }));
    setMovementLoading(false);
  };
  useEffect(() => { if (tab === "stock") loadMovementReport(); }, [tab, movementRange]);

  const exportMovementCsv = () => {
    downloadCSV(
      `stock-${movementRange}.csv`,
      ["Stock ID", "Item", "Unit", "Opening", "Received", "Consumed", "Wasted", "Current", "Reorder Level", "Status"],
      movementReport.map((r) => [r.sku || "", r.name, r.unit, r.opening, r.purchases, r.sales, r.waste, r.closing, r.reorderLevel, r.closing <= r.reorderLevel ? "Reorder" : "OK"])
    );
  };
  const exportMovementPdf = () => {
    exportReportPdf({
      title: "Stock Report",
      subtitle: movementRange === "today" ? "Today" : movementRange === "year" ? "This year" : "This month",
      columns: ["Stock ID", "Item", "Unit", "Opening", "Received", "Consumed", "Wasted", "Current", "Reorder Lvl", "Status"],
      rows: movementReport.map((r) => [r.sku || "", r.name, r.unit, r.opening, r.purchases, r.sales, r.waste, r.closing, r.reorderLevel, r.closing <= r.reorderLevel ? "Reorder" : "OK"]),
    }, `stock-${movementRange}.pdf`);
  };

  const loadConsumptionReport = async () => {
    setConsumptionLoading(true);
    const { from, to } = movementBounds();
    const [rows, summary] = await Promise.all([
      window.api.stock.consumptionReport({ from, to }),
      window.api.stock.internalConsumptionSummary({ from, to }),
    ]);
    setConsumptionReport(rows);
    setInternalSummary(summary);
    setConsumptionLoading(false);
  };
  useEffect(() => { if (tab === "consumption") loadConsumptionReport(); }, [tab, movementRange]);

  const exportConsumptionCsv = () => {
    downloadCSV(
      `consumption-${movementRange}.csv`,
      ["Item", "Unit", "Sales Consumption", "Waste", "Staff Meals", "Complimentary Meals"],
      consumptionReport.map((r) => [r.name, r.unit, r.sales, r.waste, r.staffMeals, r.complimentary])
    );
  };
  const exportConsumptionPdf = () => {
    exportReportPdf({
      title: "Consumption Report",
      subtitle: movementRange === "today" ? "Today" : movementRange === "year" ? "This year" : "This month",
      columns: ["Item", "Unit", "Sales Consumption", "Waste", "Staff Meals", "Complimentary Meals"],
      rows: consumptionReport.map((r) => [r.name, r.unit, r.sales, r.waste, r.staffMeals, r.complimentary]),
    }, `consumption-${movementRange}.pdf`);
  };

  const loadWasteReport = async () => {
    setWasteReportLoading(true);
    const { from, to } = movementBounds();
    setWasteReport(await window.api.wastage.report({ from, to, category: "waste" }));
    setWasteReportLoading(false);
  };
  useEffect(() => { if (tab === "wastage") loadWasteReport(); }, [tab, movementRange]);
  const approveWaste = async (w) => { await window.api.wastage.approve({ id: w.id, actingUser: currentUser }); loadWasteReport(); };
  const exportWasteCsv = () => downloadCSV(
    `wastage-${movementRange}.csv`,
    ["Waste ID", "Date", "Time", "Item", "Qty", "Unit", "Unit Cost", "Waste Cost", "Reason", "Location", "Reported By", "Approved By"],
    wasteReport.map((w) => [w.reference, new Date(w.created_at).toLocaleDateString(), new Date(w.created_at).toLocaleTimeString(), w.item_name, w.qty, w.unit, w.unit_cost ?? "", w.cost_impact ?? "", wastageReasonLabel(w.reason), w.location || "", w.user_name || "", w.approved_by_user_name || ""])
  );
  const exportWastePdf = () => exportReportPdf({
    title: "Wastage Report",
    subtitle: movementRange === "today" ? "Today" : movementRange === "year" ? "This year" : "This month",
    columns: ["Waste ID", "Date", "Time", "Item", "Qty", "Unit", "Unit Cost", "Waste Cost", "Reason", "Location", "Reported By", "Approved By"],
    rows: wasteReport.map((w) => [w.reference, new Date(w.created_at).toLocaleDateString(), new Date(w.created_at).toLocaleTimeString(), w.item_name, w.qty, w.unit, money(w.unit_cost || 0, settings.currency, settings.decimals), money(w.cost_impact || 0, settings.currency, settings.decimals), wastageReasonLabel(w.reason), w.location || "—", w.user_name || "—", w.approved_by_user_name || "Pending"]),
  }, `wastage-${movementRange}.pdf`);

  const loadInternalReport = async () => {
    setInternalReportLoading(true);
    const { from, to } = movementBounds();
    setInternalReport(await window.api.wastage.report({ from, to, category: "internal" }));
    setInternalReportLoading(false);
  };
  useEffect(() => { if (tab === "staffcomp") loadInternalReport(); }, [tab, movementRange]);
  const approveInternal = async (w) => { await window.api.wastage.approve({ id: w.id, actingUser: currentUser }); loadInternalReport(); };
  const exportInternalCsv = () => downloadCSV(
    `staff-comp-meals-${movementRange}.csv`,
    ["Reference", "Date", "Time", "Item", "Qty", "Unit", "Unit Cost", "Cost", "Type", "Location", "Reported By", "Approved By"],
    internalReport.map((w) => [w.reference, new Date(w.created_at).toLocaleDateString(), new Date(w.created_at).toLocaleTimeString(), w.item_name, w.qty, w.unit, w.unit_cost ?? "", w.cost_impact ?? "", wastageReasonLabel(w.reason), w.location || "", w.user_name || "", w.approved_by_user_name || ""])
  );
  const exportInternalPdf = () => exportReportPdf({
    title: "Staff & Complimentary Meals Report",
    subtitle: movementRange === "today" ? "Today" : movementRange === "year" ? "This year" : "This month",
    columns: ["Reference", "Date", "Time", "Item", "Qty", "Unit", "Unit Cost", "Cost", "Type", "Location", "Reported By", "Approved By"],
    rows: internalReport.map((w) => [w.reference, new Date(w.created_at).toLocaleDateString(), new Date(w.created_at).toLocaleTimeString(), w.item_name, w.qty, w.unit, money(w.unit_cost || 0, settings.currency, settings.decimals), money(w.cost_impact || 0, settings.currency, settings.decimals), wastageReasonLabel(w.reason), w.location || "—", w.user_name || "—", w.approved_by_user_name || "Pending"]),
  }, `staff-comp-meals-${movementRange}.pdf`);

  const loadAdjustmentsReport = async () => {
    setAdjustmentsReportLoading(true);
    const { from, to } = movementBounds();
    setAdjustmentsReport(await window.api.stockAdjustments.report({ from, to }));
    setAdjustmentsReportLoading(false);
  };
  useEffect(() => { if (tab === "adjustments") loadAdjustmentsReport(); }, [tab, movementRange]);
  const approveAdjustment = async (a) => { await window.api.stockAdjustments.approve({ id: a.id, actingUser: currentUser }); loadAdjustmentsReport(); };
  const exportAdjustmentsCsv = () => downloadCSV(
    `adjustments-${movementRange}.csv`,
    ["Adjustment ID", "Date", "Time", "Item", "System Qty", "Physical Qty", "Adjustment Qty", "Unit", "Unit Cost", "Adjustment Value", "Reason", "Adjusted By", "Approved By", "Status"],
    adjustmentsReport.map((a) => [a.reference, new Date(a.created_at).toLocaleDateString(), new Date(a.created_at).toLocaleTimeString(), a.item_name, a.previous_qty, a.new_qty, a.delta, a.unit, a.unit_cost_snapshot ?? "", a.value_impact ?? "", a.reason, a.user_name || "", a.approved_by_user_name || "", a.approved_by_user_name ? "Approved" : "Pending"])
  );
  const exportAdjustmentsPdf = () => exportReportPdf({
    title: "Stock Adjustments Report",
    subtitle: movementRange === "today" ? "Today" : movementRange === "year" ? "This year" : "This month",
    columns: ["Adjustment ID", "Date", "Time", "Item", "Sys Qty", "Phys Qty", "Adj Qty", "Unit Cost", "Adj Value", "Reason", "Adjusted By", "Status"],
    rows: adjustmentsReport.map((a) => [a.reference, new Date(a.created_at).toLocaleDateString(), new Date(a.created_at).toLocaleTimeString(), a.item_name, a.previous_qty, a.new_qty, `${a.delta > 0 ? "+" : ""}${a.delta} ${a.unit}`, money(a.unit_cost_snapshot || 0, settings.currency, settings.decimals), `${a.value_impact > 0 ? "+" : ""}${money(a.value_impact || 0, settings.currency, settings.decimals)}`, a.reason, a.user_name || "—", a.approved_by_user_name ? "Approved" : "Pending"]),
  }, `adjustments-${movementRange}.pdf`);

  const openLedger = async (stockItemId) => {
    setLedgerItemId(stockItemId);
    setLedgerLoading(true);
    setLedgerData(await window.api.stock.ledger({ stockItemId }));
    setLedgerLoading(false);
  };
  const exportLedgerCsv = () => {
    if (!ledgerData) return;
    downloadCSV(
      `ledger-${ledgerData.item.sku || ledgerData.item.name}.csv`,
      ["Date", "Reference", "Type", "Item", "Qty In", "Qty Out", "Balance"],
      ledgerData.rows.map((r) => [new Date(r.date).toLocaleString(), r.reference, r.type, ledgerData.item.name, r.qtyIn || "", r.qtyOut || "", r.balance])
    );
  };
  const exportLedgerPdf = () => {
    if (!ledgerData) return;
    exportReportPdf({
      title: `Inventory Ledger — ${ledgerData.item.name}`,
      subtitle: `Stock ID ${ledgerData.item.sku || "—"}`,
      columns: ["Date", "Reference", "Type", "Qty In", "Qty Out", "Balance"],
      rows: ledgerData.rows.map((r) => [new Date(r.date).toLocaleDateString(), r.reference, r.type, r.qtyIn || "", r.qtyOut || "", r.balance]),
    }, `ledger-${ledgerData.item.sku || ledgerData.item.name}.pdf`);
  };

  const exportPurchasesCsv = () => {
    downloadCSV(
      "purchase-log.csv",
      ["Date received", "Item", "Supplier", "Invoice #", "Qty", "Unit", "Unit Cost", "Total", "Received by"],
      purchases.map((p) => [new Date(p.purchased_at).toLocaleString(), p.item_name, p.supplier || "", p.invoice_number || "", p.qty, p.unit, p.entered_qty != null ? `${p.entered_qty} ${p.entered_unit}` : "", p.unit_cost ?? "", p.total_cost ?? "", p.user_name || ""])
    );
  };
  const exportPurchasesPdf = () => {
    exportReportPdf({
      title: "Purchase Log (Goods Received)",
      columns: ["Date", "Item", "Supplier", "Invoice #", "Qty", "Unit", "As Purchased", "Unit Cost", "Total", "Received by"],
      rows: purchases.map((p) => [new Date(p.purchased_at).toLocaleDateString(), p.item_name, p.supplier || "—", p.invoice_number || "—", p.qty, p.unit, p.entered_qty != null ? `${p.entered_qty} ${p.entered_unit}` : "—", p.unit_cost != null ? money(p.unit_cost, settings.currency, settings.decimals + 4) : "—", p.total_cost != null ? money(p.total_cost, settings.currency, settings.decimals) : "—", p.user_name || "—"]),
    }, "purchase-log.pdf");
  };

  const lowStock = stockItems.filter((s) => s.current_qty <= s.reorder_level);
  const removeStock = async (item) => {
    try { await window.api.stock.remove({ id: item.id, actingUser: currentUser }); refresh(); }
    catch (err) { showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't remove that item."); }
  };

  const filteredMenuItems = menuItems.filter((mi) => mi.category === activeCat && mi.name.toLowerCase().includes(recipeSearch.toLowerCase()));

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Store</h1>
        </div>
        <div className="hp-cat-tabs">
          <button className={`hp-cat-tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>Stock</button>
          <button className={`hp-cat-tab ${tab === "recipes" ? "active" : ""}`} onClick={() => setTab("recipes")}>Recipes</button>
          <button className={`hp-cat-tab ${tab === "purchases" ? "active" : ""}`} onClick={() => setTab("purchases")}>Purchase log</button>
          <button className={`hp-cat-tab ${tab === "wastage" ? "active" : ""}`} onClick={() => setTab("wastage")}>Wastage</button>
          <button className={`hp-cat-tab ${tab === "staffcomp" ? "active" : ""}`} onClick={() => setTab("staffcomp")}>Staff & Comp Meals</button>
          <button className={`hp-cat-tab ${tab === "consumption" ? "active" : ""}`} onClick={() => setTab("consumption")}>Consumption</button>
          <button className={`hp-cat-tab ${tab === "counts" ? "active" : ""}`} onClick={() => setTab("counts")}>Stock counts</button>
          <button className={`hp-cat-tab ${tab === "ledger" ? "active" : ""}`} onClick={() => setTab("ledger")}>Ledger</button>
          {canManage && <button className={`hp-cat-tab ${tab === "adjustments" ? "active" : ""}`} onClick={() => setTab("adjustments")}>Adjustments</button>}
        </div>
      </div>

      {tab === "stock" && (
        <>
          {lowStock.length > 0 && (
            <div className="hp-floor-section">
              <div className="hp-section-label"><AlertTriangle size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Needs restocking</div>
              <div className="hp-doc-list">
                {lowStock.map((s) => (
                  <div key={s.id} className="hp-doc-row" style={{ borderColor: "var(--billc)" }}>
                    <span className="hp-doc-name" style={{ cursor: "default" }}>{s.name}</span>
                    <span className="hp-muted">{s.current_qty} / {s.reorder_level} {s.unit}</span>
                    <button className="hp-btn hp-btn-ghost" onClick={() => setPurchaseFor(s)}>Record purchase</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="hp-floor-section">
            <div className="hp-view-head">
              <div className="hp-section-label" style={{ marginBottom: 0 }}>Stock — {movementRange === "today" ? "today" : movementRange === "year" ? "this year" : "this month"}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div className="hp-cat-tabs" style={{ marginBottom: 0 }}>
                  <button className={`hp-cat-tab ${movementRange === "today" ? "active" : ""}`} onClick={() => setMovementRange("today")}>Today</button>
                  <button className={`hp-cat-tab ${movementRange === "month" ? "active" : ""}`} onClick={() => setMovementRange("month")}>This month</button>
                  <button className={`hp-cat-tab ${movementRange === "year" ? "active" : ""}`} onClick={() => setMovementRange("year")}>This year</button>
                </div>
                <button className="hp-btn hp-btn-ghost" onClick={exportMovementCsv}><Download size={14} /> CSV</button>
                <button className="hp-btn hp-btn-ghost" onClick={exportMovementPdf}><FileText size={14} /> PDF</button>
                {canManage && <button className="hp-btn hp-btn-accent" onClick={() => setAddingItem(true)}><Plus size={14} /> Stock item</button>}
              </div>
            </div>
            {!canManage && <div className="hp-empty" style={{ marginBottom: 8 }}>Only admins and managers can add, edit, remove, or adjust stock items — anyone can record a purchase or log wastage.</div>}
            {movementLoading ? <div className="hp-empty">Loading…</div> : movementReport.length === 0 ? <div className="hp-empty">No stock items yet — add ingredients and supplies here.</div> : (
              <div style={{ overflowX: "auto" }}>
                <table className="hp-data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Stock ID</th><th style={{ textAlign: "left" }}>Item</th><th>Unit</th>
                      <th>Opening</th><th>Received</th><th>Consumed</th><th>Wasted</th><th>Current</th><th>Reorder Lvl</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementReport.map((r) => {
                      const stockItem = stockItems.find((s) => s.id === r.id);
                      const low = r.closing <= r.reorderLevel;
                      return (
                        <tr key={r.id}>
                          <td style={{ textAlign: "left" }} className="hp-muted">{r.sku || "—"}</td>
                          <td style={{ textAlign: "left", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--border)" }} onClick={() => { openLedger(r.id); setTab("ledger"); }}>{r.name}{r.hasOtherMovements ? " *" : ""}</td>
                          <td>{r.unit}</td>
                          <td>{r.opening}</td>
                          <td>{r.purchases}</td>
                          <td>{r.sales}</td>
                          <td>{r.waste}</td>
                          <td style={{ fontWeight: 700 }}>{r.closing}</td>
                          <td className="hp-muted">{r.reorderLevel}</td>
                          <td style={{ color: low ? "var(--danger)" : "var(--avail)", fontWeight: 700, fontSize: 11 }}>{low ? "⚠️ Reorder" : "OK"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                              {stockItem && <button className="hp-icon-btn hp-icon-btn-sm" title="Record purchase" onClick={() => setPurchaseFor(stockItem)}><Plus size={13} /></button>}
                              {stockItem && <button className="hp-icon-btn hp-icon-btn-sm" title="Log wastage" onClick={() => { setWastageItem(stockItem); setWastageMode("waste"); }}><AlertTriangle size={13} /></button>}
                              {canManage && stockItem && <button className="hp-icon-btn hp-icon-btn-sm" title="Adjust" onClick={() => setAdjustingItem(stockItem)}><RotateCcw size={13} /></button>}
                              {canManage && stockItem && <button className="hp-icon-btn hp-icon-btn-sm" title="Edit" onClick={() => setEditingItem(stockItem)}><Pencil size={13} /></button>}
                              {canManage && stockItem && <button className="hp-icon-btn hp-icon-btn-sm" title="Remove" onClick={() => removeStock(stockItem)}><Trash2 size={13} /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {movementReport.some((r) => r.hasOtherMovements) && (
                  <div className="hp-muted" style={{ fontSize: 11, marginTop: 8 }}>* Also had a manual adjustment or correction-reversal during this period, folded into Opening — see the Adjustments tab.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "recipes" && (
        <div className="hp-floor-section">
          <div className="hp-empty" style={{ padding: "0 0 12px" }}>Link each dish to the ingredients it consumes, with quantities. Once linked, every sale automatically deducts stock, and the cost to make one serving is calculated from what those ingredients cost in the store.{!canManage && " Only admins and managers can edit recipes."}</div>
          <div className="hp-search-row hp-history-search">
            <Search size={15} />
            <input className="hp-search-input" placeholder="Search dishes…" value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)} />
          </div>
          <div className="hp-cat-tabs">
            {categories.map((c) => (
              <button key={c} className={`hp-cat-tab ${activeCat === c ? "active" : ""}`} onClick={() => setActiveCat(c)}>{c}</button>
            ))}
          </div>
          <div className="hp-doc-list">
            {filteredMenuItems.map((mi) => {
              const info = recipeInfo[mi.id];
              return (
                <div key={mi.id} className="hp-doc-row" onClick={() => canManage && setRecipeMenuItem(mi)} style={{ cursor: canManage ? "pointer" : "default" }}>
                  <span className="hp-doc-name" style={{ flex: 1 }}>{mi.name}</span>
                  {info ? (
                    <>
                      <span className="hp-doc-active"><Star size={11} fill="currentColor" /> {info.count} ingredient{info.count > 1 ? "s" : ""}</span>
                      <span className="hp-muted">cost {money(info.cost, settings.currency, settings.decimals)}/serving</span>
                    </>
                  ) : (
                    <span className="hp-muted">No recipe set</span>
                  )}
                </div>
              );
            })}
            {filteredMenuItems.length === 0 && <div className="hp-empty">No dishes match.</div>}
          </div>
        </div>
      )}

      {tab === "purchases" && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Purchase log (goods received)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="hp-btn hp-btn-ghost" onClick={exportPurchasesCsv}><Download size={14} /> CSV</button>
              <button className="hp-btn hp-btn-ghost" onClick={exportPurchasesPdf}><FileText size={14} /> PDF</button>
            </div>
          </div>
          {purchases.length === 0 && <div className="hp-empty">No purchases recorded yet.</div>}
          {purchases.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Date received</th><th style={{ textAlign: "left" }}>Item</th><th style={{ textAlign: "left" }}>Supplier</th>
                    <th style={{ textAlign: "left" }}>Invoice #</th><th>Qty</th><th style={{ textAlign: "left" }}>Unit</th><th style={{ textAlign: "left" }}>As Purchased</th><th>Unit Cost</th><th>Total</th><th style={{ textAlign: "left" }}>Received by</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{new Date(p.purchased_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{p.item_name}</td>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{p.supplier || "—"}</td>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{p.invoice_number || "—"}</td>
                      <td>{p.qty}</td>
                      <td style={{ textAlign: "left" }}>{p.unit}</td>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{p.entered_qty != null ? `${p.entered_qty} ${p.entered_unit}` : "—"}</td>
                      <td>{p.unit_cost != null ? money(p.unit_cost, settings.currency, settings.decimals + 4) : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{p.total_cost != null ? money(p.total_cost, settings.currency, settings.decimals) : "—"}</td>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{p.user_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "wastage" && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Wastage — {movementRange === "today" ? "today" : movementRange === "year" ? "this year" : "this month"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="hp-cat-tabs" style={{ marginBottom: 0 }}>
                <button className={`hp-cat-tab ${movementRange === "today" ? "active" : ""}`} onClick={() => setMovementRange("today")}>Daily</button>
                <button className={`hp-cat-tab ${movementRange === "month" ? "active" : ""}`} onClick={() => setMovementRange("month")}>Monthly</button>
                <button className={`hp-cat-tab ${movementRange === "year" ? "active" : ""}`} onClick={() => setMovementRange("year")}>Yearly</button>
              </div>
              <button className="hp-btn hp-btn-ghost" onClick={exportWasteCsv}><Download size={14} /> CSV</button>
              <button className="hp-btn hp-btn-ghost" onClick={exportWastePdf}><FileText size={14} /> PDF</button>
              <button className="hp-btn hp-btn-accent" onClick={() => setWastePickerMode("waste")}><Plus size={14} /> Log wastage</button>
            </div>
          </div>
          {wasteReportLoading ? <div className="hp-empty">Loading…</div> : wasteReport.length === 0 ? <div className="hp-empty">No wastage in this range.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Waste ID</th><th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Time</th>
                    <th style={{ textAlign: "left" }}>Item</th><th>Qty</th><th style={{ textAlign: "left" }}>Unit</th>
                    <th>Unit Cost</th><th>Waste Cost</th><th style={{ textAlign: "left" }}>Reason</th>
                    <th style={{ textAlign: "left" }}>Location</th><th style={{ textAlign: "left" }}>Reported By</th><th style={{ textAlign: "left" }}>Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteReport.map((w) => (
                    <tr key={w.id}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{w.reference}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(w.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(w.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{w.item_name}</td>
                      <td>{w.qty}</td>
                      <td style={{ textAlign: "left" }}>{w.unit}</td>
                      <td>{w.unit_cost != null ? money(w.unit_cost, settings.currency, settings.decimals) : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{w.cost_impact != null ? money(w.cost_impact, settings.currency, settings.decimals) : "—"}</td>
                      <td style={{ textAlign: "left" }}>{wastageReasonLabel(w.reason)}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{w.location || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{w.user_name || "—"}</td>
                      <td style={{ textAlign: "left" }}>
                        {w.approved_by_user_name ? <span className="hp-doc-active">{w.approved_by_user_name}</span>
                          : canManage ? <button className="hp-btn hp-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => approveWaste(w)}>Approve</button>
                          : <span className="hp-muted">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "staffcomp" && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Staff & Complimentary Meals — {movementRange === "today" ? "today" : movementRange === "year" ? "this year" : "this month"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="hp-cat-tabs" style={{ marginBottom: 0 }}>
                <button className={`hp-cat-tab ${movementRange === "today" ? "active" : ""}`} onClick={() => setMovementRange("today")}>Daily</button>
                <button className={`hp-cat-tab ${movementRange === "month" ? "active" : ""}`} onClick={() => setMovementRange("month")}>Monthly</button>
                <button className={`hp-cat-tab ${movementRange === "year" ? "active" : ""}`} onClick={() => setMovementRange("year")}>Yearly</button>
              </div>
              <button className="hp-btn hp-btn-ghost" onClick={exportInternalCsv}><Download size={14} /> CSV</button>
              <button className="hp-btn hp-btn-ghost" onClick={exportInternalPdf}><FileText size={14} /> PDF</button>
              <button className="hp-btn hp-btn-accent" onClick={() => setWastePickerMode("internal")}><Plus size={14} /> Log entry</button>
            </div>
          </div>
          <div className="hp-empty" style={{ padding: "0 0 12px" }}>Kept separate from Wastage so that figure stays a true measure of loss — these are a deliberate cost (staff benefit or guest goodwill), not spoilage.</div>
          {internalReportLoading ? <div className="hp-empty">Loading…</div> : internalReport.length === 0 ? <div className="hp-empty">Nothing in this range.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Reference</th><th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Time</th>
                    <th style={{ textAlign: "left" }}>Item</th><th>Qty</th><th style={{ textAlign: "left" }}>Unit</th>
                    <th>Unit Cost</th><th>Cost</th><th style={{ textAlign: "left" }}>Type</th>
                    <th style={{ textAlign: "left" }}>Location</th><th style={{ textAlign: "left" }}>Reported By</th><th style={{ textAlign: "left" }}>Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {internalReport.map((w) => (
                    <tr key={w.id}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{w.reference}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(w.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(w.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{w.item_name}</td>
                      <td>{w.qty}</td>
                      <td style={{ textAlign: "left" }}>{w.unit}</td>
                      <td>{w.unit_cost != null ? money(w.unit_cost, settings.currency, settings.decimals) : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{w.cost_impact != null ? money(w.cost_impact, settings.currency, settings.decimals) : "—"}</td>
                      <td style={{ textAlign: "left" }}>{wastageReasonLabel(w.reason)}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{w.location || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{w.user_name || "—"}</td>
                      <td style={{ textAlign: "left" }}>
                        {w.approved_by_user_name ? <span className="hp-doc-active">{w.approved_by_user_name}</span>
                          : canManage ? <button className="hp-btn hp-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => approveInternal(w)}>Approve</button>
                          : <span className="hp-muted">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "consumption" && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Consumption — {movementRange === "today" ? "today" : movementRange === "year" ? "this year" : "this month"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="hp-cat-tabs" style={{ marginBottom: 0 }}>
                <button className={`hp-cat-tab ${movementRange === "today" ? "active" : ""}`} onClick={() => setMovementRange("today")}>Today</button>
                <button className={`hp-cat-tab ${movementRange === "month" ? "active" : ""}`} onClick={() => setMovementRange("month")}>This month</button>
                <button className={`hp-cat-tab ${movementRange === "year" ? "active" : ""}`} onClick={() => setMovementRange("year")}>This year</button>
              </div>
              <button className="hp-btn hp-btn-ghost" onClick={exportConsumptionCsv}><Download size={14} /> CSV</button>
              <button className="hp-btn hp-btn-ghost" onClick={exportConsumptionPdf}><FileText size={14} /> PDF</button>
            </div>
          </div>
          <div className="hp-empty" style={{ padding: "0 0 12px" }}>
            Only sold items with a recipe linked (under the Recipes tab) show up under Sales Consumption — a menu item without a recipe doesn't deduct stock when sold. Waste, staff meals, and complimentary meals are reported separately here even though they're logged in the same place (Wastage & Meals tab), since blending a deliberate cost into the waste figure would misrepresent both.
          </div>
          {internalSummary && (
            <div className="hp-report-grid">
              <div className="hp-report-card"><div className="hp-report-value">{money(internalSummary.staffMealsTotal, settings.currency, settings.decimals)}</div><div className="hp-report-label">Staff meals cost</div></div>
              <div className="hp-report-card"><div className="hp-report-value">{money(internalSummary.complimentaryTotal, settings.currency, settings.decimals)}</div><div className="hp-report-label">Complimentary cost</div></div>
            </div>
          )}
          {consumptionLoading ? <div className="hp-empty">Loading…</div> : consumptionReport.length === 0 ? <div className="hp-empty">No consumption in this range yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead>
                  <tr><th style={{ textAlign: "left" }}>Item</th><th>Sales Consumption</th><th>Waste</th><th>Staff Meals</th><th>Complimentary Meals</th></tr>
                </thead>
                <tbody>
                  {consumptionReport.map((r) => (
                    <tr key={r.id}>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{r.name}</td>
                      <td>{r.sales} {r.unit}</td>
                      <td>{r.waste} {r.unit}</td>
                      <td>{r.staffMeals} {r.unit}</td>
                      <td>{r.complimentary} {r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "counts" && (
        <StockCountsPanel currentUser={currentUser} settings={settings} showToast={showToast} />
      )}

      {tab === "ledger" && (
        <div className="hp-floor-section">
          {!ledgerItemId ? (
            <>
              <div className="hp-section-label">Inventory ledger</div>
              <div className="hp-empty" style={{ padding: "0 0 10px" }}>Full running-balance history for one item — every purchase, sale, waste/staff/comp entry, and adjustment, in order. Pick an item to view it.</div>
              <div className="hp-search-row hp-history-search">
                <Search size={15} />
                <input className="hp-search-input" placeholder="Search item…" value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} />
              </div>
              <div className="hp-doc-list">
                {stockItems.filter((s) => s.name.toLowerCase().includes(ledgerSearch.toLowerCase())).map((s) => (
                  <div key={s.id} className="hp-doc-row" style={{ cursor: "pointer" }} onClick={() => openLedger(s.id)}>
                    <span className="hp-muted" style={{ width: 60 }}>{s.sku || "—"}</span>
                    <span className="hp-doc-name" style={{ flex: 1 }}>{s.name}</span>
                    <span className="hp-muted">{s.current_qty} {s.unit}</span>
                  </div>
                ))}
                {stockItems.length === 0 && <div className="hp-empty">No stock items yet.</div>}
              </div>
            </>
          ) : ledgerLoading ? (
            <div className="hp-empty">Loading…</div>
          ) : ledgerData ? (
            <>
              <div className="hp-view-head">
                <div className="hp-view-head-left">
                  <button className="hp-icon-btn" onClick={() => { setLedgerItemId(null); setLedgerData(null); }}><ChevronLeft size={18} /></button>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16 }}>{ledgerData.item.name}</h2>
                    <div className="hp-muted" style={{ fontSize: 11.5 }}>Stock ID {ledgerData.item.sku || "—"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="hp-btn hp-btn-ghost" onClick={exportLedgerCsv}><Download size={14} /> CSV</button>
                  <button className="hp-btn hp-btn-ghost" onClick={exportLedgerPdf}><FileText size={14} /> PDF</button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="hp-data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Reference</th><th style={{ textAlign: "left" }}>Type</th>
                      <th style={{ textAlign: "left" }}>Item</th><th>Qty In</th><th>Qty Out</th><th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.rows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: "left" }} className="hp-muted">{new Date(r.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</td>
                        <td style={{ textAlign: "left" }}>{r.reference}</td>
                        <td style={{ textAlign: "left" }} className="hp-muted">{r.type}{r.note ? ` — ${r.note}` : ""}</td>
                        <td style={{ textAlign: "left" }}>{ledgerData.item.name}</td>
                        <td>{r.qtyIn || ""}</td>
                        <td>{r.qtyOut || ""}</td>
                        <td style={{ fontWeight: 700 }}>{r.balance} {ledgerData.item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="hp-empty">That item no longer exists.</div>
          )}
        </div>
      )}

      {tab === "adjustments" && canManage && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Adjustments — {movementRange === "today" ? "today" : movementRange === "year" ? "this year" : "this month"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="hp-cat-tabs" style={{ marginBottom: 0 }}>
                <button className={`hp-cat-tab ${movementRange === "today" ? "active" : ""}`} onClick={() => setMovementRange("today")}>Daily</button>
                <button className={`hp-cat-tab ${movementRange === "month" ? "active" : ""}`} onClick={() => setMovementRange("month")}>Monthly</button>
                <button className={`hp-cat-tab ${movementRange === "year" ? "active" : ""}`} onClick={() => setMovementRange("year")}>Yearly</button>
              </div>
              <button className="hp-btn hp-btn-ghost" onClick={exportAdjustmentsCsv}><Download size={14} /> CSV</button>
              <button className="hp-btn hp-btn-ghost" onClick={exportAdjustmentsPdf}><FileText size={14} /> PDF</button>
            </div>
          </div>
          {adjustmentsReportLoading ? <div className="hp-empty">Loading…</div> : adjustmentsReport.length === 0 ? <div className="hp-empty">No adjustments in this range.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Adjustment ID</th><th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Time</th>
                    <th style={{ textAlign: "left" }}>Item</th><th>System Qty</th><th>Physical Qty</th><th>Adj. Qty</th>
                    <th style={{ textAlign: "left" }}>Unit</th><th>Unit Cost</th><th>Adj. Value</th>
                    <th style={{ textAlign: "left" }}>Reason</th><th style={{ textAlign: "left" }}>Adjusted By</th>
                    <th style={{ textAlign: "left" }}>Approved By</th><th style={{ textAlign: "left" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustmentsReport.map((a) => (
                    <tr key={a.id}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.reference}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(a.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(a.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{a.item_name}</td>
                      <td>{a.previous_qty}</td>
                      <td>{a.new_qty}</td>
                      <td style={{ fontWeight: 700, color: a.delta < 0 ? "var(--danger)" : a.delta > 0 ? "var(--avail)" : undefined }}>{a.delta > 0 ? `+${a.delta}` : a.delta}</td>
                      <td style={{ textAlign: "left" }}>{a.unit}</td>
                      <td>{a.unit_cost_snapshot != null ? money(a.unit_cost_snapshot, settings.currency, settings.decimals) : "—"}</td>
                      <td style={{ fontWeight: 700, color: a.value_impact < 0 ? "var(--danger)" : a.value_impact > 0 ? "var(--avail)" : undefined }}>
                        {a.value_impact != null ? `${a.value_impact > 0 ? "+" : ""}${money(a.value_impact, settings.currency, settings.decimals)}` : "—"}
                      </td>
                      <td style={{ textAlign: "left" }}>{a.reason}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.user_name || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.approved_by_user_name || "—"}</td>
                      <td style={{ textAlign: "left" }}>
                        {a.approved_by_user_name ? <span className="hp-doc-active">Approved</span>
                          : <button className="hp-btn hp-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => approveAdjustment(a)}>Mark approved</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {purchaseFor && <RecordPurchaseModal item={purchaseFor} onClose={() => setPurchaseFor(null)} onSaved={refresh} currentUser={currentUser} settings={settings} showToast={showToast} />}
      {editingItem && <StockItemModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {addingItem && <StockItemModal item={null} onClose={() => setAddingItem(false)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {adjustingItem && <StockAdjustModal item={adjustingItem} onClose={() => setAdjustingItem(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {wastageItem && <WastageModal item={wastageItem} mode={wastageMode} onClose={() => setWastageItem(null)} onSaved={() => { refresh(); if (tab === "wastage") loadWasteReport(); if (tab === "staffcomp") loadInternalReport(); }} currentUser={currentUser} showToast={showToast} />}
      {wastePickerMode && (
        <Modal title={wastePickerMode === "waste" ? "Log wastage — pick an item" : "Log staff/comp meal — pick an item"} onClose={() => { setWastePickerMode(null); setWastePickerSearch(""); }}>
          <div className="hp-search-row hp-history-search">
            <Search size={15} />
            <input autoFocus className="hp-search-input" placeholder="Search item…" value={wastePickerSearch} onChange={(e) => setWastePickerSearch(e.target.value)} />
          </div>
          <div className="hp-doc-list">
            {stockItems.length === 0 && <div className="hp-empty">No stock items yet.</div>}
            {stockItems.filter((s) => s.name.toLowerCase().includes(wastePickerSearch.toLowerCase())).map((s) => (
              <div key={s.id} className="hp-doc-row" style={{ cursor: "pointer" }} onClick={() => { setWastageItem(s); setWastageMode(wastePickerMode); setWastePickerMode(null); setWastePickerSearch(""); }}>
                <span className="hp-muted" style={{ width: 60 }}>{s.sku || "—"}</span>
                <span className="hp-doc-name" style={{ flex: 1 }}>{s.name}</span>
                <span className="hp-muted">{s.current_qty} {s.unit}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {recipeMenuItem && canManage && <RecipeEditorModal menuItem={recipeMenuItem} stockItems={stockItems} settings={settings} onClose={() => setRecipeMenuItem(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
    </div>
  );
}

/* --------------------------------- calendar --------------------------------- */

const CALENDAR_EVENT_META = {
  reservation: { color: "#A65D57", label: "Reservation" },
  task: { color: "#C2703D", label: "Task" },
  conference: { color: "#6B5B95", label: "Conference" },
  maintenance: { color: "#5C6B73", label: "Maintenance" },
  leave: { color: "#7D6BA6", label: "Leave" },
  note: { color: "#B5843D", label: "Note" },
};

function CalendarNoteModal({ date, onClose, onSaved, currentUser, showToast }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [remind, setRemind] = useState(false);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await window.api.calendar.noteCreate({ date, title: title.trim(), note: note.trim() || null, remind, actingUser: currentUser });
    showToast("Note added");
    onSaved();
    onClose();
  };
  return (
    <Modal title={`New note — ${date}`} onClose={onClose}>
      <label className="hp-field-label">Title</label>
      <input autoFocus className="hp-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="hp-field-label">Note (optional)</label>
      <input className="hp-input" value={note} onChange={(e) => setNote(e.target.value)} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "10px 0" }}>
        <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} /> Remind me on this date (desktop notification)
      </label>
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || !title.trim()} onClick={submit}>{saving ? "Saving…" : "Add note"}</button>
    </Modal>
  );
}

function DayDetailModal({ date, events, onClose, onAddNote, onRemoveNote }) {
  return (
    <Modal title={new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} onClose={onClose}>
      {events.length === 0 && <div className="hp-empty">Nothing scheduled.</div>}
      <div className="hp-doc-list">
        {events.map((e, i) => (
          <div key={i} className="hp-doc-row">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: CALENDAR_EVENT_META[e.type]?.color || "#888", display: "inline-block", flexShrink: 0 }} />
            <span className="hp-doc-name" style={{ flex: 1, cursor: "default" }}>{e.title}{e.type === "leave" ? ` — ${leaveTypeLabel(e.leaveType)}` : ""}{e.type === "note" && e.remind ? " 🔔" : ""}</span>
            <span className="hp-muted">{CALENDAR_EVENT_META[e.type]?.label || e.type}</span>
            {e.type === "note" && <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => onRemoveNote(e.id)}><Trash2 size={13} /></button>}
          </div>
        ))}
      </div>
      <button className="hp-btn hp-btn-accent hp-btn-block" style={{ marginTop: 12 }} onClick={onAddNote}>+ Add note for this date</button>
    </Modal>
  );
}

function CalendarView({ rooms, currentUser, goHome, showToast, onConvertToCheckIn }) {
  const [reservations, setReservations] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ roomId: "", guestName: "", phone: "", startDate: todayStr(), endDate: "", notes: "" });

  const refresh = async () => setReservations(await window.api.reservations.list());
  useEffect(() => { refresh(); }, []);

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const loadEvents = async () => {
    const year = monthCursor.getFullYear(), month = monthCursor.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;
    setEvents(await window.api.calendar.events({ from, to, actingUser: currentUser }));
  };
  useEffect(() => { loadEvents(); }, [monthCursor]);

  const eventsOn = (dStr) => events.filter((e) => (e.endDate ? dStr >= e.date && dStr <= e.endDate : dStr === e.date));

  const removeNote = async (id) => {
    await window.api.calendar.noteRemove({ id, actingUser: currentUser });
    loadEvents();
  };

  const active = reservations.filter((r) => r.status === "reserved");

  const [reservationError, setReservationError] = useState("");
  const createReservation = async () => {
    const room = rooms.find((r) => r.id === form.roomId);
    if (!room || !form.guestName.trim() || !form.startDate || !form.endDate) return;
    setReservationError("");
    try {
      await window.api.reservations.create({
        roomId: room.id, roomName: room.name, guestName: form.guestName.trim(), phone: form.phone.trim() || null,
        startDate: form.startDate, endDate: form.endDate, notes: form.notes.trim() || null, actingUser: currentUser,
      });
      showToast(`Reservation created for ${form.guestName.trim()}`);
      setForm({ roomId: "", guestName: "", phone: "", startDate: todayStr(), endDate: "", notes: "" });
      setShowNew(false);
      refresh();
    } catch (err) {
      setReservationError(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't create that reservation.");
    }
  };
  const cancelReservation = async (r) => { await window.api.reservations.cancel({ id: r.id, actingUser: currentUser }); showToast("Reservation cancelled"); refresh(); };
  const checkInNow = async (r) => { await onConvertToCheckIn(r); refresh(); };

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dateStr = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Calendar</h1>
        </div>
        <button className="hp-btn hp-btn-accent" onClick={() => setShowNew(true)}><CalendarPlus size={15} /> New reservation</button>
      </div>

      <div className="hp-floor-section">
        <div className="hp-view-head">
          <button className="hp-icon-btn" onClick={() => setMonthCursor(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
          <div className="hp-section-label" style={{ marginBottom: 0 }}>{monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
          <button className="hp-icon-btn" onClick={() => setMonthCursor(new Date(year, month + 1, 1))}><ChevronLeft size={16} style={{ transform: "rotate(180deg)" }} /></button>
        </div>
        <div className="hp-cal-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="hp-cal-dow">{d}</div>)}
          {cells.map((d, i) => {
            const dayEvents = d ? eventsOn(dateStr(d)) : [];
            return (
              <div
                key={i}
                className={`hp-cal-cell ${d === null ? "hp-cal-empty" : ""} ${d && dateStr(d) === todayStr() ? "hp-cal-today" : ""}`}
                style={d ? { cursor: "pointer" } : undefined}
                onClick={() => d && setSelectedDate(dateStr(d))}
              >
                {d && <div className="hp-cal-date">{d}</div>}
                {d && dayEvents.slice(0, 3).map((e, ei) => (
                  <div key={ei} className="hp-cal-chip" title={e.title} style={{ borderLeft: `3px solid ${CALENDAR_EVENT_META[e.type]?.color || "#888"}` }}>{e.title}</div>
                ))}
                {d && dayEvents.length > 3 && <div className="hp-cal-more">+{dayEvents.length - 3} more</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
          {Object.entries(CALENDAR_EVENT_META).map(([type, meta]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
              <span className="hp-muted">{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          events={eventsOn(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onAddNote={() => setShowNoteModal(true)}
          onRemoveNote={(id) => { removeNote(id); setSelectedDate(null); }}
        />
      )}
      {showNoteModal && selectedDate && (
        <CalendarNoteModal
          date={selectedDate}
          onClose={() => setShowNoteModal(false)}
          onSaved={loadEvents}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      <div className="hp-floor-section">
        <div className="hp-section-label">Upcoming reservations</div>
        {active.length === 0 && <div className="hp-empty">No reservations yet.</div>}
        <div className="hp-history-list">
          {[...active].sort((a, b) => a.start_date.localeCompare(b.start_date)).map((r) => (
            <div key={r.id} className="hp-history-row">
              <div className="hp-history-summary" style={{ gridTemplateColumns: "90px minmax(0,1fr) 150px" }}>
                <span className="hp-history-type">Room {r.room_name}</span>
                <span className="hp-history-label">{r.guest_name}{r.phone ? ` · ${r.phone}` : ""}</span>
                <span className="hp-muted">{r.start_date} → {r.end_date}</span>
              </div>
              <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
                <button className="hp-btn hp-btn-accent" onClick={() => checkInNow(r)}>Check in now</button>
                <button className="hp-btn hp-btn-ghost" onClick={() => cancelReservation(r)}>Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <Modal title="New reservation" onClose={() => setShowNew(false)}>
          <label className="hp-field-label">Room</label>
          <div className="hp-stay-picker" style={{ maxHeight: 160, marginBottom: 8 }}>
            {rooms.map((r) => (
              <button key={r.id} className={`hp-stay-option ${form.roomId === r.id ? "active" : ""}`} onClick={() => setForm({ ...form, roomId: r.id })}>
                <span className="hp-stay-room">Room {r.name}</span>
                <span className="hp-stay-guest">{r.type}</span>
              </button>
            ))}
          </div>
          <label className="hp-field-label">Guest name</label>
          <input className="hp-input" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
          <label className="hp-field-label">Phone (optional)</label>
          <input className="hp-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="hp-field-label">Check-in date</label>
          <input className="hp-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <label className="hp-field-label">Check-out date</label>
          <input className="hp-input" type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          {reservationError && <div className="hp-login-error" style={{ marginBottom: 8 }}>{reservationError}</div>}
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!form.roomId || !form.guestName.trim() || !form.endDate} onClick={createReservation}>Create reservation</button>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- contacts --------------------------------- */

const CONTACT_TYPES = [
  { id: "guest", label: "Guests" },
  { id: "supplier", label: "Suppliers" },
  { id: "staff", label: "Staff" },
  { id: "other", label: "Other" },
];

function ContactsView({ stays, currentUser, goHome, showToast }) {
  const [contacts, setContacts] = useState([]);
  const [tab, setTab] = useState("guest");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const refresh = async () => setContacts(await window.api.contacts.list());
  useEffect(() => { refresh(); }, []);

  const filtered = contacts.filter((c) => c.type === tab && c.name.toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    if (!editing.name.trim()) return;
    if (editing.id) await window.api.contacts.update({ id: editing.id, name: editing.name.trim(), phone: editing.phone.trim(), email: editing.email.trim(), notes: editing.notes.trim(), actingUser: currentUser });
    else await window.api.contacts.create({ type: editing.type, name: editing.name.trim(), phone: editing.phone.trim(), email: editing.email.trim(), notes: editing.notes.trim(), actingUser: currentUser });
    setEditing(null);
    refresh();
  };
  const remove = async (c) => { await window.api.contacts.remove({ id: c.id, actingUser: currentUser }); refresh(); };

  const importGuests = async () => {
    const guests = stays.map((s) => ({ name: s.guestName, phone: s.phone }));
    const res = await window.api.contacts.importGuests({ guests, actingUser: currentUser });
    showToast(`${res.added} guest contact(s) imported`);
    refresh();
  };
  const importSuppliers = async () => {
    const res = await window.api.contacts.importSuppliers({ actingUser: currentUser });
    showToast(`${res.added} supplier contact(s) imported`);
    refresh();
  };

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Contacts</h1>
        </div>
        <button className="hp-btn hp-btn-accent" onClick={() => setEditing({ type: tab, name: "", phone: "", email: "", notes: "" })}><Plus size={15} /> Contact</button>
      </div>
      <div className="hp-cat-tabs">
        {CONTACT_TYPES.map((t) => (
          <button key={t.id} className={`hp-cat-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="hp-search-row hp-history-search" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <Search size={15} />
          <input className="hp-search-input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      {tab === "guest" && <button className="hp-btn hp-btn-ghost" style={{ marginBottom: 10 }} onClick={importGuests}><Download size={13} /> Import from past guests</button>}
      {tab === "supplier" && <button className="hp-btn hp-btn-ghost" style={{ marginBottom: 10 }} onClick={importSuppliers}><Download size={13} /> Import from purchase suppliers</button>}
      <div className="hp-doc-list">
        {filtered.length === 0 && <div className="hp-empty">No contacts here yet.</div>}
        {filtered.map((c) => (
          <div key={c.id} className="hp-doc-row">
            <span className="hp-doc-name" style={{ flex: 1, cursor: "pointer" }} onClick={() => setEditing({ ...c, notes: c.notes || "" })}>{c.name}</span>
            {c.phone && <span className="hp-muted"><Phone size={11} style={{ verticalAlign: "-1px" }} /> {c.phone}</span>}
            {c.email && <span className="hp-muted"><Mail size={11} style={{ verticalAlign: "-1px" }} /> {c.email}</span>}
            <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => remove(c)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit contact" : "New contact"} onClose={() => setEditing(null)}>
          <label className="hp-field-label">Name</label>
          <input autoFocus className="hp-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <label className="hp-field-label">Phone</label>
          <input className="hp-input" value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
          <label className="hp-field-label">Email</label>
          <input className="hp-input" value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
          <label className="hp-field-label">Notes</label>
          <input className="hp-input" value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!editing.name.trim()} onClick={save}>{editing.id ? "Save changes" : "Add contact"}</button>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- to-do ------------------------------------ */

function TodoView({ currentUser, goHome, showToast }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("open");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", dueDate: "", priority: "normal" });

  const refresh = async () => setTasks(await window.api.tasks.list());
  useEffect(() => { refresh(); }, []);

  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);
  const priorityColor = { low: "var(--avail)", normal: "var(--text-muted)", high: "var(--danger)" };

  const create = async () => {
    if (!form.title.trim()) return;
    await window.api.tasks.create({ title: form.title.trim(), description: form.description.trim() || null, assignedTo: form.assignedTo.trim() || null, dueDate: form.dueDate || null, priority: form.priority, actingUser: currentUser });
    setForm({ title: "", description: "", assignedTo: "", dueDate: "", priority: "normal" });
    setShowNew(false);
    refresh();
  };
  const toggle = async (t) => { await window.api.tasks.setStatus({ id: t.id, status: t.status === "done" ? "open" : "done", actingUser: currentUser }); refresh(); };
  const remove = async (t) => { await window.api.tasks.remove({ id: t.id, actingUser: currentUser }); refresh(); };

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>To-do</h1>
        </div>
        <button className="hp-btn hp-btn-accent" onClick={() => setShowNew(true)}><Plus size={15} /> Task</button>
      </div>
      <div className="hp-cat-tabs">
        {["open", "done", "all"].map((f) => (
          <button key={f} className={`hp-cat-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div className="hp-doc-list">
        {filtered.length === 0 && <div className="hp-empty">Nothing here.</div>}
        {filtered.map((t) => (
          <div key={t.id} className="hp-doc-row">
            <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => toggle(t)}>
              {t.status === "done" ? <CircleCheck size={16} color="var(--accent)" /> : <Circle size={16} />}
            </button>
            <span className="hp-doc-name" style={{ flex: 1, cursor: "default", textDecoration: t.status === "done" ? "line-through" : "none", opacity: t.status === "done" ? 0.6 : 1 }}>
              {t.title}{t.assigned_to ? ` · ${t.assigned_to}` : ""}
            </span>
            {t.due_date && <span className="hp-muted">due {t.due_date}</span>}
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: priorityColor[t.priority] }}>{t.priority}</span>
            <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => remove(t)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="New task" onClose={() => setShowNew(false)}>
          <label className="hp-field-label">Title</label>
          <input autoFocus className="hp-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="hp-field-label">Description (optional)</label>
          <input className="hp-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="hp-field-label">Assigned to (optional)</label>
          <input className="hp-input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
          <label className="hp-field-label">Due date (optional)</label>
          <input className="hp-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <label className="hp-field-label">Priority</label>
          <div className="hp-cat-tabs">
            {["low", "normal", "high"].map((p) => (
              <button key={p} className={`hp-cat-tab ${form.priority === p ? "active" : ""}`} onClick={() => setForm({ ...form, priority: p })}>{p}</button>
            ))}
          </div>
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!form.title.trim()} onClick={create}>Add task</button>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- HR ---------------------------------------- */

const LEAVE_TYPES = [
  { value: "annual", label: "Annual", entitlement: 21 },
  { value: "sick", label: "Sick", entitlement: 30 },
  { value: "family_responsibility", label: "Family Responsibility", entitlement: 3 },
  { value: "maternity", label: "Maternity", entitlement: 60 },
  { value: "paternity", label: "Paternity", entitlement: 4 },
  { value: "compensatory", label: "Compensatory", entitlement: 0 },
  { value: "public_holiday", label: "Public Holiday", entitlement: 0 },
  { value: "other", label: "Other", entitlement: 0 },
];
const leaveTypeLabel = (v) => LEAVE_TYPES.find((t) => t.value === v)?.label || v;
const leaveDash = (v) => (v === 0 || v == null ? "—" : v);

function LeaveModal({ employees, fixedEmployeeId, onClose, onSaved, currentUser, showToast }) {
  const [employeeId, setEmployeeId] = useState(fixedEmployeeId || "");
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fixedEmployee = fixedEmployeeId ? employees.find((e) => e.id === fixedEmployeeId) : null;

  const submit = async () => {
    if (!employeeId || !startDate || !endDate) return;
    setSaving(true);
    setError("");
    try {
      const res = await window.api.leave.create({ employeeId, leaveType, startDate, endDate, reason: reason.trim() || null, actingUser: currentUser });
      showToast(`${res.reference} — ${res.days} day(s) ${leaveTypeLabel(leaveType).toLowerCase()} logged`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't log that leave.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Log leave${fixedEmployee ? ` — ${fixedEmployee.name}` : ""}`} onClose={onClose}>
      {!fixedEmployee && (
        <>
          <label className="hp-field-label">Employee</label>
          <div className="hp-stay-picker" style={{ maxHeight: 140, marginBottom: 8 }}>
            {employees.map((e) => (
              <button key={e.id} className={`hp-stay-option ${employeeId === e.id ? "active" : ""}`} onClick={() => setEmployeeId(e.id)}>
                <span className="hp-stay-room">{e.name}</span>
                <span className="hp-stay-guest">{e.role || ""}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <label className="hp-field-label">Leave type</label>
      <div className="hp-cat-tabs">
        {LEAVE_TYPES.map((t) => (
          <button key={t.value} className={`hp-cat-tab ${leaveType === t.value ? "active" : ""}`} onClick={() => setLeaveType(t.value)}>{t.label}</button>
        ))}
      </div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label className="hp-field-label">Start date</label>
          <input className="hp-input hp-input-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="hp-field-label">End date</label>
          <input className="hp-input hp-input-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <label className="hp-field-label">Reason (optional)</label>
      <input className="hp-input" value={reason} onChange={(e) => setReason(e.target.value)} />
      {error && <div className="hp-login-error" style={{ marginBottom: 8 }}>{error}</div>}
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || !employeeId || !startDate || !endDate} onClick={submit}>{saving ? "Saving…" : "Log leave"}</button>
    </Modal>
  );
}

function LeaveBalanceAdjustModal({ employeeId, onClose, onSaved, currentUser, showToast }) {
  const [leaveType, setLeaveType] = useState("annual");
  const [kind, setKind] = useState("accrual");
  const [days, setDays] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const d = parseFloat(days);
    if (!d) return;
    setSaving(true);
    try {
      const res = await window.api.leave.balanceAdjust({ employeeId, leaveType, kind, days: d, note: note.trim() || null, actingUser: currentUser });
      showToast(`${res.reference} recorded`);
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't record that.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Adjust leave balance" onClose={onClose}>
      <div className="hp-empty" style={{ padding: "0 0 10px" }}>
        Compensatory and Public Holiday days have no fixed annual entitlement — credit them here when an employee earns one, since there's no attendance system to detect this automatically.
      </div>
      <label className="hp-field-label">Leave type</label>
      <div className="hp-cat-tabs">
        {LEAVE_TYPES.map((t) => (
          <button key={t.value} className={`hp-cat-tab ${leaveType === t.value ? "active" : ""}`} onClick={() => setLeaveType(t.value)}>{t.label}</button>
        ))}
      </div>
      <label className="hp-field-label">Kind</label>
      <div className="hp-cat-tabs">
        <button className={`hp-cat-tab ${kind === "opening" ? "active" : ""}`} onClick={() => setKind("opening")}>Opening balance</button>
        <button className={`hp-cat-tab ${kind === "accrual" ? "active" : ""}`} onClick={() => setKind("accrual")}>Accrual credit</button>
        <button className={`hp-cat-tab ${kind === "adjustment" ? "active" : ""}`} onClick={() => setKind("adjustment")}>Correction</button>
      </div>
      <label className="hp-field-label">Days (use a negative number to deduct)</label>
      <input autoFocus className="hp-input" type="number" step="0.5" value={days} onChange={(e) => setDays(e.target.value)} />
      <label className="hp-field-label">Note (optional)</label>
      <input className="hp-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || !days || parseFloat(days) === 0} onClick={submit}>{saving ? "Saving…" : "Save"}</button>
    </Modal>
  );
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern", "Casual"];
const EMPLOYMENT_STATUSES = ["active", "on_leave", "suspended", "probation", "terminated"];
const employmentStatusLabel = (v) => ({ active: "Active", on_leave: "On Leave", suspended: "Suspended", probation: "Probation", terminated: "Terminated" }[v] || v);
const PAY_FREQUENCIES = ["monthly", "biweekly", "weekly", "daily", "hourly"];
const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Mobile Money", "Cheque"];

function NewEmployeeModal({ onClose, onSaved, currentUser, showToast }) {
  const [form, setForm] = useState({ firstName: "", middleName: "", surname: "", phone: "", email: "", department: "", role: "", employmentType: "Full-time", hireDate: todayStr() });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.firstName.trim() && !form.surname.trim()) return;
    setSaving(true);
    try {
      await window.api.employees.create({ ...form, actingUser: currentUser });
      showToast(`${form.firstName} ${form.surname}`.trim() + " added");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't add employee.");
      setSaving(false);
    }
  };

  return (
    <Modal title="New employee" onClose={onClose}>
      <div className="hp-empty" style={{ padding: "0 0 10px" }}>Add the basics now — date of birth, ID number, contract dates, and payroll details can all be filled in afterward from the Personal Information, Employment Details, and Payroll tabs.</div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div><label className="hp-field-label">First name</label><input autoFocus className="hp-input hp-input-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
        <div><label className="hp-field-label">Middle name</label><input className="hp-input hp-input-sm" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></div>
        <div><label className="hp-field-label">Surname</label><input className="hp-input hp-input-sm" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} /></div>
      </div>
      <label className="hp-field-label">Phone</label>
      <input className="hp-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <label className="hp-field-label">Email</label>
      <input className="hp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">Department</label><input className="hp-input hp-input-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <div><label className="hp-field-label">Position</label><input className="hp-input hp-input-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
      </div>
      <label className="hp-field-label">Employment type</label>
      <div className="hp-cat-tabs">
        {EMPLOYMENT_TYPES.map((t) => <button key={t} className={`hp-cat-tab ${form.employmentType === t ? "active" : ""}`} onClick={() => setForm({ ...form, employmentType: t })}>{t}</button>)}
      </div>
      <label className="hp-field-label">Date joined</label>
      <input className="hp-input" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || (!form.firstName.trim() && !form.surname.trim())} onClick={submit}>{saving ? "Saving…" : "Add employee"}</button>
    </Modal>
  );
}

function PersonalInfoModal({ employee, onClose, onSaved, currentUser, showToast }) {
  const [form, setForm] = useState({
    firstName: employee.first_name || "", middleName: employee.middle_name || "", surname: employee.surname || "",
    gender: employee.gender || "", dateOfBirth: employee.date_of_birth || "", nationality: employee.nationality || "",
    idNumber: employee.id_number || "", phone: employee.phone || "", email: employee.email || "",
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await window.api.employees.updatePersonal({ id: employee.id, ...form, actingUser: currentUser });
      showToast("Personal information saved");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't save.");
      setSaving(false);
    }
  };
  return (
    <Modal title={`Personal information — ${employee.name}`} onClose={onClose}>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div><label className="hp-field-label">First name</label><input autoFocus className="hp-input hp-input-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
        <div><label className="hp-field-label">Middle name</label><input className="hp-input hp-input-sm" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></div>
        <div><label className="hp-field-label">Surname</label><input className="hp-input hp-input-sm" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} /></div>
      </div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label className="hp-field-label">Gender</label>
          <div className="hp-cat-tabs">{GENDER_OPTIONS.map((g) => <button key={g} className={`hp-cat-tab ${form.gender === g ? "active" : ""}`} onClick={() => setForm({ ...form, gender: g })}>{g}</button>)}</div>
        </div>
        <div><label className="hp-field-label">Date of birth</label><input className="hp-input hp-input-sm" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
      </div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">Nationality</label><input className="hp-input hp-input-sm" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
        <div><label className="hp-field-label">ID number</label><input className="hp-input hp-input-sm" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></div>
      </div>
      <label className="hp-field-label">Phone</label>
      <input className="hp-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <label className="hp-field-label">Email</label>
      <input className="hp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving} onClick={submit}>{saving ? "Saving…" : "Save changes"}</button>
    </Modal>
  );
}

function EmploymentModal({ employee, onClose, onSaved, currentUser, showToast }) {
  const [form, setForm] = useState({
    department: employee.department || "", role: employee.role || "", supervisor: employee.supervisor || "",
    employmentType: employee.employment_type || "Full-time", hireDate: employee.hire_date || "",
    contractStart: employee.contract_start || "", contractEnd: employee.contract_end || "",
    probationEnd: employee.probation_end || "", workLocation: employee.work_location || "",
    employmentStatus: employee.employment_status || "active",
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await window.api.employees.updateEmployment({ id: employee.id, ...form, actingUser: currentUser });
      showToast("Employment details saved");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't save.");
      setSaving(false);
    }
  };
  return (
    <Modal title={`Employment details — ${employee.name}`} onClose={onClose}>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">Department</label><input className="hp-input hp-input-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <div><label className="hp-field-label">Position</label><input className="hp-input hp-input-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
      </div>
      <label className="hp-field-label">Supervisor</label>
      <input className="hp-input" value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} />
      <label className="hp-field-label">Employment type</label>
      <div className="hp-cat-tabs">{EMPLOYMENT_TYPES.map((t) => <button key={t} className={`hp-cat-tab ${form.employmentType === t ? "active" : ""}`} onClick={() => setForm({ ...form, employmentType: t })}>{t}</button>)}</div>
      <label className="hp-field-label">Employment status</label>
      <div className="hp-cat-tabs">{EMPLOYMENT_STATUSES.map((s) => <button key={s} className={`hp-cat-tab ${form.employmentStatus === s ? "active" : ""}`} onClick={() => setForm({ ...form, employmentStatus: s })}>{employmentStatusLabel(s)}</button>)}</div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">Date joined</label><input className="hp-input hp-input-sm" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
        <div><label className="hp-field-label">Work location</label><input className="hp-input hp-input-sm" value={form.workLocation} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} /></div>
      </div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">Contract start</label><input className="hp-input hp-input-sm" type="date" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} /></div>
        <div><label className="hp-field-label">Contract end</label><input className="hp-input hp-input-sm" type="date" value={form.contractEnd} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })} /></div>
      </div>
      <label className="hp-field-label">Probation end</label>
      <input className="hp-input" type="date" value={form.probationEnd} onChange={(e) => setForm({ ...form, probationEnd: e.target.value })} />
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving} onClick={submit}>{saving ? "Saving…" : "Save changes"}</button>
    </Modal>
  );
}

function PayrollModal({ employee, settings, onClose, onSaved, currentUser, showToast }) {
  const [form, setForm] = useState({
    payRate: employee.pay_rate ?? "", payType: employee.pay_type || "monthly", paymentMethod: employee.payment_method || "",
    nssfNumber: employee.nssf_number || "", tin: employee.tin || "",
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await window.api.employees.updatePayroll({ id: employee.id, ...form, payRate: form.payRate === "" ? null : parseFloat(form.payRate), actingUser: currentUser });
      showToast("Payroll details saved");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't save.");
      setSaving(false);
    }
  };
  return (
    <Modal title={`Payroll — ${employee.name}`} onClose={onClose}>
      <div className="hp-empty" style={{ padding: "0 0 10px" }}>Only visible to admin and HR roles.</div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">Basic salary ({settings.currency})</label><input className="hp-input hp-input-sm" type="number" value={form.payRate} onChange={(e) => setForm({ ...form, payRate: e.target.value })} /></div>
        <div>
          <label className="hp-field-label">Pay frequency</label>
          <select className="hp-input hp-input-sm" value={form.payType} onChange={(e) => setForm({ ...form, payType: e.target.value })}>
            {PAY_FREQUENCIES.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <label className="hp-field-label">Payment method</label>
      <div className="hp-cat-tabs">{PAYMENT_METHODS.map((m) => <button key={m} className={`hp-cat-tab ${form.paymentMethod === m ? "active" : ""}`} onClick={() => setForm({ ...form, paymentMethod: m })}>{m}</button>)}</div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><label className="hp-field-label">NSSF number</label><input className="hp-input hp-input-sm" value={form.nssfNumber} onChange={(e) => setForm({ ...form, nssfNumber: e.target.value })} /></div>
        <div><label className="hp-field-label">TIN</label><input className="hp-input hp-input-sm" value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} /></div>
      </div>
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving} onClick={submit}>{saving ? "Saving…" : "Save changes"}</button>
    </Modal>
  );
}

function AttendanceView({ currentUser, goHome, showToast, settings, exportReportPdf }) {
  const hasHrAccess = currentUser?.role === "admin" || currentUser?.role === "hr";
  const [tab, setTab] = useState("kiosk");
  const [roster, setRoster] = useState([]);
  const [today, setToday] = useState([]);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("month");
  const [report, setReport] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const refreshKiosk = async () => {
    const [r, t] = await Promise.all([window.api.attendance.roster(), window.api.attendance.today()]);
    setRoster(r);
    setToday(t);
  };
  useEffect(() => { refreshKiosk(); }, []);

  const statusFor = (employeeId) => today.find((a) => a.employee_id === employeeId && !a.clock_out);

  const clockIn = async (employeeId) => {
    try {
      await window.api.attendance.clockIn({ employeeId, actingUser: currentUser });
      showToast("Clocked in");
      refreshKiosk();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't clock in.");
    }
  };
  const clockOut = async (employeeId) => {
    try {
      const res = await window.api.attendance.clockOut({ employeeId, actingUser: currentUser });
      showToast(`Clocked out — ${res.hours} hour(s)${res.compensatoryCredited ? " · compensatory day earned!" : ""}`);
      refreshKiosk();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't clock out.");
    }
  };

  const reportBounds = () => {
    const now = new Date();
    if (range === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { from: start, to: start + 86400000 - 1 };
    }
    if (range === "year") {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return { from: start, to: new Date(now.getFullYear() + 1, 0, 1).getTime() - 1 };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return { from: start, to: new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1 };
  };
  const loadReport = async () => {
    setReportLoading(true);
    const { from, to } = reportBounds();
    setReport(await window.api.attendance.report({ from, to, actingUser: currentUser }));
    setReportLoading(false);
  };
  useEffect(() => { if (tab === "report") loadReport(); }, [tab, range]);

  const exportCsv = () => downloadCSV(
    `attendance-${range}.csv`,
    ["Reference", "Employee Number", "Employee", "Date", "Clock In", "Clock Out", "Hours", "Compensatory Credited"],
    report.map((a) => [a.reference, a.employee_number ?? "", a.employee_name, a.date, new Date(a.clock_in).toLocaleTimeString(), a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : "", a.hours ?? "", a.compensatory_credited ? "Yes" : "No"])
  );
  const exportPdf = () => exportReportPdf({
    title: "Attendance Report",
    subtitle: range === "today" ? "Today" : range === "year" ? "This year" : "This month",
    columns: ["Reference", "Employee", "Date", "Clock In", "Clock Out", "Hours"],
    rows: report.map((a) => [a.reference, a.employee_name, a.date, new Date(a.clock_in).toLocaleTimeString(), a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : "—", a.hours ?? "—"]),
  }, `attendance-${range}.pdf`);

  const removeRecord = async (a) => { await window.api.attendance.remove({ id: a.id, actingUser: currentUser }); loadReport(); };

  const filteredRoster = roster.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Attendance</h1>
        </div>
      </div>
      <div className="hp-cat-tabs">
        <button className={`hp-cat-tab ${tab === "kiosk" ? "active" : ""}`} onClick={() => setTab("kiosk")}>Clock In / Out</button>
        {hasHrAccess && <button className={`hp-cat-tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>Report</button>}
      </div>

      {tab === "kiosk" && (
        <div className="hp-floor-section">
          <div className="hp-search-row hp-history-search">
            <Search size={15} />
            <input className="hp-search-input" placeholder="Search your name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="hp-doc-list">
            {filteredRoster.length === 0 && <div className="hp-empty">No active employees on record.</div>}
            {filteredRoster.map((e) => {
              const open = statusFor(e.id);
              return (
                <div key={e.id} className="hp-doc-row">
                  <span className="hp-muted" style={{ width: 50 }}>{e.employee_number ?? "—"}</span>
                  <span className="hp-doc-name" style={{ flex: 1, cursor: "default" }}>{e.name}</span>
                  {open ? (
                    <>
                      <span className="hp-doc-active">Clocked in {new Date(open.clock_in).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                      <button className="hp-btn hp-btn-accent" onClick={() => clockOut(e.id)}>Clock out</button>
                    </>
                  ) : (
                    <button className="hp-btn hp-btn-ghost" onClick={() => clockIn(e.id)}>Clock in</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "report" && hasHrAccess && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Attendance — {range === "today" ? "today" : range === "year" ? "this year" : "this month"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="hp-cat-tabs" style={{ marginBottom: 0 }}>
                <button className={`hp-cat-tab ${range === "today" ? "active" : ""}`} onClick={() => setRange("today")}>Daily</button>
                <button className={`hp-cat-tab ${range === "month" ? "active" : ""}`} onClick={() => setRange("month")}>Monthly</button>
                <button className={`hp-cat-tab ${range === "year" ? "active" : ""}`} onClick={() => setRange("year")}>Yearly</button>
              </div>
              <button className="hp-btn hp-btn-ghost" onClick={exportCsv}><Download size={14} /> CSV</button>
              <button className="hp-btn hp-btn-ghost" onClick={exportPdf}><FileText size={14} /> PDF</button>
            </div>
          </div>
          <div className="hp-empty" style={{ padding: "0 0 10px" }}>Every 6th consecutive worked day automatically credits a Compensatory leave day — see the ✓ column.</div>
          {reportLoading ? <div className="hp-empty">Loading…</div> : report.length === 0 ? <div className="hp-empty">No attendance in this range.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead><tr>
                  <th style={{ textAlign: "left" }}>Reference</th><th style={{ textAlign: "left" }}>Employee Number</th><th style={{ textAlign: "left" }}>Employee</th>
                  <th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Clock In</th><th style={{ textAlign: "left" }}>Clock Out</th><th>Hours</th><th>Comp.</th><th></th>
                </tr></thead>
                <tbody>
                  {report.map((a) => (
                    <tr key={a.id}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.reference}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.employee_number ?? "—"}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{a.employee_name}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.date}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{new Date(a.clock_in).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{a.hours ?? "—"}</td>
                      <td>{a.compensatory_credited ? <span className="hp-doc-active">✓</span> : ""}</td>
                      <td><button className="hp-icon-btn hp-icon-btn-sm" onClick={() => removeRecord(a)}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TerminateModal({ employee, onClose, onSaved, currentUser, showToast, settings }) {
  const [terminationDate, setTerminationDate] = useState(todayStr());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [settlement, setSettlement] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.leave.ledgerBalances({ employeeId: employee.id, year: new Date().getFullYear(), actingUser: currentUser }).then((balances) => {
      const annual = balances.find((b) => b.leaveType === "annual");
      if (!annual || annual.closing <= 0 || employee.pay_rate == null) return;
      const dailyRate = employee.pay_type === "hourly" ? employee.pay_rate * 8 : employee.pay_rate / 26;
      const suggested = roundMoney(annual.closing * dailyRate);
      setSuggestion({ days: annual.closing, dailyRate, amount: suggested });
      setSettlement(String(suggested));
    });
  }, []);

  const submit = async () => {
    if (!terminationDate) return;
    setSaving(true);
    try {
      await window.api.employees.terminate({
        id: employee.id, terminationDate, terminationReason: reason.trim() || null, exitNotes: notes.trim() || null,
        finalSettlementAmount: settlement === "" ? null : parseFloat(settlement), actingUser: currentUser,
      });
      showToast(`${employee.name} marked as terminated`);
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't process termination.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Terminate employment — ${employee.name}`} onClose={onClose}>
      <div className="hp-empty" style={{ padding: "0 0 10px" }}>This sets employment status to Terminated and marks the record inactive. It doesn't delete anything — the full history stays intact, and the employee can be rehired later.</div>
      <label className="hp-field-label">Termination date</label>
      <input className="hp-input" type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} />
      <label className="hp-field-label">Reason (optional)</label>
      <input className="hp-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
      <label className="hp-field-label">Exit notes (optional)</label>
      <input className="hp-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <label className="hp-field-label">Final settlement amount</label>
      <input className="hp-input" type="number" value={settlement} onChange={(e) => setSettlement(e.target.value)} />
      {suggestion && (
        <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
          Suggested figure: {suggestion.days} unused annual leave day(s) × {money(suggestion.dailyRate, settings.currency, settings.decimals)}/day = {money(suggestion.amount, settings.currency, settings.decimals)}. This is a starting point only — please verify against your actual settlement policy before relying on it.
        </div>
      )}
      <button className="hp-btn hp-btn-accent hp-btn-block" disabled={saving || !terminationDate} onClick={submit}>{saving ? "Saving…" : "Confirm termination"}</button>
    </Modal>
  );
}

function UploadDocumentModal({ onClose, onUpload }) {
  const [label, setLabel] = useState("");
  return (
    <Modal title="Upload document" onClose={onClose}>
      <label className="hp-field-label">What is this document?</label>
      <input autoFocus className="hp-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Document label" />
      <button className="hp-btn hp-btn-accent hp-btn-block" onClick={() => { onUpload(label.trim() || "Document"); onClose(); }}>Choose file…</button>
    </Modal>
  );
}

function HRView({ currentUser, goHome, showToast, settings }) {
  const hasHrAccess = currentUser?.role === "admin" || currentUser?.role === "hr";
  const [tab, setTab] = useState("personal");
  const [employees, setEmployees] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [showNewEmployee, setShowNewEmployee] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(null);
  const [editingEmployment, setEditingEmployment] = useState(null);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [terminatingEmployee, setTerminatingEmployee] = useState(null);
  const [docsEmployeeId, setDocsEmployeeId] = useState(null);
  const [docsSearch, setDocsSearch] = useState("");
  const [employeeDocs, setEmployeeDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [ledgerEmployeeId, setLedgerEmployeeId] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerYear, setLedgerYear] = useState(new Date().getFullYear());
  const [ledgerBalances, setLedgerBalances] = useState([]);
  const [showBalanceAdjustModal, setShowBalanceAdjustModal] = useState(false);

  const refresh = async () => { if (hasHrAccess) setEmployees(await window.api.employees.list({ actingUser: currentUser })); };
  useEffect(() => { refresh(); }, []);

  const rehire = async (e) => {
    await window.api.employees.rehire({ id: e.id, actingUser: currentUser });
    showToast(`${e.name} rehired`);
    refresh();
  };

  const openEmployeeDocs = async (employeeId) => {
    setDocsEmployeeId(employeeId);
    setDocsLoading(true);
    setEmployeeDocs(await window.api.documents.listForEmployee({ employeeId, actingUser: currentUser }));
    setDocsLoading(false);
  };
  const uploadEmployeeDoc = async (employeeId, label) => {
    try {
      const res = await window.api.documents.add({ category: "employee_document", employeeId, label, actingUser: currentUser });
      if (res) { showToast("Document uploaded"); openEmployeeDocs(employeeId); }
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't upload.");
    }
  };
  const removeEmployeeDoc = async (doc) => {
    await window.api.documents.remove({ id: doc.id, actingUser: currentUser });
    openEmployeeDocs(docsEmployeeId);
  };

  const loadLeave = async () => { setLeaveLoading(true); setLeaveRecords(await window.api.leave.list({ actingUser: currentUser })); setLeaveLoading(false); };
  useEffect(() => { if (tab === "leave") loadLeave(); }, [tab]);

  const [jobHistory, setJobHistory] = useState([]);

  const openLedger = async (employeeId) => {
    setLedgerEmployeeId(employeeId);
    setLedgerLoading(true);
    const [data, history] = await Promise.all([
      window.api.employees.ledger({ employeeId, actingUser: currentUser }),
      window.api.employees.history({ employeeId, actingUser: currentUser }),
    ]);
    setLedgerData(data);
    setJobHistory(history);
    setLedgerLoading(false);
  };
  useEffect(() => {
    if (ledgerEmployeeId) window.api.leave.ledgerBalances({ employeeId: ledgerEmployeeId, year: ledgerYear, actingUser: currentUser }).then(setLedgerBalances);
  }, [ledgerEmployeeId, ledgerYear]);
  const reloadBalances = () => { if (ledgerEmployeeId) window.api.leave.ledgerBalances({ employeeId: ledgerEmployeeId, year: ledgerYear, actingUser: currentUser }).then(setLedgerBalances); };
  const approveLeave = async (l) => { await window.api.leave.approve({ id: l.id, actingUser: currentUser }); loadLeave(); if (ledgerEmployeeId) openLedger(ledgerEmployeeId); };
  const removeLeave = async (l) => { await window.api.leave.remove({ id: l.id, actingUser: currentUser }); loadLeave(); if (ledgerEmployeeId) openLedger(ledgerEmployeeId); };

  const toggleStatus = async (e, ev) => { ev.stopPropagation(); await window.api.employees.setStatus({ id: e.id, status: e.status === "active" ? "inactive" : "active", actingUser: currentUser }); refresh(); };
  const remove = async (e, ev) => { ev.stopPropagation(); await window.api.employees.remove({ id: e.id, actingUser: currentUser }); refresh(); };

  const visible = employees.filter((e) => showInactive || e.status === "active");

  if (!hasHrAccess) {
    return (
      <div className="hp-view">
        <div className="hp-view-head">
          <div className="hp-view-head-left">
            <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
            <h1>Human Resources</h1>
          </div>
        </div>
        <div className="hp-empty">HR records — personal information, employment details, payroll, and leave — are restricted to admin and HR roles. Ask an admin if you need access.</div>
      </div>
    );
  }

  if (ledgerEmployeeId) {
    return (
      <div className="hp-view">
        <div className="hp-view-head">
          <div className="hp-view-head-left">
            <button className="hp-icon-btn" onClick={() => { setLedgerEmployeeId(null); setLedgerData(null); }}><ChevronLeft size={18} /></button>
            {ledgerData && (
              <div>
                <h2 style={{ margin: 0, fontSize: 16 }}>{ledgerData.employee.name}</h2>
                <div className="hp-muted" style={{ fontSize: 11.5 }}>{ledgerData.employee.role || "—"} · Hired {ledgerData.employee.hire_date || "—"}</div>
              </div>
            )}
          </div>
          {ledgerData && <button className="hp-btn hp-btn-accent" onClick={() => setShowLeaveModal(true)}><Plus size={14} /> Log leave</button>}
        </div>
        {ledgerLoading ? <div className="hp-empty">Loading…</div> : !ledgerData ? <div className="hp-empty">That employee no longer exists.</div> : (
          <>
            <div className="hp-floor-section">
              <div className="hp-view-head">
                <div className="hp-section-label" style={{ marginBottom: 0 }}>Leave balance — {ledgerYear}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select className="hp-input hp-input-sm" style={{ width: 90 }} value={ledgerYear} onChange={(e) => setLedgerYear(parseInt(e.target.value, 10))}>
                    {[ledgerYear + 1, ledgerYear, ledgerYear - 1, ledgerYear - 2].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button className="hp-btn hp-btn-ghost" onClick={() => setShowBalanceAdjustModal(true)}><Plus size={13} /> Adjust balance</button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="hp-data-table">
                  <thead><tr><th style={{ textAlign: "left" }}>Employee</th><th style={{ textAlign: "left" }}>Leave Type</th><th>Opening Balance</th><th>Accrued</th><th>Taken</th><th>Adjustment</th><th>Closing Balance</th></tr></thead>
                  <tbody>
                    {ledgerBalances.map((b) => (
                      <tr key={b.leaveType}>
                        <td style={{ textAlign: "left" }}>{ledgerData.employee.name}</td>
                        <td style={{ textAlign: "left" }}>{leaveTypeLabel(b.leaveType)}</td>
                        <td>{b.opening}</td><td>{leaveDash(b.accrued)}</td><td>{leaveDash(b.taken)}</td><td>{leaveDash(b.adjustment)}</td>
                        <td style={{ fontWeight: 700 }}>{leaveDash(b.closing)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="hp-floor-section">
              <div className="hp-section-label">Leave history</div>
              {ledgerData.leaves.length === 0 && <div className="hp-empty">No leave logged for this employee yet.</div>}
              {ledgerData.leaves.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table className="hp-data-table">
                    <thead><tr><th style={{ textAlign: "left" }}>Leave Type</th><th style={{ textAlign: "left" }}>Date From</th><th style={{ textAlign: "left" }}>Date To</th><th>Days</th><th style={{ textAlign: "left" }}>Status</th><th style={{ textAlign: "left" }}>Approved By</th><th></th></tr></thead>
                    <tbody>
                      {ledgerData.leaves.map((l) => (
                        <tr key={l.id}>
                          <td style={{ textAlign: "left" }}>{leaveTypeLabel(l.leave_type)}</td>
                          <td style={{ textAlign: "left" }} className="hp-muted">{l.start_date}</td>
                          <td style={{ textAlign: "left" }} className="hp-muted">{l.end_date}</td>
                          <td style={{ fontWeight: 700 }}>{l.days}</td>
                          <td style={{ textAlign: "left" }}>{l.approved_by_user_name ? <span className="hp-doc-active">Approved</span> : <span className="hp-muted">Pending</span>}</td>
                          <td style={{ textAlign: "left" }}>{l.approved_by_user_name ? l.approved_by_user_name : <button className="hp-btn hp-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => approveLeave(l)}>Approve</button>}</td>
                          <td><button className="hp-icon-btn hp-icon-btn-sm" onClick={() => removeLeave(l)}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="hp-floor-section">
              <div className="hp-section-label">Job & compensation history</div>
              <div className="hp-empty" style={{ padding: "0 0 10px" }}>Every promotion, transfer, salary change, and status change, automatically recorded whenever those fields change.</div>
              {jobHistory.length === 0 ? <div className="hp-empty">No history recorded yet.</div> : (
                <div style={{ overflowX: "auto" }}>
                  <table className="hp-data-table">
                    <thead><tr><th style={{ textAlign: "left" }}>Reference</th><th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Event</th><th style={{ textAlign: "left" }}>From</th><th style={{ textAlign: "left" }}>To</th><th style={{ textAlign: "left" }}>Notes</th></tr></thead>
                    <tbody>
                      {jobHistory.map((h) => (
                        <tr key={h.id}>
                          <td style={{ textAlign: "left" }} className="hp-muted">{h.reference}</td>
                          <td style={{ textAlign: "left" }} className="hp-muted">{h.effective_date}</td>
                          <td style={{ textAlign: "left", fontWeight: 600 }}>{h.title}</td>
                          <td style={{ textAlign: "left" }} className="hp-muted">{h.from_value || "—"}</td>
                          <td style={{ textAlign: "left" }} className="hp-muted">{h.to_value || "—"}</td>
                          <td style={{ textAlign: "left" }} className="hp-muted">{h.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        {showLeaveModal && <LeaveModal employees={employees} fixedEmployeeId={ledgerEmployeeId} onClose={() => setShowLeaveModal(false)} onSaved={() => { openLedger(ledgerEmployeeId); reloadBalances(); }} currentUser={currentUser} showToast={showToast} />}
        {showBalanceAdjustModal && <LeaveBalanceAdjustModal employeeId={ledgerEmployeeId} onClose={() => setShowBalanceAdjustModal(false)} onSaved={reloadBalances} currentUser={currentUser} showToast={showToast} />}
      </div>
    );
  }

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Human Resources</h1>
        </div>
        {tab === "leave" ? <button className="hp-btn hp-btn-accent" onClick={() => setShowLeaveModal(true)}><Plus size={15} /> Log leave</button>
          : tab === "documents" ? null
          : <button className="hp-btn hp-btn-accent" onClick={() => setShowNewEmployee(true)}><UserPlus size={15} /> Employee</button>}
      </div>
      <div className="hp-cat-tabs">
        <button className={`hp-cat-tab ${tab === "personal" ? "active" : ""}`} onClick={() => setTab("personal")}>Personal Information</button>
        <button className={`hp-cat-tab ${tab === "employment" ? "active" : ""}`} onClick={() => setTab("employment")}>Employment Details</button>
        <button className={`hp-cat-tab ${tab === "payroll" ? "active" : ""}`} onClick={() => setTab("payroll")}>Payroll</button>
        <button className={`hp-cat-tab ${tab === "leave" ? "active" : ""}`} onClick={() => setTab("leave")}>Leave</button>
        <button className={`hp-cat-tab ${tab === "documents" ? "active" : ""}`} onClick={() => setTab("documents")}>Documents</button>
      </div>

      {tab !== "leave" && tab !== "documents" && (
        <div className="hp-cat-tabs">
          <button className={`hp-cat-tab ${!showInactive ? "active" : ""}`} onClick={() => setShowInactive(false)}>Active</button>
          <button className={`hp-cat-tab ${showInactive ? "active" : ""}`} onClick={() => setShowInactive(true)}>All</button>
        </div>
      )}

      {tab === "personal" && (
        <div className="hp-floor-section">
          {visible.length === 0 ? <div className="hp-empty">No employees on record yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead><tr>
                  <th style={{ textAlign: "left" }}>Employee Number</th><th style={{ textAlign: "left" }}>First Name</th><th style={{ textAlign: "left" }}>Middle Name</th>
                  <th style={{ textAlign: "left" }}>Surname</th><th style={{ textAlign: "left" }}>Gender</th><th style={{ textAlign: "left" }}>Date of Birth</th>
                  <th style={{ textAlign: "left" }}>Nationality</th><th style={{ textAlign: "left" }}>ID Number</th><th style={{ textAlign: "left" }}>Phone</th><th style={{ textAlign: "left" }}>Email</th><th></th>
                </tr></thead>
                <tbody>
                  {visible.map((e) => (
                    <tr key={e.id} style={{ opacity: e.status === "inactive" ? 0.55 : 1, cursor: "pointer" }} onClick={() => setEditingPersonal(e)}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.employee_number ?? "—"}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{e.first_name || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.middle_name || "—"}</td>
                      <td style={{ textAlign: "left" }}>{e.surname || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.gender || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.date_of_birth || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.nationality || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.id_number || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.phone || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.email || "—"}</td>
                      <td onClick={(ev) => ev.stopPropagation()}>
                        <button className="hp-icon-btn hp-icon-btn-sm" title={e.status === "active" ? "Deactivate" : "Reactivate"} onClick={(ev) => toggleStatus(e, ev)}><Lock size={13} /></button>
                        <button className="hp-icon-btn hp-icon-btn-sm" title="Remove" onClick={(ev) => remove(e, ev)}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "employment" && (
        <div className="hp-floor-section">
          {visible.length === 0 ? <div className="hp-empty">No employees on record yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead><tr>
                  <th style={{ textAlign: "left" }}>Employee Number</th><th style={{ textAlign: "left" }}>Name</th><th style={{ textAlign: "left" }}>Department</th>
                  <th style={{ textAlign: "left" }}>Position</th><th style={{ textAlign: "left" }}>Supervisor</th><th style={{ textAlign: "left" }}>Employment Type</th>
                  <th style={{ textAlign: "left" }}>Date Joined</th><th style={{ textAlign: "left" }}>Contract Start</th><th style={{ textAlign: "left" }}>Contract End</th>
                  <th style={{ textAlign: "left" }}>Probation End</th><th style={{ textAlign: "left" }}>Work Location</th><th style={{ textAlign: "left" }}>Employment Status</th><th></th>
                </tr></thead>
                <tbody>
                  {visible.map((e) => (
                    <tr key={e.id} style={{ opacity: e.status === "inactive" ? 0.55 : 1, cursor: "pointer" }} onClick={() => setEditingEmployment(e)}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.employee_number ?? "—"}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{e.name}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.department || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.role || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.supervisor || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.employment_type || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.hire_date || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.contract_start || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.contract_end || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.probation_end || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.work_location || "—"}</td>
                      <td style={{ textAlign: "left" }}>{employmentStatusLabel(e.employment_status || "active")}</td>
                      <td onClick={(ev) => ev.stopPropagation()}>
                        <button className="hp-icon-btn hp-icon-btn-sm" title="History & timeline" onClick={() => openLedger(e.id)}><Clock size={13} /></button>
                        {e.employment_status === "terminated"
                          ? <button className="hp-icon-btn hp-icon-btn-sm" title="Rehire" onClick={() => rehire(e)}><RotateCcw size={13} /></button>
                          : <button className="hp-icon-btn hp-icon-btn-sm" title="Terminate" onClick={() => setTerminatingEmployee(e)}><LogOut size={13} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "payroll" && (
        <div className="hp-floor-section">
          <div className="hp-empty" style={{ padding: "0 0 10px" }}>Only visible to admin and HR roles.</div>
          {visible.length === 0 ? <div className="hp-empty">No employees on record yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead><tr>
                  <th style={{ textAlign: "left" }}>Employee Number</th><th style={{ textAlign: "left" }}>Name</th><th>Basic Salary</th>
                  <th style={{ textAlign: "left" }}>Pay Frequency</th><th style={{ textAlign: "left" }}>Payment Method</th>
                  <th style={{ textAlign: "left" }}>NSSF Number</th><th style={{ textAlign: "left" }}>TIN</th>
                </tr></thead>
                <tbody>
                  {visible.map((e) => (
                    <tr key={e.id} style={{ opacity: e.status === "inactive" ? 0.55 : 1, cursor: "pointer" }} onClick={() => setEditingPayroll(e)}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.employee_number ?? "—"}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{e.name}</td>
                      <td style={{ fontWeight: 700 }}>{e.pay_rate != null ? money(e.pay_rate, settings.currency, settings.decimals) : "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.pay_type ? e.pay_type[0].toUpperCase() + e.pay_type.slice(1) : "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.payment_method || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.nssf_number || "—"}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{e.tin || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "leave" && (
        <div className="hp-floor-section">
          <div className="hp-section-label">All leave records</div>
          {leaveLoading ? <div className="hp-empty">Loading…</div> : leaveRecords.length === 0 ? <div className="hp-empty">No leave logged yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead><tr>
                  <th style={{ textAlign: "left" }}>Employee Number</th><th style={{ textAlign: "left" }}>Employee</th>
                  <th style={{ textAlign: "left" }}>Date From</th><th style={{ textAlign: "left" }}>Date To</th>
                  <th style={{ textAlign: "left" }}>Leave Type</th><th>Days</th>
                  <th style={{ textAlign: "left" }}>Status</th><th style={{ textAlign: "left" }}>Approved By</th>
                </tr></thead>
                <tbody>
                  {leaveRecords.map((l) => (
                    <tr key={l.id}>
                      <td style={{ textAlign: "left" }} className="hp-muted">{l.employee_number != null ? l.employee_number : "—"}</td>
                      <td style={{ textAlign: "left", fontWeight: 600, cursor: "pointer" }} onClick={() => openLedger(l.employee_id)}>{l.employee_name}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{l.start_date}</td>
                      <td style={{ textAlign: "left" }} className="hp-muted">{l.end_date}</td>
                      <td style={{ textAlign: "left" }}>{leaveTypeLabel(l.leave_type)}</td>
                      <td style={{ fontWeight: 700 }}>{l.days}</td>
                      <td style={{ textAlign: "left" }}>{l.approved_by_user_name ? <span className="hp-doc-active">Approved</span> : <span className="hp-muted">Pending</span>}</td>
                      <td style={{ textAlign: "left" }}>{l.approved_by_user_name ? l.approved_by_user_name : <button className="hp-btn hp-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => approveLeave(l)}>Approve</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="hp-floor-section">
          {!docsEmployeeId ? (
            <>
              <div className="hp-section-label">Employee documents</div>
              <div className="hp-empty" style={{ padding: "0 0 10px" }}>ID copies, signed contracts, certificates — pick an employee to view or add theirs. Reuses the same document storage as the Documents module elsewhere in the app.</div>
              <div className="hp-search-row hp-history-search">
                <Search size={15} />
                <input className="hp-search-input" placeholder="Search employee…" value={docsSearch} onChange={(e) => setDocsSearch(e.target.value)} />
              </div>
              <div className="hp-doc-list">
                {employees.length === 0 && <div className="hp-empty">No employees on record yet.</div>}
                {employees.filter((e) => e.name.toLowerCase().includes(docsSearch.toLowerCase())).map((e) => (
                  <div key={e.id} className="hp-doc-row" style={{ cursor: "pointer" }} onClick={() => openEmployeeDocs(e.id)}>
                    <span className="hp-muted" style={{ width: 50 }}>{e.employee_number ?? "—"}</span>
                    <span className="hp-doc-name" style={{ flex: 1 }}>{e.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="hp-view-head">
                <div className="hp-view-head-left">
                  <button className="hp-icon-btn" onClick={() => { setDocsEmployeeId(null); setEmployeeDocs([]); }}><ChevronLeft size={18} /></button>
                  <h2 style={{ margin: 0, fontSize: 16 }}>{employees.find((e) => e.id === docsEmployeeId)?.name}</h2>
                </div>
                <button className="hp-btn hp-btn-accent" onClick={() => setShowUploadModal(true)}><Upload size={14} /> Upload</button>
              </div>
              {docsLoading ? <div className="hp-empty">Loading…</div> : employeeDocs.length === 0 ? <div className="hp-empty">No documents on file.</div> : (
                <div className="hp-doc-list">
                  {employeeDocs.map((d) => (
                    <div key={d.id} className="hp-doc-row">
                      <FileText size={14} />
                      <span className="hp-doc-name" style={{ flex: 1, cursor: "pointer" }} onClick={() => window.api.documents.open(d.stored_path)}>{d.label || d.filename}</span>
                      <span className="hp-muted">{new Date(d.uploaded_at).toLocaleDateString()}</span>
                      <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => removeEmployeeDoc(d)}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showNewEmployee && <NewEmployeeModal onClose={() => setShowNewEmployee(false)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {editingPersonal && <PersonalInfoModal employee={editingPersonal} onClose={() => setEditingPersonal(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {editingEmployment && <EmploymentModal employee={editingEmployment} onClose={() => setEditingEmployment(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {editingPayroll && <PayrollModal employee={editingPayroll} settings={settings} onClose={() => setEditingPayroll(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {terminatingEmployee && <TerminateModal employee={terminatingEmployee} settings={settings} onClose={() => setTerminatingEmployee(null)} onSaved={refresh} currentUser={currentUser} showToast={showToast} />}
      {showUploadModal && <UploadDocumentModal onClose={() => setShowUploadModal(false)} onUpload={(label) => uploadEmployeeDoc(docsEmployeeId, label)} />}
      {showLeaveModal && tab === "leave" && <LeaveModal employees={employees} onClose={() => setShowLeaveModal(false)} onSaved={loadLeave} currentUser={currentUser} showToast={showToast} />}
    </div>
  );
}

/* --------------------------------- conference facility ----------------------- */

function ConferenceView({ settings, currentUser, goHome, showToast, printDocument }) {
  const [tab, setTab] = useState("bookings");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "", hourlyRate: "", dailyRate: "", amenities: "" });
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ roomId: "", clientName: "", phone: "", eventDate: todayStr(), startTime: "", endTime: "", rateType: "daily", amount: "", notes: "" });
  const [bookingError, setBookingError] = useState("");
  const [billingBooking, setBillingBooking] = useState(null);
  const [billingMethod, setBillingMethod] = useState(null);
  const [billingReceipt, setBillingReceipt] = useState(null);

  const refresh = async () => {
    const [r, b] = await Promise.all([window.api.conference.roomsList(), window.api.conference.bookingsList()]);
    setRooms(r); setBookings(b);
  };
  useEffect(() => { refresh(); }, []);

  const addRoom = async () => {
    if (!newRoom.name.trim()) return;
    await window.api.conference.roomsCreate({
      name: newRoom.name.trim(), capacity: newRoom.capacity ? parseInt(newRoom.capacity, 10) : null,
      hourlyRate: newRoom.hourlyRate ? parseFloat(newRoom.hourlyRate) : null, dailyRate: newRoom.dailyRate ? parseFloat(newRoom.dailyRate) : null,
      amenities: newRoom.amenities.trim() || null, actingUser: currentUser,
    });
    setNewRoom({ name: "", capacity: "", hourlyRate: "", dailyRate: "", amenities: "" });
    setShowNewRoom(false);
    refresh();
  };
  const removeRoom = async (r) => {
    try { await window.api.conference.roomsRemove({ id: r.id, actingUser: currentUser }); refresh(); }
    catch (err) { showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't remove that facility."); }
  };

  const selectedRoom = rooms.find((r) => r.id === bookingForm.roomId);
  const hoursOccupied = computeHours(bookingForm.startTime, bookingForm.endTime);
  useEffect(() => {
    if (!selectedRoom) return;
    if (bookingForm.rateType === "hourly") {
      if (selectedRoom.hourly_rate == null) {
        // No hourly rate configured for this facility — don't silently
        // leave whatever amount was computed for Daily in place, since
        // that would price an hourly booking at the daily rate with
        // nothing telling the person it happened. Clear it instead; the
        // warning below explains why, and the field stays editable.
        setBookingForm((f) => (f.rateType === "hourly" ? { ...f, amount: "" } : f));
        return;
      }
      const hrs = computeHours(bookingForm.startTime, bookingForm.endTime);
      const computed = hrs != null ? selectedRoom.hourly_rate * hrs : selectedRoom.hourly_rate;
      setBookingForm((f) => ({ ...f, amount: String(roundMoney(computed)) }));
    } else if (selectedRoom.daily_rate != null) {
      setBookingForm((f) => ({ ...f, amount: String(selectedRoom.daily_rate) }));
    } else {
      // Same reasoning, mirrored: no daily rate configured, so don't
      // leave a stale hourly-computed amount in place either.
      setBookingForm((f) => (f.rateType === "daily" ? { ...f, amount: "" } : f));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingForm.roomId, bookingForm.rateType, bookingForm.startTime, bookingForm.endTime]);

  const createBooking = async () => {
    if (!selectedRoom || !bookingForm.clientName.trim() || !bookingForm.eventDate || !bookingForm.amount) return;
    setBookingError("");
    try {
      await window.api.conference.bookingsCreate({
        roomId: selectedRoom.id, roomName: selectedRoom.name, clientName: bookingForm.clientName.trim(), phone: bookingForm.phone.trim() || null,
        eventDate: bookingForm.eventDate, startTime: bookingForm.startTime || null, endTime: bookingForm.endTime || null,
        rateType: bookingForm.rateType, amount: parseFloat(bookingForm.amount), notes: bookingForm.notes.trim() || null, actingUser: currentUser,
      });
      showToast(`Booking created for ${bookingForm.clientName.trim()}`);
      setBookingForm({ roomId: "", clientName: "", phone: "", eventDate: todayStr(), startTime: "", endTime: "", rateType: "daily", amount: "", notes: "" });
      setShowNewBooking(false);
      refresh();
    } catch (err) {
      setBookingError(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't create that booking.");
    }
  };

  const confirmBilling = async () => {
    if (!billingBooking || !billingMethod) return;
    try {
      const res = await window.api.conference.bookingsSettle({ id: billingBooking.id, paymentMethod: billingMethod, actingUser: currentUser });
      showToast("Booking settled");
      setBillingReceipt(buildConferenceReceipt({ ...billingBooking, paymentMethod: billingMethod, receiptRef: res.receiptRef, closedAt: Date.now() }, settings));
      setBillingBooking(null);
      setBillingMethod(null);
      refresh();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't settle that booking.");
    }
  };
  const cancelBooking = async (b) => { await window.api.conference.bookingsCancel({ id: b.id, actingUser: currentUser }); showToast("Booking cancelled"); refresh(); };

  const activeBookings = bookings.filter((b) => b.status === "booked");
  const pastBookings = bookings.filter((b) => b.status !== "booked");

  if (billingReceipt) {
    return (
      <div className="hp-view hp-billing">
        <div className="hp-view-head"><h1>Payment received</h1></div>
        <div className="hp-bill-card">
          <div className="hp-receipt-kind-inline">Conference · {billingReceipt.label}{billingReceipt.sub ? ` · ${billingReceipt.sub}` : ""}</div>
          {billingReceipt.items.map((it, i) => (
            <div key={i} className="hp-total-row"><span>{it.name}</span><span>{money(it.amount, settings.currency, settings.decimals)}</span></div>
          ))}
          <div className="hp-divider" />
          <div className="hp-total-row hp-total-grand"><span>Total paid</span><span>{money(billingReceipt.total, settings.currency, settings.decimals)}</span></div>
        </div>
        <div className="hp-ticket-actions">
          <button className="hp-btn hp-btn-ghost" onClick={() => setBillingReceipt(null)}>Done</button>
          <button className="hp-btn hp-btn-accent" onClick={() => printDocument(billingReceipt, "Receipt")}><Printer size={15} /> Print receipt</button>
        </div>
        <div className="hp-ticket-actions">
          <button className="hp-btn hp-btn-ghost" onClick={() => printDocument(billingReceipt, "Invoice")}><FileText size={14} /> Print invoice</button>
        </div>
      </div>
    );
  }

  if (billingBooking) {
    return (
      <div className="hp-view hp-billing">
        <div className="hp-view-head">
          <button className="hp-icon-btn" onClick={() => { setBillingBooking(null); setBillingMethod(null); }}><ChevronLeft size={18} /></button>
          <h1>Bill — {billingBooking.room_name}</h1>
        </div>
        <div className="hp-bill-card">
          <div className="hp-total-row"><span>{billingBooking.client_name} · {billingBooking.event_date}</span><span>{money(billingBooking.amount, settings.currency, settings.decimals)}</span></div>
          <div className="hp-divider" />
          <div className="hp-total-row hp-total-grand"><span>Total due</span><span>{money(billingBooking.amount, settings.currency, settings.decimals)}</span></div>
        </div>
        <div className="hp-pay-methods">
          <button className={`hp-pay-btn ${billingMethod === "cash" ? "active" : ""}`} onClick={() => setBillingMethod("cash")}><Banknote size={18} /> Cash</button>
          <button className={`hp-pay-btn ${billingMethod === "card" ? "active" : ""}`} onClick={() => setBillingMethod("card")}><CreditCard size={18} /> Card</button>
          <button className={`hp-pay-btn ${billingMethod === "mobile_money" ? "active" : ""}`} onClick={() => setBillingMethod("mobile_money")}><Smartphone size={18} /> Mobile Money</button>
        </div>
        <div className="hp-ticket-actions">
          <button className="hp-btn hp-btn-ghost" onClick={() => { setBillingBooking(null); setBillingMethod(null); }}><ArrowLeftRight size={15} /> Back</button>
          <button className="hp-btn hp-btn-accent" disabled={!billingMethod} onClick={confirmBilling}><Check size={15} /> Confirm payment</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Conference Facility</h1>
        </div>
        <div className="hp-cat-tabs">
          <button className={`hp-cat-tab ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>Bookings</button>
          <button className={`hp-cat-tab ${tab === "facilities" ? "active" : ""}`} onClick={() => setTab("facilities")}>Facilities</button>
        </div>
      </div>

      {tab === "facilities" && (
        <div className="hp-floor-section">
          <div className="hp-view-head">
            <div className="hp-section-label" style={{ marginBottom: 0 }}>Meeting & event spaces</div>
            <button className="hp-btn hp-btn-accent" onClick={() => setShowNewRoom(true)}><Plus size={14} /> Facility</button>
          </div>
          {rooms.length === 0 && <div className="hp-empty">No facilities set up yet.</div>}
          {rooms.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="hp-data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Facility</th><th>Capacity</th><th>Hourly rate</th><th>Daily rate</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id}>
                      <td style={{ textAlign: "left", fontWeight: 600 }}><Presentation size={13} style={{ marginRight: 6, verticalAlign: -2 }} />{r.name}</td>
                      <td className="hp-muted">{r.capacity ? `${r.capacity} pax` : "—"}</td>
                      <td className="hp-muted">{r.hourly_rate ? `${money(r.hourly_rate, settings.currency, settings.decimals)}/hr` : "—"}</td>
                      <td className="hp-muted">{r.daily_rate ? `${money(r.daily_rate, settings.currency, settings.decimals)}/day` : "—"}</td>
                      <td><button className="hp-icon-btn hp-icon-btn-sm" onClick={() => removeRoom(r)}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <>
          <div className="hp-floor-section">
            <div className="hp-view-head">
              <div className="hp-section-label" style={{ marginBottom: 0 }}>Upcoming bookings</div>
              <button className="hp-btn hp-btn-accent" disabled={rooms.length === 0} onClick={() => setShowNewBooking(true)}><Plus size={14} /> New booking</button>
            </div>
            {rooms.length === 0 && <div className="hp-empty">Add a facility first, under the Facilities tab.</div>}
            {activeBookings.length === 0 && rooms.length > 0 && <div className="hp-empty">No bookings yet.</div>}
            {activeBookings.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="hp-data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Facility</th><th style={{ textAlign: "left" }}>Client</th><th style={{ textAlign: "left" }}>Date / Time</th><th>Amount</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBookings.map((b) => (
                      <tr key={b.id}>
                        <td style={{ textAlign: "left", fontWeight: 600 }}>{b.room_name}</td>
                        <td style={{ textAlign: "left" }}>{b.client_name}{b.phone ? ` · ${b.phone}` : ""}</td>
                        <td className="hp-muted" style={{ textAlign: "left" }}>{b.event_date}{b.start_time ? ` ${b.start_time}–${b.end_time || ""}` : ""}</td>
                        <td style={{ fontWeight: 700 }}>{money(b.amount, settings.currency, settings.decimals)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button className="hp-btn hp-btn-accent" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setBillingBooking(b)}><Receipt size={13} /> Bill</button>
                            <button className="hp-btn hp-btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => cancelBooking(b)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {pastBookings.length > 0 && (
            <div className="hp-floor-section">
              <div className="hp-section-label">Past bookings</div>
              <div style={{ overflowX: "auto" }}>
                <table className="hp-data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Facility</th><th style={{ textAlign: "left" }}>Client</th><th style={{ textAlign: "left" }}>Status</th><th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBookings.slice(0, 30).map((b) => (
                      <tr key={b.id}>
                        <td style={{ textAlign: "left", fontWeight: 600 }}>{b.room_name}</td>
                        <td style={{ textAlign: "left" }}>{b.client_name}</td>
                        <td style={{ textAlign: "left" }}><span className={`hp-history-badge hp-history-${b.status === "completed" ? "paid" : "void"}`}>{b.status}</span></td>
                        <td style={{ fontWeight: 700 }}>{money(b.amount, settings.currency, settings.decimals)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showNewRoom && (
        <Modal title="New facility" onClose={() => setShowNewRoom(false)}>
          <label className="hp-field-label">Name</label>
          <input autoFocus className="hp-input" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="Facility name" />
          <label className="hp-field-label">Capacity (people)</label>
          <input className="hp-input" type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })} />
          <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className="hp-field-label">Hourly rate</label>
              <input className="hp-input hp-input-sm" type="number" value={newRoom.hourlyRate} onChange={(e) => setNewRoom({ ...newRoom, hourlyRate: e.target.value })} />
            </div>
            <div>
              <label className="hp-field-label">Daily rate</label>
              <input className="hp-input hp-input-sm" type="number" value={newRoom.dailyRate} onChange={(e) => setNewRoom({ ...newRoom, dailyRate: e.target.value })} />
            </div>
          </div>
          <label className="hp-field-label">Amenities (optional)</label>
          <input className="hp-input" value={newRoom.amenities} onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })} placeholder="Projector, Wi-Fi, whiteboard…" />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!newRoom.name.trim()} onClick={addRoom}>Add facility</button>
        </Modal>
      )}

      {showNewBooking && (
        <Modal title="New booking" onClose={() => setShowNewBooking(false)}>
          <label className="hp-field-label">Facility</label>
          <div className="hp-stay-picker" style={{ maxHeight: 140, marginBottom: 8 }}>
            {rooms.map((r) => (
              <button key={r.id} className={`hp-stay-option ${bookingForm.roomId === r.id ? "active" : ""}`} onClick={() => setBookingForm({ ...bookingForm, roomId: r.id })}>
                <span className="hp-stay-room">{r.name}</span>
                <span className="hp-stay-guest">{r.capacity ? `${r.capacity} pax` : ""}</span>
              </button>
            ))}
          </div>
          <label className="hp-field-label">Client name</label>
          <input className="hp-input" value={bookingForm.clientName} onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })} />
          <label className="hp-field-label">Phone (optional)</label>
          <input className="hp-input" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} />
          <label className="hp-field-label">Event date</label>
          <input className="hp-input" type="date" value={bookingForm.eventDate} onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })} />
          <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className="hp-field-label">Start time (optional)</label>
              <input className="hp-input hp-input-sm" type="time" value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} />
            </div>
            <div>
              <label className="hp-field-label">End time (optional)</label>
              <input className="hp-input hp-input-sm" type="time" value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} />
            </div>
          </div>
          <label className="hp-field-label">Rate type</label>
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${bookingForm.rateType === "daily" ? "active" : ""}`} onClick={() => setBookingForm({ ...bookingForm, rateType: "daily" })}>Daily</button>
            <button className={`hp-cat-tab ${bookingForm.rateType === "hourly" ? "active" : ""}`} onClick={() => setBookingForm({ ...bookingForm, rateType: "hourly" })}>Hourly</button>
          </div>
          <label className="hp-field-label">Amount</label>
          <input className="hp-input" type="number" value={bookingForm.amount} onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })} />
          {bookingForm.rateType === "hourly" && selectedRoom && (
            selectedRoom.hourly_rate != null ? (
              <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                {hoursOccupied != null
                  ? `${money(selectedRoom.hourly_rate, settings.currency, settings.decimals)} × ${hoursOccupied} hour(s) = ${money(selectedRoom.hourly_rate * hoursOccupied, settings.currency, settings.decimals)}`
                  : "Set a start and end time to calculate by duration — using the flat hourly rate for now."}
              </div>
            ) : (
              <div className="hp-login-error" style={{ fontSize: 11.5, marginTop: 4 }}>
                {selectedRoom.name} has no hourly rate set — add one under Manage Facilities, or enter this booking's amount manually below.
              </div>
            )
          )}
          <label className="hp-field-label">Notes (optional)</label>
          <input className="hp-input" value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} />
          {bookingError && <div className="hp-login-error" style={{ marginBottom: 8 }}>{bookingError}</div>}
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!selectedRoom || !bookingForm.clientName.trim() || !bookingForm.amount} onClick={createBooking}>Create booking</button>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- running costs ------------------------------ */

const EXPENSE_CATEGORIES = ["Electricity", "Water", "Internet", "Gas", "Waste disposal", "TV Subscription", "Fuel", "Security", "Other"];

function RunningCostsView({ settings, currentUser, goHome, showToast, exportReportPdf }) {
  const [range, setRange] = useState("month");
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ category: "Electricity", description: "", vendor: "", amount: "", expenseDate: todayStr(), paymentMethod: "cash", recurring: false, notes: "" });

  const bounds = () => {
    const now = new Date();
    if (range === "month") {
      return { from: toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1).getTime()), to: toLocalDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime()) };
    }
    return { from: toLocalDateStr(new Date(now.getFullYear(), 0, 1).getTime()), to: toLocalDateStr(new Date(now.getFullYear(), 11, 31).getTime()) };
  };

  const refresh = async () => {
    const { from, to } = bounds();
    const [list, sum] = await Promise.all([window.api.runningCosts.list({ from, to }), window.api.runningCosts.summary({ from, to })]);
    setExpenses(list); setSummary(sum);
  };
  useEffect(() => { refresh(); }, [range]);

  const create = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    await window.api.runningCosts.create({
      category: form.category, description: form.description.trim() || null, vendor: form.vendor.trim() || null,
      amount: parseFloat(form.amount), expenseDate: form.expenseDate, paymentMethod: form.paymentMethod, recurring: form.recurring, notes: form.notes.trim() || null, actingUser: currentUser,
    });
    setForm({ category: "Electricity", description: "", vendor: "", amount: "", expenseDate: todayStr(), paymentMethod: "cash", recurring: false, notes: "" });
    setShowNew(false);
    refresh();
  };
  const remove = async (e) => { await window.api.runningCosts.remove({ id: e.id, actingUser: currentUser }); refresh(); };

  const exportCsv = () => {
    downloadCSV(
      `expenses-${range}.csv`,
      ["Category", "Vendor", "Description", "Amount", "Date", "Payment method", "Recurring"],
      expenses.map((e) => [e.category, e.vendor || "", e.description || "", e.amount, e.expense_date, e.payment_method || "", e.recurring ? "Yes" : "No"])
    );
  };
  const exportPdf = () => {
    exportReportPdf({
      title: "Running Costs (Expenses)",
      subtitle: `${range === "month" ? "This month" : "This year"} · ${expenses.length} entries`,
      columns: ["Category", "Vendor", "Description", "Amount", "Date"],
      rows: expenses.map((e) => [e.category, e.vendor || "—", e.description || "—", money(e.amount, settings.currency, settings.decimals), e.expense_date]),
      totalsRow: { label: "Total", value: money(expenses.reduce((s, e) => s + e.amount, 0), settings.currency, settings.decimals) },
    }, `expenses-${range}.pdf`);
  };

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Running Costs</h1>
        </div>
        <div className="hp-cat-tabs">
          <button className={`hp-cat-tab ${range === "month" ? "active" : ""}`} onClick={() => setRange("month")}>This month</button>
          <button className={`hp-cat-tab ${range === "year" ? "active" : ""}`} onClick={() => setRange("year")}>This year</button>
        </div>
      </div>

      {summary && (
        <div className="hp-report-grid">
          <div className="hp-report-card"><Zap size={16} /><div className="hp-report-value">{money(summary.total, settings.currency, settings.decimals)}</div><div className="hp-report-label">Total · {summary.count} entries</div></div>
          {Object.entries(summary.byCategory).slice(0, 5).map(([cat, amt]) => (
            <div key={cat} className="hp-report-card"><div className="hp-report-value">{money(amt, settings.currency, settings.decimals)}</div><div className="hp-report-label">{cat}</div></div>
          ))}
        </div>
      )}

      <div className="hp-floor-section">
        <div className="hp-view-head">
          <div className="hp-section-label" style={{ marginBottom: 0 }}>Entries</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="hp-btn hp-btn-ghost" onClick={exportCsv}><Download size={14} /> CSV</button>
            <button className="hp-btn hp-btn-ghost" onClick={exportPdf}><FileText size={14} /> PDF</button>
            <button className="hp-btn hp-btn-accent" onClick={() => setShowNew(true)}><Plus size={14} /> Expense</button>
          </div>
        </div>
        {expenses.length === 0 && <div className="hp-empty">No expenses recorded for this period.</div>}
        <div className="hp-doc-list">
          {expenses.map((e) => (
            <div key={e.id} className="hp-doc-row">
              <span className="hp-doc-name" style={{ flex: 1, cursor: "default" }}>{e.category}{e.vendor ? ` · ${e.vendor}` : ""}{e.description ? ` — ${e.description}` : ""}</span>
              <span className="hp-muted">{e.expense_date}</span>
              {!!e.recurring && <span className="hp-doc-active">Recurring</span>}
              <span className="hp-muted">{money(e.amount, settings.currency, settings.decimals)}</span>
              <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => remove(e)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <Modal title="New expense" onClose={() => setShowNew(false)}>
          <label className="hp-field-label">Category</label>
          <div className="hp-cat-tabs">
            {EXPENSE_CATEGORIES.map((c) => <button key={c} className={`hp-cat-tab ${form.category === c ? "active" : ""}`} onClick={() => setForm({ ...form, category: c })}>{c}</button>)}
          </div>
          <label className="hp-field-label">Description (optional)</label>
          <input className="hp-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="hp-field-label">Vendor (optional)</label>
          <input className="hp-input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <label className="hp-field-label">Amount</label>
          <input className="hp-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <label className="hp-field-label">Date</label>
          <input className="hp-input" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          <label className="hp-field-label">Payment method</label>
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${form.paymentMethod === "cash" ? "active" : ""}`} onClick={() => setForm({ ...form, paymentMethod: "cash" })}>Cash</button>
            <button className={`hp-cat-tab ${form.paymentMethod === "card" ? "active" : ""}`} onClick={() => setForm({ ...form, paymentMethod: "card" })}>Card</button>
            <button className={`hp-cat-tab ${form.paymentMethod === "mobile_money" ? "active" : ""}`} onClick={() => setForm({ ...form, paymentMethod: "mobile_money" })}>Mobile Money</button>
            <button className={`hp-cat-tab ${form.paymentMethod === "transfer" ? "active" : ""}`} onClick={() => setForm({ ...form, paymentMethod: "transfer" })}>Transfer</button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "10px 0" }}>
            <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} /> Recurring monthly expense
          </label>
          <label className="hp-field-label">Notes (optional)</label>
          <input className="hp-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!form.amount || parseFloat(form.amount) <= 0} onClick={create}>Add expense</button>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- maintenance & repairs ---------------------- */

function MaintenanceView({ settings, currentUser, goHome, showToast }) {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("active");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", category: "repair", location: "", cost: "", vendor: "", scheduledDate: "", notes: "" });

  const refresh = async () => setRecords(await window.api.maintenance.list());
  useEffect(() => { refresh(); }, []);

  const filtered = records.filter((r) => (filter === "all" ? true : filter === "active" ? r.status !== "completed" : r.status === "completed"));
  const statusColor = { planned: "var(--text-muted)", in_progress: "var(--billc)", completed: "var(--avail)" };

  const create = async () => {
    if (!form.title.trim()) return;
    await window.api.maintenance.create({
      title: form.title.trim(), category: form.category, location: form.location.trim() || null,
      cost: form.cost ? parseFloat(form.cost) : null, vendor: form.vendor.trim() || null, scheduledDate: form.scheduledDate || null, notes: form.notes.trim() || null, actingUser: currentUser,
    });
    setForm({ title: "", category: "repair", location: "", cost: "", vendor: "", scheduledDate: "", notes: "" });
    setShowNew(false);
    refresh();
  };
  const setStatus = async (r, status) => { await window.api.maintenance.setStatus({ id: r.id, status, actingUser: currentUser }); refresh(); };
  const remove = async (r) => { await window.api.maintenance.remove({ id: r.id, actingUser: currentUser }); refresh(); };

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Maintenance & Repairs</h1>
        </div>
        <button className="hp-btn hp-btn-accent" onClick={() => setShowNew(true)}><Plus size={15} /> Record</button>
      </div>
      <div className="hp-cat-tabs">
        {["active", "completed", "all"].map((f) => (
          <button key={f} className={`hp-cat-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div className="hp-doc-list">
        {filtered.length === 0 && <div className="hp-empty">Nothing here.</div>}
        {filtered.map((r) => (
          <div key={r.id} className="hp-doc-row">
            <Wrench size={14} />
            <span className="hp-doc-name" style={{ flex: 1, cursor: "default" }}>{r.title}{r.location ? ` · ${r.location}` : ""}</span>
            <span className="hp-muted" style={{ textTransform: "capitalize" }}>{r.category}</span>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: statusColor[r.status] }}>{r.status.replace("_", " ")}</span>
            {r.cost != null && <span className="hp-muted">{money(r.cost, settings.currency, settings.decimals)}</span>}
            {r.status !== "completed" && (
              <button className="hp-btn hp-btn-ghost" onClick={() => setStatus(r, r.status === "planned" ? "in_progress" : "completed")}>
                {r.status === "planned" ? "Start" : "Complete"}
              </button>
            )}
            <button className="hp-icon-btn hp-icon-btn-sm" onClick={() => remove(r)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="New maintenance record" onClose={() => setShowNew(false)}>
          <label className="hp-field-label">Title</label>
          <input autoFocus className="hp-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
          <label className="hp-field-label">Category</label>
          <div className="hp-cat-tabs">
            {["repair", "maintenance", "renovation"].map((c) => <button key={c} className={`hp-cat-tab ${form.category === c ? "active" : ""}`} onClick={() => setForm({ ...form, category: c })}>{c}</button>)}
          </div>
          <label className="hp-field-label">Location (optional)</label>
          <input className="hp-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
          <label className="hp-field-label">Estimated/actual cost (optional)</label>
          <input className="hp-input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          <label className="hp-field-label">Vendor / contractor (optional)</label>
          <input className="hp-input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <label className="hp-field-label">Scheduled date (optional)</label>
          <input className="hp-input" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          <label className="hp-field-label">Notes (optional)</label>
          <input className="hp-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!form.title.trim()} onClick={create}>Add record</button>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- business dashboard ------------------------ */

const SECTION_COLORS = { restaurant: "#C1874F", accommodation: "#6B8F71", conference: "#6B5B95" };
const GRANULARITY_LABELS = { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" };

function DashboardView({ settings, currentUser, goHome, showToast }) {
  const [granularity, setGranularity] = useState("day");
  const [revenueRows, setRevenueRows] = useState([]);
  const [cogsRows, setCogsRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [internalCostRows, setInternalCostRows] = useState([]);
  const [stockPurchaseRows, setStockPurchaseRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { from, to } = boundsForGranularity(granularity);
    Promise.all([
      window.api.dashboard.revenueRows({ from, to }),
      window.api.ledger.profitSeries({ from, to }),
      window.api.dashboard.expenseRows({ from, to }),
      window.api.dashboard.internalCostRows({ from, to }),
      window.api.dashboard.stockPurchaseRows({ from, to }),
    ]).then(([rev, cogs, exp, internal, purchases]) => {
      setRevenueRows(rev); setCogsRows(cogs); setExpenseRows(exp); setInternalCostRows(internal); setStockPurchaseRows(purchases); setLoading(false);
    });
  }, [granularity]);

  const bucketKeys = generateBuckets(granularity);
  const revenueBuckets = bucketRevenue(revenueRows, granularity, bucketKeys);
  const cogsBuckets = bucketCogs(cogsRows, granularity, bucketKeys);
  const expenseBuckets = bucketExpenses(expenseRows, granularity, bucketKeys);
  // Reuses bucketCogs (buckets by epoch-ms `closed_at`, sums `cogs`) by
  // remapping field names — internalCostRows is shaped the same way,
  // just with different names.
  const internalCostBuckets = bucketCogs(internalCostRows.map((r) => ({ closed_at: r.created_at, cogs: r.amount || 0 })), granularity, bucketKeys);

  const trendPoints = revenueBuckets.map((b) => ({ label: bucketLabel(b.key, granularity), value: b.total }));

  const sectionTotals = revenueRows.reduce((acc, r) => { acc[r.kind] = (acc[r.kind] || 0) + r.total; return acc; }, {});
  const sectionBars = [
    { label: "Restaurant", value: sectionTotals.restaurant || 0, color: SECTION_COLORS.restaurant },
    { label: "Accommodation", value: sectionTotals.accommodation || 0, color: SECTION_COLORS.accommodation },
    { label: "Conference", value: sectionTotals.conference || 0, color: SECTION_COLORS.conference },
  ];

  const totalRevenue = revenueRows.reduce((s, r) => s + r.total, 0);
  const totalCogs = cogsRows.reduce((s, r) => s + r.cogs, 0);
  const totalInternalCost = internalCostRows.reduce((s, r) => s + (r.amount || 0), 0);
  const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0) + totalInternalCost;
  const totalStockPurchases = stockPurchaseRows.reduce((s, r) => s + (r.amount || 0), 0);
  const grossProfit = roundMoney(totalRevenue - totalCogs);
  const netProfit = roundMoney(grossProfit - totalExpenses);

  const incomeExpenseBuckets = bucketKeys.map((k, i) => {
    const revenue = revenueBuckets[i].total;
    const cogs = cogsBuckets[i];
    const expenses = expenseBuckets[i] + internalCostBuckets[i];
    return { label: bucketLabel(k, granularity), revenue, expenses, netProfit: roundMoney(revenue - cogs - expenses) };
  });

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Business Dashboard</h1>
        </div>
        <div className="hp-cat-tabs">
          {["day", "week", "month", "year"].map((g) => (
            <button key={g} className={`hp-cat-tab ${granularity === g ? "active" : ""}`} onClick={() => setGranularity(g)}>{GRANULARITY_LABELS[g]}</button>
          ))}
        </div>
      </div>

      <div className="hp-report-grid">
        <div className="hp-report-card"><TrendingUp size={16} /><div className="hp-report-value">{money(totalRevenue, settings.currency, settings.decimals)}</div><div className="hp-report-label">Total revenue</div></div>
        <div className="hp-report-card"><div className="hp-report-value">{money(grossProfit, settings.currency, settings.decimals)}</div><div className="hp-report-label">Gross profit</div></div>
        <div className="hp-report-card"><Zap size={16} /><div className="hp-report-value">{money(totalExpenses, settings.currency, settings.decimals)}</div><div className="hp-report-label">Operating expenses (incl. waste & internal use)</div></div>
        <div className="hp-report-card"><div className="hp-report-value">{money(totalInternalCost, settings.currency, settings.decimals)}</div><div className="hp-report-label">of which waste/staff/comp</div></div>
        <div className="hp-report-card"><Package size={16} /><div className="hp-report-value">{money(totalStockPurchases, settings.currency, settings.decimals)}</div><div className="hp-report-label">Stock purchases this period</div></div>
        <div className="hp-report-card"><div className="hp-report-value" style={{ color: netProfit >= 0 ? "var(--avail)" : "var(--danger)" }}>{money(netProfit, settings.currency, settings.decimals)}</div><div className="hp-report-label">Net profit</div></div>
      </div>

      <div className="hp-floor-section">
        <div className="hp-section-label">{GRANULARITY_LABELS[granularity]} revenue trend — overall business</div>
        {loading ? <div className="hp-empty">Loading…</div> : <LineChartSVG points={trendPoints} xLabel={GRANULARITY_LABELS[granularity]} yLabel={`Revenue (${settings.currency.trim()})`} />}
      </div>

      <div className="hp-floor-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
        <div>
          <div className="hp-section-label">Revenue by section</div>
          <BarChartSVG bars={sectionBars} xLabel="Section" yLabel={`Revenue (${settings.currency.trim()})`} minHeight={280} />
        </div>
        <div>
          <div className="hp-section-label">Revenue position</div>
          <div className="hp-chart-card" style={{ display: "flex", alignItems: "center", gap: 20, minHeight: 280 }}>
            <PieChartSVG slices={sectionBars} size={170} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              {sectionBars.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block", flexShrink: 0 }} />
                  <span className="hp-muted hp-truncate">{s.label} — {money(s.value, settings.currency, settings.decimals)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hp-floor-section">
        <div className="hp-section-label">Income vs. expenses vs. net profit</div>
        <GroupedBarChartSVG
          buckets={incomeExpenseBuckets}
          series={[
            { key: "revenue", label: "Revenue", color: "var(--accent)" },
            { key: "expenses", label: "Expenses", color: "var(--danger)" },
            { key: "netProfit", label: "Net profit", color: "var(--avail)" },
          ]}
        />
      </div>
    </div>
  );
}

/* --------------------------------- sidebar -------------------------------- */

function Sidebar({ view, setView, openRoomCount, occupiedRoomCount }) {
  const items = [
    { id: "home", label: "Home", icon: LayoutGrid },
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

function TopBar({ venueName, saveStatus, currentUser, onLogout }) {
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
        {currentUser && (
          <button className="hp-icon-btn hp-topbar-user" onClick={onLogout} title="Log out">
            {currentUser.name} <LogOut size={13} />
          </button>
        )}
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
      <div className="hp-table-name">{order.isTakeaway ? <><Package size={14} /> Take-away</> : <><DoorOpen size={14} /> {order.roomNumber}</>}</div>
      <div className="hp-table-info">
        <div className="hp-table-total">{money(totals.subtotal, currency, decimals)}</div>
        <div className="hp-table-time"><Clock size={11} /> {elapsed(order.createdAt)}</div>
      </div>
      <div className="hp-table-status">{meta.label}</div>
    </button>
  );
}

function TableManagementPanel({ tables, setTables, showToast, onClose }) {
  const [showTableModal, setShowTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: "", section: "Main Dining", seats: 4, shape: "round" });
  const draftFor = (list) => Object.fromEntries(list.map((t) => [t.id, { name: t.name, seats: t.seats, shape: t.shape }]));
  const [tableDrafts, setTableDrafts] = useState(() => draftFor(tables));
  useEffect(() => { setTableDrafts(draftFor(tables)); }, [tables]);
  const tablesDirty = tables.some((t) => {
    const d = tableDrafts[t.id];
    return !d || d.name !== t.name || Number(d.seats) !== t.seats || d.shape !== t.shape;
  });

  const addTable = () => {
    if (!newTable.name.trim()) return;
    setTables([...tables, { id: uid("tb"), ...newTable, status: "available" }]);
    setNewTable({ name: "", section: "Main Dining", seats: 4, shape: "round" });
    setShowTableModal(false);
  };
  const removeTable = (id) => {
    const t = tables.find((x) => x.id === id);
    if (t && t.status !== "available") return;
    setTables(tables.filter((x) => x.id !== id));
  };
  const saveTableEdits = () => {
    setTables(tables.map((t) => {
      const d = tableDrafts[t.id];
      if (!d) return t;
      const name = d.name.trim() || t.name;
      const seats = Math.max(1, parseInt(d.seats, 10) || t.seats);
      const shape = d.shape === "square" ? "square" : "round";
      return { ...t, name, seats, shape };
    }));
    showToast("Table changes saved");
  };
  const cancelTableEdits = () => setTableDrafts(draftFor(tables));

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={onClose}><ChevronLeft size={18} /></button>
          <h1>Manage Tables</h1>
        </div>
        <button className="hp-btn hp-btn-accent" onClick={() => setShowTableModal(true)}><Plus size={14} /> Table</button>
      </div>
      <div className="hp-floor-section">
        <div style={{ overflowX: "auto" }}>
          <table className="hp-data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Table</th><th style={{ textAlign: "left" }}>Section</th><th style={{ textAlign: "left" }}>Shape</th><th>Seats</th><th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id}>
                  <td style={{ textAlign: "left" }}><input className="hp-input hp-input-sm" value={tableDrafts[t.id]?.name ?? t.name} onChange={(e) => setTableDrafts({ ...tableDrafts, [t.id]: { ...tableDrafts[t.id], name: e.target.value } })} /></td>
                  <td className="hp-muted" style={{ textAlign: "left" }}>{t.section}</td>
                  <td style={{ textAlign: "left" }}>
                    <select className="hp-input hp-input-sm" value={tableDrafts[t.id]?.shape ?? t.shape} onChange={(e) => setTableDrafts({ ...tableDrafts, [t.id]: { ...tableDrafts[t.id], shape: e.target.value } })}>
                      <option value="round">Round</option>
                      <option value="square">Square</option>
                    </select>
                  </td>
                  <td><input className="hp-input hp-input-sm" type="number" min="1" value={tableDrafts[t.id]?.seats ?? t.seats} onChange={(e) => setTableDrafts({ ...tableDrafts, [t.id]: { ...tableDrafts[t.id], seats: e.target.value } })} /></td>
                  <td><button className="hp-icon-btn hp-icon-btn-sm" disabled={t.status !== "available"} onClick={() => removeTable(t.id)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tablesDirty && (
          <div className="hp-ticket-actions">
            <button className="hp-btn hp-btn-ghost" onClick={cancelTableEdits}>Cancel</button>
            <button className="hp-btn hp-btn-accent" onClick={saveTableEdits}>Save changes</button>
          </div>
        )}
      </div>
      {showTableModal && (
        <Modal title="New table" onClose={() => setShowTableModal(false)}>
          <label className="hp-field-label">Name</label>
          <input autoFocus className="hp-input" value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} />
          <label className="hp-field-label">Section</label>
          <input className="hp-input" value={newTable.section} onChange={(e) => setNewTable({ ...newTable, section: e.target.value })} />
          <label className="hp-field-label">Shape</label>
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${newTable.shape === "round" ? "active" : ""}`} onClick={() => setNewTable({ ...newTable, shape: "round" })}>Round</button>
            <button className={`hp-cat-tab ${newTable.shape === "square" ? "active" : ""}`} onClick={() => setNewTable({ ...newTable, shape: "square" })}>Square</button>
          </div>
          <label className="hp-field-label">Seats</label>
          <input className="hp-input" type="number" value={newTable.seats} onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) || 1 })} />
          <button className="hp-btn hp-btn-accent hp-btn-block" onClick={addTable}>Add table</button>
        </Modal>
      )}
    </div>
  );
}

function RoomManagementPanel({ rooms, setRooms, showToast, onClose }) {
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", type: "single", rate: 50000 });
  const roomDraftFor = (list) => Object.fromEntries(list.map((r) => [r.id, { name: r.name, rate: r.rate }]));
  const [roomDrafts, setRoomDrafts] = useState(() => roomDraftFor(rooms));
  useEffect(() => { setRoomDrafts(roomDraftFor(rooms)); }, [rooms]);
  const roomsDirty = rooms.some((r) => {
    const d = roomDrafts[r.id];
    return !d || d.name !== r.name || Number(d.rate) !== r.rate;
  });

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
  const saveRoomEdits = () => {
    setRooms(rooms.map((r) => {
      const d = roomDrafts[r.id];
      if (!d) return r;
      const name = d.name.trim() || r.name;
      const rate = Math.max(0, parseInt(d.rate, 10) || r.rate);
      return { ...r, name, rate };
    }));
    showToast("Room changes saved");
  };
  const cancelRoomEdits = () => setRoomDrafts(roomDraftFor(rooms));

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={onClose}><ChevronLeft size={18} /></button>
          <h1>Manage Rooms</h1>
        </div>
        <button className="hp-btn hp-btn-accent" onClick={() => setShowRoomModal(true)}><Plus size={14} /> Room</button>
      </div>
      <div className="hp-floor-section">
        <div style={{ overflowX: "auto" }}>
          <table className="hp-data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Room</th><th style={{ textAlign: "left" }}>Type</th><th>Nightly rate</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td style={{ textAlign: "left" }}><input className="hp-input hp-input-sm" value={roomDrafts[r.id]?.name ?? r.name} onChange={(e) => setRoomDrafts({ ...roomDrafts, [r.id]: { ...roomDrafts[r.id], name: e.target.value } })} /></td>
                  <td className="hp-muted" style={{ textAlign: "left" }}>{r.type}</td>
                  <td><input className="hp-input hp-input-sm" type="number" value={roomDrafts[r.id]?.rate ?? r.rate} onChange={(e) => setRoomDrafts({ ...roomDrafts, [r.id]: { ...roomDrafts[r.id], rate: e.target.value } })} /></td>
                  <td><button className="hp-icon-btn hp-icon-btn-sm" disabled={r.status !== "vacant"} onClick={() => removeRoom(r.id)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {roomsDirty && (
          <div className="hp-ticket-actions">
            <button className="hp-btn hp-btn-ghost" onClick={cancelRoomEdits}>Cancel</button>
            <button className="hp-btn hp-btn-accent" onClick={saveRoomEdits}>Save changes</button>
          </div>
        )}
      </div>
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

function FloorView({ tables, orders, settings, checkedInStays, openTable, openRoomOrder, startRoomCharge, startTakeawayOrder, goHome, setTables, showToast }) {
  const sections = [...new Set(tables.map((t) => t.section))];
  const openOrderFor = (tableId) => orders.find((o) => o.tableId === tableId && (o.status === "occupied" || o.status === "bill"));
  const takeawayOrders = orders.filter((o) => o.isTakeaway && (o.status === "occupied" || o.status === "bill"));
  const roomOrders = orders.filter((o) => !o.tableId && !o.isTakeaway && (o.status === "occupied" || o.status === "bill"));
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedStayId, setSelectedStayId] = useState("");
  const [showTableManagement, setShowTableManagement] = useState(false);

  if (showTableManagement) {
    return <TableManagementPanel tables={tables} setTables={setTables} showToast={showToast} onClose={() => setShowTableManagement(false)} />;
  }

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Restaurant Floor</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="hp-btn hp-btn-ghost" onClick={() => setShowTableManagement(true)}><Settings size={14} /> Manage tables</button>
          <button className="hp-btn hp-btn-ghost" onClick={startTakeawayOrder}><Package size={14} /> New take-away order</button>
          <button className="hp-btn hp-btn-accent" onClick={() => setShowRoomModal(true)}>
            <DoorOpen size={15} /> New room service order
          </button>
        </div>
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

      {takeawayOrders.length > 0 && (
        <div className="hp-floor-section">
          <div className="hp-section-label">Take-away orders</div>
          <div className="hp-table-grid">
            {takeawayOrders.map((o) => (
              <RoomChargeCard key={o.id} order={o} currency={settings.currency} decimals={settings.decimals} onClick={() => openRoomOrder(o)} />
            ))}
          </div>
        </div>
      )}

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
          <h1>{table ? table.name : order.isTakeaway ? "Take-away" : `Room ${order.roomNumber}`}</h1>
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
        <h1>Bill — {table ? table.name : order.isTakeaway ? "Take-away" : `Room ${order.roomNumber}`}</h1>
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
        <button className={`hp-pay-btn ${method === "mobile_money" ? "active" : ""}`} onClick={() => setMethod("mobile_money")}><Smartphone size={18} /> Mobile Money</button>
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
        <button className="hp-btn hp-btn-accent" onClick={() => onPrint("Receipt")}><Printer size={15} /> Print receipt</button>
      </div>
      {isDesktop && (
        <div className="hp-ticket-actions">
          <button className="hp-btn hp-btn-ghost" onClick={() => onPrint("Invoice")}><FileText size={14} /> Print invoice</button>
          <button className="hp-btn hp-btn-ghost" onClick={() => onPrint("Delivery Note")}><Package size={14} /> Print delivery note</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- history view ------------------------------ */

function HistoryScreen({ orders, stays, settings, onPrint }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [conferenceBookings, setConferenceBookings] = useState([]);

  useEffect(() => {
    if (isDesktop) window.api.conference.bookingsHistoryList().then(setConferenceBookings).catch(() => setConferenceBookings([]));
  }, []);

  const orderRows = orders
    .filter((o) => o.status === "paid" || o.status === "void")
    .map((o) => ({ type: "Restaurant", id: o.id, reference: o.receiptRef, label: o.tableName || (o.isTakeaway ? "Take-away" : `Room ${o.roomNumber}`), status: o.status, closedAt: o.closedAt, total: calcTotals(o.items, settings.taxRate, settings.serviceRate).total, record: o, receiptFn: () => buildOrderReceipt(o, o.tableId ? { name: o.tableName } : null, settings) }));

  const stayRows = stays
    .filter((s) => s.status === "checked_out" || s.status === "void")
    .map((s) => ({ type: "Accommodation", id: s.id, reference: s.receiptRef, label: `Room ${s.roomName} — ${s.guestName}`, status: s.status === "checked_out" ? "paid" : "void", closedAt: s.closedAt, total: s.charges.reduce((sum, c) => sum + c.amount, 0), record: s, receiptFn: () => buildStayReceipt(s) }));

  const conferenceRows = conferenceBookings.map((b) => ({
    type: "Conference", id: b.id, reference: b.receipt_ref, label: `${b.room_name} — ${b.client_name}`,
    status: b.status === "completed" ? "paid" : "void", closedAt: b.closed_at, total: b.amount, record: b,
    receiptFn: () => buildConferenceReceipt({ ...b, paymentMethod: b.payment_method, closedAt: b.closed_at, receiptRef: b.receipt_ref }, settings),
  }));

  const rows = [...orderRows, ...stayRows, ...conferenceRows]
    .filter((r) => tab === "all" || r.type.toLowerCase() === tab)
    .filter((r) => r.label.toLowerCase().includes(query.toLowerCase()) || (r.reference || "").toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  const [open, setOpen] = useState(null);

  return (
    <div className="hp-view">
      <div className="hp-view-head"><h1>History</h1></div>
      <div className="hp-cat-tabs">
        {["all", "restaurant", "accommodation", "conference"].map((t) => (
          <button key={t} className={`hp-cat-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      <div className="hp-search-row hp-history-search">
        <Search size={15} />
        <input className="hp-search-input" placeholder="Search by reference, table or room…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {rows.length === 0 && <div className="hp-empty">No closed bills yet.</div>}
      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="hp-data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "left" }}>Reference</th><th style={{ textAlign: "left" }}>Type</th>
                <th style={{ textAlign: "left" }}>Description</th><th style={{ textAlign: "left" }}>Status</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOpen = open === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className="hp-history-tr" onClick={() => setOpen(isOpen ? null : r.id)} style={{ cursor: "pointer" }}>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{r.closedAt ? new Date(r.closedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td style={{ textAlign: "left" }}>{r.reference || "—"}</td>
                      <td className="hp-muted" style={{ textAlign: "left" }}>{r.type}</td>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>{r.label}</td>
                      <td style={{ textAlign: "left" }}><span className={`hp-history-badge hp-history-${r.status}`}>{r.status}</span></td>
                      <td style={{ fontWeight: 700 }}>{money(r.total, settings.currency, settings.decimals)}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} style={{ background: "var(--panel-2, var(--panel))", padding: "12px 16px" }}>
                          {r.type === "Restaurant"
                            ? r.record.items.map((it) => (
                                <div key={it.id} className="hp-total-row"><span>{it.qty} × {it.name}</span><span>{money(it.price * it.qty, settings.currency, settings.decimals)}</span></div>
                              ))
                            : r.type === "Accommodation"
                            ? r.record.charges.map((c) => (
                                <div key={c.id} className="hp-total-row"><span>{c.description}</span><span>{money(c.amount, settings.currency, settings.decimals)}</span></div>
                              ))
                            : (
                                <div className="hp-total-row">
                                  <span>{r.record.room_name} — {r.record.event_date}{r.record.start_time ? ` (${r.record.start_time}–${r.record.end_time || ""})` : ""}</span>
                                  <span>{money(r.record.amount, settings.currency, settings.decimals)}</span>
                                </div>
                              )}
                          <div className="hp-divider" />
                          <div className="hp-total-row hp-total-grand"><span>Total</span><span>{money(r.total, settings.currency, settings.decimals)}</span></div>
                          {(r.record.paymentMethod || r.record.payment_method) && <div className="hp-history-meta">Paid via {formatPaymentMethod(r.record.paymentMethod || r.record.payment_method, r.record.roomCharged)}</div>}
                          {r.status !== "void" && (
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                              <button className="hp-btn hp-btn-ghost" onClick={(e) => { e.stopPropagation(); onPrint(r.receiptFn(), "Receipt"); }}>
                                <Printer size={14} /> Print receipt
                              </button>
                              {isDesktop && r.type === "Restaurant" && (
                                <button className="hp-btn hp-btn-ghost" onClick={(e) => { e.stopPropagation(); onPrint(r.receiptFn(), "Invoice"); }}>
                                  <FileText size={14} /> Print invoice
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- menu view -------------------------------- */

function MenuManager({ categories, menuItems, settings, setCategories, setMenuItems, goHome }) {
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
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Menu</h1>
        </div>
      </div>
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
          <div className="hp-table-time"><Clock size={11} /> {currentStayNights(stay)} night(s)</div>
        </div>
      )}
      <div className="hp-table-status">{occupied ? "Occupied" : "Vacant"}</div>
    </button>
  );
}

function RoomBoard({ rooms, stays, settings, openRoom, checkIn, goHome, setRooms, showToast }) {
  const singles = rooms.filter((r) => r.type === "single");
  const doubles = rooms.filter((r) => r.type === "double");
  const [checkInRoom, setCheckInRoom] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [showRoomManagement, setShowRoomManagement] = useState(false);

  const stayFor = (roomId) => stays.find((s) => s.roomId === roomId && s.status === "checked_in");

  const submitCheckIn = () => {
    if (!guestName.trim()) return;
    checkIn(checkInRoom, { guestName: guestName.trim(), phone: phone.trim(), checkOutDate });
    setCheckInRoom(null); setGuestName(""); setPhone(""); setCheckOutDate("");
  };

  if (showRoomManagement) {
    return <RoomManagementPanel rooms={rooms} setRooms={setRooms} showToast={showToast} onClose={() => setShowRoomManagement(false)} />;
  }

  return (
    <div className="hp-view">
      <div className="hp-view-head">
        <div className="hp-view-head-left">
          <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
          <h1>Accommodation</h1>
        </div>
        <button className="hp-btn hp-btn-ghost" onClick={() => setShowRoomManagement(true)}><Settings size={14} /> Manage rooms</button>
      </div>

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
  const nightsElapsed = nightsBetween(stay.checkInDate, Date.now());
  const nights = currentStayNights(stay);
  const isEstimate = nights !== nightsElapsed;
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
        <div className="hp-total-row"><span>Room charge — {nights} night(s){isEstimate ? " (planned)" : ""} × {money(room.rate, settings.currency, settings.decimals)}</span><span>{money(runningRoomCharge, settings.currency, settings.decimals)}</span></div>
        {stay.charges.map((c) => (
          <div key={c.id} className="hp-total-row"><span>{c.description}</span><span>{money(c.amount, settings.currency, settings.decimals)}</span></div>
        ))}
        <div className="hp-divider" />
        <div className="hp-total-row hp-total-grand"><span>Estimated total</span><span>{money(estimatedTotal, settings.currency, settings.decimals)}</span></div>
        {isEstimate && <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 6 }}>Based on the expected check-out date — the actual bill is calculated from the real check-out date when you check the guest out.</div>}
      </div>

      {!checkingOut ? (
        <div className="hp-ticket-actions">
          {stay.charges.length === 0 && nightsElapsed <= 1 && (
            <button className="hp-btn hp-btn-ghost" onClick={() => voidStay(stay)}>Cancel check-in</button>
          )}
          <button className="hp-btn hp-btn-accent" onClick={() => setCheckingOut(true)}><Receipt size={15} /> Check out & bill</button>
        </div>
      ) : (
        <>
          <div className="hp-pay-methods">
            <button className={`hp-pay-btn ${method === "cash" ? "active" : ""}`} onClick={() => setMethod("cash")}><Banknote size={18} /> Cash</button>
            <button className={`hp-pay-btn ${method === "card" ? "active" : ""}`} onClick={() => setMethod("card")}><CreditCard size={18} /> Card</button>
            <button className={`hp-pay-btn ${method === "mobile_money" ? "active" : ""}`} onClick={() => setMethod("mobile_money")}><Smartphone size={18} /> Mobile Money</button>
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

const ROLE_LABELS = { manager: "Manager", hr: "HR", cashier: "Cashier", receptionist: "Receptionist", staff: "Staff" };
const CONFIGURABLE_ROLES = ["manager", "hr", "cashier", "receptionist", "staff"];

function RolePermissionsCard({ currentUser, showToast }) {
  const isAdmin = currentUser?.role === "admin";
  const [access, setAccess] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadJSON("pos:role-permissions", true).then((saved) => setAccess(saved || ROLE_ACCESS));
  }, []);

  const toggle = (role, appId) => {
    setAccess((prev) => {
      const current = prev[role] || [];
      const next = current.includes(appId) ? current.filter((a) => a !== appId) : [...current, appId];
      return { ...prev, [role]: next };
    });
  };

  const save = async () => {
    setSaving(true);
    const ok = await saveJSON("pos:role-permissions", access, true);
    setSaving(false);
    showToast(ok ? "Role permissions saved — takes effect next login" : "Couldn't save changes");
  };

  if (!isAdmin) {
    return (
      <div className="hp-settings-card">
        <div className="hp-section-label">Role Permissions</div>
        <div className="hp-empty">Only admins can view or change role permissions.</div>
      </div>
    );
  }
  if (!access) return <div className="hp-settings-card"><div className="hp-empty">Loading…</div></div>;

  return (
    <div className="hp-settings-card">
      <div className="hp-section-label">Role Permissions</div>
      <div className="hp-empty" style={{ padding: "0 0 12px" }}>
        Controls which tiles each role sees on Home — a visibility filter, not the underlying security check.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="hp-data-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Module</th>
              {CONFIGURABLE_ROLES.map((r) => <th key={r}>{ROLE_LABELS[r]}</th>)}
            </tr>
          </thead>
          <tbody>
            {APPS.map((app) => (
              <tr key={app.id}>
                <td style={{ textAlign: "left", fontWeight: 600 }}>{app.label}</td>
                {CONFIGURABLE_ROLES.map((r) => (
                  <td key={r}>
                    <input type="checkbox" checked={(access[r] || []).includes(app.id)} onChange={() => toggle(r, app.id)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="hp-btn hp-btn-accent" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
        <button className="hp-btn hp-btn-ghost" onClick={() => setAccess(ROLE_ACCESS)}>Reset to defaults</button>
      </div>
    </div>
  );
}

// Mirrors the server's TILE_REQUIRED_ROLES — used only to show the admin
// what a tile actually needs before granting it; the server computes the
// real grant independently and never trusts this.
const TILE_REQUIRED_ROLES = { inventory: ["manager"], conference: ["manager"], runningcosts: ["manager"], maintenance: ["manager"], hr: ["hr"], attendance: ["manager", "hr"] };

function TemporaryAccessCard({ currentUser, showToast }) {
  const isAdmin = currentUser?.role === "admin";
  const [users, setUsers] = useState([]);
  const [grants, setGrants] = useState([]);
  const [userId, setUserId] = useState("");
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [duration, setDuration] = useState("240");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const [u, g] = await Promise.all([window.api.users.list(), window.api.grants.list({ actingUser: currentUser })]);
    setUsers(u.filter((x) => x.active && x.role !== "admin"));
    setGrants(g);
  };
  useEffect(() => { if (isAdmin) refresh(); }, []);

  const toggleTile = (id) => setSelectedTiles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const create = async () => {
    if (!userId || selectedTiles.length === 0 || !duration) return;
    setSaving(true);
    try {
      const res = await window.api.grants.create({ userId, tiles: selectedTiles, durationMinutes: parseInt(duration, 10), reason: reason.trim() || null, actingUser: currentUser });
      showToast(`${res.reference} — access granted`);
      setReason("");
      setSelectedTiles([]);
      refresh();
    } catch (err) {
      showToast(err?.message?.replace(/^Error invoking remote method[^:]*:\s*Error:\s*/, "") || "Couldn't grant access.");
    }
    setSaving(false);
  };
  const revoke = async (g) => {
    await window.api.grants.revoke({ id: g.id, actingUser: currentUser });
    refresh();
  };

  if (!isAdmin) {
    return (
      <div className="hp-settings-card">
        <div className="hp-section-label">Temporary Access</div>
        <div className="hp-empty">Only admins can view or grant temporary access.</div>
      </div>
    );
  }

  const now = Date.now();
  const active = grants.filter((g) => !g.revoked_at && g.expires_at > now);
  const past = grants.filter((g) => g.revoked_at || g.expires_at <= now);

  return (
    <div className="hp-settings-card">
      <div className="hp-section-label">Temporary Access</div>
      <div className="hp-empty" style={{ padding: "0 0 12px" }}>
        Grant access to specific tiles for a limited time, without changing anyone's role.
      </div>
      <label className="hp-field-label">Person</label>
      <select className="hp-input hp-input-sm" value={userId} onChange={(e) => setUserId(e.target.value)}>
        <option value="">Select…</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name} (#{u.staff_id}) — currently {u.role}</option>)}
      </select>
      <label className="hp-field-label">Tiles to grant</label>
      <div className="hp-doc-list">
        {APPS.map((app) => (
          <label key={app.id} className="hp-doc-row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={selectedTiles.includes(app.id)} onChange={() => toggleTile(app.id)} />
            <span className="hp-doc-name" style={{ flex: 1 }}>{app.label}</span>
            <span className="hp-muted" style={{ fontSize: 11 }}>
              {(TILE_REQUIRED_ROLES[app.id] || []).length ? `Needs: ${TILE_REQUIRED_ROLES[app.id].map((r) => ROLE_LABELS[r] || r).join(" or ")}` : "No extra permission needed"}
            </span>
          </label>
        ))}
      </div>
      <div className="hp-settings-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label className="hp-field-label">Duration</label>
          <select className="hp-input hp-input-sm" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="60">1 hour</option>
            <option value="240">4 hours</option>
            <option value="480">8 hours (one shift)</option>
            <option value="1440">24 hours</option>
            <option value="10080">7 days</option>
          </select>
        </div>
        <div>
          <label className="hp-field-label">Reason (optional)</label>
          <input className="hp-input hp-input-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        </div>
      </div>
      <button className="hp-btn hp-btn-accent" disabled={saving || !userId || selectedTiles.length === 0} onClick={create}>{saving ? "Granting…" : "Grant access"}</button>

      <div className="hp-section-label" style={{ marginTop: 20 }}>Active grants</div>
      {active.length === 0 ? <div className="hp-empty">None right now.</div> : (
        <div className="hp-doc-list">
          {active.map((g) => {
            let tiles = [];
            try { tiles = JSON.parse(g.granted_tiles || "[]"); } catch { tiles = []; }
            return (
              <div key={g.id} className="hp-doc-row">
                <span className="hp-doc-name" style={{ flex: 1 }}>{g.user_name} (#{g.user_staff_id}) — {tiles.length ? tiles.map((t) => APPS.find((a) => a.id === t)?.label || t).join(", ") : (g.granted_role ? ROLE_LABELS[g.granted_role] || g.granted_role : "—")}</span>
                <span className="hp-muted">until {new Date(g.expires_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <button className="hp-btn hp-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => revoke(g)}>Revoke now</button>
              </div>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="hp-section-label" style={{ marginTop: 20 }}>History</div>
          <div className="hp-doc-list">
            {past.slice(0, 20).map((g) => {
              let tiles = [];
              try { tiles = JSON.parse(g.granted_tiles || "[]"); } catch { tiles = []; }
              return (
                <div key={g.id} className="hp-doc-row" style={{ opacity: 0.6 }}>
                  <span className="hp-doc-name" style={{ flex: 1 }}>{g.user_name} — {tiles.length ? tiles.map((t) => APPS.find((a) => a.id === t)?.label || t).join(", ") : (g.granted_role ? ROLE_LABELS[g.granted_role] || g.granted_role : "—")}</span>
                  <span className="hp-muted">{g.revoked_at ? "Revoked early" : "Expired"} · granted by {g.granted_by_user_name || "—"}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StaffCard({ currentUser, showToast }) {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("staff");
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPin, setResetPin] = useState("");
  const isAdmin = currentUser?.role === "admin";

  const refresh = async () => setUsers(await window.api.users.list());
  useEffect(() => { refresh(); }, []);

  const add = async () => {
    if (!name.trim() || pin.length < 4) return;
    const created = await window.api.users.create({ name: name.trim(), pin, role, actingUser: currentUser });
    showToast(`${name.trim()} added — Staff ID ${created.staffId}`);
    setName(""); setPin(""); setRole("staff"); setShowAdd(false);
    refresh();
  };
  const toggleActive = async (u) => {
    await window.api.users.setActive({ id: u.id, active: u.active ? 0 : 1, actingUser: currentUser });
    refresh();
  };
  const submitResetPin = async () => {
    if (!resetTarget || resetPin.length < 4) return;
    await window.api.users.resetPin({ targetUserId: resetTarget.id, newPin: resetPin, actingUser: currentUser });
    showToast(`PIN reset for ${resetTarget.name}`);
    setResetTarget(null); setResetPin("");
  };

  return (
    <div className="hp-settings-card">
      <div className="hp-view-head">
        <div className="hp-section-label"><ShieldCheck size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Staff accounts</div>
        {isAdmin && <button className="hp-btn hp-btn-accent" onClick={() => setShowAdd(true)}><UserPlus size={14} /> Add</button>}
      </div>
      {!isAdmin && <div className="hp-empty" style={{ marginBottom: 8 }}>Only admins can add accounts, reset PINs, or lock/unlock staff.</div>}
      <div className="hp-table-list">
        {users.map((u) => (
          <div key={u.id} className="hp-room-list-row" style={{ gridTemplateColumns: isAdmin ? "50px minmax(0,1fr) 80px 90px 30px 30px" : "50px minmax(0,1fr) 80px 90px" }}>
            <span className="hp-muted">{u.staff_id ?? "—"}</span>
            <span>{u.name}{u.id === currentUser?.id ? " (you)" : ""}</span>
            <span className="hp-muted">{u.role}</span>
            <span className={u.active ? "hp-doc-active" : "hp-muted"}>{u.active ? "Active" : "Disabled"}</span>
            {isAdmin && <button className="hp-icon-btn hp-icon-btn-sm" title="Reset PIN" onClick={() => setResetTarget(u)}><RotateCcw size={13} /></button>}
            {isAdmin && <button className="hp-icon-btn hp-icon-btn-sm" title={u.active ? "Disable" : "Re-enable"} disabled={u.id === currentUser?.id} onClick={() => toggleActive(u)}><Lock size={13} /></button>}
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add staff account" onClose={() => setShowAdd(false)}>
          <label className="hp-field-label">Name</label>
          <input autoFocus className="hp-input" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="hp-field-label">Role</label>
          <div className="hp-cat-tabs">
            <button className={`hp-cat-tab ${role === "staff" ? "active" : ""}`} onClick={() => setRole("staff")}>Staff</button>
            <button className={`hp-cat-tab ${role === "cashier" ? "active" : ""}`} onClick={() => setRole("cashier")}>Cashier</button>
            <button className={`hp-cat-tab ${role === "receptionist" ? "active" : ""}`} onClick={() => setRole("receptionist")}>Receptionist</button>
            <button className={`hp-cat-tab ${role === "manager" ? "active" : ""}`} onClick={() => setRole("manager")}>Manager</button>
            <button className={`hp-cat-tab ${role === "hr" ? "active" : ""}`} onClick={() => setRole("hr")}>HR</button>
            <button className={`hp-cat-tab ${role === "admin" ? "active" : ""}`} onClick={() => setRole("admin")}>Admin</button>
          </div>
          <label className="hp-field-label">PIN (4+ digits)</label>
          <input className="hp-input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={!name.trim() || pin.length < 4} onClick={add}>Add account</button>
        </Modal>
      )}
      {resetTarget && (
        <Modal title={`Reset PIN — ${resetTarget.name}`} onClose={() => { setResetTarget(null); setResetPin(""); }}>
          <div className="hp-empty" style={{ padding: "0 0 10px" }}>{resetTarget.name} will use this new PIN the next time they log in.</div>
          <label className="hp-field-label">New PIN (4+ digits)</label>
          <input autoFocus className="hp-input" type="password" inputMode="numeric" value={resetPin} onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))} />
          <button className="hp-btn hp-btn-accent hp-btn-block" disabled={resetPin.length < 4} onClick={submitResetPin}>Reset PIN</button>
        </Modal>
      )}
    </div>
  );
}

function BackupCard({ currentUser, showToast }) {
  const [backups, setBackups] = useState([]);
  const [working, setWorking] = useState(false);

  const refresh = async () => setBackups(await window.api.backup.list());
  useEffect(() => { refresh(); }, []);

  const runBackup = async () => {
    setWorking(true);
    const res = await window.api.backup.create({ actingUser: currentUser, note: "manual" });
    setWorking(false);
    if (res) { showToast("Backup created"); refresh(); }
  };
  const restore = async () => { await window.api.backup.restore({ actingUser: currentUser }); };

  return (
    <div className="hp-settings-card">
      <div className="hp-view-head">
        <div className="hp-section-label"><DatabaseBackup size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Backups & recovery</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="hp-btn hp-btn-ghost" onClick={() => window.api.backup.revealFolder()}><FolderOpen size={14} /> Open folder</button>
          <button className="hp-btn hp-btn-accent" disabled={working} onClick={runBackup}>{working ? "Backing up…" : "Back up now"}</button>
        </div>
      </div>
      <div className="hp-empty" style={{ marginBottom: 8 }}>Last 14 automatic backups kept.</div>
      <div className="hp-table-list">
        {backups.slice(0, 6).map((b) => (
          <div key={b.id} className="hp-room-list-row" style={{ gridTemplateColumns: "minmax(0,1fr) 90px 70px" }}>
            <span>{b.filename}</span>
            <span className="hp-muted">{new Date(b.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="hp-muted">{(b.size_bytes / 1024).toFixed(0)} KB</span>
          </div>
        ))}
      </div>
      {currentUser?.role === "admin" && (
        <button className="hp-btn hp-btn-ghost hp-btn-block" onClick={restore}><RotateCcw size={14} /> Restore from a backup file…</button>
      )}
    </div>
  );
}

function AuditCard() {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => setEntries(await window.api.audit.list({ limit: 100 }));
  useEffect(() => { if (open) load(); }, [open]);

  return (
    <div className="hp-settings-card">
      <div className="hp-view-head">
        <div className="hp-section-label"><History size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Audit trail</div>
        <button className="hp-btn hp-btn-ghost" onClick={() => setOpen(!open)}>{open ? "Hide" : "View"}</button>
      </div>
      {open && (
        <div className="hp-table-list" style={{ maxHeight: 260, overflowY: "auto" }}>
          {entries.length === 0 && <div className="hp-empty">No activity logged yet.</div>}
          {entries.map((e) => (
            <div key={e.id} className="hp-room-list-row" style={{ gridTemplateColumns: "120px minmax(0,1fr) 130px" }}>
              <span className="hp-muted">{e.user_name || "System"}</span>
              <span>{e.action}{e.entity_type ? ` · ${e.entity_type}` : ""}</span>
              <span className="hp-muted">{new Date(e.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(n) {
  if (!n) return "0 KB";
  const kb = n / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}

function UpdateCard() {
  const [version, setVersion] = useState(null);
  const [schemaVersion, setSchemaVersion] = useState(null);
  const [status, setStatus] = useState({ state: "idle" });

  useEffect(() => {
    let cancelled = false;
    (window.api?.app?.info ? window.api.app.info() : window.api.app.getVersion().then((v) => ({ version: v })))
      .then((info) => {
        if (cancelled || !info) return;
        setVersion(info.version || null);
        if (info.schemaVersion != null) setSchemaVersion(info.schemaVersion);
      })
      .catch(() => {});

    // Defensive: if window.api.updates is somehow missing (older build,
    // partial preload failure) just stay in "idle" rather than throwing.
    if (!window.api?.updates?.status) return;
    const unsubscribe = window.api.updates.status((data) => { if (!cancelled) setStatus(data || { state: "idle" }); });
    return () => { cancelled = true; if (typeof unsubscribe === "function") unsubscribe(); };
  }, []);

  const runCheck = async () => {
    if (!window.api?.updates?.check) return;
    try { setStatus(await window.api.updates.check()); } catch (e) { setStatus({ state: "error", message: e?.message }); }
  };
  const runDownload = async () => {
    if (!window.api?.updates?.download) return;
    try { setStatus(await window.api.updates.download()); } catch (e) { setStatus({ state: "error", message: e?.message }); }
  };
  const runInstall = async () => {
    if (!window.api?.updates?.install) return;
    try { await window.api.updates.install(); } catch (e) { setStatus({ state: "error", message: e?.message }); }
  };

  const busy = status.state === "checking" || status.state === "downloading";
  const cleanNotes = (status.releaseNotes || "").replace(/<[^>]+>/g, "").trim();

  return (
    <div className="hp-settings-card">
      <div className="hp-view-head">
        <div className="hp-section-label"><RotateCcw size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Application updates</div>
        <button className="hp-btn hp-btn-ghost" disabled={busy} onClick={runCheck}>{status.state === "checking" ? "Checking…" : "Check for updates"}</button>
      </div>

      <div className="hp-empty" style={{ marginBottom: 10 }}>
        Version {version || "…"}{schemaVersion != null ? ` · database schema v${schemaVersion}` : ""}
      </div>

      {status.state === "disabled" && <div className="hp-empty">{status.message || "Updates aren't available right now."}</div>}
      {status.state === "up-to-date" && <div className="hp-doc-active" style={{ marginBottom: 4 }}><Check size={13} /> You're on the latest version.</div>}
      {status.state === "error" && <div className="hp-login-error" style={{ marginBottom: 8 }}>{status.message || "Update check failed."}</div>}

      {status.state === "available" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 6 }}>Version {status.version} is available.</div>
          {cleanNotes && <div className="hp-muted" style={{ fontSize: 12, marginBottom: 8, whiteSpace: "pre-wrap" }}>{cleanNotes.slice(0, 400)}</div>}
          <button className="hp-btn hp-btn-accent" onClick={runDownload}>Download update</button>
        </div>
      )}

      {status.state === "downloading" && (
        <div style={{ marginBottom: 10 }}>
          <div className="hp-progress-track"><div className="hp-progress-fill" style={{ width: `${Math.round(status.percent || 0)}%` }} /></div>
          <div className="hp-muted" style={{ fontSize: 12, marginTop: 4 }}>
            {Math.round(status.percent || 0)}%{status.total ? ` · ${formatBytes(status.transferred)} / ${formatBytes(status.total)}` : ""}
          </div>
        </div>
      )}

      {status.state === "downloaded" && (
        <div style={{ marginBottom: 4 }}>
          <div className="hp-doc-active" style={{ marginBottom: 6 }}><Check size={13} /> Version {status.version} downloaded and ready.</div>
          <button className="hp-btn hp-btn-accent" onClick={runInstall}>Restart & install now</button>
          <div className="hp-muted" style={{ fontSize: 11.5, marginTop: 6 }}>Or it installs automatically the next time the app closes normally.</div>
        </div>
      )}
    </div>
  );
}

function SettingsScreen({ settings, setSettings, currentUser, showToast, themeMode, setThemeMode }) {
  const [local, setLocal] = useState(settings);
  const [activeSection, setActiveSection] = useState("venue");

  useEffect(() => setLocal(settings), [settings]);

  const settingsSections = [
    { id: "venue", label: "Venue", icon: Settings },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "staff", label: "Staff & Security", icon: ShieldCheck },
    { id: "roles", label: "Role Permissions", icon: Users },
    { id: "grants", label: "Temporary Access", icon: Clock },
    { id: "data", label: "Data & System", icon: DatabaseBackup },
    { id: "updates", label: "Application & Updates", icon: RotateCcw },
  ];

  return (
    <div className="hp-view">
      <div className="hp-view-head"><h1>Settings</h1></div>

      <div style={{ display: "grid", gridTemplateColumns: "190px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <div className="hp-settings-card" style={{ padding: 8, position: "sticky", top: 0 }}>
          <div className="hp-section-label" style={{ padding: "8px 10px 10px" }}>Settings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {settingsSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`hp-nav-item ${activeSection === id ? "active" : ""}`}
                onClick={() => setActiveSection(id)}
                style={{ width: "100%" }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          {activeSection === "venue" && (
            currentUser?.role === "admin" ? (
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
                  <div>
                    <label className="hp-field-label">Document number digits</label>
                    <input className="hp-input hp-input-sm" type="number" min="1" max="10" value={local.documentNumberDigits} onChange={(e) => setLocal({ ...local, documentNumberDigits: Math.min(10, Math.max(1, parseInt(e.target.value) || 5)) })} onBlur={() => setSettings(local)} />
                  </div>
                  <div>
                    <label className="hp-field-label">Receipt paper width</label>
                    <select className="hp-input hp-input-sm" value={local.receiptWidth} onChange={(e) => { const v = { ...local, receiptWidth: e.target.value }; setLocal(v); setSettings(v); }}>
                      <option value="80mm">80mm (standard)</option>
                      <option value="58mm">58mm (compact)</option>
                    </select>
                  </div>
                </div>
                <div className="hp-empty" style={{ marginTop: 6 }}>
                  Applies to Restaurant, Accommodation, and Conference receipts and invoices. Only affects documents issued from now on.
                </div>
              </div>
            ) : (
              <div className="hp-settings-card">
                <div className="hp-section-label">Venue</div>
                <div className="hp-empty">Only admins can change venue name, currency, and tax/service rates — these affect every receipt and report in the system.</div>
              </div>
            )
          )}

          {activeSection === "appearance" && (
            <div className="hp-settings-card">
              <div className="hp-section-label">Appearance</div>
              <div className="hp-theme-picker">
                {[
                  { id: "default", label: "Default", icon: Monitor },
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                ].map((opt) => (
                  <button key={opt.id} className={`hp-theme-option ${themeMode === opt.id ? "active" : ""}`} onClick={() => setThemeMode(opt.id)}>
                    <opt.icon size={20} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "staff" && (
            isDesktop
              ? <StaffCard currentUser={currentUser} showToast={showToast} />
              : (
                <div className="hp-settings-card">
                  <div className="hp-section-label">Staff & Security</div>
                  <div className="hp-empty">Staff accounts run on real local storage and are only available in the desktop app build.</div>
                </div>
              )
          )}

          {activeSection === "roles" && <RolePermissionsCard currentUser={currentUser} showToast={showToast} />}

          {activeSection === "grants" && <TemporaryAccessCard currentUser={currentUser} showToast={showToast} />}

          {activeSection === "data" && (
            isDesktop ? (
              <>
                <BackupCard currentUser={currentUser} showToast={showToast} />
                <AuditCard />
              </>
            ) : (
              <div className="hp-settings-card">
                <div className="hp-section-label">Data & System</div>
                <div className="hp-empty">Backups, recovery and the audit trail run on real local storage and are only available in the desktop app build.</div>
              </div>
            )
          )}

          {activeSection === "updates" && (
            isDesktop
              ? <UpdateCard />
              : (
                <div className="hp-settings-card">
                  <div className="hp-section-label">Application & Updates</div>
                  <div className="hp-empty">Checking and installing updates is only available in the desktop app build.</div>
                </div>
              )
          )}
        </div>
      </div>
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
  const [view, setView] = useState("home");
  const [placeholderApp, setPlaceholderApp] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [billingOrderId, setBillingOrderId] = useState(null);
  const [activeStayId, setActiveStayId] = useState(null);
  const [receipt, setReceipt] = useState(null); // { kind: 'order'|'stay', id }
  const [printPayload, setPrintPayload] = useState(null);
  const [printReportPayload, setPrintReportPayload] = useState(null);
  const [toast, setToast] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [currentUser, setCurrentUser] = useState(null);
  const [roleAccessConfig, setRoleAccessConfig] = useState(null);
  const [letterheadPath, setLetterheadPath] = useState(null);
  const [themeMode, setThemeModeState] = useState("dark"); // "default" | "light" | "dark"
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const toastTimer = useRef(null);
  const skipSave = useRef(true);

  // "Default" follows the OS's own light/dark preference, same idea as
  // most apps' "System" option. Listened for live, not just read once,
  // so flipping the OS setting while the app is open takes effect
  // immediately for anyone who has "Default" selected.
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mq.matches);
    const handler = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Appearance is a per-user preference (like tile order), not a venue-
  // wide setting — what looks right depends on the room lighting around
  // someone's terminal and personal preference, not on the business.
  // Defaults to "dark" (today's unchanged look) for anyone who's never
  // touched it, and always "dark" on the login screen itself, since
  // there's no per-user preference to read before anyone's signed in.
  useEffect(() => {
    if (!currentUser?.id) { setThemeModeState("dark"); return; }
    loadJSON(`pos:theme:${currentUser.id}`, false).then((v) => setThemeModeState(v === "light" || v === "default" ? v : "dark"));
  }, [currentUser?.id]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    if (currentUser?.id) saveJSON(`pos:theme:${currentUser.id}`, mode, false);
  };

  const resolvedTheme = themeMode === "default" ? (systemPrefersDark ? "dark" : "light") : themeMode;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    (async () => {
      const [fo, menu, sett, ra, rolePerm] = await Promise.all([
        loadJSON("pos:floor-orders", true),
        loadJSON("pos:menu", true),
        loadJSON("pos:settings", true),
        loadJSON("pos:rooms-stays", true),
        loadJSON("pos:role-permissions", true),
      ]);
      if (fo) { setTables(fo.tables || DEFAULT_TABLES); setOrders(fo.orders || []); }
      if (menu) { setCategories(menu.categories || DEFAULT_CATEGORIES); setMenuItems(menu.menuItems || DEFAULT_MENU_ITEMS); }
      if (sett) setSettings({ ...DEFAULT_SETTINGS, ...sett });
      if (ra) { setRooms(ra.rooms || DEFAULT_ROOMS); setStays(ra.stays || []); }
      if (rolePerm) setRoleAccessConfig(rolePerm);
      skipSave.current = false;
      setReady(true);
    })();
  }, []);

  // Surface today's reminder notes as a real desktop notification once
  // someone's logged in — checked once per login rather than on every
  // render, since the underlying data only changes when a note is added.
  useEffect(() => {
    if (!isDesktop || !currentUser) return;
    window.api.calendar.notesDueToday().then((notes) => {
      if (!notes || notes.length === 0) return;
      if (typeof Notification === "undefined" || Notification.permission === "denied") return;
      const fire = () => {
        for (const n of notes) {
          new Notification(`Reminder: ${n.title}`, { body: n.note || "Scheduled for today" });
        }
      };
      if (Notification.permission === "granted") fire();
      else Notification.requestPermission().then((perm) => { if (perm === "granted") fire(); });
    });
  }, [currentUser]);

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

  useEffect(() => {
    if (!isDesktop) return;
    refreshLetterhead();
  }, []);

  // Pulled out so it can be called again after a letterhead is uploaded,
  // activated, or removed — not just once when the app first opens. Without
  // this, setting a new logo active mid-session had no visible effect on
  // receipts until the whole app was restarted, since nothing ever told
  // this state to look again.
  function refreshLetterhead() {
    if (!isDesktop) return;
    window.api.documents.list().then((docs) => {
      const active = docs.find((d) => d.category === "letterhead" && d.is_active);
      setLetterheadPath(active ? active.stored_path : null);
    });
  }

  if (!ready) return <div className="hp-loading">Loading…</div>;
  const needsLogin = isDesktop && !currentUser;

  const activeOrder = orders.find((o) => o.id === activeOrderId) || null;
  const billingOrder = orders.find((o) => o.id === billingOrderId) || null;
  const activeStay = stays.find((s) => s.id === activeStayId) || null;
  const tableFor = (order) => (order && order.tableId ? tables.find((t) => t.id === order.tableId) : null);
  const checkedInStays = stays.filter((s) => s.status === "checked_in");

  /* ---- restaurant flows ---- */
  const openTable = (table) => {
    let order = orders.find((o) => o.tableId === table.id && (o.status === "occupied" || o.status === "bill"));
    if (!order) {
      order = { id: uid("o"), tableId: table.id, tableName: table.name, roomNumber: null, roomStayId: null, isTakeaway: false, items: [], status: "occupied", createdAt: Date.now(), closedAt: null, paymentMethod: null, roomCharged: null };
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
    const order = { id: uid("o"), tableId: null, tableName: null, roomNumber: stay.roomName, roomStayId: stay.id, isTakeaway: false, items: [], status: "occupied", createdAt: Date.now(), closedAt: null, paymentMethod: null, roomCharged: null };
    setOrders([...orders, order]);
    setActiveOrderId(order.id);
    setView("order");
  };
  const startTakeawayOrder = () => {
    const order = { id: uid("o"), tableId: null, tableName: null, roomNumber: null, roomStayId: null, isTakeaway: true, items: [], status: "occupied", createdAt: Date.now(), closedAt: null, paymentMethod: null, roomCharged: null };
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
  const closeBill = async (order, method, chosenStay) => {
    const totals = calcTotals(order.items, settings.taxRate, settings.serviceRate);
    const updated = { ...order, status: "paid", closedAt: Date.now(), paymentMethod: method, roomCharged: method === "room" ? chosenStay.roomName : null };
    const table = order.tableId ? tables.find((t) => t.id === order.tableId) : null;
    const receiptRef = await syncTransactionToLedger(updated, table, settings, currentUser);
    const finalOrder = receiptRef ? { ...updated, receiptRef } : updated;
    setOrders(orders.map((o) => (o.id === order.id ? finalOrder : o)));
    if (order.tableId) setTables(tables.map((t) => (t.id === order.tableId ? { ...t, status: "available" } : t)));
    if (method === "room" && chosenStay) {
      setStays(stays.map((s) => s.id === chosenStay.id
        ? { ...s, charges: [...s.charges, { id: uid("chg"), type: "restaurant", description: `Restaurant — ${order.tableId ? `Table ${order.tableName}` : order.isTakeaway ? "Take-away" : "Room service"}`, amount: totals.total, date: Date.now() }] }
        : s));
    }
    showToast("Payment received");
    setActiveOrderId(null);
    setBillingOrderId(null);
    setReceipt({ kind: "order", id: order.id, snapshot: finalOrder });
    setView("receipt");
  };
  const voidOrder = async (order) => {
    const updated = { ...order, status: "void", closedAt: Date.now() };
    const table = order.tableId ? tables.find((t) => t.id === order.tableId) : null;
    const receiptRef = await syncTransactionToLedger(updated, table, settings, currentUser);
    const finalOrder = receiptRef ? { ...updated, receiptRef } : updated;
    setOrders(orders.map((o) => (o.id === order.id ? finalOrder : o)));
    if (order.tableId) setTables(tables.map((t) => (t.id === order.tableId ? { ...t, status: "available" } : t)));
    showToast("Order voided");
    setActiveOrderId(null);
    setView("floor");
  };
  const goToFloor = () => { setActiveOrderId(null); setBillingOrderId(null); setView("floor"); };
  const goHome = () => { setActiveOrderId(null); setBillingOrderId(null); setActiveStayId(null); setReceipt(null); setPlaceholderApp(null); setView("home"); };
  const openApp = (app) => {
    if (app.implemented) { setView(app.id); }
    else { setPlaceholderApp(app); setView("placeholder"); }
  };

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
  const checkInFromReservation = async (reservation) => {
    const room = rooms.find((r) => r.id === reservation.room_id) || rooms.find((r) => r.name === reservation.room_name);
    if (!room) { showToast("That room no longer exists"); return; }
    if (room.status !== "vacant") { showToast(`Room ${room.name} isn't vacant right now`); return; }
    checkIn(room, { guestName: reservation.guest_name, phone: reservation.phone, checkOutDate: reservation.end_date });
    try { await window.api.reservations.markCheckedIn({ id: reservation.id, actingUser: currentUser }); } catch { /* non-fatal */ }
  };
  const checkOutStay = async (stay, room, method) => {
    const nights = nightsBetween(stay.checkInDate, Date.now());
    const roomCharge = { id: uid("chg"), type: "room", description: `Room charge — ${nights} night(s) × ${money(room.rate, settings.currency, settings.decimals)}`, amount: nights * room.rate, date: Date.now() };
    const finalCharges = [roomCharge, ...stay.charges];
    const updated = { ...stay, status: "checked_out", checkedOutAt: Date.now(), closedAt: Date.now(), paymentMethod: method, charges: finalCharges };
    const receiptRef = await syncStayToLedger(updated, currentUser);
    const finalStay = receiptRef ? { ...updated, receiptRef } : updated;
    setStays(stays.map((s) => (s.id === stay.id ? finalStay : s)));
    setRooms(rooms.map((r) => (r.id === room.id ? { ...r, status: "vacant" } : r)));
    showToast("Guest checked out");
    setActiveStayId(null);
    setReceipt({ kind: "stay", id: stay.id, snapshot: finalStay });
    setView("receipt");
  };
  const voidStay = async (stay) => {
    const updated = { ...stay, status: "void", closedAt: Date.now() };
    const receiptRef = await syncStayToLedger(updated, currentUser);
    const finalStay = receiptRef ? { ...updated, receiptRef } : updated;
    setStays(stays.map((s) => (s.id === stay.id ? finalStay : s)));
    setRooms(rooms.map((r) => (r.id === stay.roomId ? { ...r, status: "vacant" } : r)));
    showToast("Check-in cancelled");
    setActiveStayId(null);
    setView("rooms");
  };
  const goToRooms = () => { setActiveStayId(null); setView("rooms"); };

  /* ---- printing ---- */
  const printNow = (data) => {
    setPrintPayload(data);
    setPrintReportPayload(null);
    setTimeout(() => window.print(), 60);
  };

  // Invoice reference numbers are assigned the first time a transaction is
  // actually printed as an invoice (not at payment time, since not every
  // sale becomes an invoice) — but once assigned, reprints reuse the same
  // number rather than allocating a new one.
  const printDocument = async (data, docType) => {
    let payload = { ...data, docType };
    if (docType === "Invoice" && isDesktop && data.transactionId) {
      try {
        const res = await window.api.ledger.ensureInvoiceRef({ transactionId: data.transactionId });
        if (res?.invoiceRef) payload = { ...payload, receiptNo: res.invoiceRef };
      } catch { /* fall back to printing with whatever reference is already on hand */ }
    }
    printNow(payload);
  };

  // Physical printing of a tabular report (CSV/PDF export's sibling) —
  // swaps the print-only DOM to a report layout instead of a receipt.
  const printReport = (reportData) => {
    setPrintPayload(null);
    setPrintReportPayload(reportData);
    setTimeout(() => window.print(), 60);
  };

  // Direct-to-file PDF export: reuses Electron's built-in PDF renderer on
  // the current window, which — thanks to the same print-only DOM swap —
  // is already showing exactly the report content by the time this runs.
  const exportReportPdf = async (reportData, suggestedName) => {
    if (!isDesktop) { showToast("PDF export is only available in the desktop app."); return; }
    setPrintPayload(null);
    setPrintReportPayload(reportData);
    await new Promise((r) => setTimeout(r, 150));
    try {
      const res = await window.api.exportFile.pdf({ suggestedName });
      if (res?.ok) showToast(`Saved ${(res.path || "").split(/[\\/]/).pop() || "PDF"}`);
      else if (res?.message) showToast(res.message);
    } catch (err) {
      showToast(err?.message || "Couldn't export PDF.");
    }
  };

  const openRoomCount = orders.filter((o) => !o.tableId && (o.status === "occupied" || o.status === "bill")).length;
  const occupiedRoomCount = rooms.filter((r) => r.status === "occupied").length;
  const activeStayRoom = activeStay ? rooms.find((r) => r.id === activeStay.roomId) : null;
  const receiptData = receipt
    ? (receipt.kind === "order" ? buildOrderReceipt(receipt.snapshot, receipt.snapshot.tableId ? { name: receipt.snapshot.tableName } : null, settings) : buildStayReceipt(receipt.snapshot))
    : null;

  return (
    <div className={`hp-shell theme-${resolvedTheme}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .hp-shell {
          --bg: #1B1815; --panel: #24201C; --panel-raised: #2E2822;
          --accent: #C1874F; --accent-soft: #8A6239;
          --text: #F3ECE2; --text-muted: #9C9186; --border: #3A332C;
          --avail: #4E5B4F; --occ: #C1874F; --billc: #D4A24C; --danger: #B5483D;
          --on-accent: #1B1815;
          font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg);
          display: flex; height: 100vh; min-height: 640px; overflow: hidden; border-radius: 8px;
        }
        /* Dark is the same palette as above, kept explicit for clarity —
           it's also .hp-shell's own fallback, so the app never renders
           with undefined CSS variables even if a theme class somehow
           fails to apply. Light is a new palette in the same warm
           hospitality tone, not a mechanical inversion — a few colors
           (accent, billc, avail, danger) are deepened from their
           dark-mode values, since a tone that pops against near-black
           can read as washed out against a light background.
           --on-accent is the fixed near-black used for text sitting on
           top of accent/billc-colored chips and buttons in both themes,
           since both palettes keep those colors light/bright enough for
           dark text to stay legible on top of them. */
        .hp-shell.theme-dark {
          --bg: #1B1815; --panel: #24201C; --panel-raised: #2E2822;
          --accent: #C1874F; --accent-soft: #8A6239;
          --text: #F3ECE2; --text-muted: #9C9186; --border: #3A332C;
          --avail: #4E5B4F; --occ: #C1874F; --billc: #D4A24C; --danger: #B5483D;
          --on-accent: #1B1815;
        }
        .hp-shell.theme-light {
          --bg: #F7F2EA; --panel: #FFFFFF; --panel-raised: #EFE6D8;
          --accent: #A8672E; --accent-soft: #C1874F;
          --text: #2A211A; --text-muted: #8B7C6B; --border: #E4D9C8;
          --avail: #3F6B44; --occ: #A8672E; --billc: #C68E35; --danger: #A23F35;
          --on-accent: #1B1815;
        }
        .hp-shell * { box-sizing: border-box; }
        .hp-shell h1, .hp-shell h2 { font-family: 'Space Grotesk', sans-serif; margin: 0; }
        .hp-shell input:focus, .hp-shell button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

        .hp-loading { padding: 40px; color: var(--text-muted); font-family: 'Inter', sans-serif; }

        .hp-sidebar { width: 176px; background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 16px 10px; flex-shrink: 0; }
        .hp-brand { display: flex; align-items: center; gap: 8px; padding: 6px 8px 20px; }
        .hp-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: var(--on-accent); }
        .hp-brand-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: 0.06em; font-size: 14px; }
        .hp-nav { display: flex; flex-direction: column; gap: 3px; }
        .hp-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; background: none; border: none; color: var(--text-muted); border-radius: 7px; cursor: pointer; font-size: 13.5px; font-family: inherit; text-align: left; position: relative; }
        .hp-nav-item:hover { background: var(--panel-raised); color: var(--text); }
        .hp-nav-item.active { background: var(--panel-raised); color: var(--accent); }
        .hp-nav-badge { margin-left: auto; background: var(--billc); color: var(--on-accent); font-size: 10px; font-weight: 700; border-radius: 999px; padding: 1px 6px; }

        .hp-topbar { height: 52px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 22px; flex-shrink: 0; }
        .hp-topbar-venue { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; }
        .hp-topbar-right { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 12.5px; }
        .hp-save-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--avail); }
        .hp-save-dot.saving { background: var(--billc); }
        .hp-topbar-clock { margin-left: 10px; font-variant-numeric: tabular-nums; }
        .hp-topbar-user { display: flex; align-items: center; gap: 6px; margin-left: 10px; font-size: 12.5px; color: var(--text-muted); }

        .hp-main-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .hp-view { padding: 22px 26px; overflow-y: auto; flex: 1; }
        .hp-view-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .hp-view-head-left { display: flex; align-items: center; gap: 4px; }
        .hp-view-head h1 { font-size: 20px; }
        .hp-h2 { font-size: 15px; color: var(--text-muted); }

        .hp-home-head { margin-bottom: 22px; position: relative; }
        .hp-home-eyebrow { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 4px; }
        .hp-home-toolbar { position: absolute; top: 0; right: 0; display: flex; gap: 8px; }
        .hp-grant-banner { display: flex; align-items: center; gap: 8px; background: rgba(193,135,79,0.12); border: 1px solid var(--accent); color: var(--accent); border-radius: 8px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; margin: 4px 0 14px; width: fit-content; }
        .hp-home-head h1 { font-size: 24px; }
        .hp-app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
        .hp-app-tile { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 18px 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; cursor: pointer; text-align: left; font-family: inherit; color: var(--text); position: relative; }
        .hp-app-tile:hover { border-color: var(--accent); transform: translateY(-1px); }
        .hp-app-tile-editing { cursor: grab; border-style: dashed; border-color: var(--accent); }
        .hp-app-tile-editing:active { cursor: grabbing; }
        .hp-app-drag-handle { position: absolute; top: 8px; right: 8px; color: var(--text-muted); opacity: 0.6; }
        .hp-app-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; position: relative; }
        .hp-app-badge { position: absolute; top: -5px; right: -5px; background: var(--billc); color: var(--on-accent); font-size: 10px; font-weight: 700; border-radius: 999px; padding: 1px 5px; border: 2px solid var(--panel); }
        .hp-app-label { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14.5px; }
        .hp-app-blurb { font-size: 11.5px; color: var(--text-muted); }
        .hp-app-soon { margin-top: 8px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: var(--text-muted); background: var(--panel-raised); padding: 2px 7px; border-radius: 999px; }

        .hp-placeholder { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 60px; gap: 6px; }
        .hp-placeholder .hp-icon-btn { align-self: flex-start; margin-bottom: 20px; }
        .hp-placeholder-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
        .hp-placeholder-text { color: var(--text-muted); font-size: 13.5px; max-width: 360px; margin: 4px 0 18px; }

        .hp-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--panel); color: var(--text); padding: 8px 14px; border-radius: 7px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .hp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .hp-btn-accent { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
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
        .hp-cat-tab.active { background: var(--accent); border-color: var(--accent); color: var(--on-accent); font-weight: 600; }
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
        select.hp-input { color-scheme: dark; cursor: pointer; }
        .hp-input:focus { outline: none; border-color: var(--accent); }
        .hp-input-sm { padding: 7px 9px; }
        .hp-settings-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        .hp-history-search { max-width: 340px; }
        .hp-history-list { display: flex; flex-direction: column; gap: 8px; }
        .hp-history-row { background: var(--panel); border: 1px solid var(--border); border-radius: 9px; overflow: hidden; }
        .hp-history-summary { width: 100%; display: grid; grid-template-columns: 92px minmax(0,1fr) 90px 130px 100px; align-items: center; gap: 10px; padding: 12px 16px; background: none; border: none; color: var(--text); cursor: pointer; font-family: inherit; text-align: left; }
        .hp-history-type { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em; }
        .hp-history-label { font-weight: 600; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
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
        .hp-theme-picker { display: flex; gap: 10px; }
        .hp-theme-option { display: flex; flex-direction: column; align-items: center; gap: 6px; background: var(--panel-raised); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 18px; cursor: pointer; font-family: inherit; color: var(--text); font-size: 12.5px; font-weight: 600; min-width: 100px; }
        .hp-theme-option:hover { border-color: var(--accent-soft); }
        .hp-theme-option.active { border-color: var(--accent); background: var(--panel); color: var(--accent); }

        .hp-modal-veil { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .hp-modal { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; }
        .hp-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 600; font-family: 'Space Grotesk', sans-serif; }
        .hp-modal-body { padding: 6px 16px 16px; }

        .hp-toast { position: fixed; bottom: 20px; right: 20px; background: var(--panel-raised); border: 1px solid var(--accent); color: var(--text); padding: 10px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 13px; z-index: 60; }

        .hp-login-shell { position: relative; flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; }
        .hp-login-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
        .hp-login-bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,9,8,0.55) 0%, rgba(10,9,8,0.35) 45%, rgba(10,9,8,0.75) 100%); }
        .hp-login-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; padding: 0 20px; box-sizing: border-box; overflow-y: auto; }
        .hp-login-main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 24px 0; }
        .hp-login-brandmark { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 22px; }
        .hp-login-wordmark { font-size: 26px; letter-spacing: 0.02em; margin: 10px 0 4px; }
        .hp-login-tagline { color: var(--text-muted); font-size: 13px; }
        .hp-login-card { width: 340px; max-width: 90vw; background: rgba(27, 24, 21, 0.72); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 26px 24px; box-sizing: border-box; backdrop-filter: blur(6px); display: flex; flex-direction: column; }
        .hp-login-card h1 { font-size: 18px; margin-bottom: 6px; text-align: center; }
        .hp-login-sub { color: var(--text-muted); font-size: 12.5px; margin-bottom: 10px; text-align: center; }
        .hp-login-card .hp-field-label { align-self: flex-start; }
        .hp-login-input-wrap { position: relative; width: 100%; margin-bottom: 4px; }
        .hp-login-input { padding-left: 36px !important; }
        .hp-login-input-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .hp-login-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: flex; }
        .hp-login-submit { margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.03em; }
        .hp-login-forgot { background: none; border: none; color: #7FAEDB; font-size: 12.5px; margin-top: 12px; cursor: pointer; align-self: center; }
        .hp-login-error { color: var(--danger); font-size: 12.5px; margin-top: 8px; text-align: center; }
        .hp-login-mark { width: 52px; height: 52px; border-radius: 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; background: var(--accent); }
        .hp-login-footer { width: 100%; margin-top: auto; padding: 16px 24px; box-sizing: border-box; background: rgba(10, 9, 8, 0.65); border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--text-muted); }
        .hp-login-footer-venue { display: flex; align-items: center; gap: 10px; color: var(--text); }
        .hp-login-footer-name { font-weight: 600; font-size: 13px; }
        .hp-login-footer-sub { font-size: 11px; color: var(--text-muted); }
        .hp-login-footer-links { display: flex; gap: 18px; }
        .hp-login-footer-links span { display: flex; align-items: center; gap: 6px; color: var(--accent); }
        .hp-login-footer-meta { text-align: right; font-size: 11px; }

        .hp-doc-intro { color: var(--text-muted); font-size: 13px; margin: -6px 0 18px; max-width: 560px; }
        .hp-doc-list { display: flex; flex-direction: column; gap: 4px; }
        .hp-doc-row { display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 1px solid var(--border); font-size: 13px; min-width: 0; }
        .hp-recipe-line-row { display: grid; grid-template-columns: 1fr 70px 130px 90px 26px; align-items: center; gap: 6px; padding: 6px 4px; border-bottom: 1px solid var(--border); border-left: 2px solid transparent; padding-left: 6px; }
        .hp-doc-name { flex: 1; cursor: pointer; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hp-doc-name:hover { color: var(--accent); }
        .hp-doc-active { display: flex; align-items: center; gap: 4px; color: var(--accent); font-size: 11.5px; font-weight: 700; }

        .hp-report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }

        .hp-chart-card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px 14px 12px; }
        .hp-chart-axis-label { font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
        .hp-chart-axis-label-y { writing-mode: vertical-rl; transform: rotate(180deg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding-right: 2px; }
        .hp-chart-axis-label-x { text-align: center; margin-top: 6px; }

        .hp-data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .hp-data-table th { text-align: right; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-muted); font-weight: 700; padding: 6px 10px; border-bottom: 1px solid var(--border); }
        .hp-data-table th:first-child { text-align: left; }
        .hp-data-table td { text-align: right; padding: 7px 10px; border-bottom: 1px solid var(--border); font-variant-numeric: tabular-nums; }
        .hp-data-table td:first-child { text-align: left; font-weight: 600; }
        .hp-data-table tr:last-child td { border-bottom: none; }
        .hp-report-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; color: var(--accent); }
        .hp-report-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; color: var(--text); margin-top: 8px; font-variant-numeric: tabular-nums; }
        .hp-report-label { color: var(--text-muted); font-size: 11.5px; margin-top: 2px; }

        .hp-progress-track { height: 6px; border-radius: 999px; background: var(--panel-raised); overflow: hidden; }
        .hp-progress-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.2s ease; }

        .hp-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

        .hp-bar-row { display: grid; grid-template-columns: 46px minmax(0,1fr) 78px; align-items: center; gap: 8px; padding: 3px 0; font-size: 11.5px; }
        .hp-bar-track { height: 14px; background: var(--panel-raised); border-radius: 3px; overflow: hidden; }
        .hp-bar-fill-revenue { height: 100%; background: var(--accent); border-radius: 3px; min-width: 2px; }
        .hp-bar-fill-cogs { height: 100%; background: var(--danger); opacity: 0.65; }

        /* Content sections cap at a comfortable reading width instead of
           stretching edge-to-edge on a maximized or ultra-wide window —
           applies uniformly (including table/room tile grids) for visual
           consistency; tiles still wrap naturally within that width. */
        .hp-view > .hp-floor-section, .hp-view > .hp-settings-card, .hp-view > .hp-bill-card {
          max-width: 1100px;
        }

        .hp-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .hp-cal-dow { text-align: center; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); padding-bottom: 4px; }
        .hp-cal-cell { min-height: 74px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 5px 6px; display: flex; flex-direction: column; gap: 2px; }
        .hp-cal-empty { background: transparent; border-color: transparent; }
        .hp-cal-today { border-color: var(--accent); }
        .hp-cal-date { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px; color: var(--text-muted); }
        .hp-cal-today .hp-cal-date { color: var(--accent); }
        .hp-cal-chip { font-size: 9.5px; background: var(--panel-raised); border-radius: 4px; padding: 1px 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hp-cal-more { font-size: 9px; color: var(--text-muted); }

        .hp-print-only { display: none; }
        @media print {
          .hp-shell { height: auto !important; overflow: visible !important; background: #fff !important; border-radius: 0 !important; }
          .hp-shell > *:not(.hp-print-only) { display: none !important; }
          .hp-print-only { display: block !important; }
          .hp-receipt-paper { width: var(--receipt-width, 296px); margin: 0 auto; color: #111; font-family: 'Space Grotesk', monospace; padding: 8px 4px; }
          .hp-receipt-venue { font-weight: 700; font-size: 14px; text-align: center; }
          .hp-receipt-kind { text-align: center; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #555; margin-bottom: 6px; }
          .hp-receipt-meta { font-size: 10.5px; color: #333; text-align: center; }
          .hp-receipt-rule { border-top: 1px dashed #999; margin: 8px 0; }
          .hp-receipt-line { display: flex; justify-content: space-between; font-size: 11.5px; padding: 2px 0; }
          .hp-receipt-item-row { display: grid; grid-template-columns: 1fr 22px 56px; gap: 4px; font-size: 11px; padding: 2px 0; word-break: break-word; }
          .hp-receipt-item-row span:nth-child(2) { text-align: center; color: #555; }
          .hp-receipt-item-row span:nth-child(3) { text-align: right; }
          .hp-receipt-item-head { font-weight: 700; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 2px; }
          .hp-receipt-total { font-weight: 700; font-size: 13px; }
          .hp-receipt-thanks { text-align: center; margin-top: 10px; font-size: 11px; }
          .hp-receipt-logo { display: block; max-width: 70%; max-height: 70px; margin: 0 auto 8px; object-fit: contain; }
          .hp-receipt-signature { margin-top: 16px; font-size: 11px; line-height: 2.2; }
          .hp-report-paper { width: 700px; margin: 0 auto; color: #111; font-family: 'Space Grotesk', monospace; padding: 12px 0; }
          .hp-report-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
          .hp-report-table th { text-align: left; border-bottom: 1px solid #999; padding: 4px 6px; font-weight: 700; }
          .hp-report-table td { padding: 3px 6px; border-bottom: 1px solid #eee; }
        }
      `}</style>

      {needsLogin ? (
        <LoginGate onLogin={setCurrentUser} settings={settings} />
      ) : (
        <>
      <Sidebar
        view={
          ["floor", "order", "billing", "rooms", "room-folio", "menu", "placeholder", "documents", "accounting", "inventory", "calendar", "contacts", "todo", "hr", "conference", "runningcosts", "maintenance", "dashboard", "attendance"].includes(view) ? "home"
          : view === "receipt" ? "home"
          : view
        }
        setView={(v) => { setActiveOrderId(null); setBillingOrderId(null); setActiveStayId(null); setReceipt(null); setPlaceholderApp(null); setView(v); }}
        openRoomCount={openRoomCount}
        occupiedRoomCount={occupiedRoomCount}
      />

      <div className="hp-main-col">
        <TopBar venueName={settings.venueName} saveStatus={saveStatus} currentUser={currentUser} onLogout={() => setCurrentUser(null)} />

        {view === "home" && (
          <HomeView venueName={settings.venueName} openApp={openApp} openRoomCount={openRoomCount} occupiedRoomCount={occupiedRoomCount} role={currentUser?.role} roleAccessConfig={roleAccessConfig} grantedTiles={currentUser?.grantedTiles} grantExpiresAt={currentUser?.grantExpiresAt} currentUser={currentUser} />
        )}

        {view === "placeholder" && placeholderApp && (
          <PlaceholderView app={placeholderApp} goHome={goHome} />
        )}

        {view === "floor" && (
          <FloorView tables={tables} orders={orders} settings={settings} checkedInStays={checkedInStays} openTable={openTable} openRoomOrder={openRoomOrder} startRoomCharge={startRoomCharge} startTakeawayOrder={startTakeawayOrder} goHome={goHome} setTables={setTables} showToast={showToast} />
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
          <RoomBoard rooms={rooms} stays={stays} settings={settings} openRoom={openRoom} checkIn={checkIn} goHome={goHome} setRooms={setRooms} showToast={showToast} />
        )}

        {view === "room-folio" && activeStay && activeStayRoom && (
          <RoomFolio stay={activeStay} room={activeStayRoom} settings={settings} goBack={goToRooms} checkOutStay={checkOutStay} voidStay={voidStay} />
        )}

        {view === "receipt" && receiptData && (
          <ReceiptScreen
            data={receiptData}
            settings={settings}
            onPrint={(docType) => printDocument(receiptData, docType)}
            onDone={() => { setReceipt(null); setView(receipt.kind === "order" ? "floor" : "rooms"); }}
          />
        )}

        {view === "history" && <HistoryScreen orders={orders} stays={stays} settings={settings} onPrint={printDocument} />}

        {view === "menu" && (
          <MenuManager categories={categories} menuItems={menuItems} settings={settings} setCategories={setCategories} setMenuItems={setMenuItems} goHome={goHome} />
        )}

        {view === "documents" && isDesktop && (
          <DocumentsView currentUser={currentUser} goHome={goHome} showToast={showToast} onLetterheadChange={refreshLetterhead} />
        )}

        {view === "accounting" && isDesktop && (
          <ReportsView settings={settings} stays={stays} rooms={rooms} currentUser={currentUser} goHome={goHome} showToast={showToast} printReport={printReport} exportReportPdf={exportReportPdf} />
        )}

        {view === "inventory" && isDesktop && (
          <InventoryView menuItems={menuItems} categories={categories} settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} exportReportPdf={exportReportPdf} />
        )}

        {view === "calendar" && isDesktop && (
          <CalendarView rooms={rooms} currentUser={currentUser} goHome={goHome} showToast={showToast} onConvertToCheckIn={checkInFromReservation} />
        )}

        {view === "contacts" && isDesktop && (
          <ContactsView stays={stays} currentUser={currentUser} goHome={goHome} showToast={showToast} />
        )}

        {view === "todo" && isDesktop && (
          <TodoView currentUser={currentUser} goHome={goHome} showToast={showToast} />
        )}

        {view === "hr" && isDesktop && (
          <HRView settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} />
        )}

        {view === "conference" && isDesktop && (
          <ConferenceView settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} printDocument={printDocument} />
        )}

        {view === "runningcosts" && isDesktop && (
          <RunningCostsView settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} exportReportPdf={exportReportPdf} />
        )}

        {view === "maintenance" && isDesktop && (
          <MaintenanceView settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} />
        )}

        {view === "dashboard" && isDesktop && (
          <DashboardView settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} />
        )}

        {view === "attendance" && isDesktop && (
          <AttendanceView settings={settings} currentUser={currentUser} goHome={goHome} showToast={showToast} exportReportPdf={exportReportPdf} />
        )}

        {["documents", "accounting", "inventory", "calendar", "contacts", "todo", "hr", "conference", "runningcosts", "maintenance", "dashboard", "attendance"].includes(view) && !isDesktop && (
          <div className="hp-view">
            <div className="hp-view-head">
              <div className="hp-view-head-left">
                <button className="hp-icon-btn" onClick={goHome}><ArrowLeft size={18} /></button>
                <h1>Desktop app required</h1>
              </div>
            </div>
            <div className="hp-empty">This runs on real local storage and is only available in the desktop app build.</div>
          </div>
        )}

        {view === "settings" && (
          <SettingsScreen settings={settings} setSettings={setSettings} currentUser={currentUser} showToast={showToast} themeMode={themeMode} setThemeMode={setThemeMode} />
        )}
      </div>

      <div className="hp-print-only">
        {printPayload && <style>{`@page { size: ${RECEIPT_WIDTHS[settings.receiptWidth] ? settings.receiptWidth : "80mm"} auto; margin: 0; }`}</style>}
        {printReportPayload && <style>{`@page { size: A4; margin: 12mm; }`}</style>}
        <PrintReceipt data={printPayload} settings={settings} letterheadPath={letterheadPath} />
        <PrintReport data={printReportPayload} settings={settings} />
      </div>

      <Toast toast={toast} />
        </>
      )}
    </div>
  );
}
