# Kintsu

## PROJECT OVERVIEW

Kintsu is a study workspace that puts everything a student needs into one browser tab. Right now if you're watching a lecture on YouTube, you probably have a separate tab for notes (Google Docs or Notion), another tab with an online code editor if the lecture involves programming, and maybe a flashcard app like Anki open somewhere too. You're constantly switching between all of these, losing focus every time. Kintsu fixes this by combining the video player, a notes editor, a code editor with a compiler, and AI-powered flashcard generation all into one single page. You open one link, paste a YouTube URL, and everything you need is right there side by side.

## FULL TECH STACK

The frontend is built with plain HTML, CSS, and vanilla JavaScript. There is no React, no Vue, no framework at all. The styling is just a regular CSS file with flexbox layouts and CSS animations. No Tailwind, no Bootstrap, no preprocessor.

The backend runs on Node.js with Express.js. Express handles all the API routes that the frontend talks to — things like running code, generating flashcards, and saving data.

The database is MongoDB, and we use Mongoose to define schemas and run queries. Mongoose makes it easier to structure the data and validate it before saving.

For external APIs, we use three main ones. The YouTube IFrame Player API handles embedding and controlling the video player. The Piston API is a free public code execution API that runs code in a sandbox — we send code to it and get the output back. The Google Gemini API handles AI text generation, which we use to turn notes into flashcard question-answer pairs.

The only library we use on the frontend is html2pdf.js, which is loaded through a CDN script tag. It converts HTML content into a downloadable PDF file. No npm install needed for it.

## VIDEO + NOTES WORKSPACE

This is the main feature of Kintsu. When you open a workspace, the page loads the YouTube IFrame Player API by injecting a script tag that points to YouTube's API URL. Once the API is ready, it calls a callback function where we create a new YT.Player object and pass it a div ID and a video ID. This gives us a fully controllable YouTube player embedded on the page.

Next to the player, there's a notes area. This is just a regular div element with the contenteditable attribute set to true, which means you can type directly into it like a text editor. There's no library handling this — it's a native browser feature.

The important part is the timestamp button. There's a small "stamp" button near the notes area. When you click it, JavaScript calls player.getCurrentTime() on the YouTube player object. This returns the current playback position in seconds, like 127.45. We take that number, do some math to convert it to minutes and seconds (Math.floor(seconds / 60) for minutes, seconds % 60 for the remainder), and format it into a string like "2:07".

Then we use document.createElement('button') to create a small clickable button element, set its textContent to that timestamp string, and insert it into the notes div at the current cursor position using window.getSelection() and range.insertNode(). We also add an addEventListener('click') to that button so that when you click on it later, it calls player.seekTo(originalSeconds) and the video jumps right back to that exact moment.

All of this is done with plain DOM manipulation. No special editor library, no rich text framework. Just createElement, innerHTML, addEventListener, and the browser's built-in contenteditable.

## CODE EDITOR AND COMPILER

The code editor is a plain HTML textarea element. That's it. You type your code into it just like typing into any text box. Above the textarea, there's a dropdown select element where you can pick the programming language — JavaScript, Python, C++, Java, and so on.

When you click the "Run" button, JavaScript reads the value from the textarea (the code you typed) and the selected language from the dropdown. It then sends both of these to our own Express backend using a fetch() POST request to a route like /api/compile. The body of the request is a JSON object with the code string and the language string.

On the backend, the Express route handler receives this request. Instead of actually running the code on our own server (which would be dangerous — someone could write a script that deletes files or crashes the server), it forwards the request to the Piston API. Piston is a free, public API that runs code inside a sandboxed container. Our Express route sends a POST request to Piston's endpoint with the code and language, waits for the response, and then sends that response back to the frontend as JSON.

The frontend receives the JSON response, which contains the output text (whatever the code printed), and displays it inside a small div below the textarea that acts like a console output area. We just set that div's textContent to the output string.

The reason we route this through our own backend instead of calling Piston directly from the browser is partly for security (we can add rate limiting and validation) and partly because some APIs don't allow direct browser requests due to CORS restrictions.

## AI FLASHCARDS

The flashcard feature works like this. The student either selects some text from their notes or just clicks a "Generate Flashcards" button which grabs all the note content.

JavaScript takes that text and sends it via fetch() as a POST request to an Express route at /api/flashcards. The request body is just a JSON object with the note text.

On the backend, the Express route takes that text and sends it to the Google Gemini API. We construct a prompt that says something like "Based on the following study notes, generate a JSON array of question-answer pairs for flashcards. Return only valid JSON, no extra text." followed by the actual note content. We send this prompt to Gemini's API endpoint using a POST request with our API key.

Gemini responds with a text string that contains a JSON array. We parse that string with JSON.parse() on the backend to make sure it's valid JSON, and then send it back to the frontend as a proper JSON response.

On the frontend, JavaScript receives this array — something like [{question: "What is a pointer?", answer: "A variable that stores a memory address"}] — and loops through it with a forEach. For each pair, it creates a div element styled as a flashcard. The front shows the question, and clicking on the card toggles a CSS class that flips it or swaps the text content to show the answer.

These flashcards can also be saved to MongoDB. When the student clicks a "Save" button, the flashcard array gets sent to another Express route which uses a Mongoose model to save the data to a MongoDB collection. Each document stores the user ID, the video ID, and the array of flashcard pairs. When the student comes back later, the page loads their saved flashcards from the database on page load.

## PDF NOTES EXPORT

This feature is the simplest one. The html2pdf.js library is loaded on the page via a CDN script tag in the HTML file — something like a script tag pointing to a cdnjs URL. No npm install, no build step.

