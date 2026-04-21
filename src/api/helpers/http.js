/**
 * Единый формат JSON-ответов API.
 * @param { import('express').Response } res
 * @param { unknown } data
 * @param { number } [status=200]
 */
function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

/**
 * @param { import('express').Response } res
 * @param { number } status
 * @param { string } error
 */
function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

module.exports = { sendSuccess, sendError };
