class GameError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends GameError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

class AuthorizationError extends GameError {
  constructor(message) {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

class NotFoundError extends GameError {
  constructor(message) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

module.exports = {
  GameError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
};
