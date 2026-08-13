/**
 * Thrown by route handlers for expected, "friendly" errors (bad input, not
 * found, etc). Anything else that throws is treated as a 500 and never
 * leaks its stack trace to the client.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Wraps an async route handler so thrown errors/rejected promises reach next().
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Must be registered last, after all routes.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unexpected error - log full detail on the server, never send it to the client.
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
