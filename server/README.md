# Signature — Backend API (Node.js + Express + MySQL)

Website ke tamam forms ka data MySQL mein save hota hai:

| Form | Endpoint | Table |
|---|---|---|
| Get a free quote | `POST /api/enquiries` | `enquiries` |
| Join as Vendor | `POST /api/vendors` | `vendors` |
| Plan Your Event (search) | `POST /api/searches` | `searches` |
| Database check | `GET /api/health` | — |
| Data dekhna (admin) | `GET /api/enquiries`, `/api/vendors`, `/api/searches` — header `x-admin-key` | — |

## Apne computer par chalana

1. `server/.env` kholein aur MySQL ka password likhein (`DB_PASSWORD=...`).
2. Database aur tables banayein (sirf pehli dafa):
   ```
   cd server
   npm run db:setup
   ```
3. API chalayein:
   ```
   npm run dev
   ```
4. Doosre terminal mein website: project folder mein `npm run dev` → http://localhost:5173

Check: http://localhost:5000/api/health par `"db":"connected"` aana chahiye.

## Online (live) karna

### Tareeqa 1 — Ek hi Node server (VPS ya cPanel "Setup Node.js App")
1. Project folder mein `npm run build` chalayein — `dist/` folder banega.
2. `dist/` aur `server/` dono hosting par upload karein (same parent folder mein).
3. Hosting par MySQL database banayein aur `schema.sql` phpMyAdmin mein chalayein
   (agar hosting database ka naam khud deti hai to `schema.sql` ki pehli do lines hata dein).
4. `server/.env` mein hosting ka DB host, user, password, database naam likhein.
   `CORS_ORIGIN` mein apna domain likhein, jaise `https://signatureevents.pk`.
5. `server` folder mein `npm install` phir `npm start`.
   Ye server website (`dist/`) aur API dono dikhata hai.

### Tareeqa 2 — Website aur API alag jagah
- Website (dist) kisi bhi static hosting par (Netlify / Vercel / cPanel public_html).
- API kisi Node hosting par (Render, Railway, VPS).
- Website build karne se pehle project ke root mein `.env` file banayein:
  `VITE_API_URL=https://api.aapka-domain.com` phir `npm run build`.
- API ki `.env` mein `CORS_ORIGIN=https://aapka-domain.com`.

## Data dekhna
- MySQL Workbench ya phpMyAdmin mein `signature_events` database kholein, ya
- `.env` mein `ADMIN_KEY` set karein aur:
  ```
  curl -H "x-admin-key: AAPKI_KEY" https://aapka-domain.com/api/enquiries
  ```
