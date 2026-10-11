# Setup Instructions

## 1. Project Overview
Planora is a full-stack project management application featuring a unified backend serving both a React Vite web application and a React Native Expo mobile app. The platform allows users to create projects, track tasks, and monitor their statistics in a dynamic dashboard across both web and mobile environments seamlessly.

## 2. Deployed Application
- **Web App**: [https://planora-bice.vercel.app/](https://planora-bice.vercel.app/)
- **Mobile App**: [Download Android APK (Internal Distribution)](https://expo.dev/accounts/jayagrawal/projects/planora/builds/eb07446c-1bb4-4066-b980-5a1b26ad432d)
- **Backend API**: [https://planora-sux9.onrender.com/api](https://planora-sux9.onrender.com/api)
- **Database**: Supabase PostgreSQL

## 3. Option 1: Docker (Recommended)
The entire web stack (frontend and backend) can be run simultaneously using Docker Compose.

1. Navigate to the `web` directory:
   ```bash
   cd web
   ```
2. Start the services:
   ```bash
   docker compose up --build
   ```
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000/api

## 4. Option 2: Run Locally (Manual Setup)

### A. Backend (Node.js + Express)
1. Navigate to the backend directory:
   ```bash
   cd web/backend
   npm install
   ```
2. Set up your environment variables (see Section 6).
3. Initialize the Prisma database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### B. Web (React + Vite)
1. Navigate to the web frontend directory:
   ```bash
   cd web/frontend
   npm install
   ```
2. Set up your environment variables (see Section 6).
3. Start the web application:
   ```bash
   npm run dev
   ```

### C. Mobile (React Native + Expo)
1. Navigate to the mobile directory:
   ```bash
   cd app
   npm install
   ```
2. Set up your environment variables (see Section 6). *(If testing on a physical device, replace `localhost` with your local network IP address)*
3. Start the mobile app:
   ```bash
   npm start
   ```

## 5. Run Mobile Against Deployed Backend
To test the mobile app locally but connect it to the production backend instead of your local machine, simply update the `.env` in the `app` folder:
```env
EXPO_PUBLIC_API_URL=https://planora-sux9.onrender.com/api
```

## 6. Environment Variables

### Backend (`web/backend/.env`)
```env
DATABASE_URL="your-postgres-url"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=5000
```

### Web (`web/frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Mobile (`app/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```
