# Signature website ko Vercel par live karna

Natija: `https://signature-events.vercel.app` (website) aur `https://signature-events.vercel.app/admin` (admin panel)

Teen cheezein chahiye (teeno ka free plan hai):
1. **TiDB Cloud** — online MySQL database (aap ke computer wala MySQL internet se nahi milta)
2. **Vercel** — website + API
3. (Ikhtiyari) **GitHub** — code rakhne ke liye; har tabdeeli par Vercel khud dobara live karta hai

---

## Step 1 — Online database (TiDB Cloud)

1. https://tidbcloud.com par **Sign up** (Google account se).
2. **Create Cluster** → **Serverless** (Free) → Region: **Singapore (ap-southeast-1)** (Pakistan ke qareeb) → Create.
3. Cluster khulne ke baad **Connect** dabayein:
   - "Connect With" → **General**
   - **Generate Password** dabayein aur password **copy kar ke sambhal lein** (dobara nazar nahi aata)
   - Yahan se 4 cheezein note karein: **HOST**, **PORT** (4000), **USERNAME** (jaise `xxxx.root`), **PASSWORD**
4. Database banayein — VS Code terminal mein (apni details daal kar):
   ```
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --ssl-mode=VERIFY_IDENTITY -h HOST -P 4000 -u USERNAME -p -e "CREATE DATABASE signature_events"
   ```
5. Apna mojooda data (orders, menu, rates, halls, admin password) online database mein daalein:
   ```
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --ssl-mode=VERIFY_IDENTITY -h HOST -P 4000 -u USERNAME -p signature_events < D:\apptec\2026\event\server\backup\signature_events.sql
   ```
   (Naya backup chahiye ho to mujhe kahein, ya data khali shuru karna ho to `server\.env` mein TiDB ki details likh kar `cd server` → `npm run db:setup`)

---

## Step 2 — Vercel par website daalna

### Tareeqa A — seedha computer se (GitHub ki zaroorat nahi)
1. https://vercel.com par **Sign up** (Google / GitHub / email).
2. VS Code terminal:
   ```
   cd D:\apptec\2026\event
   npx vercel
   ```
   - Pehli dafa login maangega — browser mein confirm karein
   - Sawalon ke jawab: *Set up and deploy?* **Y** · *Which scope?* apna account · *Link to existing project?* **N** · *Project name?* `signature-events` · *Directory?* `./` · *Modify settings?* **N**
3. Ye ek "preview" link dega. Abhi database ki settings nahi, isliye forms kaam nahi karenge — Step 3 karein.

### Tareeqa B — GitHub ke zariye (behtar, har update khud live)
1. GitHub par naya **private** repository banayein (jaise `signature-events`).
2. Code upload karein (mujhe kahein to main git tayyar kar dunga).
3. Vercel → **Add New → Project** → GitHub repo chunein → **Deploy**.

> `.env`, database backup aur passwords **GitHub par nahi jaate** — `.gitignore` mein hain.

---

## Step 3 — Vercel mein settings (Environment Variables)

Vercel → apna project → **Settings → Environment Variables** → har line alag add karein:

| Name | Value |
|---|---|
| `DB_HOST` | TiDB ka HOST |
| `DB_PORT` | `4000` |
| `DB_USER` | TiDB ka USERNAME |
| `DB_PASSWORD` | TiDB ka PASSWORD |
| `DB_NAME` | `signature_events` |
| `DB_SSL` | `true` |
| `ADMIN_KEY` | admin ka backup password (mazboot rakhein) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `amirislam9077@gmail.com` |
| `SMTP_PASS` | Gmail App Password (server\.env wala) |
| `MAIL_FROM` | `"Signature Catering & Events" <amirislam9077@gmail.com>` |
| `ADMIN_EMAIL` | `amirislam9077@gmail.com` |
| `ADMIN_WHATSAPP` | `923218255469` |
| `BRAND_NAME` | `Signature Catering & Event Management` |
| `BRAND_PHONE` | `0321 8255469` |

Phir dobara live karein:
```
npx vercel --prod
```
(GitHub wale tareeqe mein: Vercel → Deployments → **Redeploy**)

---

## Step 4 — Check karein

1. `https://APNA-LINK.vercel.app/api/health` → `"db":"connected"` aana chahiye
2. Website kholein → **Get a Quote** bharein → admin email aani chahiye
3. `https://APNA-LINK.vercel.app/admin` → login → order nazar aana chahiye

## Apna domain (jaise signatureevents.pk)
Vercel → Project → **Settings → Domains** → domain likhein → jo DNS records Vercel bataye, wo domain wali company (Namecheap / PKNIC) mein daal dein.

## Zaroori
- Live karne se pehle admin password mazboot karein (admin panel → 🔑 Change password).
- Background music: `public/music/background.mp3` sirf license wala gaana.
- Vercel free plan mein har form par jawab ~1–3 second leta hai (email bhi saath jaati hai) — ye normal hai.
