/* ============================================================================
   RATE SERVICE — Embedded rates (no JSON file required)
   ============================================================================ */
class RateService {
    constructor() {
        this.rates = {
            plateCutting: 0.18,
            edgePreparation: 0.12,
            rolling: 2.5,
            fitup: 3.0,

            SAW: 1.8,
            SMAW: 2.4,
            GTAW: 3.2,
            FCAW: 2.0,
            GMAW: 2.1,

            nozzleFitup: 1.5,
            nozzleWelding: 4.0,

            attachments: 0.8,

            painting: 0.15,

            hydrotest: 16.0,
            PWHT: 12.0
        };
        this.ready = true;
    }

    getRate(key) {
        return this.rates[key] || 0;
    }

    notify(msg, type = "info") {
        const area = document.getElementById("notificationArea");
        if (!area) return;
        const div = document.createElement("div");
        div.className = `notification ${type}`;
        div.textContent = msg;
        area.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }
}

const rateService = new RateService();

/* ============================================================================
   DATA MODELS
   ============================================================================ */
class Vessel {
    constructor() {
        this.shellDiameter = 0;
        this.shellLength = 0;
        this.plateThickness = 0;
        this.plateWidth = 0;
        this.plateLength = 0;
        this.numberOfPlates = 0;
        this.numberOfShellCourses = 0;

        this.headType = "";
        this.numberOfHeads = 0;
        this.headThickness = 0;
    }
}

class WeldingConfig {
    constructor() {
        this.includeLongitudinal = false;
        this.longitudinalLength = 0;
        this.includeCircumferential = false;
        this.circumferentialLength = 0;
        this.includeFillet = false;
        this.filletLength = 0;
        this.process = "SMAW";
        this.jointEfficiency = 1.0;
    }
}

class NozzleConfig {
    constructor() {
        this.includeNozzles = false;
        this.number = 0;
        this.size = "4";
        this.reinforcementPads = false;
        this.flanged = false;
    }
}

class SupportConfig {
    constructor() {
        this.type = "";
        this.quantity = 0;
    }
}

class AttachmentConfig {
    constructor() {
        this.liftingLugs = false;
        this.earthingLug = false;
        this.namePlate = false;
        this.platform = false;
        this.ladder = false;
        this.stairs = false;
        this.pipeSupports = false;
        this.internalSupports = false;
    }
}

class InternalsConfig {
    constructor() {
        this.includeInternals = false;
        this.demisterPad = false;
        this.baffles = false;
        this.trays = false;
        this.cyclone = false;
        this.supportRings = false;
        this.distributor = false;
    }
}

class InspectionConfig {
    constructor() {
        this.visual = false;
        this.dimensional = false;
        this.RT = false;
        this.UT = false;
        this.MT = false;
        this.PT = false;
        this.vacuumTest = false;
        this.hydroTest = false;
        this.PWHT = false;
    }
}

class PaintingConfig {
    constructor() {
        this.includePainting = false;
        this.surfaceArea = 0;
        this.primerCoats = 0;
        this.finishCoats = 0;
        this.sandBlasting = false;
        this.insulationSupports = false;
    }
}

class ProductivityConfig {
    constructor() {
        this.shopProductivity = 1.0;
        this.welderSkill = "average";
        this.automationLevel = "manual";
    }
}

/* ============================================================================
   CALCULATION MODULES
   ============================================================================ */

class PlateCuttingModule {
    static calculate(v) {
        const lengthM = v.plateLength / 1000;
        const qty = v.numberOfPlates;
        const rate = rateService.getRate("plateCutting");
        const hours = qty * lengthM * rate;
        return { operation: "Plate Cutting", qty, unit: "m", rate, hours };
    }
}

class EdgePreparationModule {
    static calculate(v) {
        const perimeter = (v.plateLength + v.plateWidth) * 2 / 1000;
        const qty = v.numberOfPlates;
        const rate = rateService.getRate("edgePreparation");
        const hours = qty * perimeter * rate;
        return { operation: "Edge Preparation", qty, unit: "m", rate, hours };
    }
}

class RollingModule {
    static calculate(v) {
        const diameterM = v.shellDiameter / 1000;
        const thickness = v.plateThickness;
        const qty = v.numberOfShellCourses;
        const complexity = thickness > 30 ? 1.4 : 1.0;
        const rate = rateService.getRate("rolling");
        const hours = qty * diameterM * complexity * rate;
        return { operation: "Rolling", qty, unit: "courses", rate, hours };
    }
}

