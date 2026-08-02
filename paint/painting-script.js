// painting-script.js
// Industrial Painting & Blasting Productivity Calculator
// Vanilla ES6, modular, with embedded productivity “database” (formerly productivity.json)

// ============================================================================
// PRODUCTIVITY DATABASE (embedded JSON)
// ============================================================================

const productivityDb = {
  blastingProductivity: {
    "Dry Abrasive": {
      "very-slow": 6,
      "slow": 10,
      "normal": 15,
      "fast": 20
    },
    "Wet Blasting": {
      "very-slow": 4,
      "slow": 8,
      "normal": 12,
      "fast": 16
    },
    "Shot Blasting": {
      "very-slow": 12,
      "slow": 18,
      "normal": 25,
      "fast": 32
    },
    "Grit Blasting": {
      "very-slow": 8,
      "slow": 12,
      "normal": 18,
      "fast": 24
    }
  },
  paintingProductivity: {
    "Airless Spray": {
      primer: 20,
      intermediate: 18,
      finish: 16
    },
    "Conventional Spray": {
      primer: 14,
      intermediate: 12,
      finish: 10
    },
    Brush: {
      primer: 6,
      intermediate: 5,
      finish: 4
    },
    Roller: {
      primer: 10,
      intermediate: 9,
      finish: 8
    },
    "Plural Component": {
      primer: 22,
      intermediate: 20,
      finish: 18
    }
  },
  coverageRates: {
    default: 6.5,
    highSolids: 5.5,
    lowSolids: 7.5
  },
  transferEfficiency: {
    "Airless Spray": 0.65,
    "Conventional Spray": 0.5,
    Brush: 0.9,
    Roller: 0.8,
    "Plural Component": 0.7
  },
  crewProductivity: {
    baseCrewSize: 3,
    crewFactorPerPerson: 1.0
  },
  weatherAdjustments: {
    humidity: {
      high: 0.85,
      medium: 0.95,
      low: 1.0
    },
    temperature: {
      low: 0.9,
      normal: 1.0,
      high: 0.95
    },
    wind: {
      high: 0.9,
      medium: 0.95,
      low: 1.0
    }
  }
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

const appState = {
  productivityDb,
  charts: {
    hoursChart: null,
    costChart: null,
    paintChart: null
  },
  lastResult: null
};

// ============================================================================
// UTILITY: ANIMATED COUNTER
// ============================================================================

function animateValue(el, start, end, duration = 400) {
  const range = end - start;
  if (range === 0) {
    el.textContent = end.toFixed ? end.toFixed(2) : end;
    return;
  }
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = start + range * progress;
    el.textContent = Number.isFinite(value) ? value.toFixed(2) : "0";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ============================================================================
// SURFACE AREA MODULE
// ============================================================================

const SurfaceAreaModule = (() => {
  function calcPressureVesselArea(diameter, length, heads, headType) {
    const pi = Math.PI;
    const radius = diameter / 2;
    const shellArea = pi * diameter * length;
    let headArea = 0;
    if (headType === "Hemispherical") {
      headArea = 2 * pi * Math.pow(radius, 2);
    } else if (headType === "Elliptical") {
      headArea = 1.7 * pi * Math.pow(radius, 2);
    } else {
      headArea = pi * Math.pow(radius, 2);
    }
    return shellArea + heads * headArea;
  }

  function calcStorageTankArea(diameter, height, roofType) {
    const pi = Math.PI;
    const radius = diameter / 2;
    const shellArea = pi * diameter * height;
    let roofArea = 0;
    if (roofType === "Flat") {
      roofArea = pi * Math.pow(radius, 2);
    } else if (roofType === "Conical") {
      roofArea = 1.05 * pi * Math.pow(radius, 2);
    } else {
      roofArea = 1.1 * pi * Math.pow(radius, 2);
    }
    const bottomArea = pi * Math.pow(radius, 2);
    return shellArea + roofArea + bottomArea;
  }

  function calcPipeArea(od, length, qty) {
    const pi = Math.PI;
    return pi * od * length * qty;
  }

  function calcSteelStructureArea(weightTons, factor) {
    return weightTons * factor;
  }

  function getSurfaceArea() {
    const method = document.getElementById("surfaceCalcMethod").value;
    if (method === "manual") {
      const val = parseFloat(document.getElementById("manualSurfaceArea").value || "0");
      return Math.max(val, 0);
    }

    const eqType = document.getElementById("equipmentType").value;
    let area = 0;

    switch (eqType) {
      case "Pressure Vessel": {
        const d = parseFloat(document.getElementById("pvDiameter").value || "0");
        const l = parseFloat(document.getElementById("pvLength").value || "0");
        const h = parseFloat(document.getElementById("pvHeads").value || "0");
        const ht = document.getElementById("pvHeadType").value;
        area = calcPressureVesselArea(d, l, h, ht);
        break;
      }
      case "Storage Tank": {
        const d = parseFloat(document.getElementById("stDiameter").value || "0");
        const h = parseFloat(document.getElementById("stHeight").value || "0");
        const rt = document.getElementById("stRoofType").value;
        area = calcStorageTankArea(d, h, rt);
        break;
      }
      case "Pipe Spool":
      case "Pipeline": {
        const od = parseFloat(document.getElementById("pipeOD").value || "0");
        const l = parseFloat(document.getElementById("pipeLength").value || "0");
        const q = parseFloat(document.getElementById("pipeQty").value || "0");
        area = calcPipeArea(od, l, q);
        break;
      }
      case "Steel Structure": {
        const w = parseFloat(document.getElementById("ssWeight").value || "0");
        const f = parseFloat(document.getElementById("ssAreaFactor").value || "0");
        area = calcSteelStructureArea(w, f);
        break;
      }
      default:
        area = parseFloat(document.getElementById("manualSurfaceArea").value || "0");
    }

    return Math.max(area, 0);
  }

  return { getSurfaceArea };
})();

// ============================================================================
// BLASTING MODULE
// ============================================================================

const BlastingModule = (() => {
  function getBlastingProductivity(surfaceArea) {
    const include = document.getElementById("includeBlasting").checked;
    if (!include || surfaceArea <= 0) return { prod: 0, hours: 0 };

    const method = document.getElementById("blastingMethod").value;
    const level = document.getElementById("blastingProductivity").value;

    let prod = 0;
    if (level === "custom") {
      prod = parseFloat(document.getElementById("customBlastingProd").value || "0");
    } else {
      const db = appState.productivityDb.blastingProductivity;
      if (db[method] && db[method][level]) {
        prod = db[method][level];
      }
    }

    prod = Math.max(prod, 0);
    const hours = prod > 0 ? surfaceArea / prod : 0;
    return { prod, hours };
  }

  function calcAbrasiveConsumption(surfaceArea) {
    const include = document.getElementById("includeBlasting").checked;
    if (!include || surfaceArea <= 0) return 0;
    const baseRate = 0.03; // ton/m² (tunable)
    return surfaceArea * baseRate;
  }

  return { getBlastingProductivity, calcAbrasiveConsumption };
})();

// ============================================================================
// PAINTING MODULE
// ============================================================================

const PaintingModule = (() => {
  function getPaintingProductivity(surfaceArea) {
    const include = document.getElementById("includePainting").checked;
    if (!include || surfaceArea <= 0) {
      return {
        primerProd: 0,
        intermediateProd: 0,
        finishProd: 0,
        primerHours: 0,
        intermediateHours: 0,
        finishHours: 0,
        totalHours: 0
      };
    }

    const method = document.getElementById("paintingMethod").value;
    const primerCoats = parseFloat(document.getElementById("primerCoats").value || "0");
    const intermediateCoats = parseFloat(document.getElementById("intermediateCoats").value || "0");
    const finishCoats = parseFloat(document.getElementById("finishCoats").value || "0");

    const db = appState.productivityDb.paintingProductivity;
    let primerProd = 0, intermediateProd = 0, finishProd = 0;

    if (db && db[method]) {
      primerProd = db[method].primer || 0;
      intermediateProd = db[method].intermediate || 0;
      finishProd = db[method].finish || 0;
    }

    const primerHours = primerProd > 0 ? (surfaceArea / primerProd) * primerCoats : 0;
    const intermediateHours = intermediateProd > 0 ? (surfaceArea / intermediateProd) * intermediateCoats : 0;
    const finishHours = finishProd > 0 ? (surfaceArea / finishProd) * finishCoats : 0;

    const totalHours = primerHours + intermediateHours + finishHours;

    return {
      primerProd,
      intermediateProd,
      finishProd,
      primerHours,
      intermediateHours,
      finishHours,
      totalHours
    };
  }

  function calcPaintConsumption(surfaceArea) {
    const include = document.getElementById("includePainting").checked;
    if (!include || surfaceArea <= 0) {
      return {
        primer: 0,
        intermediate: 0,
        finish: 0,
        total: 0,
        wastage: 0,
        transferLoss: 0
      };
    }

    const primerCoats = parseFloat(document.getElementById("primerCoats").value || "0");
    const intermediateCoats = parseFloat(document.getElementById("intermediateCoats").value || "0");
    const finishCoats = parseFloat(document.getElementById("finishCoats").value || "0");
    const dftPerCoat = parseFloat(document.getElementById("dftPerCoat").value || "0"); // µm
    const solidVolume = parseFloat(document.getElementById("solidVolume").value || "0"); // %
    const transferEfficiencyInput = parseFloat(document.getElementById("transferEfficiency").value || "0");
    const method = document.getElementById("paintingMethod").value;

    const coverageInput = parseFloat(document.getElementById("coverageRate").value || "0");
    let coverageRate = coverageInput || appState.productivityDb.coverageRates.default;

    const sv = solidVolume > 0 ? solidVolume / 100 : 0.5;
    const teDb = appState.productivityDb.transferEfficiency;
    const teMethod = teDb[method] || transferEfficiencyInput || 0.6;

    const totalCoats = primerCoats + intermediateCoats + finishCoats;
    const theoreticalLitresPerCoat =
      coverageRate > 0 && sv > 0
        ? (surfaceArea * (dftPerCoat / 1000)) / (sv * coverageRate)
        : 0;

    const primerQty = theoreticalLitresPerCoat * primerCoats / teMethod;
    const intermediateQty = theoreticalLitresPerCoat * intermediateCoats / teMethod;
    const finishQty = theoreticalLitresPerCoat * finishCoats / teMethod;

    const totalPaint = primerQty + intermediateQty + finishQty;

    const transferLoss = totalPaint * (1 - teMethod);
    const wastage = totalPaint * 0.05;

    return {
      primer: primerQty,
      intermediate: intermediateQty,
      finish: finishQty,
      total: totalPaint,
      wastage,
      transferLoss
    };
  }

  return { getPaintingProductivity, calcPaintConsumption };
})();

// ============================================================================
// CREW & DURATION MODULE
// ============================================================================

const CrewModule = (() => {
  function getCrewSize() {
    const painters = parseFloat(document.getElementById("painters").value || "0");
    const blasters = parseFloat(document.getElementById("blasters").value || "0");
    const helpers = parseFloat(document.getElementById("helpers").value || "0");
    return Math.max(painters + blasters + helpers, 0);
  }

  function calcManHours(blastingHours, paintingHours) {
    const crewSize = getCrewSize();
    const productivityFactor = parseFloat(document.getElementById("productivityFactor").value || "1");
    const baseHours = blastingHours + paintingHours;
    const adjustedHours = baseHours / (productivityFactor || 1);
    const manHours = crewSize > 0 ? adjustedHours * crewSize : 0;
    return { crewSize, manHours, adjustedHours };
  }

  function calcDuration(adjustedHours) {
    const hoursPerDay = parseFloat(document.getElementById("hoursPerDay").value || "8");
    const includeWeather = document.getElementById("includeWeather").checked;
    let weatherFactor = 1;

    if (includeWeather) {
      const humidity = parseFloat(document.getElementById("humidity").value || "0");
      const temperature = parseFloat(document.getElementById("temperature").value || "0");
      const wind = parseFloat(document.getElementById("wind").value || "0");
      const manualFactor = parseFloat(document.getElementById("weatherFactor").value || "1");

      weatherFactor = manualFactor || 1;

      const wa = appState.productivityDb.weatherAdjustments;
      const humCat = humidity > 80 ? "high" : humidity > 60 ? "medium" : "low";
      const tempCat = temperature < 5 ? "low" : temperature > 35 ? "high" : "normal";
      const windCat = wind > 8 ? "high" : wind > 4 ? "medium" : "low";

      weatherFactor *= (wa.humidity[humCat] || 1);
      weatherFactor *= (wa.temperature[tempCat] || 1);
      weatherFactor *= (wa.wind[windCat] || 1);
    }

    const effectiveHours = adjustedHours / weatherFactor;
    const days = hoursPerDay > 0 ? effectiveHours / hoursPerDay : 0;
    return { days, effectiveHours };
  }

  return { getCrewSize, calcManHours, calcDuration };
})();

// ============================================================================
// COST MODULE
// ============================================================================

const CostModule = (() => {
  function calcCosts(manHours, paintQty, abrasiveQty, durationDays) {
    const labourRate = parseFloat(document.getElementById("labourRate").value || "0");
    const paintCostRate = parseFloat(document.getElementById("paintCost").value || "0");
    const abrasiveCostRate = parseFloat(document.getElementById("abrasiveCost").value || "0");
    const equipmentCostRate = parseFloat(document.getElementById("equipmentCost").value || "0");

    const labourCost = manHours * labourRate;
    const paintCost = paintQty * paintCostRate;
    const abrasiveCost = abrasiveQty * abrasiveCostRate;
    const equipmentCost = durationDays * equipmentCostRate;

    const totalCost = labourCost + paintCost + abrasiveCost + equipmentCost;

    return { labourCost, paintCost, abrasiveCost, equipmentCost, totalCost };
  }

  return { calcCosts };
})();

// ============================================================================
// PRODUCTIVITY MODULE (ORCHESTRATOR)
// ============================================================================

const ProductivityModule = (() => {
  function calculateAll() {
    const surfaceArea = SurfaceAreaModule.getSurfaceArea();

    const blasting = BlastingModule.getBlastingProductivity(surfaceArea);
    const blastingHours = blasting.hours;
    const abrasiveQty = BlastingModule.calcAbrasiveConsumption(surfaceArea);

    const painting = PaintingModule.getPaintingProductivity(surfaceArea);
    const paintingHours = painting.totalHours;
    const paintConsumption = PaintingModule.calcPaintConsumption(surfaceArea);

    const crewResult = CrewModule.calcManHours(blastingHours, paintingHours);
    const durationResult = CrewModule.calcDuration(crewResult.adjustedHours);

    const costs = CostModule.calcCosts(
      crewResult.manHours,
      paintConsumption.total,
      abrasiveQty,
      durationResult.days
    );

    const result = {
      surfaceArea,
      blastingHours,
      paintingHours,
      manHours: crewResult.manHours,
      crewSize: crewResult.crewSize,
      durationDays: durationResult.days,
      paintQty: paintConsumption.total,
      abrasiveQty,
      costs,
      paintConsumption,
      blastingProd: blasting.prod,
      paintingProd: painting
    };

    appState.lastResult = result;
    return result;
  }

  return { calculateAll };
})();

// ============================================================================
// UI & CHARTS
// ============================================================================

function updateKpiCards(result) {
  const map = [
    ["kpiSurfaceArea", result.surfaceArea],
    ["kpiBlastingHours", result.blastingHours],
    ["kpiPaintingHours", result.paintingHours],
    ["kpiManHours", result.manHours],
    ["kpiCrew", result.crewSize],
    ["kpiDuration", result.durationDays],
    ["kpiPaintQty", result.paintQty],
    ["kpiAbrasiveQty", result.abrasiveQty],
    ["kpiPaintCost", result.costs.paintCost],
    ["kpiLabourCost", result.costs.labourCost],
    ["kpiEquipmentCost", result.costs.equipmentCost],
    ["kpiTotalCost", result.costs.totalCost]
  ];

  map.forEach(([id, value]) => {
    const el = document.getElementById(id);
    const current = parseFloat(el.textContent || "0");
    animateValue(el, current, value || 0);
  });

  const pc = result.paintConsumption;
  animateValue(document.getElementById("matPrimer"), 0, pc.primer || 0);
  animateValue(document.getElementById("matIntermediate"), 0, pc.intermediate || 0);
  animateValue(document.getElementById("matFinish"), 0, pc.finish || 0);
  animateValue(document.getElementById("matTotalPaint"), 0, pc.total || 0);
  animateValue(document.getElementById("matAbrasive"), 0, result.abrasiveQty || 0);
  animateValue(document.getElementById("matWastage"), 0, pc.wastage || 0);
  animateValue(document.getElementById("matTransferLoss"), 0, pc.transferLoss || 0);
}

function updateBreakdownTable(result) {
  const tbody = document.getElementById("breakdownBody");
  tbody.innerHTML = "";

  const rows = [];

  if (result.blastingHours > 0) {
    rows.push({
      op: "Blasting",
      area: result.surfaceArea,
      prod: result.blastingProd,
      hours: result.blastingHours,
      crew: result.crewSize,
      cost: result.costs.labourCost * (result.blastingHours / (result.blastingHours + result.paintingHours || 1))
    });
  }

  if (result.paintingHours > 0) {
    rows.push({
      op: "Painting",
      area: result.surfaceArea,
      prod: result.paintingProd.primerProd || result.paintingProd.finishProd,
      hours: result.paintingHours,
      crew: result.crewSize,
      cost: result.costs.labourCost * (result.paintingHours / (result.blastingHours + result.paintingHours || 1))
    });
  }

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.op}</td>
      <td>${r.area.toFixed(2)}</td>
      <td>${r.prod.toFixed(2)}</td>
      <td>${r.hours.toFixed(2)}</td>
      <td>${r.crew}</td>
      <td>${r.cost.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initCharts() {
  const hoursCtx = document.getElementById("hoursChart").getContext("2d");
  const costCtx = document.getElementById("costChart").getContext("2d");
  const paintCtx = document.getElementById("paintChart").getContext("2d");

  appState.charts.hoursChart = new Chart(hoursCtx, {
    type: "pie",
    data: {
      labels: ["Blasting", "Painting"],
      datasets: [{
        data: [0, 0],
        backgroundColor: ["#1f4f96", "#4b6fae"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  appState.charts.costChart = new Chart(costCtx, {
    type: "bar",
    data: {
      labels: ["Labour", "Paint", "Abrasive", "Equipment"],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ["#1f4f96", "#4b6fae", "#6b7280", "#10b981"]
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  appState.charts.paintChart = new Chart(paintCtx, {
    type: "doughnut",
    data: {
      labels: ["Primer", "Intermediate", "Finish"],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ["#1f4f96", "#4b6fae", "#6b7280"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function updateCharts(result) {
  const hc = appState.charts.hoursChart;
  const cc = appState.charts.costChart;
  const pc = appState.charts.paintChart;

  if (hc) {
    hc.data.datasets[0].data = [result.blastingHours || 0, result.paintingHours || 0];
    hc.update();
  }

  if (cc) {
    cc.data.datasets[0].data = [
      result.costs.labourCost || 0,
      result.costs.paintCost || 0,
      result.costs.abrasiveCost || 0,
      result.costs.equipmentCost || 0
    ];
    cc.update();
  }

  if (pc) {
    pc.data.datasets[0].data = [
      result.paintConsumption.primer || 0,
      result.paintConsumption.intermediate || 0,
      result.paintConsumption.finish || 0
    ];
    pc.update();
  }
}

// ============================================================================
// EXPORT / SAVE / LOAD
// ============================================================================

function exportJson() {
  if (!appState.lastResult) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.lastResult, null, 2));
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = "painting-estimate.json";
  a.click();
}

function saveProject() {
  if (!appState.lastResult) return;
  localStorage.setItem("paintingProject", JSON.stringify({
    meta: {
      projectName: document.getElementById("projectName").value,
      projectNumber: document.getElementById("projectNumber").value,
      clientName: document.getElementById("clientName").value,
      projectLocation: document.getElementById("projectLocation").value,
      estimatorName: document.getElementById("estimatorName").value,
      estimateDate: document.getElementById("estimateDate").value
    },
    result: appState.lastResult
  }));
  alert("Project saved.");
}

function loadProject() {
  const data = localStorage.getItem("paintingProject");
  if (!data) {
    alert("No saved project found.");
    return;
  }
  const obj = JSON.parse(data);
  const m = obj.meta;
  document.getElementById("projectName").value = m.projectName || "";
  document.getElementById("projectNumber").value = m.projectNumber || "";
  document.getElementById("clientName").value = m.clientName || "";
  document.getElementById("projectLocation").value = m.projectLocation || "";
  document.getElementById("estimatorName").value = m.estimatorName || "";
  document.getElementById("estimateDate").value = m.estimateDate || "";

  appState.lastResult = obj.result;
  updateKpiCards(obj.result);
  updateBreakdownTable(obj.result);
  updateCharts(obj.result);
  alert("Project loaded.");
}

function printReport() {
  window.print();
}

function exportPdf() {
  window.print();
}

function exportExcel() {
  if (!appState.lastResult) return;
  const rows = [
    ["Metric", "Value"],
    ["Surface Area (m²)", appState.lastResult.surfaceArea],
    ["Blasting Hours", appState.lastResult.blastingHours],
    ["Painting Hours", appState.lastResult.paintingHours],
    ["Man Hours", appState.lastResult.manHours],
    ["Crew Size", appState.lastResult.crewSize],
    ["Duration (days)", appState.lastResult.durationDays],
    ["Paint Qty (L)", appState.lastResult.paintQty],
    ["Abrasive Qty (tons)", appState.lastResult.abrasiveQty],
    ["Labour Cost", appState.lastResult.costs.labourCost],
    ["Paint Cost", appState.lastResult.costs.paintCost],
    ["Abrasive Cost", appState.lastResult.costs.abrasiveCost],
    ["Equipment Cost", appState.lastResult.costs.equipmentCost],
    ["Total Cost", appState.lastResult.costs.totalCost]
  ];

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "painting-estimate.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateInputs() {
  const errors = [];

  const eqType = document.getElementById("equipmentType").value;
  if (!eqType) errors.push("Equipment Type is required.");

  const method = document.getElementById("surfaceCalcMethod").value;
  if (method === "manual") {
    const val = parseFloat(document.getElementById("manualSurfaceArea").value || "0");
    if (val <= 0) errors.push("Manual Surface Area must be greater than zero.");
  }

  if (document.getElementById("includePainting").checked) {
    const dft = parseFloat(document.getElementById("dftPerCoat").value || "0");
    if (dft <= 0) errors.push("DFT per coat must be greater than zero for painting.");
  }

  if (document.getElementById("includeBlasting").checked) {
    const bp = document.getElementById("blastingProductivity").value;
    if (bp === "custom") {
      const cp = parseFloat(document.getElementById("customBlastingProd").value || "0");
      if (cp <= 0) errors.push("Custom blasting productivity must be greater than zero.");
    }
  }

  const labourRate = parseFloat(document.getElementById("labourRate").value || "0");
  if (labourRate < 0) errors.push("Labour rate cannot be negative.");

  if (errors.length) {
    alert("Validation errors:\n\n" + errors.join("\n"));
    return false;
  }
  return true;
}

// ============================================================================
// UI HELPERS
// ============================================================================

function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("toggleThemeBtn");
  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    btn.textContent = "Dark Mode";
  } else {
    body.classList.add("dark-theme");
    btn.textContent = "Light Mode";
  }
}

function resetForm() {
  document.querySelectorAll("input, select").forEach(el => {
    if (el.type === "checkbox") {
      el.checked = false;
    } else {
      el.value = "";
    }
  });
  document.getElementById("surfaceCalcMethod").value = "manual";
  document.getElementById("hoursPerDay").value = "8";
  document.getElementById("productivityFactor").value = "1.0";
  document.getElementById("transferEfficiency").value = "0.6";
  document.getElementById("includeBlasting").checked = false;
  document.getElementById("includePainting").checked = false;
  document.getElementById("includeWeather").checked = false;
  document.getElementById("blastingDetails").classList.add("hidden");
  document.getElementById("paintingDetails").classList.add("hidden");
  document.getElementById("weatherDetails").classList.add("hidden");
}

function handleCollapsibles() {
  document.querySelectorAll(".collapsible").forEach(card => {
    const btn = card.querySelector(".collapse-toggle");
    btn.addEventListener("click", () => {
      card.classList.toggle("collapsed");
    });
  });
}

function handleSurfaceMethodChange() {
  const methodSelect = document.getElementById("surfaceCalcMethod");
  methodSelect.addEventListener("change", () => {
    const method = methodSelect.value;
    const manualGroup = document.getElementById("manualSurfaceAreaGroup");
    const autoGroup = document.getElementById("autoSurfaceAreaGroup");
    if (method === "manual") {
      manualGroup.classList.remove("hidden");
      autoGroup.classList.add("hidden");
    } else {
      manualGroup.classList.add("hidden");
      autoGroup.classList.remove("hidden");
    }
  });
}

function handleEquipmentChange() {
  const eqSelect = document.getElementById("equipmentType");
  eqSelect.addEventListener("change", () => {
    const eq = eqSelect.value;
    document.querySelectorAll(".dimension-card").forEach(card => {
      const eqAttr = card.getAttribute("data-eq");
      const eqAlt = card.getAttribute("data-eq-alt");
      if (eqAttr === eq || eqAlt === eq) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });
}

function handleBlastingToggle() {
  const cb = document.getElementById("includeBlasting");
  const details = document.getElementById("blastingDetails");
  cb.addEventListener("change", () => {
    details.classList.toggle("hidden", !cb.checked);
  });

  const prodSelect = document.getElementById("blastingProductivity");
  const customGroup = document.getElementById("customBlastingProdGroup");
  prodSelect.addEventListener("change", () => {
    customGroup.classList.toggle("hidden", prodSelect.value !== "custom");
  });
}

function handlePaintingToggle() {
  const cb = document.getElementById("includePainting");
  const details = document.getElementById("paintingDetails");
  cb.addEventListener("change", () => {
    details.classList.toggle("hidden", !cb.checked);
  });
}

function handleWeatherToggle() {
  const cb = document.getElementById("includeWeather");
  const details = document.getElementById("weatherDetails");
  cb.addEventListener("change", () => {
    details.classList.toggle("hidden", !cb.checked);
  });
}

function handleSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.outline = term && text.includes(term) ? "2px solid #3b82f6" : "none";
    });
  });
}

// ============================================================================
// INIT
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  handleCollapsibles();
  handleSurfaceMethodChange();
  handleEquipmentChange();
  handleBlastingToggle();
  handlePaintingToggle();
  handleWeatherToggle();
  handleSearch();
  initCharts();

  document.getElementById("toggleThemeBtn").addEventListener("click", toggleTheme);
  document.getElementById("resetFormBtn").addEventListener("click", resetForm);

  document.getElementById("calculateBtn").addEventListener("click", () => {
    if (!validateInputs()) return;
    const result = ProductivityModule.calculateAll();
    updateKpiCards(result);
    updateBreakdownTable(result);
    updateCharts(result);
  });

  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("saveProjectBtn").addEventListener("click", saveProject);
  document.getElementById("loadProjectBtn").addEventListener("click", loadProject);
  document.getElementById("printReportBtn").addEventListener("click", printReport);
  document.getElementById("exportPdfBtn").addEventListener("click", exportPdf);
  document.getElementById("exportExcelBtn").addEventListener("click", exportExcel);
});
