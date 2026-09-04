const { contextBridge, ipcRenderer } = require("electron");

// Same shape as the get/set/delete/list storage API used in the web
// preview, so settings/menu/tables/rooms code works unchanged.
contextBridge.exposeInMainWorld("storage", {
  get: (key) => ipcRenderer.invoke("store:get", key),
  set: (key, value) => ipcRenderer.invoke("store:set", key, value),
  delete: (key) => ipcRenderer.invoke("store:delete", key),
  list: (prefix) => ipcRenderer.invoke("store:list", prefix),
});

// Desktop-only: relational ledger, users, audit, documents, backups.
// Presence of window.api is how the renderer detects it's running in
// the desktop app rather than the browser preview.
contextBridge.exposeInMainWorld("api", {
  users: {
    list: () => ipcRenderer.invoke("users:list"),
    hasAny: () => ipcRenderer.invoke("users:hasAny"),
    create: (payload) => ipcRenderer.invoke("users:create", payload),
    setActive: (payload) => ipcRenderer.invoke("users:setActive", payload),
    resetPin: (payload) => ipcRenderer.invoke("users:resetPin", payload),
    login: (payload) => ipcRenderer.invoke("users:login", payload),
  },
  ledger: {
    recordTransaction: (payload) => ipcRenderer.invoke("ledger:recordTransaction", payload),
    voidTransaction: (payload) => ipcRenderer.invoke("ledger:voidTransaction", payload),
    listRange: (payload) => ipcRenderer.invoke("ledger:listRange", payload),
    summary: (payload) => ipcRenderer.invoke("ledger:summary", payload),
    lookup: (payload) => ipcRenderer.invoke("ledger:lookup", payload),
    ensureInvoiceRef: (payload) => ipcRenderer.invoke("ledger:ensureInvoiceRef", payload),
    foodCostReport: (payload) => ipcRenderer.invoke("ledger:foodCostReport", payload),
    profitSeries: (payload) => ipcRenderer.invoke("ledger:profitSeries", payload),
  },
  audit: {
    list: (payload) => ipcRenderer.invoke("audit:list", payload),
    write: (payload) => ipcRenderer.invoke("audit:write", payload),
  },
  reservations: {
    list: () => ipcRenderer.invoke("reservations:list"),
    create: (payload) => ipcRenderer.invoke("reservations:create", payload),
    cancel: (payload) => ipcRenderer.invoke("reservations:cancel", payload),
    markCheckedIn: (payload) => ipcRenderer.invoke("reservations:markCheckedIn", payload),
  },
  calendar: {
    events: (payload) => ipcRenderer.invoke("calendar:events", payload),
    noteCreate: (payload) => ipcRenderer.invoke("calendar:notes:create", payload),
    noteRemove: (payload) => ipcRenderer.invoke("calendar:notes:remove", payload),
    notesDueToday: () => ipcRenderer.invoke("calendar:notes:dueToday"),
  },
  contacts: {
    list: () => ipcRenderer.invoke("contacts:list"),
    create: (payload) => ipcRenderer.invoke("contacts:create", payload),
    update: (payload) => ipcRenderer.invoke("contacts:update", payload),
    remove: (payload) => ipcRenderer.invoke("contacts:remove", payload),
    importGuests: (payload) => ipcRenderer.invoke("contacts:importGuests", payload),
    importSuppliers: (payload) => ipcRenderer.invoke("contacts:importSuppliers", payload),
  },
  tasks: {
    list: () => ipcRenderer.invoke("tasks:list"),
    create: (payload) => ipcRenderer.invoke("tasks:create", payload),
    setStatus: (payload) => ipcRenderer.invoke("tasks:setStatus", payload),
    remove: (payload) => ipcRenderer.invoke("tasks:remove", payload),
  },
  grants: {
    list: (payload) => ipcRenderer.invoke("grants:list", payload),
    create: (payload) => ipcRenderer.invoke("grants:create", payload),
    revoke: (payload) => ipcRenderer.invoke("grants:revoke", payload),
  },
  employees: {
    list: (payload) => ipcRenderer.invoke("employees:list", payload),
    create: (payload) => ipcRenderer.invoke("employees:create", payload),
    updatePersonal: (payload) => ipcRenderer.invoke("employees:updatePersonal", payload),
    updateEmployment: (payload) => ipcRenderer.invoke("employees:updateEmployment", payload),
    updatePayroll: (payload) => ipcRenderer.invoke("employees:updatePayroll", payload),
    setStatus: (payload) => ipcRenderer.invoke("employees:setStatus", payload),
    remove: (payload) => ipcRenderer.invoke("employees:remove", payload),
    ledger: (payload) => ipcRenderer.invoke("employees:ledger", payload),
    history: (payload) => ipcRenderer.invoke("employees:history", payload),
    historyAdd: (payload) => ipcRenderer.invoke("employees:historyAdd", payload),
    terminate: (payload) => ipcRenderer.invoke("employees:terminate", payload),
    settlementPaid: (payload) => ipcRenderer.invoke("employees:settlementPaid", payload),
    rehire: (payload) => ipcRenderer.invoke("employees:rehire", payload),
  },
  attendance: {
    roster: () => ipcRenderer.invoke("attendance:roster"),
    today: () => ipcRenderer.invoke("attendance:today"),
    status: (payload) => ipcRenderer.invoke("attendance:status", payload),
    clockIn: (payload) => ipcRenderer.invoke("attendance:clockIn", payload),
    clockOut: (payload) => ipcRenderer.invoke("attendance:clockOut", payload),
    manualEntry: (payload) => ipcRenderer.invoke("attendance:manualEntry", payload),
    report: (payload) => ipcRenderer.invoke("attendance:report", payload),
    remove: (payload) => ipcRenderer.invoke("attendance:remove", payload),
  },
  leave: {
    list: (payload) => ipcRenderer.invoke("leave:list", payload),
    create: (payload) => ipcRenderer.invoke("leave:create", payload),
    approve: (payload) => ipcRenderer.invoke("leave:approve", payload),
    remove: (payload) => ipcRenderer.invoke("leave:remove", payload),
    balanceAdjust: (payload) => ipcRenderer.invoke("leave:balanceAdjust", payload),
    ledgerBalances: (payload) => ipcRenderer.invoke("leave:ledgerBalances", payload),
  },
  conference: {
    roomsList: () => ipcRenderer.invoke("conference:rooms:list"),
    roomsCreate: (payload) => ipcRenderer.invoke("conference:rooms:create", payload),
    roomsRemove: (payload) => ipcRenderer.invoke("conference:rooms:remove", payload),
    bookingsList: () => ipcRenderer.invoke("conference:bookings:list"),
    bookingsCreate: (payload) => ipcRenderer.invoke("conference:bookings:create", payload),
    bookingsSettle: (payload) => ipcRenderer.invoke("conference:bookings:settle", payload),
    bookingsCancel: (payload) => ipcRenderer.invoke("conference:bookings:cancel", payload),
    bookingsHistoryList: () => ipcRenderer.invoke("conference:bookings:historyList"),
  },
  runningCosts: {
    list: (payload) => ipcRenderer.invoke("runningCosts:list", payload),
    create: (payload) => ipcRenderer.invoke("runningCosts:create", payload),
    remove: (payload) => ipcRenderer.invoke("runningCosts:remove", payload),
    summary: (payload) => ipcRenderer.invoke("runningCosts:summary", payload),
  },
  maintenance: {
    list: () => ipcRenderer.invoke("maintenance:list"),
    create: (payload) => ipcRenderer.invoke("maintenance:create", payload),
    setStatus: (payload) => ipcRenderer.invoke("maintenance:setStatus", payload),
    remove: (payload) => ipcRenderer.invoke("maintenance:remove", payload),
  },
  documents: {
    list: () => ipcRenderer.invoke("documents:list"),
    listForEmployee: (payload) => ipcRenderer.invoke("documents:listForEmployee", payload),
    add: (payload) => ipcRenderer.invoke("documents:add", payload),
    setActive: (payload) => ipcRenderer.invoke("documents:setActive", payload),
    remove: (payload) => ipcRenderer.invoke("documents:remove", payload),
    open: (storedPath) => ipcRenderer.invoke("documents:open", storedPath),
  },
  stock: {
    list: () => ipcRenderer.invoke("stock:list"),
    create: (payload) => ipcRenderer.invoke("stock:create", payload),
    update: (payload) => ipcRenderer.invoke("stock:update", payload),
    remove: (payload) => ipcRenderer.invoke("stock:remove", payload),
    purchase: (payload) => ipcRenderer.invoke("stock:purchase", payload),
    purchasesList: (payload) => ipcRenderer.invoke("stock:purchases:list", payload),
    consumptionList: (payload) => ipcRenderer.invoke("stock:consumption:list", payload),
    movementReport: (payload) => ipcRenderer.invoke("stock:movementReport", payload),
    consumptionReport: (payload) => ipcRenderer.invoke("stock:consumptionReport", payload),
    ledger: (payload) => ipcRenderer.invoke("stock:ledger", payload),
    internalConsumptionSummary: (payload) => ipcRenderer.invoke("stock:internalConsumptionSummary", payload),
    adjust: (payload) => ipcRenderer.invoke("stock:adjust", payload),
    adjustmentsList: (payload) => ipcRenderer.invoke("stock:adjustments:list", payload),
    inventoryValue: () => ipcRenderer.invoke("stock:inventoryValue"),
  },
  recipe: {
    get: (payload) => ipcRenderer.invoke("recipe:get", payload),
    set: (payload) => ipcRenderer.invoke("recipe:set", payload),
    allCounts: () => ipcRenderer.invoke("recipe:allCounts"),
    allWithCost: () => ipcRenderer.invoke("recipe:allWithCost"),
    currentVersion: (payload) => ipcRenderer.invoke("recipe:currentVersion", payload),
  },
  wastage: {
    list: (payload) => ipcRenderer.invoke("wastage:list", payload),
    create: (payload) => ipcRenderer.invoke("wastage:create", payload),
    remove: (payload) => ipcRenderer.invoke("wastage:remove", payload),
    summary: (payload) => ipcRenderer.invoke("wastage:summary", payload),
    byItem: (payload) => ipcRenderer.invoke("wastage:byItem", payload),
    report: (payload) => ipcRenderer.invoke("wastage:report", payload),
    approve: (payload) => ipcRenderer.invoke("wastage:approve", payload),
  },
  stockCounts: {
    list: () => ipcRenderer.invoke("stockCounts:list"),
    start: (payload) => ipcRenderer.invoke("stockCounts:start", payload),
    get: (payload) => ipcRenderer.invoke("stockCounts:get", payload),
    recordCount: (payload) => ipcRenderer.invoke("stockCounts:recordCount", payload),
    finalize: (payload) => ipcRenderer.invoke("stockCounts:finalize", payload),
    cancel: (payload) => ipcRenderer.invoke("stockCounts:cancel", payload),
    varianceTrend: () => ipcRenderer.invoke("stockCounts:varianceTrend"),
    varianceByItem: () => ipcRenderer.invoke("stockCounts:varianceByItem"),
  },
  stockAdjustments: {
    report: (payload) => ipcRenderer.invoke("stockAdjustments:report", payload),
    approve: (payload) => ipcRenderer.invoke("stockAdjustments:approve", payload),
  },
  alerts: {
    list: (payload) => ipcRenderer.invoke("alerts:list", payload),
  },
  dashboard: {
    revenueRows: (payload) => ipcRenderer.invoke("dashboard:revenueRows", payload),
    expenseRows: (payload) => ipcRenderer.invoke("dashboard:expenseRows", payload),
    internalCostRows: (payload) => ipcRenderer.invoke("dashboard:internalCostRows", payload),
    stockPurchaseRows: (payload) => ipcRenderer.invoke("dashboard:stockPurchaseRows", payload),
  },
  exportFile: {
    pdf: (payload) => ipcRenderer.invoke("export:pdf", payload),
  },
  backup: {
    create: (payload) => ipcRenderer.invoke("backup:create", payload),
    list: () => ipcRenderer.invoke("backup:list"),
    restore: (payload) => ipcRenderer.invoke("backup:restore", payload),
    revealFolder: () => ipcRenderer.invoke("backup:revealFolder"),
  },
  terminal: {
    info: () => ipcRenderer.invoke("terminal:info"),
  },
  app: {
    getVersion: () => ipcRenderer.invoke("app:version"),
    info: () => ipcRenderer.invoke("app:info"),
  },
  database: {
    info: () => ipcRenderer.invoke("database:info"),
  },
  updates: {
    check: () => ipcRenderer.invoke("updates:check"),
    download: () => ipcRenderer.invoke("updates:download"),
    install: () => ipcRenderer.invoke("updates:install"),
    // Subscribes to push status events (checking/available/downloading/
    // downloaded/up-to-date/error/disabled). Returns an unsubscribe fn —
    // callers MUST call it on unmount to avoid leaking listeners.
    status: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on("updates:status", listener);
      return () => ipcRenderer.removeListener("updates:status", listener);
    },
  },
});
