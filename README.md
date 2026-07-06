# FixItNow Backend

REST API for **FixItNow** — a home services marketplace where customers book technicians, pay online, and leave reviews after completed jobs.

Built with **Node.js**, **Express 5**, **TypeScript**, **Prisma 7**, and **PostgreSQL**.

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
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app.ts                 # Express app & route mounting
│   ├── server.ts              # Server entry point
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
└── generated/prisma/          # Prisma client (generated)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fixitnow-backend

# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

Server runs at **http://localhost:5001** by default.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm run prisma:generate` | Generate Prisma client |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Server
PORT=5001
NODE_ENV=development
APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001

# Auth
JWT_SECRET=your-strong-secret-key
JWT_EXPIRES_IN=7d

# ShurjoPay (sandbox)
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

## License

ISC
