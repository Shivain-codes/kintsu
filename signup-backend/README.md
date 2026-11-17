# Kintsu Signup — 3rd Evaluation Demo

Node + Express backend for the Kintsu signup page. Signup page only: the form,
local JSON-file user CRUD, MongoDB user CRUD, and an external API fetch.

## Run it

```bash
npm install
node server.js
```

Open http://localhost:3000/signup.html

For MongoDB: copy `.env.example` to `.env` and paste your Atlas connection
string as `DATABASE_URL`, then restart. Without it the server still runs and
the JSON routes still work; the `/api/mongo/users` routes answer 503.

## What the signup page does

- Validates email (must contain `@`) and password (4+ characters).
- Saves the user to `localStorage` (`kintsu_user`) and POSTs it to `/api/users`.
- Lists all saved users (from `data/users.json`) and external users
  (from the public JSONPlaceholder API, via `/api/external/users`).
- The password is checked only — it is never stored or sent anywhere.

## Endpoints

| Method | Route | What it does |
| ------ | ----- | ------------ |
| GET | `/` | Health check |
| GET | `/api/users` | List users from `data/users.json` |
| GET | `/api/users/:id` | One user by id |
| POST | `/api/users` | Create a user (same email = update in place, keeps id/createdAt) |
| PUT | `/api/users/:id` | Update a user |
| DELETE | `/api/users/:id` | Delete a user |
| GET | `/api/mongo/users` | List users from MongoDB |
| GET | `/api/mongo/users/:id` | One user from MongoDB |
| POST | `/api/mongo/users` | Create a user in MongoDB |
| PUT | `/api/mongo/users/:id` | Update a user in MongoDB |
| DELETE | `/api/mongo/users/:id` | Delete a user from MongoDB |
| GET | `/api/external/users` | Users from https://jsonplaceholder.typicode.com/users |

## Try it with curl

```bash
# Health check
curl http://localhost:3000/

# Create a user (JSON file)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"shivain@example.com","username":"shivain"}'

# Create the same email again — updates in place, no duplicate
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"shivain@example.com","username":"shivain-g"}'

# List all users
curl http://localhost:3000/api/users

# One user (replace ID with the id from the create response)
curl http://localhost:3000/api/users/usr_<id>

# Update a user
curl -X PUT http://localhost:3000/api/users/usr_<id> \
  -H "Content-Type: application/json" \
  -d '{"username":"shivain-new"}'

# Delete a user
curl -X DELETE http://localhost:3000/api/users/usr_<id>

# Bad input: missing/invalid email
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}'

# External API (real data from JSONPlaceholder)
curl http://localhost:3000/api/external/users

# MongoDB CRUD — same five calls, under /api/mongo/users
# (needs DATABASE_URL in .env, otherwise 503)
curl -X POST http://localhost:3000/api/mongo/users \
  -H "Content-Type: application/json" \
  -d '{"email":"shivain@example.com","username":"shivain"}'
curl http://localhost:3000/api/mongo/users
curl http://localhost:3000/api/mongo/users/<mongo-id>
curl -X PUT http://localhost:3000/api/mongo/users/<mongo-id> \
  -H "Content-Type: application/json" \
  -d '{"username":"shivain-new"}'
curl -X DELETE http://localhost:3000/api/mongo/users/<mongo-id>

# The signup page itself
curl -I http://localhost:3000/signup.html
```
