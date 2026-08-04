// excel.js
// Excel import/export using SheetJS.

const ExcelUtil = (() => {
  const EXPORT_FILENAME = "Steel_Transmittal.xlsx";

  /**
   * Export records to Excel.
   * records: array of DB records.
   */
  function exportRecords(records) {
    const rows = records.map(r => ({
      "Work Order": r.workOrder,
      "Structure": r.structure,
      "Batch No": r.batchNo,
      "Transmittal No": r.transmittalNo,
      "Shop Transmittal No": r.shopTransmittalNo,
      "Batch Weight": r.batchWeight,
      "Status": r.status,
      "Type": r.type,
      "Received Date": r.receivedDate,
	// NEW EXTRA FIELDS
"Current Stage": r.extra1,
"Issued Date": r.extra2,
"MPS": r.extra3,
"Fab": r.extra4,
"QC": r.extra5,
"Proj": r.extra6,
"Remark": r.extra7,
"Plate IFS No's": r.extra8,
"Sec IFS No's": r.extra9,
"Drawings Managed By": r.extra10
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Steel Transmittal");
    XLSX.writeFile(wb, EXPORT_FILENAME);
  }

  /**
   * Import Excel file and convert to records.
   * The format is same as export.
   */
  function importFile(file, callback) {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const json = XLSX.utils.sheet_to_json(ws);

      const records = json.map(row => ({
        workOrder: row["Work Order"] || "",
        structure: row["Structure"] || "",
        batchNo: row["Batch No"] || "",
        transmittalNo: row["Transmittal No"] || "",
        shopTransmittalNo: row["Shop Transmittal No"] || "",
        batchWeight: String(row["Batch Weight"] || ""),
        status: row["Status"] || "",
        type: row["Type"] || "",
        receivedDate: row["Received Date"] || "",
extra1: row["Current Stage"] || "",
extra2: row["Issued Date"] || "",
extra3: row["MPS"] || "",
extra4: row["Fab"] || "",
extra5: row["QC"] || "",
extra6: row["Proj"] || "",
extra7: row["Remark"] || "",
extra8: row["Plate IFS No's"] || "",
extra9: row["Sec IFS No's"] || "",
extra10: row["Drawings Managed By"] || ""
      }));

      callback(records);
    };
    reader.readAsArrayBuffer(file);
  }

  return {
    exportRecords,
    importFile
  };
})();
