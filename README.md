# School Management Backend (Phase 1)

This repository contains the Phase 1 backend foundation for a multi-tenant School & College Management System.

Quick start

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Start server (development):

```bash
npm run dev
```

Health check: `GET /health`

Notes
- All data models include `schoolId` and are scoped by `schoolId` to ensure multi-tenant isolation.
- JWT payload includes `userId`, `role`, and `schoolId`.

See `src/` for project layout and implementation.
