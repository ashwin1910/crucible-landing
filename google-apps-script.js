/**
 * Google Apps Script — Crucible Waitlist Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL
 * 5. Paste it into index.html as SHEETS_ENDPOINT
 *
 * The script creates a sheet called "Waitlist" with headers on first run.
 * It deduplicates by email — if the same email submits again with more info,
 * it UPDATES the existing row instead of creating a duplicate.
 */

const SHEET_NAME = 'Waitlist';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    // Find existing row by email (dedup)
    const emails = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().flat();
    const existingRow = emails.indexOf(data.email) + 2; // +2 for header row + 0-index

    if (existingRow > 1) {
      // UPDATE existing row — only fill in empty cells or upgrade step
      const row = sheet.getRange(existingRow, 1, 1, 8).getValues()[0];
      sheet.getRange(existingRow, 1, 1, 8).setValues([[
        data.email,
        data.name || row[1] || '',
        data.company || row[2] || '',
        data.role || row[3] || '',
        data.use_case || row[4] || '',
        data.step === 'full_profile' ? 'full_profile' : row[5],   // upgrade step
        row[6],                                                     // keep original timestamp
        new Date().toISOString()                                    // updated_at
      ]]);
    } else {
      // INSERT new row
      sheet.appendRow([
        data.email || '',
        data.name || '',
        data.company || '',
        data.role || '',
        data.use_case || '',
        data.step || 'email_only',
        new Date().toISOString(),  // created_at
        new Date().toISOString()   // updated_at
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', action: existingRow > 1 ? 'updated' : 'created' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Health check + stats endpoint
  const sheet = getOrCreateSheet();
  const count = Math.max(sheet.getLastRow() - 1, 0);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', signups: count }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['email', 'name', 'company', 'role', 'use_case', 'step', 'created_at', 'updated_at']);
    sheet.setFrozenRows(1);
    // Bold headers
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    // Auto-resize
    sheet.autoResizeColumns(1, 8);
  }

  return sheet;
}
