# Maarif HR Soft

End-to-end demo of an HR operations platform. The frontend is a Vite/React
single-page app, while the backend is a lightweight PHP API that serves data
from a MySQL database via PDO.

## Prerequisites

- Node.js 18+
- npm 9+
- PHP 8.1+ with the PDO MySQL extension
- Composer
- MySQL 8 (or compatible)

## Initial Setup

1. **Install JavaScript dependencies**
   ```bash
   npm install
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Configure environment variables**
   - Duplicate `.env.example` to `.env`.
   - Adjust database credentials and the frontend CORS origin as needed.
   - Ensure `VITE_API_URL` points to the URL where the PHP API will run
     (default `http://localhost:8080` when using `php -S`).

4. **Provision the database**
   ```sql
   SOURCE /path/to/database/hr_soft.sql;
   SOURCE /path/to/database/seeds/hr_soft_seed.sql;
   ```
   The first script creates the schema; the second clears existing rows and
   reloads the canonical demo data (roles, permissions, users, application
   types, and sample workflow records).

## Running the Stack

Start the PHP API (from the project root):
```bash
php -S localhost:8080 -t api/public
```

Start the Vite dev server:
```bash
npm run dev
```

- API health probe: `http://localhost:8080/health`
- Bootstrap payload: `http://localhost:8080/bootstrap`
- Frontend: `http://localhost:5173`

## Demo Accounts

| Role     | Email        | Password |
|----------|--------------|----------|
| Admin    | admin@hr.com | admin123 |
| HR       | hr@hr.com    | hr123    |
| Employee | user@hr.com  | user123  |

## Key Directories

```
api/                Backend controllers, repositories, and services
database/           Schema and seed SQL dumps
src/                React application code
  components/       UI primitives and page layouts
  context/          Global state management and domain logic
  constants/        Shared enumerations (permissions, features, etc.)
  services/         API client helpers
```

## PHP API Notes

- `App\Support\Env` loads `.env` via `vlucas/phpdotenv`, populating `DB_*`
  variables before the rest of the application boots.
- `App\Database\Database` provides a singleton PDO connection configured for
  `utf8mb4`, `ERRMODE_EXCEPTION`, associative fetches, and disabled emulated
  prepares.
- `App\Services\BootstrapService` and accompanying repositories aggregate roles,
  users, application types, and workflow bundles so the frontend can hydrate its
  context in one request.
- Write endpoints (`/roles`, `/users`, `/application-types`, `/applications`)
  accept JSON payloads and persist the provided state, always returning the
  canonical representation fetched from MySQL.

## Frontend Highlights

- `src/context/AppContext.tsx` is the single source of truth for roles, users,
  application types, and workflow bundles. It loads from the `/bootstrap`
  endpoint and pushes mutations through the sync endpoints.
- `src/services/api.ts` centralises HTTP helpers and enforces that `VITE_API_URL`
  is configured before any request is attempted.
- Permissions data lives in `src/constants/permissions.ts`, ensuring a single
  definition for all role-building UIs.
- User onboarding collects national ID numbers and issues the default password
  `123`; the first login presents an inline password reset flow so credentials
  are never left at the default.

## Seeding & Resetting Data

Re-run `database/seeds/hr_soft_seed.sql` at any time to reset demo content while
retaining the schema. The script disables foreign key checks, deletes data in the
correct order, resets auto-increment counters, and reloads the curated fixtures.

## Production Hardening Checklist

- Replace demo credentials with hashed passwords.
- Issue distinct `.env.production` values for `CORS_ORIGIN` and `ALLOW_SEED=false`.
- Serve the API through a web server (Nginx/Apache) rather than the PHP dev server.
- Enable TLS and restrict database connectivity to your private network.
- Add migrations for schema evolution instead of importing full dumps.

---

This project is provided for demonstration purposes. Adapt the code and
instructions as needed for your own deployments.
