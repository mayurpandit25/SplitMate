# SplitMate — Shared Expense Management App

SplitMate is a full-stack shared expense management application that helps users create groups, track shared expenses, split costs equally, view balances, and record settlements.

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
- Node.js and npm
- MySQL Server

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create the environment configuration file:

```bash
cp .env.example .env
```

Edit `.env` and configure your MySQL credentials and a secure `JWT_SECRET` of at least 32 characters.

Install dependencies:

```bash
npm install
```

Initialize the database tables:

```bash
npm run db:init
```

Start the backend server:

```bash
npm run dev
```

The backend API runs at:

`http://localhost:8080/api`

### 2. Frontend Setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the frontend environment file if needed:

```bash
cp .env.example .env
```

Configure the API URL in `.env`:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

Start the frontend:

```bash
npm run dev
```

Open the application in your browser:

`http://localhost:5173`

## Security Notes

- Never commit actual `.env` files, database passwords, or JWT secrets to GitHub.
- Use strong, unique credentials for production deployments.
- Back up the MySQL database regularly.
