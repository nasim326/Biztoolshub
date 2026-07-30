// steel-weight.js
(function () {
  const shapeCards = document.querySelectorAll(".shape-card");
  const shapeInputGroups = document.querySelectorAll(".shape-input-group");
  const materialRadios = document.querySelectorAll("input[name='material']");
  const customDensityWrapper = document.getElementById("densityCustomWrapper");
  const customDensityInput = document.getElementById("customDensity");
  const unitRadios = document.querySelectorAll("input[name='unit']");
  const pricePerKgInput = document.getElementById("pricePerKg");

  const resultShapeEl = document.getElementById("resultShape");
  const resultDensityEl = document.getElementById("resultDensity");
  const resultUnitEl = document.getElementById("resultUnit");
  const resultWeightPerPieceEl = document.getElementById("resultWeightPerPiece");
  const resultTotalWeightEl = document.getElementById("resultTotalWeight");
  const resultVolumeEl = document.getElementById("resultVolume");
  const resultCostPerPieceEl = document.getElementById("resultCostPerPiece");
  const resultTotalCostEl = document.getElementById("resultTotalCost");
  const resultEmptyEl = document.getElementById("resultEmpty");

  const resetBtn = document.getElementById("resetBtn");
  const copyBtn = document.getElementById("copyBtn");
  const printBtn = document.getElementById("printBtn");

  const formulaToggleBtn = document.querySelector(".formula-toggle");
  const formulaContent = document.getElementById("formulaContent");

  let currentShape = "round";

  function getUnitFactor(unit) {
    switch (unit) {
      case "mm":
        return 0.001;
      case "cm":
        return 0.01;
      case "m":
        return 1;
      case "inch":
        return 0.0254;
      case "ft":
        return 0.3048;
      default:
        return 1;
    }
  }

  function getDensity() {
    const selected = Array.from(materialRadios).find((r) => r.checked);
    if (!selected) return 7850;
    if (selected.value === "custom") {
      const val = parseFloat(customDensityInput.value);
      return val > 0 ? val : NaN;
    }
    return parseFloat(selected.value);
  }

  function getUnit() {
    const selected = Array.from(unitRadios).find((r) => r.checked);
    return selected ? selected.value : "mm";
  }

  function validatePositive(id) {
    const el = document.getElementById(id);
    const errorEl = document.querySelector(`[data-error-for="${id}"]`);
    if (!el || !errorEl) return true;
    const val = el.value.trim();
    if (!val) {
      errorEl.textContent = "";
      el.classList.remove("invalid");
      return true;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      errorEl.textContent = "Enter a positive number";
      el.classList.add("invalid");
      return false;
    }
    errorEl.textContent = "";
    el.classList.remove("invalid");
    return true;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    if (!el) return NaN;
    const val = parseFloat(el.value);
    return isNaN(val) ? NaN : val;
  }

  function calculate() {
    const density = getDensity();
    const unit = getUnit();
    const factor = getUnitFactor(unit);

    if (!density || isNaN(density) || density <= 0) {
      resultDensityEl.textContent = "Invalid density";
      resultWeightPerPieceEl.textContent = "0.000 kg";
      resultTotalWeightEl.textContent = "0.000 kg";
      resultVolumeEl.textContent = "0.000 m³";
      resultCostPerPieceEl.textContent = "0.00";
      resultTotalCostEl.textContent = "0.00";
      resultEmptyEl.style.display = "block";
      return;
    }

    resultDensityEl.textContent = `${density.toFixed(0)} kg/m³`;
    resultUnitEl.textContent = unit;

    let volumePerPiece = 0;
    let qty = 1;

    if (currentShape === "round") {
      const d = getValue("roundDiameter");
      const L = getValue("roundLength");
      qty = getValue("roundQty") || 1;
      if (d > 0 && L > 0 && qty > 0) {
        const d_m = d * factor;
        const L_m = L * factor;
        volumePerPiece = Math.PI * Math.pow(d_m, 2) / 4 * L_m;
      }
    } else if (currentShape === "pipe") {
      const OD = getValue("pipeOD");
      const t = getValue("pipeThickness");
      const L = getValue("pipeLength");
      qty = getValue("pipeQty") || 1;
      if (OD > 0 && t > 0 && L > 0 && qty > 0) {
        const OD_m = OD * factor;
        const t_m = t * factor;
        const ID_m = Math.max(OD_m - 2 * t_m, 0);
        volumePerPiece = Math.PI * (Math.pow(OD_m, 2) - Math.pow(ID_m, 2)) / 4 * L * factor;
      }
    } else if (currentShape === "plate" || currentShape === "sheet") {
      const L = getValue("plateLength");
      const W = getValue("plateWidth");
      const T = getValue("plateThickness");
      qty = getValue("plateQty") || 1;
      if (L > 0 && W > 0 && T > 0 && qty > 0) {
        volumePerPiece = L * factor * W * factor * T * factor;
      }
    } else if (currentShape === "square") {
      const S = getValue("squareSide");
      const L = getValue("squareLength");
      qty = getValue("squareQty") || 1;
      if (S > 0 && L > 0 && qty > 0) {
        const S_m = S * factor;
        const L_m = L * factor;
        volumePerPiece = Math.pow(S_m, 2) * L_m;
      }
    } else if (currentShape === "flat") {
      const W = getValue("flatWidth");
      const T = getValue("flatThickness");
      const L = getValue("flatLength");
      qty = getValue("flatQty") || 1;
      if (W > 0 && T > 0 && L > 0 && qty > 0) {
        volumePerPiece = W * factor * T * factor * L * factor;
      }
    } else if (currentShape === "tube-square") {
      const outer = getValue("tubeSqOuter");
      const t = getValue("tubeSqThickness");
      const L = getValue("tubeSqLength");
      qty = getValue("tubeSqQty") || 1;
      if (outer > 0 && t > 0 && L > 0 && qty > 0) {
        const outer_m = outer * factor;
        const t_m = t * factor;
        const inner_m = Math.max(outer_m - 2 * t_m, 0);
        const areaOuter = Math.pow(outer_m, 2);
        const areaInner = Math.pow(inner_m, 2);
        volumePerPiece = (areaOuter - areaInner) * L * factor;
      }
    } else if (currentShape === "tube-rect") {
      const W = getValue("tubeRectWidth");
      const H = getValue("tubeRectHeight");
      const t = getValue("tubeRectThickness");
      const L = getValue("tubeRectLength");
      qty = getValue("tubeRectQty") || 1;
      if (W > 0 && H > 0 && t > 0 && L > 0 && qty > 0) {
        const W_m = W * factor;
        const H_m = H * factor;
        const t_m = t * factor;
        const innerW = Math.max(W_m - 2 * t_m, 0);
        const innerH = Math.max(H_m - 2 * t_m, 0);
        const areaOuter = W_m * H_m;
        const areaInner = innerW * innerH;
        volumePerPiece = (areaOuter - areaInner) * L * factor;
      }
    } else if (currentShape === "angle") {
      const A = getValue("angleLegA");
      const B = getValue("angleLegB");
      const T = getValue("angleThickness");
      const L = getValue("angleLength");
      qty = getValue("angleQty") || 1;
      if (A > 0 && B > 0 && T > 0 && L > 0 && qty > 0) {
        const A_m = A * factor;
        const B_m = B * factor;
        const T_m = T * factor;
        const area = (A_m + B_m - T_m) * T_m;
        volumePerPiece = area * L * factor;
      }
    } else if (currentShape === "channel") {
      const W = getValue("channelWidth");
      const H = getValue("channelHeight");
      const T = getValue("channelThickness");
      const L = getValue("channelLength");
      qty = getValue("channelQty") || 1;
      if (W > 0 && H > 0 && T > 0 && L > 0 && qty > 0) {
        const W_m = W * factor;
        const H_m = H * factor;
        const T_m = T * factor;
        const area = 2 * W_m * T_m + (H_m - 2 * T_m) * T_m;
        volumePerPiece = area * L * factor;
      }
    } else if (currentShape === "ibeam" || currentShape === "hbeam") {
      const F = getValue(currentShape === "ibeam" ? "ibeamFlangeWidth" : "hbeamFlangeWidth");
      const H = getValue(currentShape === "ibeam" ? "ibeamHeight" : "hbeamHeight");
      const T = getValue(currentShape === "ibeam" ? "ibeamThickness" : "hbeamThickness");
      const L = getValue(currentShape === "ibeam" ? "ibeamLength" : "hbeamLength");
      qty = getValue(currentShape === "ibeam" ? "ibeamQty" : "hbeamQty") || 1;
      if (F > 0 && H > 0 && T > 0 && L > 0 && qty > 0) {
        const F_m = F * factor;
        const H_m = H * factor;
        const T_m = T * factor;
        const area = 2 * F_m * T_m + (H_m - 2 * T_m) * T_m;
        volumePerPiece = area * L * factor;
      }
    } else if (currentShape === "tsection") {
      const W = getValue("tWidth");
      const H = getValue("tHeight");
      const T = getValue("tThickness");
      const L = getValue("tLength");
      qty = getValue("tQty") || 1;
      if (W > 0 && H > 0 && T > 0 && L > 0 && qty > 0) {
        const W_m = W * factor;
        const H_m = H * factor;
        const T_m = T * factor;
        const area = W_m * T_m + (H_m - T_m) * T_m;
        volumePerPiece = area * L * factor;
      }
    }

    if (!volumePerPiece || volumePerPiece <= 0 || !qty || qty <= 0) {
      resultWeightPerPieceEl.textContent = "0.000 kg";
      resultTotalWeightEl.textContent = "0.000 kg";
      resultVolumeEl.textContent = "0.000 m³";
      resultCostPerPieceEl.textContent = "0.00";
      resultTotalCostEl.textContent = "0.00";
      resultEmptyEl.style.display = "block";
      return;
    }

    resultEmptyEl.style.display = "none";

    const weightPerPiece = volumePerPiece * density;
    const totalWeight = weightPerPiece * qty;

    const pricePerKg = parseFloat(pricePerKgInput.value) || 0;
    const costPerPiece = pricePerKg > 0 ? weightPerPiece * pricePerKg : 0;
    const totalCost = pricePerKg > 0 ? totalWeight * pricePerKg : 0;

    resultWeightPerPieceEl.textContent = `${weightPerPiece.toFixed(3)} kg`;
    resultTotalWeightEl.textContent = `${totalWeight.toFixed(3)} kg`;
    resultVolumeEl.textContent = `${volumePerPiece.toExponential(3)} m³`;
    resultCostPerPieceEl.textContent = pricePerKg > 0 ? costPerPiece.toFixed(2) : "0.00";
    resultTotalCostEl.textContent = pricePerKg > 0 ? totalCost.toFixed(2) : "0.00";
  }

  function onShapeChange(shape) {
    currentShape = shape;
    resultShapeEl.textContent = {
      round: "Round Bar",
      square: "Square Bar",
      flat: "Flat Bar",
      hex: "Hex Bar",
      plate: "Steel Plate",
      sheet: "Steel Sheet",
      pipe: "Pipe",
      "tube-square": "Tube (Square)",
      "tube-rect": "Tube (Rectangle)",
      angle: "Angle",
      channel: "Channel",
      ibeam: "I Beam",
      hbeam: "H Beam",
      tsection: "T Section",
    }[shape] || "Shape";

    shapeInputGroups.forEach((group) => {
      group.hidden = group.dataset.shape !== shape;
    });

    calculate();
  }

  function setupShapeCards() {
    shapeCards.forEach((card) => {
      card.addEventListener("click", () => {
        shapeCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        onShapeChange(card.dataset.shape);
      });
    });
  }

  function setupMaterial() {
    materialRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "custom" && radio.checked) {
          customDensityWrapper.hidden = false;
        } else if (radio.checked) {
          customDensityWrapper.hidden = true;
        }
        calculate();
      });
    });

    customDensityInput.addEventListener("input", () => {
      validatePositive("customDensity");
      calculate();
    });
  }

  function setupUnits() {
    unitRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        resultUnitEl.textContent = radio.value;
        calculate();
      });
    });
  }

  function setupInputsValidation() {
    const ids = [
      "roundDiameter",
      "roundLength",
      "roundQty",
      "pipeOD",
      "pipeThickness",
      "pipeLength",
      "pipeQty",
      "plateLength",
      "plateWidth",
      "plateThickness",
      "plateQty",
      "squareSide",
      "squareLength",
      "squareQty",
      "flatWidth",
      "flatThickness",
      "flatLength",
      "flatQty",
      "tubeSqOuter",
      "tubeSqThickness",
      "tubeSqLength",
      "tubeSqQty",
      "tubeRectWidth",
      "tubeRectHeight",
      "tubeRectThickness",
      "tubeRectLength",
      "tubeRectQty",
      "angleLegA",
      "angleLegB",
      "angleThickness",
      "angleLength",
      "angleQty",
      "channelWidth",
      "channelHeight",
      "channelThickness",
      "channelLength",
      "channelQty",
      "ibeamFlangeWidth",
      "ibeamHeight",
      "ibeamThickness",
      "ibeamLength",
      "ibeamQty",
      "hbeamFlangeWidth",
      "hbeamHeight",
      "hbeamThickness",
      "hbeamLength",
      "hbeamQty",
      "tWidth",
      "tHeight",
      "tThickness",
      "tLength",
      "tQty",
      "pricePerKg",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        validatePositive(id);
        calculate();
      });
    });
  }

  function setupActions() {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll("input[type='number']").forEach((input) => {
        if (input.id.endsWith("Qty")) {
          input.value = "1";
        } else {
          input.value = "";
        }
        input.classList.remove("invalid");
      });
      customDensityWrapper.hidden = true;
      materialRadios.forEach((r) => {
        if (r.value === "7850") r.checked = true;
      });
      unitRadios.forEach((r) => {
        if (r.value === "mm") r.checked = true;
      });
      shapeCards.forEach((c) => c.classList.remove("active"));
      const defaultCard = document.querySelector(".shape-card[data-shape='round']");
      if (defaultCard) defaultCard.classList.add("active");
      onShapeChange("round");
      resultEmptyEl.style.display = "block";
      calculate();
    });

    copyBtn.addEventListener("click", () => {
      const text = `
Steel Weight Calculator Result
Shape: ${resultShapeEl.textContent}
Density: ${resultDensityEl.textContent}
Unit: ${resultUnitEl.textContent}
Weight per Piece: ${resultWeightPerPieceEl.textContent}
Total Weight: ${resultTotalWeightEl.textContent}
Volume per Piece: ${resultVolumeEl.textContent}
Cost per Piece: ${resultCostPerPieceEl.textContent}
Total Cost: ${resultTotalCostEl.textContent}
`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          alert("Result copied to clipboard.");
        }).catch(() => {
          alert("Unable to copy result.");
        });
      } else {
        alert("Clipboard not supported in this browser.");
      }
    });

    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  function setupFormulasToggle() {
    if (!formulaToggleBtn || !formulaContent) return;
    formulaToggleBtn.addEventListener("click", () => {
      const expanded = formulaToggleBtn.getAttribute("aria-expanded") === "true";
      formulaToggleBtn.setAttribute("aria-expanded", String(!expanded));
      formulaContent.hidden = expanded;
      const icon = formulaToggleBtn.querySelector(".formula-icon");
      if (icon) icon.style.transform = expanded ? "rotate(0deg)" : "rotate(180deg)";
    });
  }

  function init() {
    setupShapeCards();
    setupMaterial();
    setupUnits();
    setupInputsValidation();
    setupActions();
    setupFormulasToggle();
    calculate();
  }

  document.addEventListener("DOMContentLoaded", init);
})();