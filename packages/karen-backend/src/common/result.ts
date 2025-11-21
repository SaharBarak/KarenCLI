/**
 * Result monad for NestJS backend
 * Using neverthrow for functional error handling
 */

import { Result, ok, err } from 'neverthrow';

export { Result, ok, err } from 'neverthrow';

/**
 * Service error types
 */
export enum ServiceErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  STRIPE_ERROR = 'STRIPE_ERROR',
  GITHUB_ERROR = 'GITHUB_ERROR',
  AUDIT_ERROR = 'AUDIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
    public readonly cause?: unknown,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  static databaseError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.DATABASE_ERROR, message, cause, 500);
  }

  static validationError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.VALIDATION_ERROR, message, cause, 400);
  }

  static authenticationError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.AUTHENTICATION_ERROR, message, cause, 401);
  }

  static authorizationError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.AUTHORIZATION_ERROR, message, cause, 403);
  }

  static notFound(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.NOT_FOUND, message, cause, 404);
  }

  static stripeError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.STRIPE_ERROR, message, cause, 500);
  }

  static githubError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.GITHUB_ERROR, message, cause, 500);
  }

  static auditError(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.AUDIT_ERROR, message, cause, 500);
  }

  static unknown(message: string, cause?: unknown): ServiceError {
    return new ServiceError(ServiceErrorCode.UNKNOWN_ERROR, message, cause, 500);
  }
}

/**
 * Type alias for service results
 */
export type ServiceResult<T> = Result<T, ServiceError>;

/**
 * Utility to wrap async service calls
 */
export async function resultify<T>(
  fn: () => Promise<T>,
  errorMapper?: (error: unknown) => ServiceError
): Promise<ServiceResult<T>> {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    const serviceError = errorMapper
      ? errorMapper(error)
      : ServiceError.unknown('An unexpected error occurred', error);
    return err(serviceError);
  }
}
