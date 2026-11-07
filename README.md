# Academic Certificate Verification System

A web application that lets educational institutions issue academic certificates with a unique verification code, and lets **anyone** check whether a certificate is genuine, without needing an account.

Built with **Node.js, Express, EJS and PostgreSQL** using a simple **MVC** structure and **Node.js EventEmitter** for event-driven processing. The database runs on **Neon** and the application on **Render**.

## Features

- Login with role-based access (Administrator, Institution Staff, Student, Verifier)
- Administrator: manage institutions and user accounts
- Institution staff: register students (optionally creating their login at the same time), issue and revoke certificates, **only for their own institution**
- Automatic unique verification code for each certificate, in the form `CERT-XXXXXXXX`
- **Public verification** through a web page or `POST /api/verify`, with four results: `VALID`, `REVOKED`, `NOT_FOUND`, `INVALID`
- Every verification attempt, including failed ones, is saved as history
- Role-based dashboards and history pages
- Rate limiting on login and verification
- Event-driven logging with `CertificateIssued` and `VerificationRequested`

## Technology

| Part | Technology |
|---|---|
| Server | Node.js, Express 5 |
| Pages | EJS (server-rendered) with small browser scripts using `fetch` |
| Database | PostgreSQL on Neon (`pg` connection pool, SSL) |
| Login | JWT in an HTTP-only cookie, passwords hashed with `bcryptjs` |
| Events | Node.js `EventEmitter` |
| Rate limiting | `express-rate-limit` |
| Hosting | Render (application), Neon (database) |
| API testing | Postman |

## How it works

```
Browser / Postman
      |
   app.js  (JSON + form parsing, cookies, static files, optionalAuth)
      |
   Routes  ->  requireAuth / roleGuard  ->  Controllers  ->  Models  ->  PostgreSQL (Neon)
                                                 |
                                            eventBus.emit(...)  ->  listeners.js
```

- **Routes** connect a URL to a controller and say who may use it.
- **Controllers** read the request, apply the rules and send the response.
- **Models** contain all the SQL.
- **Views** are EJS templates. Pages are rendered on the server; actions (login, create, revoke, verify) call the REST API with `fetch`.
- **Middleware** (`middleware/auth.js`, `middleware/roleGuard.js`) identifies the user and checks the role.
- **Events** (`events/`) announce that something happened, and listeners react without the controller knowing about them.

### Verification workflow

1. `POST /api/verify` receives `{ "code": "..." }` (no login needed; a logged-in user is recorded if there is one).
2. The code is cleaned (trimmed, upper-cased). If it does not match `^CERT-[0-9A-F]{8}$` the result is `INVALID`.
3. Otherwise the database is searched: no match is `NOT_FOUND`, a revoked certificate is `REVOKED`, otherwise `VALID`.
4. The request and result are saved in **one database transaction**.
5. Only then is `VerificationRequested` emitted and the answer returned.

## Roles and permissions

| Action | Public | Student | Verifier | Institution staff | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Verify a certificate | yes | yes | yes | yes | yes |
| See own verification history | no | no | yes | no | yes (all) |
| See history of own institution's certificates | no | no | no | yes | yes |
| View own certificates | no | yes | no | no | no |
| Manage students | no | no | no | own institution | all |
| Issue / revoke certificates | no | no | no | own institution | any |
| Manage institutions and users | no | no | no | no | yes |

## Database

Seven tables: `roles`, `institutions`, `users`, `students`, `certificates`, `verification_requests`, `verification_results`. See `database/schema.sql`.

- `users.institution_id` is set for institution staff and students only.
- `students.user_id` optionally links a student record to a login account.
- `certificates.verification_code` is `UNIQUE` and has a `CHECK` that enforces the `CERT-XXXXXXXX` format.
- `verification_requests.certificate_id` and `verifier_id` are nullable, so failed and anonymous attempts can be stored.
- `verification_results.request_id` is `UNIQUE`, giving a one-to-one link with the request.

## REST API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public (10 failed attempts / 15 min / IP) |
| POST | `/api/auth/logout` | Logged in |
| GET | `/api/auth/me` | Logged in |
| GET, POST | `/api/institutions` | Admin |
| PUT | `/api/institutions/:id` | Admin |
| GET, POST | `/api/users` | Admin |
| PUT | `/api/users/:id` | Admin |
| GET, POST | `/api/students` | Admin, Staff (own institution) |
| PUT | `/api/students/:id` | Admin, Staff (own institution) |
| GET | `/api/certificates` | Admin, Staff (own institution), Student (own) |
| POST | `/api/certificates` | Admin, Staff |
| PATCH | `/api/certificates/:id/revoke` | Admin, Staff |
| **POST** | **`/api/verify`** | **Public (20 requests / minute / IP)** |
| GET | `/api/verifications` | Admin (all), Staff (own institution), Verifier (own) |

