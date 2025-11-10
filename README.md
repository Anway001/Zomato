# Zomato Clone

## Overview
A full-stack food discovery prototype inspired by Zomato that pairs a short-form vertical video feed with partner tooling. The project exposes a Node.js/Express API backed by MongoDB and a React 19 + Vite frontend that renders immersive reels, supports likes and saves, and offers food partner utilities such as video uploads and profile pages.

## Features
- **Immersive food feed**: Infinite-style vertical reel experience with smooth wheel navigation, auto-play, comments, likes, saves, and share actions.
- **Saved collection**: Dedicated `/saved` page mirroring the feed to browse only saved dishes with live unsave pruning.
- **Partner tooling**: Food partners can upload dish videos, manage details, and share branded profile pages with aggregated stats.
- **Authentication**: Separate flows for diners and food partners with JWT cookies, password hashing, and logout endpoints.
- **Personalized metadata**: Backend enriches food responses with `isLiked`, `isSaved`, `likeCount`, and `saveCount` so the UI preserves state across reloads.
- **Media storage ready**: ImageKit service integration scaffolded for secure video uploads via in-memory multer storage.

## Tech Stack
- **Frontend**: React 19, React Router 7, Axios, Vite, modern CSS modules.
- **Backend**: Node.js, Express 5, Mongoose, JSON Web Tokens, bcrypt, multer.
- **Infrastructure**: MongoDB Atlas (or any Mongo instance), optional ImageKit for CDN-backed media storage.

## Project Structure
```
Zomato_clone/
├─ Backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  └─ services/
│  ├─ server.js
│  └─ package.json
├─ Frontend/
│  ├─ src/
│  │  ├─ General/
│  │  ├─ Food-partner/
│  │  ├─ Router/
│  │  └─ pages/
│  ├─ vite.config.js
│  └─ package.json
└─ package.json
```

## Getting Started
### Prerequisites
1. Node.js 18+ and npm.
2. MongoDB connection string.
3. ImageKit account (optional, required only for real uploads).

### Backend Setup
1. `cd Backend`
2. `npm install`
3. Create a `.env` file alongside `server.js`:
   ```env
   PORT=8080
   MONGODB_URL=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   IMAGEKIT_PUBLIC_KEY=your-public-key
   IMAGEKIT_PRIVATE_KEY=your-private-key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
   ```
   Omit the ImageKit keys if you are not enabling uploads.
4. Start the API: `node server.js`

### Frontend Setup
1. In a second terminal run `cd Frontend`
2. `npm install`
3. Launch the dev server: `npm run dev`
4. Visit `http://localhost:5173` (update `Backend/src/app.js` CORS origin if you change the port).

### Running Both Services Together
- Keep the backend running on `http://localhost:8080` so Axios requests from the frontend succeed (`withCredentials` is enabled for cookie auth).
- Use tools like `npm-run-all` or separate terminals/tmux panes if you prefer a single command setup.

## Key API Routes
- **POST `/api/auth/user/register`** — Register a diner account and receive a JWT cookie.
- **POST `/api/auth/user/login`** — Authenticate a diner.
- **POST `/api/auth/foodpartner/register`** — Register a food partner.
- **POST `/api/food`** — Upload a food video (food partner auth + multipart form upload).
- **GET `/api/food`** — Fetch the global feed; returns personal `isLiked`/`isSaved` flags when authenticated.
- **POST `/api/food/likes`** — Toggle like state for the current actor.
- **POST `/api/food/saves`** — Toggle save state for the current actor.
- **GET `/api/food/saves`** — Retrieve saved items for the signed-in user or partner.
- **GET `/api/foodpartner/:id`** — Fetch partner profile and their food items for storefront views.

## Frontend Routes
- `/` — Primary reel feed.
- `/saved` — Saved food feed.
- `/createFood` — Partner upload form.
- `/partner/:id` — Public partner profile.
- `/user/login`, `/user/register`, `/foodpartner/login`, `/foodpartner/register` — Auth screens.

## Development Notes
- The backend enables CORS for `http://localhost:5173` and expects cookie-based authentication (`withCredentials: true`). Update the origin and Axios base URLs if you deploy.
- Multer stores uploads in memory before streaming to ImageKit; validate payload sizes before production use.
- No automated tests are defined yet (`npm test` is a placeholder in both workspaces).

## Troubleshooting
- **Mongo connection failures**: ensure `MONGODB_URL` is reachable and the network allows access.
- **401 responses on likes/saves**: confirm you are logged in and the browser sends the JWT cookie (secure flags may block requests on plain HTTP).
- **Video previews missing**: verify ImageKit credentials or adjust the upload service to point to local storage during development.
