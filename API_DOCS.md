# Task API — Documentation

**Base URL:** `http://localhost:3000`  
**Version:** 1.0.0  
**Auth:** JWT Bearer Token (required for all `/tasks` endpoints)

---

## Authentication

### POST `/auth/login`

Authenticate and receive a JWT access token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Sample credentials:**
| Username | Password    |
|----------|-------------|
| user1    | password1   |
| user2    | password2   |
| admin    | adminpass   |

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` — Missing or invalid fields
- `401` — Invalid credentials

---

## Tasks

All `/tasks` endpoints require the header:
```
Authorization: Bearer <access_token>
```

---

### GET `/tasks`

Retrieve all tasks (paginated). Soft-deleted tasks are excluded.

**Query Parameters:**
| Parameter | Type    | Default | Description                    |
|-----------|---------|---------|--------------------------------|
| `page`    | integer | `1`     | Page number (1-indexed)        |
| `limit`   | integer | `10`    | Items per page (max: 100)      |

**Example:** `GET /tasks?page=1&limit=5`

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "title": "My Task",
        "description": "Some description",
        "status": "pending",
        "completed_at": null,
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T10:00:00.000Z"
      }
    ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 5,
      "totalPages": 9
    }
  }
}
```

---

### GET `/tasks/:id`

Retrieve a specific task by its ID.

**Path Parameters:**
| Parameter | Type    | Description   |
|-----------|---------|---------------|
| `id`      | integer | Task ID       |

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My Task",
    "description": "Some description",
    "status": "in-progress",
    "completed_at": null,
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` — Invalid ID (non-numeric)
- `404` — Task not found

---

### POST `/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "pending | in-progress | completed (optional, defaults to 'pending')",
  "completed_at": "ISO date string (optional)"
}
```

**Example:**
```json
{
  "title": "Fix critical bug",
  "description": "The login page breaks on Safari",
  "status": "in-progress"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Fix critical bug",
    "description": "The login page breaks on Safari",
    "status": "in-progress",
    "completed_at": null,
    "created_at": "2024-01-15T14:00:00.000Z",
    "updated_at": "2024-01-15T14:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` — Validation failed (title missing, invalid status, etc.)
- `401` — Unauthorized

**Validation Rules:**
- `title`: required, string, max 255 characters
- `status`: must be one of `pending`, `in-progress`, `completed`
- If `status` is `completed` and `completed_at` is not provided, it is auto-set to now

---

### PATCH `/tasks/:id`

Partially update an existing task. Only provided fields are updated.

**Path Parameters:**
| Parameter | Type    | Description   |
|-----------|---------|---------------|
| `id`      | integer | Task ID       |

**Request Body** (all fields optional):
```json
{
  "title": "string",
  "description": "string",
  "status": "pending | in-progress | completed",
  "completed_at": "ISO date string | null"
}
```

**Example:**
```json
{
  "status": "completed"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My Task",
    "description": "Some description",
    "status": "completed",
    "completed_at": "2024-01-15T15:00:00.000Z",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T15:00:00.000Z"
  }
}
```

**Notes:**
- Setting `status` to `completed` auto-sets `completed_at` if not provided
- Setting `status` away from `completed` clears `completed_at`

**Error Responses:**
- `400` — Validation failed or invalid ID
- `404` — Task not found

---

### DELETE `/tasks/:id`

**Soft delete** a task. The record is retained in the database with `deleted_at` set.

**Path Parameters:**
| Parameter | Type    | Description   |
|-----------|---------|---------------|
| `id`      | integer | Task ID       |

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Task 1 has been soft deleted"
}
```

**Error Responses:**
- `400` — Invalid ID (non-numeric)
- `404` — Task not found

---

## Error Response Format

All errors return a consistent structure:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "data": ["array of validation errors, if applicable"]
}
```

---

## Task Status Enum

| Value       | Description                      |
|-------------|----------------------------------|
| `pending`   | Task created, not yet started    |
| `in-progress` | Task is actively being worked  |
| `completed` | Task finished                    |

---

## Health Check

### GET `/health`

No auth required. Verify the API is running.

**Response `200`:**
```json
{
  "success": true,
  "message": "Task API is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```
