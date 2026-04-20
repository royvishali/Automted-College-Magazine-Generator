/**
 * AI Parser Utility
 * - Parses XLSX / DOCX uploads into structured JSON
 * - Uses Gemini API (if key present) to identify section type
 * - Falls back to heuristic keyword matching
 */
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const path = require('path');

// ─── Heuristic Section Detection ─────────────────────────────────────────────
const SECTION_KEYWORDS = {
  placements: ['company', 'package', 'lpa', 'ctc', 'placed', 'offer', 'recruit'],
  cocurricular: ['competition', 'hackathon', 'rank', 'prize', 'award', 'winner', 'first', 'second', 'third'],
  faculty_achievements: ['publication', 'journal', 'paper', 'research', 'conference', 'isbn', 'issn', 'author', 'patent'],
  industrial_visits: ['visit', 'industry', 'company visit', 'plant', 'tour'],
  events: ['event', 'seminar', 'workshop', 'guest lecture', 'fest', 'symposium'],
};

function detectSectionFromContent(text) {
  const lower = text.toLowerCase();
  let best = { section: 'cocurricular', score: 0 };

  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > best.score) best = { section, score };
  }

  return best.section;
}

// ─── Parse XLSX ────────────────────────────────────────────────────────────────
function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const results = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (jsonData.length === 0) continue;

    // First row = headers
    const headers = jsonData[0].map(h => String(h).trim()).filter(Boolean);
    if (headers.length === 0) continue;

    const rows = jsonData.slice(1)
      .filter(row => row.some(cell => cell !== ''))
      .map(row => headers.map((_, i) => String(row[i] ?? '').trim()));

    if (rows.length === 0) continue;

    const rawText = [headers, ...rows].flat().join(' ');
    const suggestedSection = detectSectionFromContent(rawText);

    results.push({
      sheetName,
      suggestedSection,
      table: { headers, rows },
      confidence: 'heuristic',
    });
  }

  return results;
}

// ─── Parse DOCX ────────────────────────────────────────────────────────────────
async function parseWord(buffer) {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to detect tables from repeated tab-separated lines
  const tabRows = lines.filter(l => l.includes('\t'));
  let table = null;

  if (tabRows.length >= 2) {
    const tableData = tabRows.map(row => row.split('\t').map(c => c.trim()));
    const headers = tableData[0];
    const rows = tableData.slice(1);
    table = { headers, rows };
  }

  const suggestedSection = detectSectionFromContent(text);

  return [{
    sheetName: 'Document',
    suggestedSection,
    table: table || { headers: ['Content'], rows: lines.map(l => [l]) },
    rawText: text.slice(0, 500),
    confidence: 'heuristic',
  }];
}

// ─── AI Enhancement (Gemini) ───────────────────────────────────────────────────
async function enhanceWithAI(parsedResults, rawText) {
  if (!process.env.GEMINI_API_KEY) return parsedResults;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are helping organize a college department magazine. 
Given this data extracted from a spreadsheet/document, determine which magazine section it belongs to.

Sections available: placements, cocurricular, extracurricular, faculty_achievements, events, industrial_visits

Data preview:
${rawText.slice(0, 1000)}

Respond with ONLY a JSON object like:
{"section": "placements", "confidence": "high", "reason": "Contains company names and packages"}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanJson = responseText.replace(/```json?/g, '').replace(/```/g, '').trim();
    const aiResult = JSON.parse(cleanJson);

    return parsedResults.map(r => ({
      ...r,
      suggestedSection: aiResult.section || r.suggestedSection,
      confidence: aiResult.confidence || 'ai',
      aiReason: aiResult.reason,
    }));
  } catch (err) {
    console.warn('Gemini AI parse failed, using heuristic:', err.message);
    return parsedResults;
  }
}

// ─── Main Parse Function ────────────────────────────────────────────────────────
async function parseUploadedFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const fs = require('fs');
  const buffer = fs.readFileSync(filePath);

  let results;
  let rawText = '';

  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    results = parseExcel(buffer);
    rawText = results.map(r => [...r.table.headers, ...r.table.rows.flat()].join(' ')).join(' ');
  } else if (ext === '.docx' || ext === '.doc') {
    results = await parseWord(buffer);
    rawText = results[0]?.rawText || '';
  } else {
    throw new Error(`Unsupported file type: ${ext}. Please upload .xlsx, .xls, .csv, or .docx`);
  }

  // Try AI enhancement
  results = await enhanceWithAI(results, rawText);

  return results;
}

module.exports = { parseUploadedFile };
