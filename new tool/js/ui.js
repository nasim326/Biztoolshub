// ui.js
// UI helpers: toast, loading, confirm dialog, view switching, table rendering.

const UI = (() => {
  const toastEl = document.getElementById("toast");
  const loadingEl = document.getElementById("loadingOverlay");
  const confirmDialogEl = document.getElementById("confirmDialog");
  const confirmMessageEl = document.getElementById("confirmMessage");
  const confirmYesBtn = document.getElementById("confirmYes");
  const confirmNoBtn = document.getElementById("confirmNo");

  let confirmResolve = null;

  function showToast(message, duration = 2500) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, duration);
  }

  function showLoading() {
    loadingEl.classList.remove("hidden");
  }

  function hideLoading() {
    loadingEl.classList.add("hidden");
  }

  function confirm(message) {
    confirmMessageEl.textContent = message;
    confirmDialogEl.classList.remove("hidden");
    return new Promise(resolve => {
      confirmResolve = resolve;
    });
  }

  confirmYesBtn.addEventListener("click", () => {
    confirmDialogEl.classList.add("hidden");
    if (confirmResolve) confirmResolve(true);
  });

  confirmNoBtn.addEventListener("click", () => {
    confirmDialogEl.classList.add("hidden");
    if (confirmResolve) confirmResolve(false);
  });

  function switchView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(`view-${viewId}`).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });
  }

  function renderPreview(record) {
    const tbody = document.querySelector("#previewTable tbody");
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    [
      record.workOrder,
      record.structure,
      record.batchNo,
      record.transmittalNo,
      record.shopTransmittalNo,
      record.batchWeight,
      record.status,
      record.type,
      record.receivedDate
    ].forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  function renderWarnings(warnings) {
    const el = document.getElementById("parseWarnings");
    if (!warnings || warnings.length === 0) {
      el.textContent = "";
      return;
    }
    el.innerHTML = warnings.map(w => `• ${w}`).join("<br>");
  }

  function renderDashboard(records) {
    const totalRecords = records.length;
    const todayStr = formatToday();
    const todayRecords = records.filter(r => r.receivedDate === todayStr).length;
    const totalWeight = records.reduce((sum, r) => sum + parseFloat(r.batchWeight || 0), 0);
    const latest = records.slice().sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime))[0];

    document.getElementById("card-total-records").textContent = totalRecords;
    document.getElementById("card-today-records").textContent = todayRecords;
    document.getElementById("card-total-weight").textContent = totalWeight.toFixed(3);
    document.getElementById("card-latest-entry").textContent = latest
      ? `${latest.workOrder} / ${latest.structure} / ${latest.batchNo}`
      : "—";
  }

  function formatToday() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${mon}/${year}`;
  }

  return {
    showToast,
    showLoading,
    hideLoading,
    confirm,
    switchView,
    renderPreview,
    renderWarnings,
    renderDashboard
  };
})();