Pages: `/login`, `/dashboard`, `/verify`, `/verify/history`, `/admin/institutions`, `/admin/users`, `/institution/students`, `/institution/certificates`, `/student/certificates`.

## Project structure

```
certverify/
├── app.js                    Starts the server, sets up middleware and routes
├── config/db.js              PostgreSQL connection pool (Neon, SSL)
├── routes/                   URL -> controller, plus who may use it
├── controllers/              Request handling and rules
├── models/                   SQL queries
├── middleware/
│   ├── auth.js               optionalAuth (who is this?) and requireAuth (must be logged in)
│   └── roleGuard.js          Allows only certain roles
├── events/
│   ├── eventBus.js           The shared EventEmitter
│   └── listeners.js          What happens on CertificateIssued / VerificationRequested
├── views/                    EJS templates (partials, auth, admin, institution, student, verification)
├── public/                   css, browser scripts, images/logo.png
├── database/                 schema.sql, seed.sql, testConnection.js
├── postman/                  Postman collection with tests
├── .env.example              Names of the environment variables (no secrets)
└── package.json
```

## Run it locally

You need Node.js 20 or newer and a PostgreSQL database (a free Neon project works well).

```bash
git clone <your-repository-url>
cd certverify
npm install
cp .env.example .env          # then edit .env
```

1. Put your database connection string and a long random secret into `.env`:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
   JWT_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```
2. Create the tables and starting data by running `database/schema.sql` and then `database/seed.sql` in the database's SQL editor.
3. Check the connection, then start the app:
   ```bash
   npm run test-db
   npm run dev          # development (restarts on changes)
   npm start            # production
   ```
4. Open http://localhost:3000.

**Starting account:** `admin@example.com` / `Admin@123`. This password appears in `seed.sql`, so **change it** before using the system for real (see "Change the admin password").

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string (must end with `sslmode=verify-full` or `require`) |
| `JWT_SECRET` | Secret used to sign login tokens |
| `NODE_ENV` | `development` locally, `production` on Render (turns on secure cookies) |
| `PORT` | Set automatically by Render. Defaults to 3000 locally |

## Deployment (Neon + Render)

**Neon:** create a project, run `schema.sql` then `seed.sql` in the SQL Editor, and copy the connection string (change `sslmode=require` to `sslmode=verify-full`).

**Render:** create a **Web Service** from the GitHub repository.

| Setting | Value |
|---|---|
| Build command | `npm install` |
| Start command | `npm start` |
| Environment variables | `DATABASE_URL`, `JWT_SECRET` (a new one for production), `NODE_ENV=production` |

Render provides `PORT` itself. Every `git push` to the main branch redeploys the site automatically. Database changes are **not** automatic: run any new SQL in Neon yourself.

### Change the admin password

```bash
node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword', 10))"
```
```sql
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE email = 'admin@example.com';
```

## Testing with Postman

Import `postman/Certificate-Verification.postman_collection.json`, set the collection variables `baseUrl`, `adminEmail` and `adminPassword`, and run the collection. It contains 46 requests and 84 checks covering login, institutions, users, students, certificates, public verification, history and permission failures. Each run creates uniquely named records, so it can be repeated.

## Security notes

- Passwords are stored only as bcrypt hashes; the hash is never sent to the browser.
- The login token is in an `HttpOnly`, `SameSite=Lax` cookie (and `Secure` in production). The user is reloaded from the database on every request, so deactivating an account takes effect immediately.
- All SQL uses parameters (`$1`, `$2`, ...), which prevents SQL injection. EJS escapes output, which prevents cross-site scripting.
- Institution staff can only reach their own institution's data. Requests for another institution's records return 404, the same as for records that do not exist.
- Login and verification are rate limited. Secrets live only in environment variables.

## Known limitations

- Rate-limit counters are kept in memory and reset when the server restarts.
- There are no delete operations, no password-reset flow and no e-mail notifications.
- History pages show the 200 most recent checks.
- The event system runs inside one Node.js process; it is not a message queue.
- Anyone holding a verification code can see the student's name and certificate details. That is what verification is for, so the code should be shared deliberately.
