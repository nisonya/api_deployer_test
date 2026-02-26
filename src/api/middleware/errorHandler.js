/**
 * Финальный middleware для обработки ошибок (вызывается через next(err)).
 * Должен быть зарегистрирован последним, после всех маршрутов.
 */
function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;

  console.error('API error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    status
  });

  const message =
    status === 500
      ? 'Server error. Try again later.'
      : err.message || getDefaultMessage(status);

  const body = { success: false, error: message };
  if (process.env.NODE_ENV !== 'production') {
    body.details = err.message;
  }

  res.status(status).json(body);
}

function getDefaultMessage(status) {
  const messages = {
    400: 'Invalid request',
    401: 'Unauthorized access',
    403: 'Access denied',
    404: 'Resource not found'
  };
  return messages[status] ?? 'Error';
}

module.exports = errorHandler;
