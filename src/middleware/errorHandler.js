const config = require('../config');
const multer = require('multer');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  res.status(err.statusCode).render('error', {
    title: 'Error',
    statusCode: err.statusCode,
    message: err.message,
    error: err,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(err.statusCode).render('error', {
      title: 'Error',
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  console.error('ERROR 💥', err);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(500).json({
      success: false,
      message: 'Something went very wrong!',
    });
  }

  res.status(500).render('error', {
    title: 'Error',
    statusCode: 500,
    message: 'Something went very wrong!',
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const isUploadError = err instanceof multer.MulterError || (err && err.code === 'LIMIT_FILE_SIZE');
  if (isUploadError && req.session) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large. Maximum allowed size is 6MB per image.'
      : `Upload failed: ${err.field ? `${err.field} - ` : ''}${err.message}`;
    if (req.flash) req.flash('error', message);
    const referer = req.get('Referer') || (req.originalUrl.includes('/admin') ? '/admin/products' : '/');
    return res.redirect(referer);
  }

  if (config.nodeEnv === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err, message: err.message };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, req, res);
  }
};

module.exports = { AppError, errorHandler };