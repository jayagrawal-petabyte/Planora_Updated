# API Documentation

The REST API is strictly typed and validates all payloads using Zod (shared types).
All protected routes require an `Authorization: Bearer <token>` header.

## Authentication Routes

### `POST /api/auth/register`
- **Authentication**: None
- **Purpose**: Registers a new user account.
- **Body**: `{ fullName, email, password }`
- **Success**: `201 Created` with `{ success: true, data: { token, refreshToken, user } }`

### `POST /api/auth/login`
- **Authentication**: None
- **Purpose**: Authenticates a user and returns tokens.
- **Body**: `{ email, password }`
- **Success**: `200 OK` with `{ success: true, data: { token, refreshToken, user } }`

### `POST /api/auth/logout`
- **Authentication**: None
- **Purpose**: Logs out a user.
- **Success**: `200 OK`

### `GET /api/auth/me`
- **Authentication**: Required
- **Purpose**: Retrieves the currently authenticated user's profile.
- **Success**: `200 OK` with `{ success: true, data: { user } }`

---

## Project Routes
*All project routes require Authentication.*

### `GET /api/projects`
- **Query Params**: `search`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
- **Success**: `200 OK` with `{ success: true, data: { projects, pagination } }`

### `GET /api/projects/:id`
- **Success**: `200 OK` with `{ success: true, data: { project } }`

### `GET /api/projects/:id/activity`
- **Authentication**: Required (requesting user must own project `:id`)
- **Query Params**: `page` (default `1`), `limit` (default `10`, max `50`)
- **Success**: `200 OK` with paginated timeline items:
  ```json
  {
    "success": true,
    "data": {
      "activities": [
        {
          "id": "e2f1837c-d760-4447-975c-30c1eefdb72e",
          "actorId": "58efce56-cb8e-4a69-8fcb-240fa8be4ad7",
          "actorName": "Alex Johnson",
          "action": "UPDATE_TASK",
          "entityType": "TASK",
          "entityId": "38da4c86-c4d6-4e5a-8b83-a4efc828fe27",
          "entityTitle": "Design Landing Hero",
          "projectId": "8b021e90-c0b9-470a-af96-a831e5f8ee4d",
          "timestamp": "2026-10-11T19:30:00.000Z",
          "summary": "You moved \"Design Landing Hero\" from Pending to In Progress",
          "changedFields": {
            "status": {
              "old": "PENDING",
              "new": "IN_PROGRESS"
            }
          }
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
  }
  ```
- **Errors**: `404 Not Found` if project does not exist or user does not own it.

### `POST /api/projects`
- **Body**: `{ name, description?, status?, startDate?, endDate? }`
- **Success**: `201 Created` with `{ success: true, data: { project } }`

### `PUT /api/projects/:id`
- **Body**: `{ name?, description?, status?, startDate?, endDate? }`
- **Success**: `200 OK`

### `DELETE /api/projects/:id`
- **Success**: `200 OK`

---

## Task Routes
*All task routes require Authentication.*

### `GET /api/tasks`
- **Query Params**: `projectId`, `search`, `status`, `priority`, `page`, `limit`, `sortBy`, `sortOrder`
- **Success**: `200 OK` with `{ success: true, data: { tasks, pagination } }`

### `GET /api/tasks/:id`
- **Success**: `200 OK` with `{ success: true, data: { task } }`

### `POST /api/tasks`
- **Body**: `{ name, description?, projectId, status?, priority?, dueDate? }`
- **Success**: `201 Created`

### `PUT /api/tasks/:id`
- **Body**: `{ name?, description?, status?, priority?, dueDate? }`
- **Success**: `200 OK`

### `DELETE /api/tasks/:id`
- **Success**: `200 OK`

---

## Dashboard Routes

### `GET /api/dashboard`
- **Authentication**: Required
- **Purpose**: Retrieves aggregated metrics for the authenticated user's projects and tasks.
- **Success**: `200 OK` with `{ success: true, data: { stats: { totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress } } }`
