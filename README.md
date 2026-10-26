# SplitMate — ready-to-run shared expense app

A full-stack shared-expenses application with a React/Vite frontend, Node.js/Express API, and MySQL database. It includes account registration/login, groups, adding registered members by email, expense tracking, equal splits, balances, settlement records, and deleting an expense (only the original payer can delete it).

## Easiest start: Docker Compose

**You do not need to install Node.js or MySQL on your computer for this method.** Install Docker Desktop (Windows: enable WSL 2 integration if you use Ubuntu/WSL), then:

1. Extract this ZIP to a folder, for example `C:\SplitMate-Ready`.
2. In that folder, copy `.env.example` to `.env`.
3. Edit `.env` and replace all example passwords and `JWT_SECRET` with your own strong values. Use different strong values for `MYSQL_ROOT_PASSWORD` and `DB_PASSWORD`; the app uses `DB_PASSWORD` for its app database user.
4. Open a terminal in the extracted folder and run:

   ```bash
   docker compose up --build -d
   ```

5. Open **http://localhost:8088**.
6. Choose **Create one** to register your first account, then create a group and add expenses.

Check containers:

```bash
docker compose ps
docker compose logs -f backend
```

Stop the app without deleting your database:

```bash
docker compose down
```

Stop the app and delete all stored application data (destructive):

```bash
docker compose down -v
```

## How to use

1. Register each person with their own email address.
2. Create a group (the creator is automatically added as its owner).
3. Open the group and add members using their registered email addresses.
4. Add an expense. The logged-in user is recorded as the payer and the amount is split equally between all members of that group at the time the expense is created.
5. Check Balances. A positive amount means the other person owes you; a negative amount means you owe the other person.
6. Record a settlement when a payment has actually been made.

## Local development without Docker

Requirements: Node.js 20+ and MySQL 8. Create a database and user, then:

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your local MySQL credentials and a random JWT_SECRET (32+ characters).
npm install
npm run db:init
npm run dev
```

### Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server calls the API at `http://localhost:8080/api` if `VITE_API_URL` is not set. For a different API URL, create `frontend/.env.local` with `VITE_API_URL=http://localhost:8080/api`.

## Deployment notes

- The Docker setup serves the frontend and API through the same origin on port **8088**, with Nginx proxying `/api` to the backend. For a public server, put HTTPS in front of the app (for example, a reverse proxy with a TLS certificate), expose only the intended web port, and use strong unique secrets.
- Do not commit `.env` to Git. Keep regular database backups.
- This is a practical starter app, not a financial ledger or audited accounting system. Expense splits are equal across current group members, and settlements are recorded as entered; they are not automatically limited to an exact outstanding debt.