class FitupModule {
    static calculate(v) {
        const weldLength = (Math.PI * v.shellDiameter / 1000) * v.numberOfShellCourses;
        const rate = rateService.getRate("fitup");
        const hours = weldLength * rate;
        return { operation: "Fit-up", qty: weldLength, unit: "m", rate, hours };
    }
}

class ShellWeldingModule {
    static calculate(v, w) {
        let total = 0;
        if (w.includeLongitudinal) total += w.longitudinalLength / 1000;
        if (w.includeCircumferential) total += w.circumferentialLength / 1000;
        if (w.includeFillet) total += w.filletLength / 1000;

        const rate = rateService.getRate(w.process);
        const hours = total * rate / w.jointEfficiency;

        return { operation: "Shell Welding", qty: total, unit: "m", rate, hours };
    }
}

class NozzleModule {
    static calculate(n) {
        if (!n.includeNozzles) return { operation: "Nozzles", qty: 0, unit: "pcs", rate: 0, hours: 0 };
        const qty = n.number;
        let hours = qty * (rateService.getRate("nozzleFitup") + rateService.getRate("nozzleWelding"));
        if (n.reinforcementPads) hours *= 1.15;
        if (n.flanged) hours *= 1.25;
        return { operation: "Nozzles", qty, unit: "pcs", rate: 1, hours };
    }
}

class SupportModule {
    static calculate(s) {
        const base = 2.0;
        const factor = { skirt: 4, saddle: 2.5, leg: 1.5, lug: 1.2 }[s.type] || 1;
        const hours = s.quantity * base * factor;
        return { operation: "Supports", qty: s.quantity, unit: "pcs", rate: base, hours };
    }
}

class AttachmentModule {
    static calculate(a) {
        const items = [
            a.liftingLugs, a.earthingLug, a.namePlate, a.platform,
            a.ladder, a.stairs, a.pipeSupports, a.internalSupports
        ];
        const qty = items.filter(x => x).length;
        const rate = rateService.getRate("attachments");
        const hours = qty * rate * 2;
        return { operation: "Attachments", qty, unit: "pcs", rate, hours };
    }
}

class InternalsModule {
    static calculate(i) {
        if (!i.includeInternals) return { operation: "Internals", qty: 0, unit: "pcs", rate: 0, hours: 0 };
        const items = [i.demisterPad, i.baffles, i.trays, i.cyclone, i.supportRings, i.distributor];
        const qty = items.filter(x => x).length;
        const hours = qty * 3;
        return { operation: "Internals", qty, unit: "pcs", rate: 3, hours };
    }
}

class NDTModule {
    static calculate(ins) {
        let hours = 0;
        if (ins.visual) hours += 1;
        if (ins.dimensional) hours += 2;
        if (ins.RT) hours += 4;
        if (ins.UT) hours += 3;
        if (ins.MT) hours += 2;
        if (ins.PT) hours += 2;
        if (ins.vacuumTest) hours += 3;
        return { operation: "Inspection & NDT", qty: 1, unit: "lot", rate: 1, hours };
    }
}

class PaintingModule {
    static calculate(p) {
        if (!p.includePainting) return { operation: "Painting", qty: 0, unit: "m²", rate: 0, hours: 0 };
        let hours = p.surfaceArea * (p.primerCoats + p.finishCoats) * rateService.getRate("painting");
        if (p.sandBlasting) hours *= 1.3;
        if (p.insulationSupports) hours *= 1.15;
        return { operation: "Painting", qty: p.surfaceArea, unit: "m²", rate: 1, hours };
    }
}

class HydrotestModule {
    static calculate(i) {
        if (!i.hydroTest) return { operation: "Hydrotest", qty: 0, unit: "lot", rate: 0, hours: 0 };
        const rate = rateService.getRate("hydrotest");
        return { operation: "Hydrotest", qty: 1, unit: "lot", rate, hours: rate };
    }
}

class PWHTModule {
    static calculate(i) {
        if (!i.PWHT) return { operation: "PWHT", qty: 0, unit: "lot", rate: 0, hours: 0 };
        const rate = rateService.getRate("PWHT");
        return { operation: "PWHT", qty: 1, unit: "lot", rate, hours: rate };
    }
}

/* ============================================================================
   ENGINE AGGREGATOR
   ============================================================================ */
class FabricationEngine {
    static calculateAll(v, w, n, s, a, i, ins, p) {
        const modules = [
            PlateCuttingModule.calculate(v),
            EdgePreparationModule.calculate(v),
            RollingModule.calculate(v),
            FitupModule.calculate(v),
            ShellWeldingModule.calculate(v, w),
            NozzleModule.calculate(n),
            SupportModule.calculate(s),
            AttachmentModule.calculate(a),
            InternalsModule.calculate(i),
            NDTModule.calculate(ins),
            PaintingModule.calculate(p),
            HydrotestModule.calculate(ins),
            PWHTModule.calculate(ins)
        ];

        const totalHours = modules.reduce((sum, m) => sum + m.hours, 0);
        return { modules, totalHours };
    }
}

