# FixItNow API Documentation

**Base URL:** `http://localhost:5001/api`

**Production:** `https://your-project.vercel.app/api`

**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Auth APIs](#auth-apis)
6. [Public APIs](#public-apis)
7. [Customer APIs](#customer-apis)
8. [Technician APIs](#technician-apis)
9. [Payment APIs](#payment-apis)
10. [Review APIs](#review-apis)
11. [Admin APIs](#admin-apis)
12. [End-to-End Flow](#end-to-end-flow)
13. [Common Errors](#common-errors)

---

## Overview

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

---

## Authentication

Protected endpoints require:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Get token from `POST /auth/register` or `POST /auth/login`.

---

## Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Paginated:**
```json
{ "success": true, "message": "...", "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }, "data": [] }
```

**Error:**
```json
{ "success": false, "message": "Error description" }
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `400` | Validation / business rule error |
| `401` | Missing or invalid token |
| `403` | Wrong role or banned user |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, review, etc.) |
| `500` | Internal server error |
| `502` | Payment gateway error |

---

## Auth APIs

---

### 1. Register

**`POST /auth/register`**

| | |
|---|---|
| **Auth** | None (Public) |

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "01712345678",
  "role": "CUSTOMER"
}
```

**Register as technician:**
```json
{
  "name": "Md Parvej",
  "email": "tech@example.com",
  "password": "password123",
  "phone": "01798765432",
  "role": "TECHNICIAN"
}
```

**Response `201`:**
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXI4NW1tMDgwMDAzNW5hanJ4NXQ1d3BhIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzgzMzYwMDAwLCJleHAiOjE3ODM5NjQ4MDB9.xxx"
  }
}
```

**Error `409`:**
```json
{
  "success": false,
  "message": "Email is already registered"
}
```

---

### 2. Login

**`POST /auth/login`**

| | |
|---|---|
| **Auth** | None (Public) |

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged in successfully",
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

**Error `401`:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Current User

**`GET /auth/me`**

| | |
|---|---|
| **Auth** | Bearer token (any role) |

**Request body:** None

**Response `200` (Customer):**
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
    "status": "ACTIVE",
    "createdAt": "2026-07-06T10:00:00.000Z",
    "updatedAt": "2026-07-06T10:00:00.000Z",
    "technicianProfile": null
  }
}
```

**Response `200` (Technician):**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "id": "cmr85mm0800035najrx5t5wpa",
    "name": "Md Parvej",
    "email": "tech@example.com",
    "role": "TECHNICIAN",
    "status": "ACTIVE",
    "technicianProfile": {
      "id": "cmr87xylm0000gnajs79t2v38",
      "bio": "Certified plumber",
      "skills": ["Plumbing", "Pipe fitting"],
      "experienceYears": 5,
      "hourlyRate": 500,
      "location": "Dhaka, Mirpur",
      "avgRating": 4.5,
      "totalReviews": 12
    }
  }
}
```

---

## Public APIs

No authentication required.

---

### 4. List Categories

**`GET /categories`**

**Request body:** None

**Response `200`:**
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
    },
    {
      "id": "cmr8cd3fw00039pajy6j2qac0",
      "name": "Electrical",
      "description": "Electrical repair and installation",
      "icon": "⚡",
      "createdAt": "2026-07-05T10:00:00.000Z"
    }
  ]
}
```

---

### 5. List Services

**`GET /services`**

**Query parameters:**
```
GET /services?page=1&limit=10&categoryId=cmr8cd3fw00039pajy6j2qabf&minPrice=500&maxPrice=3000&location=Dhaka&search=pipe
```

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `categoryId` | string | Filter by category |
| `location` | string | Filter by technician location |
| `minRating` | number | Min technician rating (0–5) |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `search` | string | Search title/description |

**Response `200`:**
```json
{
  "success": true,
  "message": "Services fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "title": "Pipe Leak Repair",
      "description": "Fix leaking pipes in kitchen and bathroom",
      "price": 1500,
      "isActive": true,
      "createdAt": "2026-07-05T12:00:00.000Z",
      "updatedAt": "2026-07-05T12:00:00.000Z",
      "category": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "name": "Plumbing",
        "icon": "🔧"
      },
      "technician": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "location": "Dhaka, Mirpur",
        "avgRating": 4.5,
        "user": {
          "id": "cmr85mm0800035najrx5t5wpa",
          "name": "Md Parvej"
        }
      }
    }
  ]
}
```

---

### 6. List Technicians

**`GET /technicians`**

**Query parameters:**
```
GET /technicians?page=1&limit=10&location=Dhaka&minRating=4&categoryId=cmr8cd3fw00039pajy6j2qabf&search=plumber
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Technicians fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr87xylm0000gnajs79t2v38",
      "bio": "Certified plumber with 5 years experience",
      "skills": ["Plumbing", "Pipe fitting"],
      "experienceYears": 5,
      "hourlyRate": 500,
      "location": "Dhaka, Mirpur",
      "avgRating": 4.5,
      "totalReviews": 12,
      "user": {
        "id": "cmr85mm0800035najrx5t5wpa",
        "name": "Md Parvej",
        "phone": "01798765432"
      },
      "services": [
        {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "title": "Pipe Leak Repair",
          "price": 1500,
          "category": {
            "id": "cmr8cd3fw00039pajy6j2qabf",
            "name": "Plumbing"
          }
        }
      ]
    }
  ]
}
```

---

### 7. Get Technician Profile

**`GET /technicians/:id`**

**Example:** `GET /technicians/cmr87xylm0000gnajs79t2v38`

**Response `200`:**
```json
{
  "success": true,
  "message": "Technician profile fetched successfully",
  "data": {
    "id": "cmr87xylm0000gnajs79t2v38",
    "bio": "Certified plumber with 5 years experience",
    "skills": ["Plumbing", "Pipe fitting", "Water heater"],
    "experienceYears": 5,
    "hourlyRate": 500,
    "location": "Dhaka, Mirpur",
    "avgRating": 4.5,
    "totalReviews": 12,
    "createdAt": "2026-07-05T10:00:00.000Z",
    "user": {
      "id": "cmr85mm0800035najrx5t5wpa",
      "name": "Md Parvej",
      "phone": "01798765432",
      "email": "tech@example.com"
    },
    "services": [
      {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair",
        "description": "Fix leaking pipes",
        "price": 1500,
        "category": {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "name": "Plumbing",
          "icon": "🔧"
        }
      }
    ],
    "availability": [
      {
        "id": "cmr8avail0001",
        "day": "SATURDAY",
        "startTime": "09:00",
        "endTime": "18:00"
      },
      {
        "id": "cmr8avail0002",
        "day": "MONDAY",
        "startTime": "09:00",
        "endTime": "18:00"
      }
    ],
    "reviews": [
      {
        "id": "cmr9review001",
        "rating": 5,
        "comment": "Excellent work!",
        "createdAt": "2026-07-06T15:00:00.000Z",
        "customer": {
          "id": "cmr85cust001",
          "name": "John Doe"
        }
      }
    ]
  }
}
```

**Error `404`:**
```json
{
  "success": false,
  "message": "Technician not found"
}
```

---

## Customer APIs

**Required role:** `CUSTOMER`

---

### 8. Create Booking

**`POST /bookings`**

| | |
|---|---|
| **Auth** | Bearer token (Customer) |

**Request body:**
```json
{
  "serviceId": "cmr8cd3fw00039pajy6j2qabf",
  "scheduledAt": "2026-07-10T10:00:00.000Z",
  "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
  "notes": "Kitchen sink is leaking badly"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "cmr9jqeun0000c8ajp13sb43v",
    "scheduledAt": "2026-07-10T10:00:00.000Z",
    "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
    "notes": "Kitchen sink is leaking badly",
    "status": "REQUESTED",
    "createdAt": "2026-07-06T18:30:00.000Z",
    "updatedAt": "2026-07-06T18:30:00.000Z",
    "technician": {
      "id": "cmr87xylm0000gnajs79t2v38",
      "location": "Dhaka, Mirpur",
      "avgRating": 4.5,
      "user": {
        "id": "cmr85mm0800035najrx5t5wpa",
        "name": "Md Parvej",
        "phone": "01798765432"
      }
    },
    "service": {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "title": "Pipe Leak Repair",
      "description": "Fix leaking pipes",
      "price": 1500,
      "category": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "name": "Plumbing",
        "icon": "🔧"
      }
    },
    "payment": null,
    "review": null
  }
}
```

---

### 9. List My Bookings

**`GET /bookings`**

**Query parameters:**
```
GET /bookings?page=1&limit=10&status=ACCEPTED
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "scheduledAt": "2026-07-10T10:00:00.000Z",
      "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
      "notes": "Kitchen sink is leaking badly",
      "status": "ACCEPTED",
      "createdAt": "2026-07-06T18:30:00.000Z",
      "updatedAt": "2026-07-06T18:35:00.000Z",
      "technician": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "location": "Dhaka, Mirpur",
        "avgRating": 4.5,
        "user": {
          "id": "cmr85mm0800035najrx5t5wpa",
          "name": "Md Parvej",
          "phone": "01798765432"
        }
      },
      "service": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair",
        "description": "Fix leaking pipes",
        "price": 1500,
        "category": {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "name": "Plumbing",
          "icon": "🔧"
        }
      },
      "payment": null,
      "review": null
    }
  ]
}
```

---

### 10. Get Booking Details

**`GET /bookings/:id`**

**Example:** `GET /bookings/cmr9jqeun0000c8ajp13sb43v`

**Response `200`:**
```json
{
  "success": true,
  "message": "Booking details fetched successfully",
  "data": {
    "id": "cmr9jqeun0000c8ajp13sb43v",
    "scheduledAt": "2026-07-10T10:00:00.000Z",
    "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
    "notes": "Kitchen sink is leaking badly",
    "status": "PAID",
    "createdAt": "2026-07-06T18:30:00.000Z",
    "updatedAt": "2026-07-06T18:45:00.000Z",
    "technician": {
      "id": "cmr87xylm0000gnajs79t2v38",
      "location": "Dhaka, Mirpur",
      "avgRating": 4.5,
      "user": {
        "id": "cmr85mm0800035najrx5t5wpa",
        "name": "Md Parvej",
        "phone": "01798765432"
      }
    },
    "service": {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "title": "Pipe Leak Repair",
      "description": "Fix leaking pipes",
      "price": 1500,
      "category": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "name": "Plumbing",
        "icon": "🔧"
      }
    },
    "payment": {
      "id": "cmr9kfsv30000oaajgvhfdrno",
      "status": "COMPLETED",
      "amount": 1500,
      "provider": "SHURJOPAY",
      "paidAt": "2026-07-06T18:45:00.000Z"
    },
    "review": null
  }
}
```

---

## Technician APIs

**Base path:** `/technician`  
**Required role:** `TECHNICIAN`

---

### 11. Update Profile

**`PUT /technician/profile`**

**Request body:**
```json
{
  "bio": "Certified plumber with 5 years experience in residential plumbing",
  "skills": ["Plumbing", "Pipe fitting", "Water heater"],
  "experienceYears": 5,
  "hourlyRate": 500,
  "location": "Dhaka, Mirpur"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Technician profile updated successfully",
  "data": {
    "id": "cmr87xylm0000gnajs79t2v38",
    "bio": "Certified plumber with 5 years experience in residential plumbing",
    "skills": ["Plumbing", "Pipe fitting", "Water heater"],
    "experienceYears": 5,
    "hourlyRate": 500,
    "location": "Dhaka, Mirpur",
    "avgRating": 4.5,
    "totalReviews": 12,
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-06T19:00:00.000Z",
    "user": {
      "id": "cmr85mm0800035najrx5t5wpa",
      "name": "Md Parvej",
      "email": "tech@example.com",
      "phone": "01798765432"
    },
    "availability": []
  }
}
```

---

### 12. Update Availability

**`PUT /technician/availability`**

**Request body:**
```json
{
  "slots": [
    { "day": "SATURDAY", "startTime": "09:00", "endTime": "18:00" },
    { "day": "SUNDAY", "startTime": "10:00", "endTime": "16:00" },
    { "day": "MONDAY", "startTime": "09:00", "endTime": "18:00" },
    { "day": "WEDNESDAY", "startTime": "09:00", "endTime": "18:00" },
    { "day": "FRIDAY", "startTime": "09:00", "endTime": "18:00" }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Availability updated successfully",
  "data": {
    "id": "cmr87xylm0000gnajs79t2v38",
    "bio": "Certified plumber",
    "skills": ["Plumbing"],
    "experienceYears": 5,
    "hourlyRate": 500,
    "location": "Dhaka, Mirpur",
    "avgRating": 4.5,
    "totalReviews": 12,
    "user": {
      "id": "cmr85mm0800035najrx5t5wpa",
      "name": "Md Parvej",
      "email": "tech@example.com",
      "phone": "01798765432"
    },
    "availability": [
      { "id": "cmr8avail0001", "day": "SATURDAY", "startTime": "09:00", "endTime": "18:00" },
      { "id": "cmr8avail0002", "day": "SUNDAY", "startTime": "10:00", "endTime": "16:00" },
      { "id": "cmr8avail0003", "day": "MONDAY", "startTime": "09:00", "endTime": "18:00" },
      { "id": "cmr8avail0004", "day": "WEDNESDAY", "startTime": "09:00", "endTime": "18:00" },
      { "id": "cmr8avail0005", "day": "FRIDAY", "startTime": "09:00", "endTime": "18:00" }
    ]
  }
}
```

---

### 13. List My Bookings (Technician)

**`GET /technician/bookings`**

**Query parameters:**
```
GET /technician/bookings?page=1&limit=10&status=REQUESTED
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "scheduledAt": "2026-07-10T10:00:00.000Z",
      "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
      "notes": "Kitchen sink is leaking badly",
      "status": "REQUESTED",
      "createdAt": "2026-07-06T18:30:00.000Z",
      "updatedAt": "2026-07-06T18:30:00.000Z",
      "customer": {
        "id": "cmr85cust001",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "01712345678"
      },
      "service": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair",
        "price": 1500,
        "category": {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "name": "Plumbing"
        }
      },
      "payment": null
    }
  ]
}
```

---

### 14. Update Booking Status

**`PATCH /technician/bookings/:id`**

**Accept booking:**
```json
{
  "status": "ACCEPTED"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "id": "cmr9jqeun0000c8ajp13sb43v",
    "scheduledAt": "2026-07-10T10:00:00.000Z",
    "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
    "notes": "Kitchen sink is leaking badly",
    "status": "ACCEPTED",
    "createdAt": "2026-07-06T18:30:00.000Z",
    "updatedAt": "2026-07-06T18:35:00.000Z",
    "customer": {
      "id": "cmr85cust001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "01712345678"
    },
    "service": {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "title": "Pipe Leak Repair",
      "price": 1500,
      "category": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "name": "Plumbing"
      }
    },
    "payment": null
  }
}
```

**Other status examples:**

Decline:
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

**Error `400`:**
```json
{
  "success": false,
  "message": "Cannot change booking status from REQUESTED to IN_PROGRESS"
}
```

---

### 15. List My Services

**`GET /technician/services`**

**Response `200`:**
```json
{
  "success": true,
  "message": "Services fetched successfully",
  "data": [
    {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "title": "Pipe Leak Repair",
      "description": "Fix leaking pipes in kitchen and bathroom",
      "price": 1500,
      "isActive": true,
      "createdAt": "2026-07-05T12:00:00.000Z",
      "updatedAt": "2026-07-05T12:00:00.000Z",
      "category": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "name": "Plumbing",
        "icon": "🔧"
      }
    }
  ]
}
```

---

### 16. Create Service

**`POST /technician/services`**

**Request body:**
```json
{
  "title": "Pipe Leak Repair",
  "description": "Fix leaking pipes in kitchen and bathroom",
  "price": 1500,
  "categoryId": "cmr8cd3fw00039pajy6j2qabf"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "cmr8cd3fw00039pajy6j2qabf",
    "title": "Pipe Leak Repair",
    "description": "Fix leaking pipes in kitchen and bathroom",
    "price": 1500,
    "isActive": true,
    "createdAt": "2026-07-05T12:00:00.000Z",
    "updatedAt": "2026-07-05T12:00:00.000Z",
    "category": {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "name": "Plumbing",
      "icon": "🔧"
    }
  }
}
```

---

### 17. Update Service

**`PATCH /technician/services/:id`**

**Request body:**
```json
{
  "title": "Advanced Pipe Leak Repair",
  "price": 1800,
  "isActive": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "id": "cmr8cd3fw00039pajy6j2qabf",
    "title": "Advanced Pipe Leak Repair",
    "description": "Fix leaking pipes in kitchen and bathroom",
    "price": 1800,
    "isActive": true,
    "createdAt": "2026-07-05T12:00:00.000Z",
    "updatedAt": "2026-07-06T19:10:00.000Z",
    "category": {
      "id": "cmr8cd3fw00039pajy6j2qabf",
      "name": "Plumbing",
      "icon": "🔧"
    }
  }
}
```

---

### 18. Delete Service

**`DELETE /technician/services/:id`**

**Request body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Service deleted successfully",
  "data": {
    "id": "cmr8cd3fw00039pajy6j2qabf",
    "title": "Pipe Leak Repair",
    "description": "Fix leaking pipes",
    "price": 1500,
    "isActive": true,
    "categoryId": "cmr8cd3fw00039pajy6j2qabf",
    "technicianId": "cmr87xylm0000gnajs79t2v38"
  }
}
```

**Error `400`:**
```json
{
  "success": false,
  "message": "Cannot delete service that has linked bookings. Deactivate it instead."
}
```

---

## Payment APIs

---

### 19. ShurjoPay Callback (Public)

**`GET /payments/shurjopay/callback?order_id=SP1783363257829`**

| | |
|---|---|
| **Auth** | None |

**Response `200`:**
```json
{
  "success": true,
  "message": "ShurjoPay payment verified successfully",
  "data": {
    "id": "cmr9kfsv30000oaajgvhfdrno",
    "transactionId": "SP1783363257829",
    "bookingId": "cmr9jqeun0000c8ajp13sb43v",
    "amount": 1500,
    "currency": "BDT",
    "provider": "SHURJOPAY",
    "status": "COMPLETED",
    "paidAt": "2026-07-06T18:45:00.000Z",
    "booking": {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "status": "PAID"
    }
  }
}
```

---

### 20. Create Payment

**`POST /payments/create`**

| | |
|---|---|
| **Auth** | Bearer token (Customer) |
| **Prerequisite** | Booking status must be `ACCEPTED` |

**Request body (ShurjoPay):**
```json
{
  "bookingId": "cmr9jqeun0000c8ajp13sb43v",
  "provider": "SHURJOPAY"
}
```

**Request body (SSLCommerz):**
```json
{
  "bookingId": "cmr9jqeun0000c8ajp13sb43v",
  "provider": "SSLCOMMERZ"
}
```

**Request body (Stripe):**
```json
{
  "bookingId": "cmr9jqeun0000c8ajp13sb43v",
  "provider": "STRIPE"
}
```

**Response `201`:**
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
      "method": null,
      "provider": "SHURJOPAY",
      "status": "PENDING",
      "paidAt": null,
      "createdAt": "2026-07-06T18:40:58.335Z",
      "updatedAt": "2026-07-06T18:41:00.865Z",
      "booking": {
        "id": "cmr9jqeun0000c8ajp13sb43v",
        "status": "ACCEPTED",
        "scheduledAt": "2026-07-10T10:00:00.000Z",
        "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
        "service": {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "title": "Pipe Leak Repair",
          "price": 1500
        },
        "technician": {
          "id": "cmr87xylm0000gnajs79t2v38",
          "user": {
            "id": "cmr85mm0800035najrx5t5wpa",
            "name": "Md Parvej"
          }
        }
      }
    },
    "gatewayUrl": "https://sandbox.securepay.shurjopayment.com/spaycheckout/?token=eyJ...&order_id=SP6a4bf6bc945aa",
    "sessionId": null
  }
}
```

| Response field | Use as |
|----------------|--------|
| `data.payment.id` | `paymentId` in confirm |
| `data.payment.transactionId` | `orderId` in confirm |
| `data.gatewayUrl` | Open in browser to pay |

**Error `400`:**
```json
{
  "success": false,
  "message": "Payment can only be created for accepted bookings. Current status: REQUESTED. Ask the technician to accept the booking first."
}
```

---

### 21. Confirm Payment

**`POST /payments/confirm`**

| | |
|---|---|
| **Auth** | Bearer token (Customer) |
| **Prerequisite** | Payment completed on gateway |

**ShurjoPay:**
```json
{
  "paymentId": "cmr9kfsv30000oaajgvhfdrno",
  "orderId": "SP1783363257829"
}
```

**SSLCommerz:**
```json
{
  "paymentId": "cmr9kfsv30000oaajgvhfdrno",
  "val_id": "VALIDATION_ID_FROM_SSLCOMMERZ"
}
```

**Stripe:**
```json
{
  "paymentId": "cmr9kfsv30000oaajgvhfdrno",
  "sessionId": "cs_test_a1b2c3d4e5f6"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "id": "cmr9kfsv30000oaajgvhfdrno",
    "transactionId": "SP1783363257829",
    "bookingId": "cmr9jqeun0000c8ajp13sb43v",
    "amount": 1500,
    "currency": "BDT",
    "method": "bkash",
    "provider": "SHURJOPAY",
    "status": "COMPLETED",
    "paidAt": "2026-07-06T18:45:00.000Z",
    "createdAt": "2026-07-06T18:40:58.335Z",
    "updatedAt": "2026-07-06T18:45:00.000Z",
    "booking": {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "status": "PAID",
      "scheduledAt": "2026-07-10T10:00:00.000Z",
      "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
      "service": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair",
        "price": 1500
      },
      "technician": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "user": {
          "id": "cmr85mm0800035najrx5t5wpa",
          "name": "Md Parvej"
        }
      }
    }
  }
}
```

---

### 22. List My Payments

**`GET /payments`**

**Query parameters:**
```
GET /payments?page=1&limit=10&status=COMPLETED
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payments fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr9kfsv30000oaajgvhfdrno",
      "transactionId": "SP1783363257829",
      "bookingId": "cmr9jqeun0000c8ajp13sb43v",
      "amount": 1500,
      "currency": "BDT",
      "method": "bkash",
      "provider": "SHURJOPAY",
      "status": "COMPLETED",
      "paidAt": "2026-07-06T18:45:00.000Z",
      "createdAt": "2026-07-06T18:40:58.335Z",
      "updatedAt": "2026-07-06T18:45:00.000Z",
      "booking": {
        "id": "cmr9jqeun0000c8ajp13sb43v",
        "status": "PAID",
        "service": {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "title": "Pipe Leak Repair",
          "price": 1500
        }
      }
    }
  ]
}
```

---

### 23. Get Payment Details

**`GET /payments/:id`**

**Example:** `GET /payments/cmr9kfsv30000oaajgvhfdrno`

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment details fetched successfully",
  "data": {
    "id": "cmr9kfsv30000oaajgvhfdrno",
    "transactionId": "SP1783363257829",
    "bookingId": "cmr9jqeun0000c8ajp13sb43v",
    "amount": 1500,
    "currency": "BDT",
    "method": "bkash",
    "provider": "SHURJOPAY",
    "status": "COMPLETED",
    "paidAt": "2026-07-06T18:45:00.000Z",
    "createdAt": "2026-07-06T18:40:58.335Z",
    "updatedAt": "2026-07-06T18:45:00.000Z",
    "booking": {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "status": "PAID",
      "scheduledAt": "2026-07-10T10:00:00.000Z",
      "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
      "service": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair",
        "price": 1500
      },
      "technician": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "user": {
          "id": "cmr85mm0800035najrx5t5wpa",
          "name": "Md Parvej"
        }
      }
    }
  }
}
```

---

## Review APIs

---

### 24. Create Review

**`POST /reviews`**

| | |
|---|---|
| **Auth** | Bearer token (Customer) |
| **Prerequisite** | Booking status must be `COMPLETED` |

**Request body:**
```json
{
  "bookingId": "cmr9jqeun0000c8ajp13sb43v",
  "rating": 5,
  "comment": "Excellent work, very professional and on time!"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "cmr9review001",
    "rating": 5,
    "comment": "Excellent work, very professional and on time!",
    "createdAt": "2026-07-06T20:00:00.000Z",
    "booking": {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "status": "COMPLETED",
      "service": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair"
      }
    },
    "technician": {
      "id": "cmr87xylm0000gnajs79t2v38",
      "avgRating": 4.6,
      "totalReviews": 13,
      "user": {
        "id": "cmr85mm0800035najrx5t5wpa",
        "name": "Md Parvej"
      }
    }
  }
}
```

**Error `400`:**
```json
{
  "success": false,
  "message": "Review can only be created for completed bookings"
}
```

**Error `409`:**
```json
{
  "success": false,
  "message": "Review already exists for this booking"
}
```

---

## Admin APIs

**Base path:** `/admin`  
**Required role:** `ADMIN`

---

### 25. List Users

**`GET /admin/users`**

**Query parameters:**
```
GET /admin/users?page=1&limit=10&role=TECHNICIAN&status=ACTIVE&search=parvej
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr85mm0800035najrx5t5wpa",
      "name": "Md Parvej",
      "email": "tech@example.com",
      "phone": "01798765432",
      "role": "TECHNICIAN",
      "status": "ACTIVE",
      "createdAt": "2026-07-05T10:00:00.000Z",
      "updatedAt": "2026-07-05T10:00:00.000Z",
      "technicianProfile": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "location": "Dhaka, Mirpur",
        "avgRating": 4.5
      },
      "_count": {
        "bookings": 5,
        "reviews": 0
      }
    }
  ]
}
```

---

### 26. Update User Status

**`PATCH /admin/users/:id`**

**Ban user:**
```json
{
  "status": "BANNED"
}
```

**Unban user:**
```json
{
  "status": "ACTIVE"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "id": "cmr85mm0800035najrx5t5wpa",
    "name": "Md Parvej",
    "email": "tech@example.com",
    "phone": "01798765432",
    "role": "TECHNICIAN",
    "status": "BANNED",
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-06T21:00:00.000Z"
  }
}
```

---

### 27. List All Bookings (Admin)

**`GET /admin/bookings`**

**Query parameters:**
```
GET /admin/bookings?page=1&limit=10&status=PAID
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": "cmr9jqeun0000c8ajp13sb43v",
      "scheduledAt": "2026-07-10T10:00:00.000Z",
      "address": "House 12, Road 5, Block C, Mirpur 10, Dhaka",
      "notes": "Kitchen sink is leaking badly",
      "status": "PAID",
      "createdAt": "2026-07-06T18:30:00.000Z",
      "updatedAt": "2026-07-06T18:45:00.000Z",
      "customer": {
        "id": "cmr85cust001",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "01712345678"
      },
      "technician": {
        "id": "cmr87xylm0000gnajs79t2v38",
        "location": "Dhaka, Mirpur",
        "user": {
          "id": "cmr85mm0800035najrx5t5wpa",
          "name": "Md Parvej",
          "email": "tech@example.com"
        }
      },
      "service": {
        "id": "cmr8cd3fw00039pajy6j2qabf",
        "title": "Pipe Leak Repair",
        "price": 1500,
        "category": {
          "id": "cmr8cd3fw00039pajy6j2qabf",
          "name": "Plumbing"
        }
      },
      "payment": {
        "id": "cmr9kfsv30000oaajgvhfdrno",
        "status": "COMPLETED",
        "amount": 1500,
        "provider": "SHURJOPAY"
      }
    }
  ]
}
```

---

### 28. List Categories (Admin)

**`GET /admin/categories`**

**Response `200`:**
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

### 29. Create Category (Admin)

**`POST /admin/categories`**

**Request body:**
```json
{
  "name": "Plumbing",
  "description": "Water and pipe related services",
  "icon": "🔧"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "cmr8cd3fw00039pajy6j2qabf",
    "name": "Plumbing",
    "description": "Water and pipe related services",
    "icon": "🔧",
    "createdAt": "2026-07-05T10:00:00.000Z"
  }
}
```

---

### 30. Update Category (Admin)

**`PATCH /admin/categories/:id`**

**Request body:**
```json
{
  "name": "Plumbing & Water",
  "description": "All water and pipe services",
  "icon": "🚿"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "cmr8cd3fw00039pajy6j2qabf",
    "name": "Plumbing & Water",
    "description": "All water and pipe services",
    "icon": "🚿",
    "createdAt": "2026-07-05T10:00:00.000Z"
  }
}
```

---

### 31. Delete Category (Admin)

**`DELETE /admin/categories/:id`**

**Request body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "id": "cmr8cd3fw00039pajy6j2qabf",
    "name": "Plumbing",
    "description": "Water and pipe related services",
    "icon": "🔧",
    "createdAt": "2026-07-05T10:00:00.000Z"
  }
}
```

