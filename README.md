# CSE Department Portal

A full-stack admin portal for a Computer Science & Engineering department. It includes JWT-protected admin login, publication CRUD, Excel import with duplicate detection, event management with image upload, dashboard analytics, charts, exports, responsive navigation, and dark mode.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Lucide React, Axios
- Backend: Node.js, Express.js, PostgreSQL, JWT, bcrypt, Multer, xlsx
- Security: Helmet, CORS, rate limiting, input validation, parameterized SQL queries

## Folder Structure

```text
client/
server/
server/routes
server/controllers
server/models
server/middleware
server/config
server/uploads
server/utils
```

## Database

Create a PostgreSQL database:

```sql
CREATE DATABASE cse_department_portal;
```

The schema is in `server/config/schema.sql` and is applied by the admin seed script. Publications are normalized into a parent `publications` table and child `publication_authors` rows, so a publication can have multiple student authors.

## Backend Setup

```bash
cd server
cp .env.example .env
npm install
npm run seed:admin
npm run dev
```

Default seeded credentials from `.env.example`:

```text
username: admin
password: Admin@12345
```

Change `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` before production use.

## Frontend Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## API Endpoints

- `POST /api/login`
- `GET /api/dashboard`
- `GET /api/publications`
- `POST /api/publications`
- `PUT /api/publications/:id`
- `DELETE /api/publications/:id`
- `POST /api/upload-excel`
- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

All endpoints except `/api/login` require `Authorization: Bearer <token>`.

## Excel Upload Columns

Supported column names:

- `S.No`
- `Student Name`
- `Regd.No`
- `Title of the Paper`
- `Conference/Journal`
- `Name of the Paper`
- `Type of Paper`
- `Year`
- `Faculty Guide`

The importer validates required data, groups consecutive author rows into one publication, ignores duplicate publication details and duplicate authors within a publication, inserts valid rows, and returns inserted, duplicate, and failed row counts/details.

For multi-author publications, place the publication details only on the first row. Put additional student names and registration numbers on the following rows and leave the publication detail columns blank.

## Production Notes

- Serve the React build through a static host or reverse proxy.
- Use a strong `JWT_SECRET`.
- Use HTTPS.
- Restrict `CLIENT_ORIGIN` to the deployed frontend origin.
- Keep uploaded files on durable storage in production.
- Run PostgreSQL migrations explicitly rather than relying only on `seed:admin`.
