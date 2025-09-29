const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const LEDGER_FILE = path.join(__dirname, '..', 'data', 'ledger.json');
if (!fs.existsSync(path.dirname(LEDGER_FILE))) fs.mkdirSync(path.dirname(LEDGER_FILE), { recursive: true });
if (!fs.existsSync(LEDGER_FILE)) fs.writeFileSync(LEDGER_FILE, '[]');

function hash(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function append(payload) {
  const ledger = JSON.parse(fs.readFileSync(LEDGER_FILE));
  const prev = ledger.length ? ledger[ledger.length-1].hash : null;
  const entry = { payload, ts: new Date().toISOString(), prev, hash: null };
  entry.hash = hash({ payload, ts: entry.ts, prev });
  ledger.push(entry);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
  return entry;
}

function getAll() {
  return JSON.parse(fs.readFileSync(LEDGER_FILE));
}

module.exports = { append, getAll };