When the student clicks "Download as PDF", JavaScript grabs the notes div element using document.getElementById or querySelector. Then it calls html2pdf().from(element).set({ margin: 10, filename: 'my-notes.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).save().

That's literally it. The library takes the rendered HTML content of that div — including any formatted text, timestamp buttons, and whatever else is in the notes — converts it into a canvas using html2canvas internally, then converts that canvas into a PDF using jsPDF internally, and triggers a browser download of the resulting file.

No backend route is needed for this. It all happens in the browser. The student gets a PDF file that looks exactly like their notes on screen.

## PAUSE/REWIND HEATMAP

Every time the student interacts with the video in a way that suggests they're struggling with a section — pausing or seeking backward — we track it.

The YouTube IFrame Player API fires events when the player state changes. We add an event listener for the onStateChange event. When the state changes to PAUSED (state value 2), we grab the current timestamp with player.getCurrentTime() and send it to an Express route at /api/heatmap via fetch() POST. The body looks like { videoId: "abc123", timestamp: 127, action: "pause" }.

For rewind detection, we keep track of the previous timestamp. On every state change or time update, we compare the current time to the last known time. If the current time is significantly less than the previous time (meaning the student dragged the progress bar backward), we log that as a "rewind" action and send it the same way.

On the backend, the Express route uses a Mongoose model to save each event as a small document in a MongoDB collection. Each document has the video ID, the timestamp in seconds, and the action type.

When the video page loads, JavaScript fetches all heatmap entries for the current video from the backend. It then groups them into time buckets — for example, every 10-second interval. For each bucket, it counts how many pause and rewind events happened. It then creates a row of small div elements, one per bucket, and sets each div's background color based on the count. More events means a darker shade of pink or red, fewer events means a lighter shade. This row gets positioned underneath the video progress bar.

The result is a visual strip that shows which parts of the lecture were most replayed, similar to the "most replayed" feature on YouTube itself. But this one is built from the student's own data stored in our own MongoDB database, not from crowd data.

## HOW EVERYTHING CONNECTS

Here's how the full system works from start to finish.

The browser makes an initial request to our Express server, which serves the static HTML, CSS, and JS files from a public/ folder using express.static(). The page loads, and from that point on, the browser never does a full page reload.

Every dynamic action happens through JavaScript fetch() calls. When the student runs code, JavaScript sends the code to /api/compile, Express forwards it to Piston, gets the output, and sends it back as JSON. When the student wants flashcards, JavaScript sends the note text to /api/flashcards, Express sends it to Gemini, parses the response, and sends back JSON. When the student pauses or rewinds, JavaScript sends the timestamp to /api/heatmap, and Express saves it to MongoDB via Mongoose.

Every time the frontend gets a JSON response back, it uses plain DOM methods — createElement, appendChild, textContent, classList.toggle — to update what's on screen. No virtual DOM, no state management library, no reactivity framework. Just direct manipulation of the actual page elements.

The database layer is straightforward. Mongoose models define the shape of documents (like a Flashcard schema with fields for userId, videoId, and cards array). Express routes call methods like Flashcard.find() to read data and new Flashcard().save() to write data. MongoDB stores everything as JSON-like documents, so the data format matches naturally with what JavaScript uses.

## FOLDER STRUCTURE

```
kintsu/
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── routes/
│   ├── compile.js
│   ├── flashcards.js
│   └── heatmap.js
├── models/
│   ├── Flashcard.js
│   ├── HeatmapEvent.js
│   └── Note.js
├── server.js
├── package.json
└── .env
```

The public/ folder holds all frontend files. Express serves this folder as static files.

The routes/ folder has one file per API route. Each file exports an Express router with the relevant GET and POST handlers.

The models/ folder has one file per Mongoose schema. Each file defines the schema fields and exports the model.

server.js is the entry point. It sets up Express, connects to MongoDB using a connection string from the .env file, registers the route files, and starts listening on a port.

The .env file stores sensitive stuff like the MongoDB connection string, the Gemini API key, and the port number. This file is never committed to Git.

## STUDY VAULT DASHBOARD

Open `dashboard.html` (run `node server.js` and visit http://localhost:3333/dashboard.html). The dashboard copies the live One Stop Notes dashboard design: neubrutalist cards with thick black outlines and hard shadows, pale pink page, white cards, hot pink / yellow / lavender accents, mono labels and bold display titles, default light theme with a dark-mode toggle.

What the dashboard does:

- Boards sidebar: All Notes plus Computer Science and Machine Learning, with per-board counts. Clicking a board filters the notes grid, updates the heading and count, and shows an empty state for empty boards. The active board is yellow.
- Create new note: goes to the workspace editor (`index.html#workspace`), like the live site. There is no create-note modal on the dashboard.
- New Board: an inline form inside the sidebar, not a modal. Enter a board name, pick one of seven colours (Pink, Yellow, Lilac, Mint, Sky, Coral, Lime), then Create or Cancel. Created boards are saved in the browser and appear in the sidebar.
- Select and batch: Select turns into Cancel Select. Cards show a circular checkbox and a pink tap-to-select hint, and selected cards get a hot-pink outline. The batch bar above the grid shows the selected count, Move to board (including Unsorted), Delete, and close.
- Quick Start: floating bottom-right card with a pink QUICK START label, 0/5 progress, minimise and close controls, Step 1 to paste a video, Use suggested video and I will paste my own buttons that go to the editor.
- Notes: white rounded cards with cover art, ID pill, title, date, delete, and Open to the workspace. Export with Save to JSON.

There is no sample banner or toast on the dashboard, matching the live site.