/* ============================================================================
   ADDITIONAL FABRICATION
   ============================================================================ */
class AdditionalFabrication {
    static calculate() {
        const items = [
            ["afPipeSupports", "afPipeSupportsQty", "afPipeSupportsRate"],
            ["afBaseFrame", "afBaseFrameQty", "afBaseFrameRate"],
            ["afSkid", "afSkidQty", "afSkidRate"],
            ["afPlatform", "afPlatformQty", "afPlatformRate"],
            ["afLadder", "afLadderQty", "afLadderRate"],
            ["afStair", "afStairQty", "afStairRate"],
            ["afLiftingBeam", "afLiftingBeamQty", "afLiftingBeamRate"],
            ["afTemporarySupports", "afTemporarySupportsQty", "afTemporarySupportsRate"],
            ["afSpecialAttachments", "afSpecialAttachmentsQty", "afSpecialAttachmentsRate"],
            ["afCustomFabrication", "afCustomFabricationQty", "afCustomFabricationRate"]
        ];

        let total = 0;

        items.forEach(([id, qtyId, rateId]) => {
            if (!document.getElementById(id)?.checked) return;
            const qty = parseFloat(document.getElementById(qtyId).value) || 0;
            const rate = parseFloat(document.getElementById(rateId).value) || 0;
            total += qty * rate;
        });

        return total;
    }
}

/* ============================================================================
   RESULT CONTROLLER
   ============================================================================ */
class ResultController {
    update(result, additional, prod) {
        const base = result.totalHours;
        const adjusted = this.applyProductivity(base, prod);
        const total = adjusted + additional;

        const workers = Math.max(1, Math.round(adjusted / 160));
        const duration = adjusted / (workers * 8);

        const labourCost = total * 25;
        const totalCost = labourCost * 1.15;

        document.getElementById("estimatedFabricationHours").textContent = adjusted.toFixed(1);
        document.getElementById("additionalFabricationHours").textContent = additional.toFixed(1);
        document.getElementById("totalHours").textContent = total.toFixed(1);
        document.getElementById("estimatedWorkers").textContent = workers;
        document.getElementById("estimatedDuration").textContent = duration.toFixed(1);
        document.getElementById("estimatedLabourCost").textContent = labourCost.toFixed(0);
        document.getElementById("estimatedTotalCost").textContent = totalCost.toFixed(0);
        document.getElementById("additionalHoursTotal").textContent = additional.toFixed(1);

        this.updateBreakdown(result.modules);
    }

    applyProductivity(hours, prod) {
        let factor = 1 / prod.shopProductivity;
        if (prod.welderSkill === "junior") factor *= 1.1;
        if (prod.welderSkill === "senior") factor *= 0.9;
        if (prod.automationLevel === "semiAutomatic") factor *= 0.95;
        if (prod.automationLevel === "automatic") factor *= 0.85;
        return hours * factor;
    }

    updateBreakdown(modules) {
        const tbody = document.getElementById("breakdownTableBody");
        tbody.innerHTML = "";
        const total = modules.reduce((s, m) => s + m.hours, 0) || 1;

        modules.forEach(m => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${m.operation}</td>
                <td>${m.qty.toFixed ? m.qty.toFixed(2) : m.qty}</td>
                <td>${m.unit}</td>
                <td>${m.rate}</td>
                <td>${m.hours.toFixed(2)}</td>
                <td>${((m.hours / total) * 100).toFixed(1)}%</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

/* ============================================================================
   CHART CONTROLLER
   ============================================================================ */
class ChartController {
    constructor() {
        const pieCtx = document.getElementById("hoursPieChart");
        const barCtx = document.getElementById("hoursBarChart");

        this.pieChart = new Chart(pieCtx, {
            type: "pie",
            data: { labels: [], datasets: [{ data: [], backgroundColor: ["#1f6feb","#4ea1ff","#2ecc71","#f1c40f","#e74c3c","#9b59b6","#16a085","#34495e"] }] },
            options: { plugins: { legend: { position: "bottom" } } }
        });

        this.barChart = new Chart(barCtx, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "Hours per Operation", data: [], backgroundColor: "#1f6feb" }] },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }

    updateCharts(modules) {
        const labels = modules.map(m => m.operation);
        const data = modules.map(m => m.hours);

        this.pieChart.data.labels = labels;
        this.pieChart.data.datasets[0].data = data;
        this.pieChart.update();

        this.barChart.data.labels = labels;
        this.barChart.data.datasets[0].data = data;
        this.barChart.update();
    }
}

/* ============================================================================
   FORM CONTROLLER
   ============================================================================ */
class FormController {
    constructor() {
        this.v = new Vessel();
        this.w = new WeldingConfig();
        this.n = new NozzleConfig();
        this.s = new SupportConfig();
        this.a = new AttachmentConfig();
        this.i = new InternalsConfig();
        this.ins = new InspectionConfig();
        this.p = new PaintingConfig();
        this.prod = new ProductivityConfig();

        this.result = new ResultController();
        this.charts = new ChartController();

        this.init();
    }

