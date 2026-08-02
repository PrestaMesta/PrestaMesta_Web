/**
 * Reference implementation of a minimal backend for the launch-notification form.
 *
 * NOT wired into the Angular app, its build, or CI (see docs/decisions/007-form-backend.md). The
 * frontend always runs in demo mode. This file exists to demonstrate the server-side practices
 * the assignment asks for: server-side validation, a honeypot check, rate limiting, a request
 * body size limit, restrictive CORS, generic error responses, and environment-based
 * configuration — without adding a database or deploying anything.
 */
import cors from 'cors';
import express from 'express';
import { createRateLimiter } from './rate-limiter.mjs';
import { isHoneypotFilled, isValidEmail } from './validators.mjs';

const PORT = Number(process.env.PORT) || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:4200';
const MAX_BODY_SIZE = '10kb';
const REQUEST_TIMEOUT_MS = 5000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
});

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    res.status(503).json({ message: 'Request timed out.' });
  });
  next();
});

app.use(express.json({ limit: MAX_BODY_SIZE }));

// Restrictive CORS: a single explicit origin from configuration, never a wildcard.
app.use(cors({ origin: ALLOWED_ORIGIN, methods: ['POST'] }));

app.post('/api/launch-notifications', (req, res) => {
  if (rateLimiter.isLimited(req.ip)) {
    res.status(429).json({ message: 'Too many requests.' });
    return;
  }

  const body = req.body ?? {};

  // Bots that fill the honeypot get a fake success so they don't learn it was detected — but
  // nothing is stored or forwarded.
  if (isHoneypotFilled(body.company)) {
    res.status(202).json({ message: 'Received.' });
    return;
  }

  if (!isValidEmail(body.email)) {
    res.status(400).json({ message: 'Invalid request.' });
    return;
  }

  // Reference implementation only: nothing is persisted. A real implementation would store the
  // (normalized/possibly hashed) email or forward it to a mailing list provider here, using
  // credentials read from environment variables — never hardcoded, never sent to the client.
  res.status(202).json({ message: 'Received.' });
});

// Generic error handler: no stack traces, no internal details in the response.
app.use((_err, _req, res, _next) => {
  res.status(500).json({ message: 'Internal error.' });
});

const server = app.listen(PORT, () => {
  console.log(`Reference launch-notification API listening on port ${PORT}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
