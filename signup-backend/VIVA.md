# VIVA — Kintsu Signup Page (3rd Evaluation)

Short points only. Every line below matches the code in this folder.

## The big ideas, one at a time

- **Node** is JavaScript running outside the browser, on the server. It lets the
  signup page have a backend that saves data.
- **Express** is a small Node library for building a server. It gives us routing:
  "when a request comes to this URL with this method, run this function".
- **Middleware** is a function that runs before the route handler. Ours is
  `express.json()`: it reads the JSON body of a POST/PUT request and puts it on
  `req.body`. Without it, `req.body` is empty and the signup data never arrives.
- **Routing** is matching a method + URL to a handler. Example: `POST /api/users`
  runs the create-user handler; `GET /api/users/:id` runs the one-user handler,
  with `:id` as the id from the URL.
- **A REST API** is a set of URLs that the frontend calls with HTTP methods.
  Each URL does one job and answers with JSON.
- **CRUD maps to HTTP methods**: Create = POST, Read = GET, Update = PUT,
  Delete = DELETE. Five routes per store in this demo.

## The signup flow, end to end

- The page is the real Kintsu signup page from the 2nd evaluation (signup.html + signup.css), with the All users and External users sections added.
- User types email + password and submits the form.
- `signup.js` checks: email must contain `@`, password must be 4+ characters.
  If not, it shows the error message and stops.
- It builds `{ email, username }` — username is the part before `@`.
- It saves that user to `localStorage` under the key `kintsu_user`.
- It POSTs the same user as JSON to `/api/users` (`fetch` with
  `Content-Type: application/json`).
- Express runs the POST handler: it reads `data/users.json`, checks for the
  email with `findIndex`, and either updates the existing entry in place
  (keeps `id` and `createdAt`, refreshes `lastLogin`) or pushes a new user
  with `id: 'usr_' + Date.now()` and `createdAt`.
- It writes the whole array back to `data/users.json` and answers 201.
- The page then reloads the "All users" list with `GET /api/users`.
- The password is checked only. It is never stored in the JSON file, never
  sent to MongoDB, and never sent anywhere else.

## JSON file vs MongoDB

- **JSON file** (`data/users.json`): simple, no setup, good for a demo and for
  a few users. The whole file is read and written on every request.
- **MongoDB** (`/api/mongo/users`): a real database. It handles many users,
  many requests at once, and enforces rules itself — email is `unique`, so
  MongoDB rejects a duplicate email with error code 11000.
- Both stores have the same five routes, so the frontend could switch stores
  without changing how it calls the API.
- If MongoDB is down, the server still starts and the JSON routes still work.
  The Mongo routes answer 503 until the database is reachable.

## External API fetch

- **Browser fetch**: the page can call `https://jsonplaceholder.typicode.com/users`
  directly with `fetch`. It works here because that API allows cross-origin calls.
- **Server fetch** (what this demo does): the browser calls our own
  `GET /api/external/users`, and the server fetches the public API and passes
  the data through. This way the page still works when the browser blocks
  cross-origin calls, and the server can shape the data before sending it.
- If the outside API is down, our route answers 502 with an error message
  instead of crashing.

## Likely viva questions

1. **What is Node.js?**
   JavaScript that runs on the server instead of the browser, so the signup page
   can have a backend that saves data.

2. **What is Express?**
   A small Node library for building servers. It provides routing: a method +
   URL runs a handler function.

3. **What does `express.json()` do?**
   It is middleware that reads the JSON body of POST/PUT requests and puts it
   on `req.body`. Without it, `req.body` is empty.

4. **How does the signup form reach the server?**
   `signup.js` sends a `fetch` POST to `/api/users` with
   `Content-Type: application/json` and the user as the JSON body.

5. **What happens when the same email signs up twice?**
   No duplicate is created. The POST handler finds the email with `findIndex`,
   updates that entry in place, keeps its `id` and `createdAt`, and refreshes
   `lastLogin`.

6. **What do GET, POST, PUT, DELETE mean here?**
   GET reads, POST creates, PUT updates, DELETE removes. That mapping is CRUD.

7. **What is the difference between the JSON file and MongoDB?**
   The JSON file is simple storage for a demo; MongoDB is a real database that
   handles many users and enforces rules like unique email itself.

8. **How does MongoDB stop a duplicate email?**
   The schema says `unique: true` on email, so MongoDB rejects the second
   insert with error code 11000, and the route answers 400.

9. **What happens if MongoDB is down?**
   The server still starts, the JSON routes still work, and the Mongo routes
   answer 503 with a clear error message.

10. **Why fetch the external API through the server instead of directly?**
    The page still works when the browser blocks cross-origin calls, and the
    server can shape the data first. If the outside API fails, the route
    answers 502 instead of crashing.