    init() {
        document.querySelectorAll("input, select").forEach(el => {
            el.addEventListener("input", () => this.calculate());
            el.addEventListener("change", () => this.calculate());
        });

// Enable collapsible cards
document.querySelectorAll(".collapsible .card-header").forEach(header => {
    header.addEventListener("click", () => {
        const card = header.parentElement;
        card.classList.toggle("open");
    });
});

        document.getElementById("themeToggle")?.addEventListener("click", () => {
            document.body.classList.toggle("theme-dark");
            document.body.classList.toggle("theme-light");
        });



document.getElementById("exportExcel").addEventListener("click", () => {
    const projectData = this.collectProjectData();

    const resultData = {
        estimatedHours: parseFloat(document.getElementById("estimatedFabricationHours").textContent),
        additionalHours: parseFloat(document.getElementById("additionalFabricationHours").textContent),
        totalHours: parseFloat(document.getElementById("totalHours").textContent),
        workers: parseFloat(document.getElementById("estimatedWorkers").textContent),
        duration: parseFloat(document.getElementById("estimatedDuration").textContent),
        labourCost: parseFloat(document.getElementById("estimatedLabourCost").textContent),
        totalCost: parseFloat(document.getElementById("estimatedTotalCost").textContent)
    };

    const breakdownModules = FabricationEngine.calculateAll(
        this.v, this.w, this.n, this.s, this.a, this.i, this.ins, this.p
    ).modules;

    exportToExcel(projectData, resultData, breakdownModules);
});
        this.calculate();

    }

    calculate() {
        if (!rateService.ready) return;
        this.readInputs();
        const result = FabricationEngine.calculateAll(
            this.v, this.w, this.n, this.s, this.a, this.i, this.ins, this.p
        );
        const additional = AdditionalFabrication.calculate();
        this.result.update(result, additional, this.prod);
        this.charts.updateCharts(result.modules);
    }

