// app.js
// The entry point of the application. It creates the Express app, switches on the
// middleware, connects the routes and starts the server.

require('dotenv').config();           // load variables from .env (local development)
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const pool = require('./config/db');
const pageRoutes = require('./routes/pageRoutes');

const app = express();

// Render runs the app behind a proxy. This lets Express see the visitor's real IP
// address and HTTPS connection (needed later for rate limiting and secure cookies).
app.set('trust proxy', 1);

// Tell Express to use EJS and where the templates are.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware: runs on every request, in this order.
app.use(express.json());                          // reads JSON request bodies (API calls)
app.use(express.urlencoded({ extended: false })); // reads normal HTML form bodies
app.use(cookieParser());                          // reads cookies (the login token, from Phase 2)
app.use(express.static(path.join(__dirname, 'public'))); // serves css, js and images

// Routes
app.use('/', pageRoutes);

// If no route matched, the page does not exist (404).
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'Endpoint not found' });
  }
  res.status(404).render('error', {
    title: 'Page not found',
    status: 404,
    message: 'The page you are looking for does not exist.',
  });
});

// Error handler: catches errors thrown inside routes (Express 5 also catches async errors).
// The four parameters (err, req, res, next) are how Express recognises an error handler.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  // Do not show technical details to visitors in production.
  const message = status < 500 || process.env.NODE_ENV !== 'production'
    ? err.message
    : 'Something went wrong. Please try again later.';

  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({ message });
  }
  res.status(status).render('error', { title: 'Error', status, message });
});

// Render gives us the port in process.env.PORT. Locally we fall back to 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await pool.query('SELECT 1'); // quick check that the database answers
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
});
