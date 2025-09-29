const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const ledger = require('./blockchain/ledger');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
const IDs_FILE = path.join(DB_DIR, 'tourist_ids.json');
const ALERTS_FILE = path.join(DB_DIR, 'alerts.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const TRACKS_FILE = path.join(DB_DIR, 'tracks.json');
if (!fs.existsSync(IDs_FILE)) fs.writeFileSync(IDs_FILE, '[]');
if (!fs.existsSync(ALERTS_FILE)) fs.writeFileSync(ALERTS_FILE, '[]');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(TRACKS_FILE)) fs.writeFileSync(TRACKS_FILE, '[]');

function readJSON(f){ return JSON.parse(fs.readFileSync(f)); }
function writeJSON(f,d){ fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'username,password,role required' });
  const users = readJSON(USERS_FILE);
  if (users.find(u=>u.username===username)) return res.status(400).json({ error: 'username exists' });
  const user = { id: nanoid(8), username, password, role };
  users.push(user);
  writeJSON(USERS_FILE, users);
  res.json({ success:true, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/api/login', (req, res)=>{
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const u = users.find(x=>x.username===username && x.password===password);
  if (!u) return res.status(401).json({ error: 'invalid credentials' });
  u.token = nanoid(16);
  writeJSON(USERS_FILE, users);
  res.json({ success:true, user: { id: u.id, username: u.username, role: u.role, token: u.token } });
});

app.post('/api/issue-id', (req, res) => {
  const { name, kycId, itinerary, contacts, validUntil } = req.body;
  if (!name || !kycId) return res.status(400).json({ error: 'name & kycId required' });
  const id = nanoid(10);
  const record = { id, name, kycId, itinerary: itinerary||[], contacts: contacts||[], validUntil, issuedAt: new Date().toISOString() };
  const ids = readJSON(IDs_FILE);
  ids.push(record);
  writeJSON(IDs_FILE, ids);
  ledger.append(record);
  res.json({ success: true, record });
});

app.get('/api/id/:id', (req, res) => {
  const ids = readJSON(IDs_FILE);
  const rec = ids.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json(rec);
});

app.post('/api/alert', (req, res) => {
  const { touristId, type, lat, lon, details, reporter } = req.body;
  const alerts = readJSON(ALERTS_FILE);
  const alert = { id: nanoid(8), touristId, type, lat, lon, details, reporter, ts: new Date().toISOString() };
  alerts.push(alert);
  writeJSON(ALERTS_FILE, alerts);
  ledger.append(alert);
  res.json({ success: true, alert });
});

app.get('/api/alerts', (req, res) => {
  const alerts = readJSON(ALERTS_FILE);
  res.json(alerts);
});

app.post('/api/track', (req, res) => {
  const { touristId, lat, lon } = req.body;
  if (!touristId) return res.status(400).json({ error:'touristId required' });
  const tracks = readJSON(TRACKS_FILE);
  tracks.push({ touristId, lat, lon, ts: new Date().toISOString() });
  writeJSON(TRACKS_FILE, tracks);
  res.json({ success:true });
});

app.get('/api/track/:touristId/last', (req, res) => {
  const tracks = readJSON(TRACKS_FILE).filter(t=>t.touristId===req.params.touristId);
  if (!tracks.length) return res.status(404).json({ error:'no tracks' });
  res.json(tracks[tracks.length-1]);
});

app.get('/api/safety-score', (req, res) => {
  const { lat, lon } = req.query;
  const base = 70;
  const variability = Math.abs(((parseFloat(lat)||0) + (parseFloat(lon)||0)) % 30);
  const score = Math.max(20, Math.min(95, Math.round(base - variability)));
  res.json({ score, computedAt: new Date().toISOString() });
});

app.post('/api/analyze', (req, res) => {
  const tracks = readJSON(TRACKS_FILE);
  const alerts = [];
  const byTourist = {};
  tracks.forEach(t=> (byTourist[t.touristId] = byTourist[t.touristId] || []).push(t));
  Object.keys(byTourist).forEach(tid=>{
    const arr = byTourist[tid].sort((a,b)=> new Date(a.ts)-new Date(b.ts));
    for(let i=1;i<arr.length;i++){
      const prev = new Date(arr[i-1].ts);
      const cur = new Date(arr[i].ts);
      const gap = (cur - prev)/1000;
      if (gap > 3600*2){
        const alert = { id: nanoid(8), touristId: tid, type:'prolonged_inactivity', ts: arr[i].ts, note: 'gap_s:'+gap };
        alerts.push(alert);
      }
    }
  });
  if (alerts.length){
    const fileAlerts = readJSON(ALERTS_FILE);
    alerts.forEach(a=> fileAlerts.push(a));
    writeJSON(ALERTS_FILE, fileAlerts);
    alerts.forEach(a=> ledger.append(a));
  }
  res.json({ generated: alerts.length, alerts });
});

app.get('/api/ledger', (req, res) => {
  res.json(ledger.getAll());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Backend running on port', PORT));
