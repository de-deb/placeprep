# Design assets

All diagrams match the **actual implementation** in this repo (Review 2).

## Files

- `architecture.drawio` / `architecture.png` — layered client-server architecture:
  browser → React frontend → Express API → services → Prisma → PostgreSQL.
- `component-diagram.drawio` / `component-diagram.png` — module map:
  `frontend/src` (pages, UI kit, services, context) and `backend/src`
  (routes, controllers, services, middleware, validations).
- `ui/` — real screenshots taken from the running frontend (demo mode):
  - `login.png` — login with demo + seeded credentials
  - `dashboard.png` — command center with readiness + opportunities
  - `profile.png` — profile view/edit
  - `preparation.png` — coding practice with detail modal
  - `company.png` — company listings
  - `admin.png` — placement-cell command center
  - `resume.png` — resume center

## Regenerating

Diagrams:

```bash
python3 docs/design/generate_diagrams.py
```

UI screenshots (requires frontend build):

```bash
npm run build --prefix frontend
npx vite preview --port 4173 --strictPort --prefix frontend &
# then headless Chrome screenshots of /login, /dashboard?demo=student, etc.
```

Draw.io sources can be opened at https://app.diagrams.net.
