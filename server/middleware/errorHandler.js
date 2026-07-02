function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Uploaded file is too large.' });
  }

  console.error(error);
  return res.status(error.status || 500).json({
    message: error.message || 'Something went wrong.',
  });
}

module.exports = { notFound, errorHandler };
