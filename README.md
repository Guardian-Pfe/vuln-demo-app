# User Management API

A simple REST API for managing users, built with Node.js, Express, and SQLite.

## Features

- User login with JWT authentication
- User lookup by ID or search by username/email
- Admin panel for user management
- Network diagnostic utility (ping)

## Setup

```bash
npm install
node index.js
```

The server starts on `http://localhost:3000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users/login` | Authenticate and receive a JWT |
| `GET` | `/api/users/:id` | Look up a user by ID |
| `GET` | `/api/users/search?q=` | Search users by username or email |
| `POST` | `/api/users/ping` | Ping a host (body: `{ "host": "..." }`) |
| `GET` | `/api/admin/users` | List all users (requires `X-Admin-Token` header) |
| `POST` | `/api/admin/users` | Create a user (requires `X-Admin-Token` header) |
| `DELETE` | `/api/admin/users/:id` | Delete a user (requires `X-Admin-Token` header) |
| `GET` | `/api/admin/config` | View server config (requires `X-Admin-Token` header) |

## Example Requests

**Login:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
```

**Get user:**
```bash
curl http://localhost:3000/api/users/1
```

**Admin — list all users:**
```bash
curl http://localhost:3000/api/admin/users \
  -H "X-Admin-Token: supersecret"
```

**Ping utility:**
```bash
curl -X POST http://localhost:3000/api/users/ping \
  -H "Content-Type: application/json" \
  -d '{"host":"127.0.0.1"}'
```

## Default Seed Users

| Username | Password | Role |
|----------|----------|------|
| admin | Admin1234! | admin |
| alice | password123 | user |
| bob | qwerty | user |
