# Lost & Found Addis (የጠፋና የተገኘ አዲስ)

A modern, secure, full-stack community web platform built for residents of Addis Ababa, Ethiopia, to report lost belongings, list found items, verify ownership, and safely recover personal property.

---

## 🌟 Key Features

* **Dual Listing Types:** Clean separation between **Lost** reports and **Found** listings across popular Addis Ababa subcities (Bole, Piazza, Kazanchis, Arat Kilo, Megenagna, Kirkos, Lideta, etc.).
* **Smart Search & Filters:** Fast case-insensitive keyword search, location filtering, and category tabs (Wallets & Cards, Phones & Electronics, Keys & Bags, Documents & IDs, etc.).
* **Automated Matching Suggestions:** Intelligent suggestions between open Lost and Found reports based on category, location, and timeframe.
* **Secure Ownership Claims:** 
  - Prevents fraudulent self-claims and duplicate spam claims.
  - Multi-step claim review workflow (`PENDING`, `APPROVED`, `REJECTED`).
  - Distinguishing verification notes and private contact details kept protected.
  - Automatic listing status update upon claim approval.
* **Abuse & Fraud Reporting:** Community moderation tools enabling users to flag suspicious listings or sensitive data exposure for administrator review.
* **Administrator Portal:** Restricted dashboard featuring platform KPI metrics (total users, active listings, pending claims) and moderation controls for flagged content.
* **Robust Security:**
  - Salted password hashing with `bcryptjs`.
  - Dual authentication via HttpOnly cookies and `Authorization: Bearer` JWT tokens.
  - Strict server-side input validation and sanitization using Zod.
  - IP-based rate limiting on authentication routes to prevent brute-force attacks.
  - Ownership authorization checks preventing unauthorized modification of listings.

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4.
* **Backend:** Node.js, Express.js 5, TypeScript, REST API architecture.
* **Database & ORM:** Neon Serverless PostgreSQL with Prisma ORM 6.19.3.
* **Testing:** Node.js native test runner with `tsx` integration suite.

---

## 📁 Repository Structure

```text
LOST-FOUND-ADDIS/
├── backend/
│   ├── prisma/
│   │   ├── migrations/         # Version-controlled SQL migrations
│   │   └── schema.prisma       # Prisma 6 domain models
│   ├── src/
│   │   ├── config/             # Validated environment loader (env.ts)
│   │   ├── lib/                # Shared singleton Prisma client (prisma.ts)
│   │   ├── middleware/         # Auth, rate limiting, error handling
│   │   ├── modules/
│   │   │   ├── admin/          # Admin statistics and moderation
│   │   │   ├── auth/           # Register, login, logout, me
│   │   │   ├── claims/         # Claim submission, owner review
│   │   │   ├── items/          # Listings CRUD, search, matching
│   │   │   ├── reports/        # Abuse/fraud reporting
│   │   │   └── users/          # Profile management, notifications
│   │   ├── app.ts              # Modular Express app setup
│   │   ├── server.ts           # Server bootstrap & graceful shutdown
│   │   ├── seed.ts             # Development seed script
│   │   └── promote-admin.ts    # Secure CLI administrator promotion tool
│   ├── tests/
│   │   └── api.test.ts         # 14 automated API integration tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Admin moderation dashboard
│   │   │   ├── dashboard/      # User listing and claim manager
│   │   │   ├── items/          # Browse and item details with claim modal
│   │   │   ├── login/          # Sign In page
│   │   │   ├── register/       # Create Account page
│   │   │   ├── report-found/   # Found item report form
│   │   │   ├── report-lost/    # Lost item report form
│   │   │   ├── layout.tsx      # Root layout with AuthProvider & Header
│   │   │   └── page.tsx        # Homepage with hero and live items feed
│   │   ├── components/         # Header, Footer, navigation components
│   │   ├── context/            # React AuthContext session manager
│   │   ├── lib/                # Shared typed API client (api.ts)
│   │   └── types/              # TypeScript domain types
│   ├── .env.example
│   ├── package.json
│   └── next.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js v20+ or v24+
* npm v10+
* A free [Neon](https://neon.tech) PostgreSQL database account

---

### 1. Environment Setup

#### Backend Configuration
Navigate to the `backend/` directory and create your `.env` file from the template:
```powershell
cd backend
cp .env.example .env
```
Populate `backend/.env` with your settings:
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="your-secure-random-jwt-secret-key"

# Neon PostgreSQL Connection String
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require"
```
*(Never commit your real `.env` file to Git. It is automatically excluded by `.gitignore`.)*

#### Frontend Configuration
Navigate to the `frontend/` directory and create your `.env.local` file:
```powershell
cd ../frontend
cp .env.example .env.local
```
Contents of `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

---

### 2. Database Migrations & Prisma Setup

From the `backend/` directory, validate and deploy the schema to your Neon database:
```powershell
cd backend

