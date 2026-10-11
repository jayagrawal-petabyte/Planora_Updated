# Project Management System (Web + Mobile)

A full-stack project management application with a unified backend serving both a responsive web application and a cross-platform mobile app. Users can seamlessly create projects, manage tasks, and view their dashboard metrics on either platform, with all changes instantly synchronized.

## Deployment URLs
- **Web App**: https://planora-bice.vercel.app/
- **Mobile App**: [Download Android APK](https://expo.dev/accounts/jayagrawal/projects/planora/builds/eb07446c-1bb4-4066-b980-5a1b26ad432d)
- **Backend API**: https://planora-sux9.onrender.com/api
- **Database**: Supabase PostgreSQL

## Tech Stack & Architecture
- **Web Frontend**: React (Vite)
- **Mobile App**: React Native (Expo)
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Shared Code**: Shared TypeScript types/Zod validators used seamlessly across frontend, mobile, and backend via an internal workspace package.

## Main Features
- Unified Authentication (JWT, bcrypt, rate-limiting)
- Project & Task Management (CRUD, Sorting, Filtering, Search)
- Interactive Dashboard (Metrics aggregation based on authenticated user)
- Secure mobile token storage (`expo-secure-store`)
- Unified error handling and comprehensive field validation

### Bonus Features Implemented
- **Comprehensive Unit & Integration Tests**: Implemented using Jest and React Testing Library (RTL) for frontend components and backend logic.
- **System Audit Logs**: Automated tracking of all mutations (create/update/delete) for tasks and projects, stored securely in a dedicated PostgreSQL `AuditLog` table.
- **Mobile Offline Viewing**: Fallback caching implemented via `expo-secure-store` ensuring projects and tasks remain viewable on the mobile app even without an active internet connection.
- **Full-Stack Type Safety (Shared Workspace)**: A dedicated `packages/shared` workspace containing Zod schemas and TypeScript interfaces guarantees 100% type parity across the database, backend APIs, web app, and mobile app.
- **Docker Support**: Included complete `Dockerfile` configurations and a `docker-compose.yml` for instantly spinning up the web app and backend together.
- **Pagination & Sorting**: Integrated cleanly across all list views (projects and tasks) for performance and usability.
- **Refresh Tokens**: Built a secure JWT refresh mechanism to keep user sessions alive smoothly without forcing repeated logins.

## Repository Structure
This is a standard Monorepo layout:
- `web/backend/`: Node.js Express backend and Prisma Database schema
- `web/frontend/`: React Vite web application
- `app/`: React Native Expo mobile application
- `packages/shared/`: Shared Zod validation schemas and TypeScript interfaces
- `docs/`: Technical documentation

## Documentation Links
Detailed technical documentation is provided in the `docs` folder:
1. [Setup Instructions](docs/SETUP.md) - How to run the project locally.
2. [API Documentation](docs/API.md) - Endpoints and methods.
3. [Database Schema](docs/SCHEMA.md) - ER Diagram and relationships.

## How the Demo Works
1. Create an account via the Web or Mobile app.
2. Log into the same account on both platforms.
3. Create a project on the web, pull-to-refresh on mobile to see it immediately.
4. Add tasks and check off progress, seeing your Dashboard statistics update instantly.
