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
