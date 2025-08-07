// import { ApiError } from "next/dist/server/api-utils";

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong!",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.status = false;
    this.errors = errors;
    this.message = message;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
