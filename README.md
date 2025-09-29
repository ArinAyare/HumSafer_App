# HUMSAFER - Smart Tourist Safety Monitoring & Incident Response System (MVP)

This project is a demo that includes:
- Login & registration (tourist, police, admin)
- Role-based dashboards with map and alerts
- SOS button for tourists sending alerts to police
- Live tracking (opt-in) for tourists
- Simple AI analyze endpoint to generate alerts from tracks
- Black & Orange themed UI and assets

## Quick start

1. Backend:
   - `cd backend`
   - `npm install`
   - `node server.js`
   - Server runs on http://localhost:3000

2. Frontend:
   - Open `frontend/src/index.html` directly in a modern browser, or serve statically:
     - `npx http-server frontend/src -p 8080`
     - Open http://localhost:8080

3. Tourist:
   - Register as role `tourist`, login, opt-in to share location, try SOS.

4. Police:
   - Register as role `police`, login to view live alerts & map.

5. Admin:
   - Register as `admin` to view the ledger.

Notes:
- This is a demo. Do NOT store real KYC or passwords this way in production.
- For production: add TLS, authentication, databases, real blockchain, and secure KYC flows.