---

## End-to-End Flow

Complete Postman test sequence:

### Step 1 — Register users

```http
POST /api/auth/register
```
```json
{ "name": "John Doe", "email": "customer@test.com", "password": "123456", "phone": "01712345678", "role": "CUSTOMER" }
```

```http
POST /api/auth/register
```
```json
{ "name": "Md Parvej", "email": "tech@test.com", "password": "123456", "phone": "01798765432", "role": "TECHNICIAN" }
```

Save `customerToken` and `technicianToken` from responses.

---

### Step 2 — Technician setup

```http
PUT /api/technician/profile
Authorization: Bearer <technicianToken>
```
```json
{ "bio": "Certified plumber", "skills": ["Plumbing"], "experienceYears": 5, "hourlyRate": 500, "location": "Dhaka" }
```

```http
PUT /api/technician/availability
Authorization: Bearer <technicianToken>
```
```json
{ "slots": [{ "day": "SATURDAY", "startTime": "09:00", "endTime": "18:00" }] }
```

```http
POST /api/technician/services
Authorization: Bearer <technicianToken>
```
```json
{ "title": "Pipe Leak Repair", "description": "Fix leaks", "price": 1500, "categoryId": "<categoryId>" }
```

---

### Step 3 — Customer books

```http
GET /api/services
```

