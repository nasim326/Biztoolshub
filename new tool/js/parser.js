// parser.js
// Responsible for smart parsing of pasted Excel-like text into a single record.

const Parser = (() => {
  /**
   * Normalize raw text into lines and tokens.
   * Supports tabs, multiple spaces, blank lines.
   */
  function tokenize(raw) {
    const lines = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0); // ignore blank lines

    return lines.map(line => {
      // Split by tabs or multiple spaces
      const parts = line.split(/\t+| {2,}/).map(p => p.trim()).filter(p => p.length > 0);
      return parts;
    });
  }

  /**
   * Detect header row heuristically.
   * We look for tokens that match known header names.
   */
  function detectHeader(tokens) {
    const headerKeywords = ["sn", "transmittal", "cutting", "weight"];
    for (let i = 0; i < tokens.length; i++) {
      const row = tokens[i].map(t => t.toLowerCase());
      const score = headerKeywords.reduce(
        (acc, key) => acc + (row.some(col => col.includes(key)) ? 1 : 0),
        0
      );
      if (score >= 2) {
        return { index: i, row: tokens[i] };
      }
    }
    return null;
  }

  /**
   * Map columns by heuristic names.
   */
  function mapColumns(headerRow) {
    const map = {
      sn: null,
      transmittal: null,
      cutting: null,
      weight: null,
      totalWeight: null
    };

    headerRow.forEach((col, idx) => {
      const lc = col.toLowerCase();
      if (lc.includes("sn")) map.sn = idx;
      else if (lc.includes("transmittal")) map.transmittal = idx;
      else if (lc.includes("cutting")) map.cutting = idx;
      else if (lc.includes("weight")) {
        // Could be weight or total weight
        if (lc.includes("total")) map.totalWeight = idx;
        else map.weight = idx;
      }
    });

    return map;
  }

  /**
   * Parse data rows into structured objects.
   */
  function parseRows(tokens, headerInfo, colMap, warnings) {
    const rows = [];
    for (let i = headerInfo.index + 1; i < tokens.length; i++) {
      const row = tokens[i];

      // Detect total weight row heuristically
      const joined = row.join(" ").toLowerCase();
      if (joined.includes("total") && joined.includes("weight")) {
        // Try to find numeric value
        const num = row
          .map(v => v.replace(",", "."))
          .find(v => /^[0-9]+(\.[0-9]+)?$/.test(v));
        if (num) {
          rows.push({ isTotal: true, totalWeight: parseFloat(num) });
        } else {
          warnings.push("Total Weight row detected but no numeric value found.");
        }
        continue;
      }

      // Normal data row
      const transmittal = colMap.transmittal != null ? row[colMap.transmittal] : null;
      const cutting = colMap.cutting != null ? row[colMap.cutting] : null;
      const weightStr = colMap.weight != null ? row[colMap.weight] : null;

      if (!transmittal) {
        warnings.push(`Missing Transmittal Number in row: "${row.join(" ")}"`);
        continue; // cannot recover
      }
      if (!cutting) {
        warnings.push(`Missing Cutting List Number in row: "${row.join(" ")}"`);
        continue;
      }
      if (!weightStr) {
        warnings.push(`Missing Weight in row: "${row.join(" ")}"`);
        continue;
      }

      const weight = parseFloat(weightStr.replace(",", "."));
      if (isNaN(weight)) {
        warnings.push(`Invalid Weight "${weightStr}" in row: "${row.join(" ")}"`);
        continue;
      }

      rows.push({
        isTotal: false,
        transmittal,
        cutting,
        weight
      });
    }

    return rows;
  }

  /**
   * Build final record from parsed rows according to rules.
   */
  function buildRecord(rows, warnings) {
    const dataRows = rows.filter(r => !r.isTotal);
    const totalRow = rows.find(r => r.isTotal);

    if (dataRows.length === 0) {
      throw new Error("No valid data rows found.");
    }

    // Work Order: first 4 digits from first transmittal
    const firstTrans = dataRows[0].transmittal;
    const workOrderBase = firstTrans.slice(0, 4);
    let workOrder = workOrderBase;
    const digits5to7 = firstTrans.slice(4, 7);
    if (digits5to7 === "102") {
      workOrder = `${workOrderBase}-102`;
    }

/* ---------------------------------------------------------
   NEW RULE: Cutting List starts with "P"
--------------------------------------------------------- */
const firstCutting = dataRows[0].cutting;

if (firstCutting.startsWith("P")) {

  // --- NEW STRUCTURE RULE ---
  // Example: P068307R1-B8 → Structure = 07R1
  // Take characters 4 to before "-"
  const cut = firstCutting;

  // Remove "P"
  const noP = cut.substring(1); // 068307R1-B8

  // Now take from index 3 until before "-"
  // 0(0) 6(1) 8(2) 3(3) 0(4) 7(5) R(6) 1(7)
  const structPart = noP.substring(3).split("-")[0];

  structure = structPart;

  // --- Work Order rule ---
  const trans = firstTrans;

  // Extract first 4 digits
  let woDigits = trans.slice(0, 4);

  // If transmittal starts with "0", do NOT add another "0"
  if (trans.startsWith("0")) {
    workOrder = `P${woDigits}-102`;
  } else {
    workOrder = `P0${woDigits}-102`;
  }
}
    // Structure: from cutting list numbers
    const structures = [];
    dataRows.forEach(r => {
      const cl = r.cutting;
      // Remove first 4 digits
      const withoutFirst4 = cl.replace(/^\d{4}/, "");
      // Take before "-"
      const match = withoutFirst4.split("-")[0];
      if (match && !structures.includes(match)) {
        structures.push(match);
      }
    });

    // Batch No: text after "-"
    const batchNos = [];
    dataRows.forEach(r => {
      const cl = r.cutting;
      const parts = cl.split("-");
      if (parts.length > 1) {
        const batch = parts[1];
        if (batch && !batchNos.includes(batch)) {
          batchNos.push(batch);
        }
      }
    });

    // Transmittal No: unique list
    const transmittals = [];
    dataRows.forEach(r => {
      if (!transmittals.includes(r.transmittal)) {
        transmittals.push(r.transmittal);
      } else {
        warnings.push(`Duplicate Transmittal Number detected: ${r.transmittal}`);
      }
    });

    // Batch Weight: total weight row or sum
    let batchWeight = 0;
    if (totalRow && totalRow.totalWeight != null) {
      batchWeight = totalRow.totalWeight;
    } else {
      batchWeight = dataRows.reduce((sum, r) => sum + r.weight, 0);
      warnings.push("Total Weight missing; calculated automatically from Weight column.");
    }

    // Type: HL if any structure contains letter M, else MS
    const type = structures.some(s => /m/i.test(s)) ? "HL" : "MS";

    // Status: always 03
    const status = "03";

    // Received Date: today's date DD/MMM/YYYY
    const receivedDate = formatToday();

    return {
      workOrder,
      structure: structures.join(";"),
      batchNo: batchNos.join(";"),
      transmittalNo: transmittals.join(";"),
      shopTransmittalNo: "",
      batchWeight: batchWeight.toFixed(3),
      status,
      type,
      receivedDate
    };
  }

  function formatToday() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${mon}/${year}`;
  }

  /**
   * Public API: parse raw text into record + warnings.
   */
  function parse(raw) {
    const warnings = [];

    if (!raw || !raw.trim()) {
      throw new Error("Empty input.");
    }

    const tokens = tokenize(raw);
    if (tokens.length === 0) {
      throw new Error("No valid lines found.");
    }

    const headerInfo = detectHeader(tokens);
    if (!headerInfo) {
      throw new Error("Could not detect header row. Please check format.");
    }

    const colMap = mapColumns(headerInfo.row);
    if (colMap.transmittal == null) warnings.push("Transmittal Number column not clearly detected.");
    if (colMap.cutting == null) warnings.push("Cutting List Number column not clearly detected.");
    if (colMap.weight == null) warnings.push("Weight column not clearly detected.");

    const rows = parseRows(tokens, headerInfo, colMap, warnings);
    const record = buildRecord(rows, warnings);

    return { record, warnings };
  }

  return {
    parse
  };
})();
