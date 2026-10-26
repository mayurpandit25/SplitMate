# SplitMate — Shared Expense Management App

SplitMate is a full-stack expense-sharing application that helps users create groups, track shared expenses, split costs equally, view balances, and record settlements.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- REST API
- JWT Authentication

### Database
- MySQL
- SQL

## Getting Started

### Prerequisites
- Node.js
- npm
- MySQL Server
- Git

### 1. Install Node.js and npm

Node.js includes npm, the Node Package Manager.

Download and install the latest LTS version from the official website:

https://nodejs.org/en/download

Verify the installation:

```bash
node -v
npm -v
```

Both commands should display version numbers.

### 2. Install and Start MySQL

Install MySQL Server using the official instructions for your operating system:

https://dev.mysql.com/downloads/mysql/

Start the MySQL service and verify that you can connect to the server.

### 3. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create the environment configuration file:

```bash
cp .env.example .env
```

Edit `.env` and configure your local MySQL credentials and a secure, randomly generated `JWT_SECRET` of at least 32 characters.

Install backend dependencies:

```bash
npm install
```

Initialize the database tables:

```bash
npm run db:init
```

Start the backend:

```bash
npm run dev
```

The backend API runs at:

`http://localhost:8080/api`

### 4. Frontend Setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

Configure the API URL in `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

Start the frontend:

```bash
npm run dev
```

Open the application in your browser:

http://localhost:5173

## Security Notes

- Never commit actual `.env` files, database passwords, or JWT secrets to GitHub.
- Use strong, unique credentials for production deployments.
- Back up your MySQL database regularly.
