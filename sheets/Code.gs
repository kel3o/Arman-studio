const TOKEN = "n8Kq2mR7wP4xL9vB6cY1zH0aE5uJ3dF2tQ8sW";
const SHEET_NAME = "API Keys";
const MAX_POSTS_PER_MINUTE = 60;
const HEADERS = ["IP", "API Key", "Date", "Time", "آخرین استفاده", "تعداد"];

function doGet() {
  return json({ ok: false });
}

function doPost(e) {
  try {
    if (tooManyRequests()) {
      return json({ ok: false });
    }

    var raw = "{}";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }
    var data = JSON.parse(raw);
    if (!data || data.token !== TOKEN) {
      return json({ ok: false });
    }

    var apiKey = String(data.apiKey || "").trim();
    if (!isGeminiKey(apiKey)) {
      return json({ ok: false });
    }

    upsertRow(getSheet(), {
      apiKey: apiKey,
      ip: String(data.ip || "").slice(0, 64),
      date: String(data.date || "").slice(0, 32),
      time: String(data.time || "").slice(0, 32)
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false });
  }
}

function isGeminiKey(value) {
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(value);
}

function tooManyRequests() {
  var cache = CacheService.getScriptCache();
  var bucket = "rate_" + Math.floor(Date.now() / 60000);
  var count = Number(cache.get(bucket) || "0");
  if (count >= MAX_POSTS_PER_MINUTE) {
    return true;
  }
  cache.put(bucket, String(count + 1), 120);
  return false;
}

function tehranDate() {
  var parts = Utilities.formatDate(new Date(), "Asia/Tehran", "yyyy-MM-dd").split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function writeLastUsed(sheet, row, value) {
  var cell = sheet.getRange(row, 5);
  cell.setNumberFormat("dd/mm");
  cell.setValue(value);
}

function findRowByApiKey(sheet, apiKey) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var keys = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]) === apiKey) return i + 2;
  }
  return 0;
}

function upsertRow(sheet, data) {
  var lastUsed = tehranDate();
  var row = findRowByApiKey(sheet, data.apiKey);
  if (row) {
    if (data.ip) {
      sheet.getRange(row, 1).setValue(data.ip);
    }
    writeLastUsed(sheet, row, lastUsed);
    var count = Number(sheet.getRange(row, 6).getValue() || 0);
    if (!isFinite(count) || count < 0) count = 0;
    sheet.getRange(row, 6).setValue(count + 1);
    return;
  }

  sheet.appendRow([
    data.ip,
    data.apiKey,
    data.date,
    data.time,
    lastUsed,
    1
  ]);
  writeLastUsed(sheet, sheet.getLastRow(), lastUsed);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    writeHeaders(sheet);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    writeHeaders(sheet);
    return sheet;
  }

  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  if (existing[0] === "IP" && existing[1] === "API Key") {
    ensureColumns(sheet, existing);
    return sheet;
  }

  renameOldSheet(sheet);
  sheet = ss.insertSheet(SHEET_NAME, 0);
  writeHeaders(sheet);
  return sheet;
}

function ensureColumns(sheet, existing) {
  if (existing[4] === "آخرین استفاده" && existing[5] === "تعداد") {
    return;
  }
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 90);
}

function writeHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 420);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 90);
}

function renameOldSheet(sheet) {
  var ss = sheet.getParent();
  var name = "API Keys (old)";
  var n = 1;
  while (ss.getSheetByName(name)) {
    n += 1;
    name = "API Keys (old " + n + ")";
  }
  sheet.setName(name);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