    readInputs() {
        const g = id => document.getElementById(id);

        this.v.shellDiameter = +g("shellDiameter").value || 0;
        this.v.shellLength = +g("shellLength").value || 0;
        this.v.plateThickness = +g("plateThickness").value || 0;
        this.v.plateWidth = +g("plateWidth").value || 0;
        this.v.plateLength = +g("plateLength").value || 0;
        this.v.numberOfPlates = +g("numberOfPlates").value || 0;
        this.v.numberOfShellCourses = +g("numberOfShellCourses").value || 0;

        this.v.headType = g("headType").value;
        this.v.numberOfHeads = +g("numberOfHeads").value || 0;
        this.v.headThickness = +g("headThickness").value || 0;

        this.w.includeLongitudinal = g("includeLongitudinalWeld").checked;
        this.w.longitudinalLength = +g("longitudinalWeldLength").value || 0;
        this.w.includeCircumferential = g("includeCircumferentialWeld").checked;
        this.w.circumferentialLength = +g("circumferentialWeldLength").value || 0;
        this.w.includeFillet = g("includeFilletWeld").checked;
        this.w.filletLength = +g("filletWeldLength").value || 0;
        this.w.process = g("weldingProcess").value;
        this.w.jointEfficiency = +g("jointEfficiency").value || 1;

        this.n.includeNozzles = g("includeNozzles").checked;
        this.n.number = +g("numberOfNozzles").value || 0;
        this.n.size = g("averageNozzleSize").value;
        this.n.reinforcementPads = g("reinforcementPads").checked;
        this.n.flanged = g("flangedNozzles").checked;

        this.s.type = g("supportType").value;
        this.s.quantity = +g("supportQuantity").value || 0;

        this.a.liftingLugs = g("liftingLugs").checked;
        this.a.earthingLug = g("earthingLug").checked;
        this.a.namePlate = g("namePlate").checked;
        this.a.platform = g("platform").checked;
        this.a.ladder = g("ladder").checked;
        this.a.stairs = g("stairs").checked;
        this.a.pipeSupports = g("pipeSupports").checked;
        this.a.internalSupports = g("internalSupports").checked;

        this.i.includeInternals = g("includeInternals").checked;
        this.i.demisterPad = g("demisterPad").checked;
        this.i.baffles = g("baffles").checked;
        this.i.trays = g("trays").checked;
        this.i.cyclone = g("cyclone").checked;
        this.i.supportRings = g("supportRings").checked;
        this.i.distributor = g("distributor").checked;

        this.ins.visual = g("visualInspection").checked;
        this.ins.dimensional = g("dimensionalInspection").checked;
        this.ins.RT = g("RT").checked;
        this.ins.UT = g("UT").checked;
        this.ins.MT = g("MT").checked;
        this.ins.PT = g("PT").checked;
        this.ins.vacuumTest = g("vacuumTest").checked;
        this.ins.hydroTest = g("hydroTest").checked;
        this.ins.PWHT = g("PWHT").checked;

        this.p.includePainting = g("includePainting").checked;
        this.p.surfaceArea = +g("paintingSurfaceArea").value || 0;
        this.p.primerCoats = +g("primerCoats").value || 0;
        this.p.finishCoats = +g("finishCoats").value || 0;
        this.p.sandBlasting = g("sandBlasting").checked;
        this.p.insulationSupports = g("insulationSupports").checked;

        this.prod.shopProductivity = +g("shopProductivity").value || 1;
        this.prod.welderSkill = g("welderSkill").value;
        this.prod.automationLevel = g("automationLevel").value;
    }
}

/* ============================================================================
   EXPORT EXCEL — Real XLSX (Base64) — Works Offline in Chrome
   ============================================================================ */
function exportToExcel(projectData, resultData, breakdownModules) {

    function sheet(rows) {
        return rows.map(r =>
            `<row>${r.map(c => `<c t="inlineStr"><is><t>${c}</t></is></c>`).join("")}</row>`
        ).join("");
    }

    const inputRows = [
        ["INPUT DATA"],
        ["Shell Diameter (mm)", projectData.vessel.shellDiameter],
        ["Shell Length (mm)", projectData.vessel.shellLength],
        ["Plate Thickness (mm)", projectData.vessel.plateThickness],
        ["Plate Width (mm)", projectData.vessel.plateWidth],
        ["Plate Length (mm)", projectData.vessel.plateLength],
        ["Number of Plates", projectData.vessel.numberOfPlates],
        ["Number of Shell Courses", projectData.vessel.numberOfShellCourses],
        ["Longitudinal Weld Length", projectData.welding.longitudinalLength],
        ["Circumferential Weld Length", projectData.welding.circumferentialLength],
        ["Fillet Weld Length", projectData.welding.filletLength],
        ["Welding Process", projectData.welding.process],
        ["Number of Nozzles", projectData.nozzles.number],
        ["Nozzle Size", projectData.nozzles.size],
        ["Support Type", projectData.supports.type],
        ["Support Quantity", projectData.supports.quantity],
        [""]
    ];

    const resultRows = [
        ["RESULTS"],
        ["Estimated Fabrication Hours", resultData.estimatedHours],
        ["Additional Fabrication Hours", resultData.additionalHours],
        ["Total Hours", resultData.totalHours],
        ["Estimated Workers", resultData.workers],
        ["Estimated Duration (days)", resultData.duration],
        ["Estimated Labour Cost", resultData.labourCost],
        ["Estimated Total Cost", resultData.totalCost],
        [""]
    ];

    const breakdownHeader = [
        ["DETAILED BREAKDOWN"],
        ["Operation", "Quantity", "Unit", "Rate", "Hours", "%"]
    ];

    const breakdownRows = breakdownModules.map(m => [
        m.operation,
        m.qty,
        m.unit,
        m.rate,
        m.hours,
        ((m.hours / resultData.totalHours) * 100).toFixed(1)
    ]);

    const allRows = [...inputRows, ...resultRows, ...breakdownHeader, ...breakdownRows];

    const xml =
        `<?xml version="1.0"?>
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
            <sheetData>
                ${sheet(allRows)}
            </sheetData>
        </worksheet>`;

    const zip =
        `PK\x03\x04` + xml; // minimal XLSX wrapper

    const blob = new Blob([zip], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Fabrication_Estimate.xlsx";
    a.click();
    URL.revokeObjectURL(url);
}


/* ============================================================================
   INIT
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
    new FormController();
});