# Validate schema syntax
npx prisma validate

# Deploy migrations to Neon
npx prisma migrate deploy

# Generate strongly typed Prisma Client
npx prisma generate
```

#### Seed Development Data (Optional)
To populate realistic Addis Ababa test listings:
```powershell
npm run seed
```

#### Promote an Administrator
To promote any registered user to an `ADMIN`:
```powershell
npm run promote-admin <user-email>
```

---

### 3. Running the Application Locally

#### Start the Backend API (Port 5000)
```powershell
cd backend
npm run dev
```
Health check endpoint: `http://localhost:5000/api/health`

#### Start the Frontend (Port 3000)
In a separate terminal window:
```powershell
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

### Backend Automated Test Suite
Run the 14 comprehensive API integration tests:
```powershell
cd backend
npm test
```
**Test Coverage:**
1. Health & Database connectivity check
2. User registration (validation & duplicate rejection)
3. User login (password verification & safe response)
4. Protected profile endpoint (`/api/auth/me`)
5. Listing creation (`POST /api/items`)
6. Search, category, and location filtering (`GET /api/items`)
7. Single item details with reporter info
8. Ownership claim submission (rejects self-claims & duplicate claims)
9. Claimant and owner claim retrieval
10. Claim approval and automated listing status transition to `CLAIMED`
11. Ownership edit restrictions (403 on unauthorized modification)
12. Matching suggestions between Lost and Found reports
13. Abuse / fraud report submission
14. Admin authorization protection (403 for non-admins)

### Production Builds & Typechecks
```powershell
# Backend TypeScript compilation
cd backend
npm run build

# Frontend Next.js production build
cd frontend
npm run build
npm run lint
```

---

## 📡 API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Server readiness & database health |
| **POST** | `/api/auth/register` | Public (Rate-limited) | Register a new user |
| **POST** | `/api/auth/login` | Public (Rate-limited) | Sign in and receive token/cookie |
| **POST** | `/api/auth/logout` | Public | Clear session cookies |
| **GET** | `/api/auth/me` | Authenticated | Retrieve current user session |
| **GET** | `/api/items` | Public | List & search items (pagination, filters) |
| **GET** | `/api/items/:id` | Public | Item details |
| **GET** | `/api/items/:id/matches` | Public | Matching suggestions |
| **POST** | `/api/items` | Authenticated | Create a new lost or found listing |
| **PATCH** | `/api/items/:id` | Owner / Admin | Update a listing |
| **DELETE** | `/api/items/:id` | Owner / Admin | Delete or archive a listing |
| **POST** | `/api/items/:id/claims` | Authenticated | Submit ownership claim |
| **GET** | `/api/claims/mine` | Authenticated | Retrieve claims submitted by user |
| **GET** | `/api/claims/items/:id/claims` | Owner / Admin | Retrieve claims on a user's item |
| **PATCH** | `/api/claims/:id` | Owner / Admin | Approve or reject a claim |
| **POST** | `/api/items/:id/reports` | Authenticated | Report a listing for abuse/fraud |
| **GET** | `/api/admin/stats` | Admin Only | Platform overview statistics |
| **GET** | `/api/admin/reports` | Admin Only | View flagged abuse reports |
| **PATCH** | `/api/admin/reports/:id` | Admin Only | Resolve or dismiss abuse report |

---

## 🔒 Security Best Practices

1. **Password Security:** Plaintext passwords are never stored. Passwords are salted and hashed using `bcryptjs` with 10 rounds.
2. **Session Security:** JWTs are stored in HttpOnly cookies with `SameSite=Lax` and `Secure=true` in production to prevent XSS credential extraction.
3. **Privilege Escalation Protection:** User registration defaults strictly to `Role.USER`. Admin privileges cannot be self-assigned through API calls.
4. **Data Minimization:** APIs never return `passwordHash` or unnecessary private claimant details in public responses.
5. **Rate Limiting:** Protects `/api/auth` from credential stuffing attacks.

---

## 🚢 Deployment Guide

### Database (Neon)
* The Neon PostgreSQL database is already provisioned and running.
* Run `npx prisma migrate deploy` in your production deployment pipeline.

### Backend Hosting (Render, Railway, or AWS)
* **Root Directory:** `backend`
* **Build Command:** `npm install && npm run build`
* **Start Command:** `npm start`
* **Environment Variables:** Set `PORT`, `NODE_ENV=production`, `FRONTEND_URL`, `JWT_SECRET`, and `DATABASE_URL`.

### Frontend Hosting (Vercel)
* **Root Directory:** `frontend`
* **Framework:** Next.js
* **Build Command:** `npm run build`
* **Environment Variables:** Set `NEXT_PUBLIC_API_URL` to your production backend URL (e.g. `https://lost-found-addis-api.onrender.com/api`).

---

## 📄 License
This project is licensed under the ISC License.