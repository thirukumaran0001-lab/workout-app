# APEX Workout Tracker ⚡

APEX is a premium, high-contrast workout telemetry application designed with a luxury-stealth dark aesthetic. It features real-time set and rep tracking, biometric charts, custom rest timers, and workout history logging.

This project is built using a **Vite + React** frontend and an **Express** backend, fully optimized to be **100% Vercel-Friendly** for single-click deployment.

---

## 🚀 Vercel Deployment Architecture

Vercel is primarily a serverless platform. To support both the React frontend and Express backend in a single repository without running a persistent VM, the project employs the following architecture:

### 1. Serverless Backend (`api/server.js`)
* Vercel automatically treats any file in the `api/` directory as a **Serverless Function**.
* `api/server.js` exports the configured Express application (`export default app`). Vercel automatically wraps this export in its Serverless environment, running it on-demand.
* The root `server.js` is only used for local development (to launch `app.listen()`), keeping the production deployment clean and serverless.

### 2. Ephemeral Storage Protection (Hybrid Sync)
* Serverless functions are stateless and their local disk is read-only, except for the temporary `/tmp` folder.
* To prevent data loss when Vercel scales down or restarts, the application implements a **Hybrid Sync Engine**:
  * **Seeding**: On cold start, the backend seeds the `/tmp` database from the repository's static files (`data/*.json`).
  * **Client-Side Sync**: All user workouts, session states, and exercises are cached in the browser's `localStorage`.
  * **Auto-Rehydration**: When the app starts or a session completes, the client automatically reconciles its local state with the backend, rebuilding the `/tmp` cache if the serverless container has restarted.

### 3. Vercel Routing Configuration (`vercel.json`)
The [vercel.json](vercel.json) file directs Vercel to:
* Direct all API calls starting with `/api/` to the Express serverless function (`api/server.js`).
* Include the seed database files (`data/**`) in the serverless function bundle so it has initial exercise libraries and workout templates.

---

## 🛠️ Local Development

To run the application locally on your machine:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Environment**:
   ```bash
   npm run dev
   ```
   * This uses `concurrently` to launch both:
     * The Vite frontend dev server at `http://localhost:5173/`
     * The Express backend server at `http://localhost:5001/`
   * Vite is configured to proxy all `/api/*` requests to the local Express server.

---

## 📦 Production Build

Vercel builds and compiles the frontend assets automatically on push. If you want to build and test the production bundle locally:

1. **Build Frontend**:
   ```bash
   npm run build
   ```
   * This compiles the React app into the `dist/` directory, which Vercel will serve as optimized static assets.

2. **Preview Production Build**:
   ```bash
   npm run preview
   ```
