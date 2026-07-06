# FixItNow API Documentation

**Base URL:** `http://localhost:5001/api`

**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Pagination](#pagination)
6. [Auth APIs](#auth-apis)
7. [Public APIs](#public-apis)
8. [Customer APIs](#customer-apis)
9. [Technician APIs](#technician-apis)
10. [Payment APIs](#payment-apis)
11. [Review APIs](#review-apis)
12. [Admin APIs](#admin-apis)
13. [End-to-End Flow](#end-to-end-flow)

---

## Overview

FixItNow is a home services marketplace API. Users register as **customers** or **technicians**. Customers browse services, book technicians, pay online, and leave reviews. Technicians manage profiles, services, availability, and job status.

### Roles

| Role | Description |
|------|-------------|
| `CUSTOMER` | Books services, makes payments, writes reviews |
| `TECHNICIAN` | Offers services, accepts jobs, updates job status |
| `ADMIN` | Manages users, bookings, and categories |

### Booking Status Flow

```
REQUESTED → ACCEPTED → PAID → IN_PROGRESS → COMPLETED
         ↘ DECLINED
         ↘ CANCELLED
```

| Status | Meaning |
|--------|---------|
| `REQUESTED` | Customer created booking; awaiting technician response |
| `ACCEPTED` | Technician accepted; payment unlocked |
| `DECLINED` | Technician declined |
| `PAID` | Payment completed |
| `IN_PROGRESS` | Technician started the job |
| `COMPLETED` | Job finished; review unlocked |
| `CANCELLED` | Booking cancelled |

---

## Authentication

Protected endpoints require a JWT token.

**Header:**

```
Authorization: Bearer <access_token>
```

Tokens are returned from `POST /auth/register` and `POST /auth/login`.

**Token payload:**

```json
{
  "userId": "cuid...",
  "email": "user@example.com",
  "role": "CUSTOMER"
}
```

**Cookie (optional):** Login also sets an `accessToken` httpOnly cookie.

---

## Response Format

### Success (single resource)

```json
{
  "success": true,
  "message": "Description of result",
  "data": { }
}
```

### Success (paginated list)

```json
{
  "success": true,
  "message": "Description of result",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "data": []
}
```

### Validation error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Application error

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation / business rule violation |
| `401` | Missing or invalid token |
| `403` | Forbidden (wrong role or banned user) |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already registered) |
| `500` | Internal server error |
| `502` | Payment gateway error |

---

## Pagination

List endpoints support query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (min: 1) |
| `limit` | number | `10` | Items per page (min: 1, max: 100) |

**Example:** `GET /api/services?page=1&limit=10`

---

## Auth APIs

### Register

Create a new customer or technician account.

```
POST /auth/register
```

**Auth:** Public

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "01712345678",
  "role": "CUSTOMER"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Min 2 characters |
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Min 6 characters |
| `phone` | string | No | |
| `role` | string | Yes | `CUSTOMER` or `TECHNICIAN` |

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cmr85mm0800035najrx5t5wpa",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "01712345678",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "createdAt": "2026-07-06T10:00:00.000Z",
      "updatedAt": "2026-07-06T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

```
POST /auth/login
```

**Auth:** Public

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "cmr85mm0800035najrx5t5wpa",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User

```
GET /auth/me
```

**Auth:** Bearer token (any role)

**Response (200):**

```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "id": "cmr85mm0800035najrx5t5wpa",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01712345678",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

---

## Public APIs

No authentication required.

### List Categories

```
GET /categories
```

**Response (200):**

```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [
    {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "name": "Plumbing",
      "description": "Pipe and water related services",
      "icon": "🔧",
      "createdAt": "2026-07-05T10:00:00.000Z"
    }
  ]
}
```

---

### List Services

```
GET /services
```

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `categoryId` | string | Filter by category |
| `location` | string | Filter by technician location |
| `minRating` | number | Min technician rating (0–5) |
| `minPrice` | number | Minimum service price |
| `maxPrice` | number | Maximum service price |
| `search` | string | Search title/description |

**Example:** `GET /services?categoryId=abc&minPrice=500&maxPrice=3000`

**Response (200):**

```json
{
  "success": true,
  "message": "Services fetched successfully",
  "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 },
  "data": [
    {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "title": "Pipe Leak Repair",
      "description": "Fix leaking pipes",
      "price": 1500,
      "isActive": true,
      "category": { "id": "...", "name": "Plumbing", "icon": "🔧" },
      "technician": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "location": "Dhaka",
        "avgRating": 4.5,
        "user": { "id": "...", "name": "Md Parvej" }
      }
    }
  ]
}
```

---

### List Technicians

```
GET /technicians
```

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `location` | string | Filter by location |
| `minRating` | number | Minimum average rating |
| `categoryId` | string | Has active service in category |
| `search` | string | Search name, location, bio |

**Response (200):**

```json
{
  "success": true,
  "message": "Technicians fetched successfully",
  "meta": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 },
  "data": [
    {
      "id": "cmr87xylm0000gnajs79t2v38",
      "bio": "Experienced plumber",
      "skills": ["Plumbing", "Pipe fitting"],
      "experienceYears": 5,
      "hourlyRate": 500,
      "location": "Dhaka",
      "avgRating": 4.5,
      "totalReviews": 12,
      "user": { "id": "...", "name": "Md Parvej", "phone": "017..." }
    }
  ]
}
```

---

### Get Technician Profile

```
GET /technicians/:id
```

**Response (200):** Full technician profile including services, availability slots, and recent reviews.

---

## Customer APIs

**Required role:** `CUSTOMER`

### Create Booking

```
POST /bookings
```

**Body:**

```json
{
  "serviceId": "cmr8cd3fw00039pajy6j2qabf",
  "scheduledAt": "2026-07-10T10:00:00.000Z",
  "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
  "notes": "Kitchen sink is leaking"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `serviceId` | string | Yes | Active service ID |
| `scheduledAt` | date (ISO) | Yes | Future date/time |
| `address` | string | Yes | Min 5 characters |
| `notes` | string | No | Extra instructions |

**Response (201):** Booking with `status: "REQUESTED"`

---

### List My Bookings

```
GET /bookings
```

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | Filter: `REQUESTED`, `ACCEPTED`, `PAID`, `IN_PROGRESS`, `COMPLETED`, `DECLINED`, `CANCELLED` |

**Example:** `GET /bookings?status=ACCEPTED&page=1`

---

### Get Booking Details

```
GET /bookings/:id
```

Returns booking with service, technician, payment, and review info.

---

## Technician APIs

**Base path:** `/technician`

**Required role:** `TECHNICIAN`

### Update Profile

```
PUT /technician/profile
```

**Body (at least one field required):**

```json
{
  "bio": "Certified plumber with 5 years experience",
  "skills": ["Plumbing", "Pipe fitting", "Water heater"],
  "experienceYears": 5,
  "hourlyRate": 500,
  "location": "Dhaka, Mirpur"
}
```

---

### Update Availability

```
PUT /technician/availability
```

**Body:**

```json
{
  "slots": [
    { "day": "SATURDAY", "startTime": "09:00", "endTime": "18:00" },
    { "day": "SUNDAY", "startTime": "10:00", "endTime": "16:00" },
    { "day": "MONDAY", "startTime": "09:00", "endTime": "18:00" }
  ]
}
```

| Field | Values |
|-------|--------|
| `day` | `SATURDAY`, `SUNDAY`, `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY` |
| `startTime` | `HH:mm` format (e.g. `09:00`) |
| `endTime` | `HH:mm` format (must be after `startTime`) |

---

### List My Bookings

```
GET /technician/bookings
```

**Query parameters:** `page`, `limit`, `status` (same status values as customer bookings)

---

### Update Booking Status

```
PATCH /technician/bookings/:id
```

**Body:**

```json
{
  "status": "ACCEPTED"
}
```

**Allowed transitions:**

| Current status | Allowed next statuses |
|----------------|----------------------|
| `REQUESTED` | `ACCEPTED`, `DECLINED` |
| `PAID` | `IN_PROGRESS` |
| `IN_PROGRESS` | `COMPLETED` |

**Examples:**

Accept a booking:
```json
{ "status": "ACCEPTED" }
```

Decline a booking:
```json
{ "status": "DECLINED" }
```

Start job (after payment):
```json
{ "status": "IN_PROGRESS" }
```

Complete job:
```json
{ "status": "COMPLETED" }
```

---

### Manage Services

#### List my services

```
GET /technician/services
```

#### Create service

```
POST /technician/services
```

**Body:**

```json
{
  "title": "Pipe Leak Repair",
  "description": "Fix leaking pipes in kitchen and bathroom",
  "price": 1500,
  "categoryId": "cmr8cd3fw00039pajy6j2qabf"
}
```

#### Update service

```
PATCH /technician/services/:id
```

**Body (at least one field):**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "price": 1800,
  "categoryId": "...",
  "isActive": false
}
```

#### Delete service

```
DELETE /technician/services/:id
```

Fails if the service has linked bookings. Use `isActive: false` instead.

---

## Payment APIs

### ShurjoPay Callback (public)

```
GET /payments/shurjopay/callback?order_id=SP1783363257829
POST /payments/shurjopay/callback
```

**Auth:** None

Verifies payment with ShurjoPay and marks booking as `PAID`.

---

### Create Payment Session

```
POST /payments/create
```

**Auth:** Customer

**Prerequisite:** Booking status must be `ACCEPTED`

**Body:**

```json
{
  "bookingId": "cmr9jqeun0000c8ajp13sb43v",
  "provider": "SHURJOPAY"
}
```

| Field | Type | Values |
|-------|------|--------|
| `bookingId` | string | Booking ID |
| `provider` | string | `SHURJOPAY`, `SSLCOMMERZ`, `STRIPE` |

**Response (201):**

```json
{
  "success": true,
  "message": "Payment session created successfully",
  "data": {
    "payment": {
      "id": "cmr9kfsv30000oaajgvhfdrno",
      "transactionId": "SP1783363257829",
      "bookingId": "cmr9jqeun0000c8ajp13sb43v",
      "amount": 1500,
      "currency": "BDT",
      "provider": "SHURJOPAY",
      "status": "PENDING",
      "paidAt": null,
      "booking": {
        "id": "cmr9jqeun0000c8ajp13sb43v",
        "status": "ACCEPTED"
      }
    },
    "gatewayUrl": "https://sandbox.securepay.shurjopayment.com/spaycheckout/?token=...",
    "sessionId": null
  }
}
```

**Field mapping for confirm:**

| Response field | Confirm field |
|----------------|---------------|
| `payment.id` | `paymentId` |
| `payment.transactionId` | `orderId` |

Open `gatewayUrl` in a browser to complete payment before confirming.

---

### Confirm Payment

```
POST /payments/confirm
```

**Auth:** Customer

#### ShurjoPay

```json
{
  "paymentId": "cmr9kfsv30000oaajgvhfdrno",
  "orderId": "SP1783363257829"
}
```

`orderId` is optional — defaults to `payment.transactionId`.

#### SSLCommerz

```json
{
  "paymentId": "pay_id_here",
  "val_id": "VALIDATION_ID_FROM_SSLCOMMERZ"
}
```

#### Stripe

```json
{
  "paymentId": "pay_id_here",
  "sessionId": "cs_test_..."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "id": "cmr9kfsv30000oaajgvhfdrno",
    "status": "COMPLETED",
    "paidAt": "2026-07-06T18:45:00.000Z",
    "booking": {
      "status": "PAID"
    }
  }
}
```

---

### List My Payments

```
GET /payments
```

**Query parameters:** `page`, `limit`, `status` (`PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`)

---

### Get Payment Details

```
GET /payments/:id
```

---

## Review APIs

### Create Review

```
POST /reviews
```

**Auth:** Customer

**Prerequisite:** Booking status must be `COMPLETED`

**Body:**

```json
{
  "bookingId": "cmr9jqeun0000c8ajp13sb43v",
  "rating": 5,
  "comment": "Excellent work, very professional!"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `bookingId` | string | Yes | Completed booking ID |
| `rating` | number | Yes | Integer 1–5 |
| `comment` | string | No | Optional feedback |

**Response (201):** Review object. Technician `avgRating` and `totalReviews` are updated automatically.

---

## Admin APIs

**Base path:** `/admin`

**Required role:** `ADMIN`

### List Users

```
GET /admin/users
```

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `role` | string | `CUSTOMER`, `TECHNICIAN`, `ADMIN` |
| `status` | string | `ACTIVE`, `BANNED` |
| `search` | string | Search name or email |

---

### Update User Status

```
PATCH /admin/users/:id
```

**Body:**

```json
{
  "status": "BANNED"
}
```

Values: `ACTIVE`, `BANNED`

---

### List All Bookings

```
GET /admin/bookings
```

**Query parameters:** `page`, `limit`, `status`

---

### Manage Categories

#### List categories

```
GET /admin/categories
```

#### Create category

```
POST /admin/categories
```

**Body:**

```json
{
  "name": "Plumbing",
  "description": "Water and pipe related services",
  "icon": "🔧"
}
```

#### Update category

```
PATCH /admin/categories/:id
```

**Body (at least one field):**

```json
{
  "name": "Plumbing & Water",
  "description": "Updated description",
  "icon": "🚿"
}
```

#### Delete category

```
DELETE /admin/categories/:id
```

---

## End-to-End Flow

Complete test flow using Postman:

### Step 1 — Register users

```http
POST /api/auth/register
{ "name": "Customer", "email": "customer@test.com", "password": "123456", "role": "CUSTOMER" }

POST /api/auth/register
{ "name": "Technician", "email": "tech@test.com", "password": "123456", "role": "TECHNICIAN" }
```

Save both tokens.

### Step 2 — Technician setup

```http
PUT /api/technician/profile          (technician token)
PUT /api/technician/availability     (technician token)
POST /api/technician/services        (technician token)
```

### Step 3 — Customer books service

```http
GET /api/services                    (no auth)
POST /api/bookings                   (customer token)
```

### Step 4 — Technician accepts

```http
PATCH /api/technician/bookings/:bookingId
{ "status": "ACCEPTED" }             (technician token)
```

### Step 5 — Customer pays

```http
POST /api/payments/create
{ "bookingId": "...", "provider": "SHURJOPAY" }   (customer token)
```

Open `gatewayUrl` → complete sandbox payment.

```http
POST /api/payments/confirm
{ "paymentId": "...", "orderId": "..." }          (customer token)
```

### Step 6 — Technician completes job

```http
PATCH /api/technician/bookings/:bookingId
{ "status": "IN_PROGRESS" }          (technician token)

PATCH /api/technician/bookings/:bookingId
{ "status": "COMPLETED" }            (technician token)
```

### Step 7 — Customer reviews

```http
POST /api/reviews
{ "bookingId": "...", "rating": 5, "comment": "Great job!" }  (customer token)
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Payment can only be created for accepted bookings` | Booking is `REQUESTED` | Technician must accept first |
| `Customer access required` | Wrong role token | Use customer token |
| `Technician access required` | Wrong role token | Use technician token |
| `Booking not found` | Wrong ID or wrong customer | Check booking ID and token |
| `Reviews can only be created for completed bookings` | Booking not `COMPLETED` | Finish the job first |
| `Invalid or expired token` | Bad/expired JWT | Login again |

---

## Postman Collection Tips

1. Create environment variables: `baseUrl`, `customerToken`, `technicianToken`, `bookingId`, `paymentId`
2. Set `baseUrl` = `http://localhost:5001/api`
3. Use **Authorization → Bearer Token** tab for protected routes
4. Use **different tokens** for customer vs technician requests
5. After create payment, save `data.payment.id` as `paymentId` and `data.payment.transactionId` as `orderId`
