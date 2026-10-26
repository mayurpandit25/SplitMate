# SplitMate Backend

A single-service REST API for SplitMate built with Node.js, Express, and MySQL. This project is intended to run directly on your machine first. It does **not** use Docker.

## Requirements

- Node.js 18 or newer (Node.js 20 LTS recommended)
- MySQL Server 8.x running locally or on a reachable database host
- MySQL account allowed to create/use the `splitmate` database (or create it manually and grant access)

## 1. Install dependencies

Open a terminal in this `splitmate-backend` folder:

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows CMD:

```cmd
copy .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Edit `.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and a long random `JWT_SECRET` (at least 32 characters). Never commit `.env`.

## 3. Create a MySQL user and database

Log in to MySQL as an administrator:

```sql
CREATE DATABASE splitmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'splitmate_user'@'localhost' IDENTIFIED BY 'use_a_strong_password_here';
GRANT ALL PRIVILEGES ON splitmate.* TO 'splitmate_user'@'localhost';
FLUSH PRIVILEGES;
```

Use the same user/password in `.env`. If the database or user already exists, skip the matching `CREATE` statement and grant the privileges. If your MySQL setup uses a different host or user, adjust the SQL host and `.env` accordingly.

## 4. Create the database tables

```bash
npm run db:init
```

Expected output:

```text
SplitMate tables created successfully.
```

## 5. Start the API

Development mode (automatically restarts on code changes):

```bash
npm run dev
```

Production-style local run:

```bash
npm start
```

The API listens on `http://localhost:8080`.

## 6. Verify

Open `http://localhost:8080/api/health`. Expected response:

```json
{"status":"ok","service":"splitmate-api","database":"connected"}
```

If the response says database unavailable, check that MySQL is running and `.env` credentials/database settings are correct.

## API routes

All protected routes require this header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/health` | API and DB health | No |
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Current account | Yes |
| POST | `/api/auth/logout` | Logout acknowledgement; client removes token | Yes |
| GET | `/api/users/search?email=...` | Find registered users by email | Yes |
| GET | `/api/groups` | List groups for current user | Yes |
| POST | `/api/groups` | Create group | Yes |
| GET | `/api/groups/:id/members` | List group members | Yes |
| POST | `/api/groups/:id/members` | Add existing user by email (creator only) | Yes |
| DELETE | `/api/groups/:id` | Delete own group | Yes |
| GET | `/api/expenses` | List expenses visible to current user | Yes |
| GET | `/api/expenses?groupId=1` | List expenses in a group | Yes |
| POST | `/api/expenses` | Create expense with equal split | Yes |
| GET | `/api/expenses/:id/splits` | List expense shares | Yes |
| DELETE | `/api/expenses/:id` | Delete an expense you paid | Yes |
| GET | `/api/balances` | Calculate shared-group net balances | Yes |
| GET | `/api/settlements` | List settlements involving current user | Yes |
| POST | `/api/settlements` | Record a settlement | Yes |
