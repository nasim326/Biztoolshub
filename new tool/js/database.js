// database.js
// LocalStorage-based database layer.

const Database = (() => {
  const STORAGE_KEY = "steel_transmittal_db";

  function _load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function _save(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function getAll() {
    return _load();
  }

  function getNextId(records) {
    if (records.length === 0) return 1;
    return Math.max(...records.map(r => r.id)) + 1;
  }

  function add(record) {
    const records = _load();
    const now = new Date().toISOString();
    const id = getNextId(records);
    const newRecord = {
      id,
      ...record,
// NEW EXTRA FIELDS
  extra1: record.extra1 || "",
  extra2: record.extra2 || "",
  extra3: record.extra3 || "",
  extra4: record.extra4 || "",
  extra5: record.extra5 || "",
  extra6: record.extra6 || "",
  extra7: record.extra7 || "",
  extra8: record.extra8 || "",
  extra9: record.extra9 || "",
  extra10: record.extra10 || "",
      createdTime: now,
      updatedTime: now
    };
    records.push(newRecord);
    _save(records);
    return newRecord;
  }

  function update(id, updates) {
    const records = _load();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    records[idx] = {
      ...records[idx],
      ...updates,
// ensure extra fields exist
  extra1: updates.extra1 ?? records[idx].extra1,
  extra2: updates.extra2 ?? records[idx].extra2,
  extra3: updates.extra3 ?? records[idx].extra3,
  extra4: updates.extra4 ?? records[idx].extra4,
  extra5: updates.extra5 ?? records[idx].extra5,
  extra6: updates.extra6 ?? records[idx].extra6,
  extra7: updates.extra7 ?? records[idx].extra7,
  extra8: updates.extra8 ?? records[idx].extra8,
  extra9: updates.extra9 ?? records[idx].extra9,
  extra10: updates.extra10 ?? records[idx].extra10,
      updatedTime: new Date().toISOString()
    };
    _save(records);
    return records[idx];
  }

  function remove(id) {
    const records = _load();
    const filtered = records.filter(r => r.id !== id);
    _save(filtered);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function backup() {
    return JSON.stringify(_load(), null, 2);
  }

  function restore(json) {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) throw new Error("Invalid backup format.");
      _save(data);
    } catch (e) {
      throw e;
    }
  }

  return {
    getAll,
    add,
    update,
    remove,
    clear,
    backup,
    restore
  };
})();
