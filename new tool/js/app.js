// app.js
// Main application wiring: events, database table, search/filter/sort, settings, PIN unlock, inline editing.

(() => {

  /* ---------------------------------------------------------
     ADMIN ACCESS CONTROL (PIN)
  --------------------------------------------------------- */

  const ACCESS_PIN = "2601";   // <<< CHANGE YOUR PIN HERE
  let isAdmin = false;

  const loginScreen = document.getElementById("loginScreen");
  const loginBtn = document.getElementById("loginBtn");
  const viewerBtn = document.getElementById("viewerBtn");
  const accessKeyInput = document.getElementById("accessKeyInput");
  const quickUnlockBtn = document.getElementById("quickUnlockBtn");

  loginBtn.addEventListener("click", () => {
    if (accessKeyInput.value === ACCESS_PIN) {
      isAdmin = true;
      loginScreen.style.display = "none";
      UI.showToast("Admin Mode Activated");
      applyAccessControl();
    } else {
      UI.showToast("Invalid PIN");
    }
  });

  viewerBtn.addEventListener("click", () => {
    isAdmin = false;
    loginScreen.style.display = "none";
    UI.showToast("Viewer Mode Activated");
    applyAccessControl();
  });

  quickUnlockBtn.addEventListener("click", () => {
    const pin = prompt("Enter PIN:");
    if (pin === ACCESS_PIN) {
      isAdmin = true;
      UI.showToast("Admin Mode Activated");
      applyAccessControl();
    } else {
      UI.showToast("Invalid PIN");
    }
  });

  function applyAccessControl() {
    // Hide New Entry & Settings for viewer
    document.querySelector("[data-view='new-entry']").style.display = isAdmin ? "block" : "none";
    document.querySelector("[data-view='settings']").style.display = isAdmin ? "block" : "none";

    // Hide edit/delete buttons
    const dbTable = document.getElementById("dbTable");
    if (!isAdmin) dbTable.classList.add("viewer-mode");
    else dbTable.classList.remove("viewer-mode");
  }

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */

  let currentPreviewRecord = null;
  let dbRecords = [];
  let sortState = { field: "id", dir: "asc" };
  let page = 1;
  const pageSize = 10;

  const navButtons = document.querySelectorAll(".nav-link");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      UI.switchView(btn.dataset.view);
      if (btn.dataset.view === "dashboard") refreshDashboard();
      if (btn.dataset.view === "database") refreshDatabaseTable();
    });
  });

  /* ---------------------------------------------------------
     THEME
  --------------------------------------------------------- */

  const toggleThemeBtn = document.getElementById("toggleThemeBtn");
  const settingsDarkBtn = document.getElementById("settingsDark");
  const settingsLightBtn = document.getElementById("settingsLight");

  function setTheme(mode) {
    document.body.classList.toggle("dark", mode === "dark");
    document.body.classList.toggle("light", mode === "light");
    localStorage.setItem("steel_theme", mode);
  }

  toggleThemeBtn.addEventListener("click", () => {
    const current = document.body.classList.contains("dark") ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  settingsDarkBtn.addEventListener("click", () => setTheme("dark"));
  settingsLightBtn.addEventListener("click", () => setTheme("light"));

  const savedTheme = localStorage.getItem("steel_theme") || "light";
  setTheme(savedTheme);

  /* ---------------------------------------------------------
     NEW ENTRY PAGE
  --------------------------------------------------------- */

  const pasteArea = document.getElementById("pasteArea");
  const btnConvert = document.getElementById("btnConvert");
  const btnPreview = document.getElementById("btnPreview");
  const btnSave = document.getElementById("btnSave");
  const btnClear = document.getElementById("btnClear");

  btnConvert.addEventListener("click", () => tryParse(true));
  btnPreview.addEventListener("click", () => tryParse(true));

  btnSave.addEventListener("click", async () => {
    if (!isAdmin) {
      UI.showToast("Viewer Mode: Save disabled");
      return;
    }
    if (!currentPreviewRecord) {
      UI.showToast("No record to save. Please convert first.");
      return;
    }
    const confirmed = await UI.confirm("Save this record to database?");
    if (!confirmed) return;

    const saved = Database.add(currentPreviewRecord);
    UI.showToast(`Record #${saved.id} saved.`);
    currentPreviewRecord = null;
    UI.renderPreview(saved);
    loadDb();
    refreshDashboard();
  });

  btnClear.addEventListener("click", () => {
    pasteArea.value = "";
    currentPreviewRecord = null;
    UI.renderPreview({
      workOrder: "",
      structure: "",
      batchNo: "",
      transmittalNo: "",
      shopTransmittalNo: "",
      batchWeight: "",
      status: "",
      type: "",
      receivedDate: ""
    });
    UI.renderWarnings([]);
  });

  function tryParse(showPreview) {
    const raw = pasteArea.value;
    try {
      const { record, warnings } = Parser.parse(raw);
      currentPreviewRecord = record;
      if (showPreview) UI.renderPreview(record);
      UI.renderWarnings(warnings);
      UI.showToast("Conversion successful.");
    } catch (e) {
      UI.renderWarnings([e.message]);
      UI.showToast(e.message);
    }
  }

  /* ---------------------------------------------------------
     DATABASE PAGE
  --------------------------------------------------------- */

  const dbSearchInput = document.getElementById("dbSearch");
  const dbFilterSelect = document.getElementById("dbFilter");
  const dbCustomFrom = document.getElementById("dbCustomFrom");
  const dbCustomTo = document.getElementById("dbCustomTo");
  const dbApplyCustomBtn = document.getElementById("dbApplyCustom");
  const dbTableBody = document.querySelector("#dbTable tbody");
  const selectAllCheckbox = document.getElementById("selectAll");
  const btnExportSelected = document.getElementById("btnExportSelected");
  const btnExportAll = document.getElementById("btnExportAll");
  const pagePrevBtn = document.getElementById("pagePrev");
  const pageNextBtn = document.getElementById("pageNext");
  const pageInfoEl = document.getElementById("pageInfo");

  function loadDb() {
    dbRecords = Database.getAll();
  }

  function applySearchFilterSort() {
    let list = dbRecords.slice();

    const q = dbSearchInput.value.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        [
          r.workOrder,
          r.structure,
          r.batchNo,
          r.transmittalNo,
          r.receivedDate,
          r.status
        ].join(" ").toLowerCase().includes(q)
      );
    }

    const filter = dbFilterSelect.value;
    const todayStr = formatToday();
    const now = new Date();

    if (filter === "today") {
      list = list.filter(r => r.receivedDate === todayStr);
    } else if (filter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(r => parseDate(r.receivedDate) >= weekAgo);
    } else if (filter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter(r => parseDate(r.receivedDate) >= monthAgo);
    }

    if (dbCustomFrom.value && dbCustomTo.value) {
      const from = new Date(dbCustomFrom.value);
      const to = new Date(dbCustomTo.value);
      list = list.filter(r => {
        const d = parseDate(r.receivedDate);
        return d >= from && d <= to;
      });
    }

    list.sort((a, b) => {
      const field = sortState.field;
      const dir = sortState.dir === "asc" ? 1 : -1;
      let va = a[field];
      let vb = b[field];
      if (field === "batchWeight" || field === "id") {
        va = parseFloat(va);
        vb = parseFloat(vb);
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return list;
  }

  function refreshDatabaseTable() {
    const list = applySearchFilterSort();
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * pageSize;
    const pageItems = list.slice(start, start + pageSize);

    dbTableBody.innerHTML = "";

    pageItems.forEach(r => {
      const tr = document.createElement("tr");

      // Checkbox
      const tdSel = document.createElement("td");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.id = r.id;
      tdSel.appendChild(cb);
      tr.appendChild(tdSel);

      // Data columns with truncation for multi-value fields
      const cols = [
        r.id,
        r.workOrder,
        r.structure,
        r.batchNo,
        r.transmittalNo,
        r.shopTransmittalNo,
        r.batchWeight,
        r.status,
        r.type,
        r.receivedDate,
	r.extra1,
  r.extra2,
  r.extra3,
  r.extra4,
  r.extra5,
  r.extra6,
  r.extra7,
  r.extra8,
  r.extra9,
  r.extra10
      ];

      cols.forEach((val, idx) => {
        const td = document.createElement("td");

        const multiColsIndex = [2, 3, 4]; // structure, batchNo, transmittalNo

        if (multiColsIndex.includes(idx) && typeof val === "string") {
          const parts = val.split(";");
          let display = val;
          if (parts.length > 2) {
            display = parts.slice(0, 2).join(";") + " ...";
          }
          td.textContent = display;
          td.title = val;
          td.classList.add("truncated-cell");
        } else {
          td.textContent = val;
        }

        tr.appendChild(td);
      });

      // Actions
      const tdActions = document.createElement("td");

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => editRecord(r.id));

      const btnDelete = document.createElement("button");
      btnDelete.textContent = "Delete";
      btnDelete.addEventListener("click", () => deleteRecord(r.id));

      const btnExport = document.createElement("button");
      btnExport.textContent = "Export";
      btnExport.addEventListener("click", () => ExcelUtil.exportRecords([r]));

      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDelete);
      tdActions.appendChild(btnExport);

      tr.appendChild(tdActions);
      dbTableBody.appendChild(tr);
    });

    pageInfoEl.textContent = `Page ${page} / ${totalPages}`;
  }

  /* ---------------------------------------------------------
     INLINE EDITING
  --------------------------------------------------------- */

  function editRecord(id) {
    const rec = dbRecords.find(r => r.id === id);
    if (!rec || !isAdmin) {
      if (!isAdmin) UI.showToast("Viewer Mode: Edit disabled");
      return;
    }

    const rows = Array.from(dbTableBody.querySelectorAll("tr"));
    const row = rows.find(tr => {
      const firstDataCell = tr.querySelector("td:nth-child(2)");
      return firstDataCell && parseInt(firstDataCell.textContent, 10) === id;
    });
    if (!row) return;

    const cells = row.querySelectorAll("td");

    // Make editable (skip checkbox + actions)
    for (let i = 1; i <= 20; i++) {
      const cell = cells[i];
      cell.contentEditable = "true";
      cell.style.backgroundColor = "rgba(30,136,229,0.08)";
    }

    // Replace actions with Save/Cancel
    const actionsCell = cells[21];
    actionsCell.innerHTML = "";

    const btnSave = document.createElement("button");
    btnSave.textContent = "Save";
    btnSave.addEventListener("click", () => saveEditedRow(id, row));

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    btnCancel.addEventListener("click", () => {
      refreshDatabaseTable();
      UI.showToast("Edit cancelled");
    });

    actionsCell.appendChild(btnSave);
    actionsCell.appendChild(btnCancel);
  }

  function saveEditedRow(id, row) {
    const cells = row.querySelectorAll("td");

    const updated = {
      workOrder: cells[2].textContent.trim(),
      structure: cells[3].textContent.trim(),
      batchNo: cells[4].textContent.trim(),
      transmittalNo: cells[5].textContent.trim(),
      shopTransmittalNo: cells[6].textContent.trim(),
      batchWeight: cells[7].textContent.trim(),
      status: cells[8].textContent.trim(),
      type: cells[9].textContent.trim(),
      receivedDate: cells[10].textContent.trim(),
  extra1: cells[11].textContent.trim(),
  extra2: cells[12].textContent.trim(),
  extra3: cells[13].textContent.trim(),
  extra4: cells[14].textContent.trim(),
  extra5: cells[15].textContent.trim(),
  extra6: cells[16].textContent.trim(),
  extra7: cells[17].textContent.trim(),
  extra8: cells[18].textContent.trim(),
  extra9: cells[19].textContent.trim(),
  extra10: cells[20].textContent.trim()
    };

    Database.update(id, updated);
    loadDb();
    refreshDatabaseTable();
    refreshDashboard();
    UI.showToast(`Record #${id} updated.`);
  }

  /* ---------------------------------------------------------
     DELETE RECORD
  --------------------------------------------------------- */

  async function deleteRecord(id) {
    if (!isAdmin) {
      UI.showToast("Viewer Mode: Delete disabled");
      return;
    }
    const confirmed = await UI.confirm(`Delete record #${id}?`);
    if (!confirmed) return;

    Database.remove(id);
    loadDb();
    refreshDatabaseTable();
    refreshDashboard();
    UI.showToast(`Record #${id} deleted.`);
  }

  /* ---------------------------------------------------------
     SEARCH / FILTER / SORT
  --------------------------------------------------------- */

  dbSearchInput.addEventListener("input", () => {
    page = 1;
    refreshDatabaseTable();
  });

  dbFilterSelect.addEventListener("change", () => {
    page = 1;
    refreshDatabaseTable();
  });

  dbApplyCustomBtn.addEventListener("click", () => {
    page = 1;
    refreshDatabaseTable();
  });

  selectAllCheckbox.addEventListener("change", () => {
    const checked = selectAllCheckbox.checked;
    dbTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.checked = checked;
    });
  });

  btnExportSelected.addEventListener("click", () => {
    const ids = Array.from(dbTableBody.querySelectorAll("input[type=checkbox]"))
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.dataset.id, 10));

    const selected = dbRecords.filter(r => ids.includes(r.id));
    if (selected.length === 0) {
      UI.showToast("No records selected.");
      return;
    }
    ExcelUtil.exportRecords(selected);
  });

  btnExportAll.addEventListener("click", () => {
    if (dbRecords.length === 0) {
      UI.showToast("No records to export.");
      return;
    }
    ExcelUtil.exportRecords(dbRecords);
  });

  pagePrevBtn.addEventListener("click", () => {
    if (page > 1) {
      page--;
      refreshDatabaseTable();
    }
  });

  pageNextBtn.addEventListener("click", () => {
    const list = applySearchFilterSort();
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (page < totalPages) {
      page++;
      refreshDatabaseTable();
    }
  });

  document.querySelectorAll("#dbTable thead th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (sortState.field === field) {
        sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
      } else {
        sortState.field = field;
        sortState.dir = "asc";
      }
      refreshDatabaseTable();
    });
  });

  /* ---------------------------------------------------------
     SETTINGS: BACKUP / RESTORE / CLEAR
  --------------------------------------------------------- */

  const btnBackup = document.getElementById("btnBackup");
  const btnRestore = document.getElementById("btnRestore");
  const restoreFileInput = document.getElementById("restoreFile");
  const btnClearDb = document.getElementById("btnClearDb");

  btnBackup.addEventListener("click", () => {
    const json = Database.backup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "steel_transmittal_backup.json";
    a.click();
    URL.revokeObjectURL(url);
    UI.showToast("Backup downloaded.");
  });

  btnRestore.addEventListener("click", () => {
    if (!isAdmin) {
      UI.showToast("Viewer Mode: Restore disabled");
      return;
    }
    const file = restoreFileInput.files[0];
    if (!file) {
      UI.showToast("Please select a JSON backup file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        Database.restore(e.target.result);
        loadDb();
        refreshDatabaseTable();
        refreshDashboard();
        UI.showToast("Database restored.");
      } catch (err) {
        UI.showToast(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  });

  btnClearDb.addEventListener("click", async () => {
    if (!isAdmin) {
      UI.showToast("Viewer Mode: Clear disabled");
      return;
    }
    const confirmed = await UI.confirm("Clear entire database?");
    if (!confirmed) return;

    Database.clear();
    loadDb();
    refreshDatabaseTable();
    refreshDashboard();
    UI.showToast("Database cleared.");
  });

    /* ---------------------------------------------------------
     GLOBAL SEARCH (TOP BAR)
  --------------------------------------------------------- */

  const globalSearchInput = document.getElementById("globalSearch");
  globalSearchInput.addEventListener("input", () => {
    dbSearchInput.value = globalSearchInput.value;
    UI.switchView("database");
    page = 1;
    refreshDatabaseTable();
  });

  /* ---------------------------------------------------------
     DATE HELPERS
  --------------------------------------------------------- */

  function formatToday() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${mon}/${year}`;
  }

  function parseDate(str) {
    // str: DD/MMM/YYYY
    const [day, monStr, year] = str.split("/");
    const months = {
      Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
      Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
    };
    const month = months[monStr] ?? 0;
    return new Date(parseInt(year,10), month, parseInt(day,10));
  }

  /* ---------------------------------------------------------
     DASHBOARD (FULL FIXED VERSION)
  --------------------------------------------------------- */

  function parseCustomDate(str) {
    if (!str) return null;
    const parts = str.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parts[1];
    const year = parseInt(parts[2]);

    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    return new Date(year, months[month], day);
  }

  function parseWeight(w) {
    if (!w) return 0;
    return parseFloat(w.toString().replace(/,/g, ""));
  }

  function refreshDashboard() {

    UI.renderDashboard(dbRecords);

    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long" });
    const year = now.getFullYear();
    const monthTag = `${monthName}-${year}`;

    document.getElementById("dashMonthName").textContent = monthTag;
    document.getElementById("dashMonthName2").textContent = monthTag;

    const isHL = r => r.type === "HL";
    const isMS = r => r.type === "MS";

    const monthIssued = dbRecords.filter(r => {
      const d = parseCustomDate(r.issuedDate);
      if (!d) return false;
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const hlIssued = monthIssued.filter(isHL);
    document.getElementById("hlIssuedQty").textContent = hlIssued.length;
    document.getElementById("hlIssuedWeight").textContent =
      hlIssued.reduce((t, r) => t + parseWeight(r.batchWeight), 0).toFixed(2);

    const msIssued = monthIssued.filter(isMS);
    document.getElementById("msIssuedQty").textContent = msIssued.length;
    document.getElementById("msIssuedWeight").textContent =
      msIssued.reduce((t, r) => t + parseWeight(r.batchWeight), 0).toFixed(2);

    const hlRecv = dbRecords.filter(isHL);
    const msRecv = dbRecords.filter(isMS);

    document.getElementById("hlRecvQty").textContent = hlRecv.length;
    document.getElementById("hlRecvWeight").textContent =
      hlRecv.reduce((t, r) => t + parseWeight(r.batchWeight), 0).toFixed(2);

    document.getElementById("msRecvQty").textContent = msRecv.length;
    document.getElementById("msRecvWeight").textContent =
      msRecv.reduce((t, r) => t + parseWeight(r.batchWeight), 0).toFixed(2);

    const hlBal = hlRecv.filter(r => r.issuedDate);
    const msBal = msRecv.filter(r => r.issuedDate);

    document.getElementById("hlBalQty").textContent = hlBal.length;
    document.getElementById("hlBalWeight").textContent =
      hlBal.reduce((t, r) => t + parseWeight(r.batchWeight), 0).toFixed(2);

    document.getElementById("msBalQty").textContent = msBal.length;
    document.getElementById("msBalWeight").textContent =
      msBal.reduce((t, r) => t + parseWeight(r.batchWeight), 0).toFixed(2);
  }

/* ---------------------------------------------------------
   OLD DATA IMPORT (Auto-detect headings + Preview + Validation)
--------------------------------------------------------- */

const oldDataArea = document.getElementById("oldDataArea");
const btnOldPreview = document.getElementById("btnOldPreview");
const btnOldDataStore = document.getElementById("btnOldDataStore");
const oldDataWarnings = document.getElementById("oldDataWarnings");
const oldPreviewTable = document.getElementById("oldPreviewTable");

const REQUIRED_HEADERS = [
  "Work Order",
  "Structure",
  "Batch No",
  "Transmittal No",
  "Shop Transmittal No",
  "Batch Weight",
  "Status",
  "Type",
  "Received Date",
  "Current Stage",
  "Issued Date",
  "MPS",
  "Fab",
  "QC",
  "Proj",
  "Remark",
  "Plate IFS No's",
  "Sec IFS No's",
  "Drawings Managed By"
];

/* -----------------------------
   AUTO-DETECT HEADERS
----------------------------- */
function detectHeaders(firstLine) {
  const cols = firstLine.split("\t").map(c => c.trim());
  const missing = REQUIRED_HEADERS.filter(h => !cols.includes(h));
  return { cols, missing };
}

/* -----------------------------
   VALIDATE DATE FORMAT
----------------------------- */
function isValidDate(str) {
  // Accept formats like: 3/Jan/2026
  return /^[0-9]{1,2}\/[A-Za-z]{3}\/[0-9]{4}$/.test(str.trim());
}

/* -----------------------------
   PREVIEW OLD DATA
----------------------------- */
btnOldPreview.addEventListener("click", () => {
  const raw = oldDataArea.value.trim();
  if (!raw) {
    UI.showToast("Paste old data first.");
    return;
  }

  const lines = raw.split("\n").filter(l => l.trim() !== "");
  const headerLine = lines[0];

  const { cols: headers, missing } = detectHeaders(headerLine);

  oldDataWarnings.innerHTML = "";

  if (missing.length > 0) {
    oldDataWarnings.innerHTML = "Missing headers: " + missing.join(", ");
    UI.showToast("Header validation failed.");
    return;
  }

  // Render preview header
  oldPreviewTable.querySelector("thead").innerHTML =
    "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";

  const tbody = oldPreviewTable.querySelector("tbody");
  tbody.innerHTML = "";

  // Render preview rows
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const tr = document.createElement("tr");

    cols.forEach((c, idx) => {
      const td = document.createElement("td");
      td.textContent = c.trim();

      // Validate date columns
      if (headers[idx] === "Received Date" || headers[idx] === "Issued Date") {
        if (!isValidDate(c)) {
          td.style.background = "#ffcccc";
        }
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  UI.showToast("Preview generated.");
});

/* -----------------------------
   STORE OLD DATA INTO DATABASE
----------------------------- */
btnOldDataStore.addEventListener("click", () => {
  if (!isAdmin) {
    UI.showToast("Viewer Mode: Old Data Store disabled");
    return;
  }

  const raw = oldDataArea.value.trim();
  if (!raw) {
    UI.showToast("Paste old data first.");
    return;
  }

  const lines = raw.split("\n").filter(l => l.trim() !== "");
  const headerLine = lines[0];

  const { cols: headers, missing } = detectHeaders(headerLine);

  if (missing.length > 0) {
    UI.showToast("Cannot store: Missing headers.");
    return;
  }

  let stored = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");

    const rec = {};

    headers.forEach((h, idx) => {
      rec[h] = cols[idx] ? cols[idx].trim() : "";
    });

    // Convert to database format
    const dbRec = {
      workOrder: rec["Work Order"],
      structure: rec["Structure"],
      batchNo: rec["Batch No"],
      transmittalNo: rec["Transmittal No"],
      shopTransmittalNo: rec["Shop Transmittal No"],
      batchWeight: rec["Batch Weight"],
      status: rec["Status"],
      type: rec["Type"],
      receivedDate: rec["Received Date"],
      extra1: rec["Current Stage"],
      extra2: rec["Issued Date"],
      extra3: rec["MPS"],
      extra4: rec["Fab"],
      extra5: rec["QC"],
      extra6: rec["Proj"],
      extra7: rec["Remark"],
      extra8: rec["Plate IFS No's"],
      extra9: rec["Sec IFS No's"],
      extra10: rec["Drawings Managed By"]

      
    };

    Database.add(dbRec);
    stored++;
  }

  loadDb();
  refreshDatabaseTable();
  refreshDashboard();

  UI.showToast(`${stored} old records stored.`);
});

  /* ---------------------------------------------------------
     INITIAL LOAD
  --------------------------------------------------------- */

  loadDb();
  refreshDashboard();

})();

