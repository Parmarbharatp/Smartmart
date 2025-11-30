# SmartMart Frontend (Vite + React)

## 🚀 Getting Started

```bash
cd project
npm install
cp env.example .env   # or create .env manually
npm run dev
```

## 🔧 Environment Variables

See `env.example` for the required keys:

| Key | Description |
|-----|-------------|
| `VITE_API_URL` | Base URL of the backend API (`https://<railway-app>.up.railway.app/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID used for social login |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key for Checkout |

## 🏗️ Production Build

```bash
npm run build   # outputs to project/dist
npm run preview
```

Deploy the `dist` folder to any static hosting provider (Netlify, Vercel, Cloudflare Pages, etc.). Make sure the host rewrites all routes to `index.html`.

## 🔗 Backend Integration

- Set `VITE_API_URL` to your Railway backend URL + `/api`.
- Add every deployed frontend origin to `FRONTEND_URLS` (or `FRONTEND_URL`) on the backend so CORS passes.
- Keep `SERVE_FRONTEND=false` in the backend when hosting the SPA separately.

