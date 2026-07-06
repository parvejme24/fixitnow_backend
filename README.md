# FixItNow Backend

REST API for **FixItNow** — a home services marketplace where customers book technicians, pay online, and leave reviews after completed jobs.

Built with **Node.js**, **Express 5**, **TypeScript**, **Prisma 7**, and **PostgreSQL**.

## Links

| | URL |
|---|---|
| **Live API** | [https://fixitnow-backend-weld.vercel.app](https://fixitnow-backend-weld.vercel.app) |
| **API Base URL** | [https://fixitnow-backend-weld.vercel.app/api](https://fixitnow-backend-weld.vercel.app/api) |
| **GitHub Repository** | [https://github.com/parvejme24/fixitnow_backend](https://github.com/parvejme24/fixitnow_backend) |

---

## Features

- JWT authentication with role-based access (`CUSTOMER`, `TECHNICIAN`, `ADMIN`)
- Browse categories, services, and technicians (public)
- Customer booking lifecycle
- Technician profile, availability, services, and booking management
- Payments via **ShurjoPay**, **SSLCommerz**, or **Stripe**
- Post-job reviews with automatic technician rating updates
- Admin panel APIs (users, bookings, categories)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Payments | ShurjoPay, SSLCommerz, Stripe |

---

## Project Structure

```
fixitnow-backend/
├── api/
│   └── index.ts               # Vercel serverless entry point
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app.ts                 # Express app & route mounting
│   ├── server.ts              # Local dev server entry point
│   ├── config/                # Environment config
│   ├── lib/                   # Prisma, payment gateways
│   ├── middleware/            # Auth, roles, error handling
│   ├── module/
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── category/
│   │   ├── service/
│   │   ├── technician/
│   │   ├── payment/
│   │   ├── review/
│   │   └── admin/
│   └── utils/
├── docs/
│   └── API.md                 # Full API documentation
├── generated/prisma/          # Prisma client (generated)
├── vercel.json                # Vercel deployment config
└── .env.example               # Environment variable template
```

---

## Getting Started

Follow these steps to run the project locally from scratch.

### Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** — [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download Git](https://git-scm.com/)
- **PostgreSQL database** — e.g. free hosted DB from [Neon](https://neon.tech)

Check your versions:

```bash
node -v    # should be v18 or higher
npm -v
git -v
```

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/parvejme24/fixitnow_backend.git
cd fixitnow_backend
```

---

### Step 2 — Install dependencies

```bash
npm install
```

This installs all packages and automatically runs `prisma generate` via the `postinstall` script.

---

### Step 3 — Set up environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` in your editor and fill in the values:

```env
# Database (required)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Server (required)
PORT=5001
NODE_ENV=development
APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001

# Auth (required)
JWT_SECRET=your-strong-secret-key
JWT_EXPIRES_IN=7d

# ShurjoPay — sandbox (required for payment testing)
SP_ENDPOINT=https://sandbox.shurjopayment.com
SP_USERNAME=your_shurjopay_username
SP_PASSWORD=your_shurjopay_password
SP_PREFIX=SP
SP_RETURN_URL=http://localhost:5001/api/payments/shurjopay/callback

# SSLCommerz (optional)
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_LIVE=false

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

#### Environment variable reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string from Neon or local Postgres |
| `PORT` | No | Server port (default: `5001`) |
| `NODE_ENV` | No | `development` or `production` |
| `APP_URL` | Yes | Frontend URL — used for CORS |
| `BACKEND_URL` | Yes | Backend URL — used for payment callbacks |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `SP_ENDPOINT` | Yes* | ShurjoPay API base URL |
| `SP_USERNAME` | Yes* | ShurjoPay merchant username |
| `SP_PASSWORD` | Yes* | ShurjoPay merchant password |
| `SP_PREFIX` | No | Order ID prefix (default: `SP`) |
| `SP_RETURN_URL` | Yes* | ShurjoPay payment callback URL |
| `SSLCOMMERZ_STORE_ID` | No | SSLCommerz store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | No | SSLCommerz store password |
| `SSLCOMMERZ_IS_LIVE` | No | `true` for live, `false` for sandbox |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |

\* Required if you use ShurjoPay payments.

#### Get a free database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the **connection string** from the dashboard
4. Paste it as `DATABASE_URL` in your `.env` file

---

### Step 4 — Set up the database

Push the Prisma schema to your database (creates all tables):

```bash
npx prisma db push
```

Generate the Prisma client (if not already done):

```bash
npm run prisma:generate
```

Optional — open Prisma Studio to view/edit data in the browser:

```bash
npx prisma studio
```

---

### Step 5 — Run the development server

```bash
npm run dev
```

You should see:

```
Connected to the database successfully.
Server is running at http://localhost:5001
```

---

### Step 6 — Verify the server is working

Open your browser or use curl:

```bash
curl http://localhost:5001/
```

Expected response:

```
Welcome to FixItNow API
```

Test a public API endpoint:

```bash
curl http://localhost:5001/api/categories
```

API base URL for Postman:

```
http://localhost:5001/api
```

---

### Available npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build locally |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run deploy` | Deploy preview to Vercel |
| `npm run deploy:prod` | Deploy production to Vercel |

---

### Quick local setup (copy-paste)

Run all setup commands in order:

```bash
# 1. Clone
git clone https://github.com/parvejme24/fixitnow_backend.git
cd fixitnow_backend

# 2. Install
npm install

# 3. Environment
cp .env.example .env
# → Edit .env and add your DATABASE_URL, JWT_SECRET, ShurjoPay keys

# 4. Database
npx prisma db push

# 5. Run
npm run dev
```

---

## Booking Lifecycle

```
REQUESTED → ACCEPTED → PAID → IN_PROGRESS → COMPLETED
         ↘ DECLINED
         ↘ CANCELLED (before IN_PROGRESS)
```

| Step | Who | Action |
|------|-----|--------|
| 1 | Customer | Create booking (`POST /api/bookings`) |
| 2 | Technician | Accept booking (`PATCH /api/technician/bookings/:id`) |
| 3 | Customer | Create payment (`POST /api/payments/create`) |
| 4 | Customer | Pay on gateway, then confirm (`POST /api/payments/confirm`) |
| 5 | Technician | Start job (`status: IN_PROGRESS`) |
| 6 | Technician | Complete job (`status: COMPLETED`) |
| 7 | Customer | Leave review (`POST /api/reviews`) |

---

## Authentication

Protected routes require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/auth/register` or `POST /api/auth/login`.

| Role | Access |
|------|--------|
| `CUSTOMER` | Bookings, payments, reviews |
| `TECHNICIAN` | Profile, services, booking status updates |
| `ADMIN` | User management, all bookings, category CRUD |

---

## Payment Providers

| Provider | Currency | Confirm field |
|----------|----------|---------------|
| `SHURJOPAY` | BDT | `paymentId` (+ optional `orderId`) |
| `SSLCOMMERZ` | BDT | `paymentId` + `val_id` |
| `STRIPE` | USD | `paymentId` + `sessionId` |

ShurjoPay also supports a public callback:

```
GET /api/payments/shurjopay/callback?order_id=<transactionId>
```

---

## API Documentation

Full endpoint reference with request/response examples:

**[docs/API.md](./docs/API.md)**

### Quick endpoint overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register customer/technician |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Any | Current user profile |
| GET | `/api/categories` | Public | List categories |
| GET | `/api/services` | Public | List services |
| GET | `/api/technicians` | Public | List technicians |
| GET | `/api/technicians/:id` | Public | Technician details |
| POST | `/api/bookings` | Customer | Create booking |
| GET | `/api/bookings` | Customer | My bookings |
| GET | `/api/bookings/:id` | Customer | Booking details |
| PUT | `/api/technician/profile` | Technician | Update profile |
| PUT | `/api/technician/availability` | Technician | Set weekly slots |
| GET | `/api/technician/bookings` | Technician | My assigned bookings |
| PATCH | `/api/technician/bookings/:id` | Technician | Update booking status |
| GET/POST/PATCH/DELETE | `/api/technician/services` | Technician | Manage services |
| POST | `/api/payments/create` | Customer | Start payment |
| POST | `/api/payments/confirm` | Customer | Confirm payment |
| GET | `/api/payments` | Customer | Payment history |
| GET | `/api/payments/:id` | Customer | Payment details |
| POST | `/api/reviews` | Customer | Submit review |
| GET | `/api/admin/users` | Admin | List users |
| PATCH | `/api/admin/users/:id` | Admin | Ban/unban user |
| GET | `/api/admin/bookings` | Admin | All bookings |
| GET/POST/PATCH/DELETE | `/api/admin/categories` | Admin | Manage categories |

---

## Standard Response Format

**Success:**

```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

**Paginated success:**

```json
{
  "success": true,
  "message": "...",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  },
  "data": []
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Testing with Postman

1. Register a **customer** and a **technician**
2. Technician creates a **service** and sets **availability**
3. Customer creates a **booking**
4. Technician **accepts** the booking (`status: ACCEPTED`)
5. Customer **creates payment** with `provider: "SHURJOPAY"`
6. Open `gatewayUrl` and complete sandbox payment
7. Customer **confirms payment**
8. Technician moves booking to `IN_PROGRESS` → `COMPLETED`
9. Customer submits a **review**

Use separate Bearer tokens for customer and technician requests.

---

## Deploy to Vercel

This project is configured for [Vercel](https://vercel.com) serverless deployment.

### Files added for Vercel

| File | Purpose |
|------|---------|
| `api/index.ts` | Serverless entry point (exports Express app) |
| `vercel.json` | Rewrites all routes to the API function |

### Deploy steps

#### Option A — Vercel CLI

```bash
# Login (no global install needed)
npx vercel login

# Deploy preview
npx vercel

# Deploy to production
npx vercel --prod
```

Or use npm scripts:

```bash
npm run deploy        # preview
npm run deploy:prod   # production
```

#### Option B — GitHub integration

1. Push this repo to [GitHub](https://github.com/parvejme24/fixitnow_backend)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects settings from `vercel.json`
5. Add environment variables (see below)
6. Click **Deploy**

### Required Vercel environment variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...-pooler...` | Use **pooled** Neon URL for serverless |
| `JWT_SECRET` | `your-production-secret` | Strong random string |
| `NODE_ENV` | `production` | |
| `APP_URL` | `https://your-frontend.vercel.app` | Frontend URL for CORS |
| `BACKEND_URL` | `https://fixitnow-backend-weld.vercel.app` | Your Vercel deployment URL |
| `SP_ENDPOINT` | `https://sandbox.shurjopayment.com` | Or live endpoint |
| `SP_USERNAME` | `sp_sandbox` | ShurjoPay credentials |
| `SP_PASSWORD` | `your-password` | ShurjoPay credentials |
| `SP_PREFIX` | `SP` | |
| `SP_RETURN_URL` | `https://fixitnow-backend-weld.vercel.app/api/payments/shurjopay/callback` | Must match deployed URL |

`VERCEL_URL` is set automatically by Vercel. If `BACKEND_URL` is omitted, the app falls back to `https://<VERCEL_URL>`.

### Database setup (one time)

Run locally against your production database before first deploy:

```bash
npx prisma db push
```

Or use Prisma Migrate if you add migrations later.

### After deployment

Test the API:

```
GET https://fixitnow-backend-weld.vercel.app/
```

Expected response: `Welcome to FixItNow API`

API base URL:

```
https://fixitnow-backend-weld.vercel.app/api
```

Update your Postman `BaseURL` and ShurjoPay `SP_RETURN_URL` to the production URL above.

### Notes

- Local dev still uses `npm run dev` with `src/server.ts`
- Vercel uses `api/index.ts` as the serverless handler
- Prisma client is generated automatically via `postinstall` / `vercel-build`
- Use Neon **connection pooler** URL (`-pooler` in hostname) for serverless

---

## License

ISC
