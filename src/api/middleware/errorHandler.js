const errorHandler = (err, req, res, next) => {
  console.error('server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    status: err.status || 500
  });

  const status = err.status || 500;
  let message = 'Server error';
    if (status === 400) message = err.message || 'Invalid request';
    if (status === 401) message = err.message || 'Unauthorized access';
    if (status === 403) message = err.message || 'Access denied';
    if (status === 404) message = err.message || 'Resource not found';

  const response = {
    success: false,
    error: message
  };

  if (process.env.NODE_ENV !== 'production') {
    response.details = err.message;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;