```http
POST /api/bookings
Authorization: Bearer <customerToken>
```
```json
{ "serviceId": "<serviceId>", "scheduledAt": "2026-07-10T10:00:00.000Z", "address": "House 12, Mirpur, Dhaka", "notes": "Urgent" }
```

Save `bookingId` from response.

---

### Step 4 — Technician accepts

```http
PATCH /api/technician/bookings/<bookingId>
Authorization: Bearer <technicianToken>
```
```json
{ "status": "ACCEPTED" }
```

---

### Step 5 — Customer pays

```http
POST /api/payments/create
Authorization: Bearer <customerToken>
```
```json
{ "bookingId": "<bookingId>", "provider": "SHURJOPAY" }
```

Open `gatewayUrl` → complete sandbox payment.

```http
POST /api/payments/confirm
Authorization: Bearer <customerToken>
```
```json
{ "paymentId": "<paymentId>", "orderId": "<transactionId>" }
```

---

### Step 6 — Technician completes job

```http
PATCH /api/technician/bookings/<bookingId>
Authorization: Bearer <technicianToken>
```
```json
{ "status": "IN_PROGRESS" }
```

```http
PATCH /api/technician/bookings/<bookingId>
Authorization: Bearer <technicianToken>
```
```json
{ "status": "COMPLETED" }
```

---

### Step 7 — Customer reviews

```http
POST /api/reviews
Authorization: Bearer <customerToken>
```
```json
{ "bookingId": "<bookingId>", "rating": 5, "comment": "Great job!" }
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Payment can only be created for accepted bookings` | Booking is `REQUESTED` | Technician must accept first |
| `Customer access required` | Wrong role token | Use customer token |
| `Technician access required` | Wrong role token | Use technician token |
| `Booking not found` | Wrong ID or wrong customer | Check booking ID and token |
| `Review can only be created for completed bookings` | Booking not `COMPLETED` | Finish the job first |
| `Invalid or expired token` | Bad/expired JWT | Login again |
| `Email is already registered` | Duplicate email on register | Use login instead |

---

## Postman Tips

1. Set environment variable `baseUrl` = `http://localhost:5001/api`
2. Save `customerToken`, `technicianToken`, `bookingId`, `paymentId` after each step
3. Use **Authorization → Bearer Token** for protected routes
4. After create payment: `paymentId` = `data.payment.id`, `orderId` = `data.payment.transactionId`
