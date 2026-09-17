/**
 * Google Apps Script: handler untuk Buku Tamu (Ucapan)
 * - GANTI `SHEET_ID` dengan ID spreadsheet Anda
 * - Pastikan sheet name sesuai `SHEET_NAME` (default: "Ucapan")
 * - Deploy as Web App (Anyone, even anonymous) untuk panggilan fetch dari klien
 */

const SHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Ucapan';

function _openSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function _readAllRows() {
  const sheet = _openSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function _findRowIndexById(id) {
  const sheet = _openSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(r => String(r[0]));
  const idx = ids.indexOf(String(id));
  return idx >= 0 ? idx + 2 : -1; // return absolute sheet row number
}

function doGet(e) {
  try {
    const data = _readAllRows();
    const out = { status: 'success', data };
    return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents ? e.postData.contents : null;
    if (!raw) throw new Error('Empty payload');
    const payload = JSON.parse(raw);

    // handle like/love action
    if (payload.action && payload.action === 'love') {
      if (!payload.id) throw new Error('Missing id for love action');
      const rowNum = _findRowIndexById(payload.id);
      if (rowNum === -1) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Message not found' })).setMimeType(ContentService.MimeType.JSON);

      const sheet = _openSheet();
      // assume 'love' column exists in header; find its index
      const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      const loveColIndex = headers.indexOf('love');
      if (loveColIndex === -1) {
        // if no love column, append one at the end and set header
        const newCol = headers.length + 1;
        sheet.getRange(1, newCol).setValue('love');
        // default love 0 for all existing rows
        if (sheet.getLastRow() > 1) sheet.getRange(2, newCol, sheet.getLastRow()-1).setValue(0);
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: "Added 'love' column — please retry the action" })).setMimeType(ContentService.MimeType.JSON);
      }

      const loveCell = sheet.getRange(rowNum, loveColIndex + 1);
      const current = Number(loveCell.getValue()) || 0;
      const updated = current + 1;
      loveCell.setValue(updated);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: payload.id, love: updated })).setMimeType(ContentService.MimeType.JSON);
    }

    // handle new message submission (fallback)
    const sheet = _openSheet();
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];

    // build a standardized object to append
    const id = payload.id || Utilities.getUuid();
    const timestamp = payload.timestamp || new Date().toISOString();
    const nama = payload.nama || '';
    const ucapan = payload.ucapan || '';
    const kehadiran = payload.kehadiran || '';
    const jumlah_tamu = payload.jumlah_tamu || payload.jumlahTamu || '';
    const love = Number(payload.love || 0);

    // ensure headers contain id,timestamp,nama,ucapan,kehadiran,jumlah_tamu,love (create if missing)
    const required = ['id','timestamp','nama','ucapan','kehadiran','jumlah_tamu','love'];
    required.forEach((h) => {
      if (!headers.includes(h)) {
        headers.push(h);
        changeHeaderRow(sheet, headers);
      }
    });

    // prepare row aligned to headers
    const row = headers.map((h) => {
      switch(h) {
        case 'id': return id;
        case 'timestamp': return timestamp;
        case 'nama': return nama;
        case 'ucapan': return ucapan;
        case 'kehadiran': return kehadiran;
        case 'jumlah_tamu': return jumlah_tamu;
        case 'love': return love;
        default:
          // allow other columns to be empty
          return payload[h] || '';
      }
    });

    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Ucapan diterima', id })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function changeHeaderRow(sheet, headers) {
  // overwrite header row with new headers array
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
}

// Optional: respond to OPTIONS preflight
function doOptions(e) {
  return ContentService.createTextOutput('');
}
