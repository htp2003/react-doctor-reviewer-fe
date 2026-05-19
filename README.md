# React Doctor Reviewer FE

Frontend for submitting a public GitHub repository URL and visualizing the review report
returned by the backend service.

## Environment

This app requires `VITE_API_BASE_URL` and `VITE_VERSION`.

Example:

```bash
VITE_API_BASE_URL=https://react-doctor-reviewer-be.onrender.com
VITE_VERSION=0.0.0
```

Files included in this repo:

- `.env.development`
- `.env.production`
- `.env.example`

When deploying, make sure your hosting platform exposes the same `VITE_API_BASE_URL`
and `VITE_VERSION` values at build time if you do not want to rely on committed env
files.

## Scripts

```bash
npm run dev
npm run test
npm run lint
npm run build
```
