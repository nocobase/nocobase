// The exit code of a failed request: what the CLI on a machine and an online run's shell both exit with.
import {
  ERROR_API_STATUS,
  EXIT_CODES,
  exitCodeFor,
  type ExitCode,
} from '@nocobase/agent-protocol';

/**
 * A reason of the standard error body (one with its canonical `apiStatus`, or one the agent protocol defines) decides;
 * otherwise the HTTP status does, 0 meaning no response arrived.
 */
export function apiExitCode(
  httpStatus: number,
  reason: string,
  apiStatus?: string,
): ExitCode {
  if (apiStatus !== undefined || reason in ERROR_API_STATUS)
    return exitCodeFor(reason, apiStatus);
  if (httpStatus === 0) return EXIT_CODES.network;
  if (httpStatus === 401 || httpStatus === 403) return EXIT_CODES.auth;
  if (httpStatus === 404) return EXIT_CODES.notFound;
  if (httpStatus === 400) return EXIT_CODES.validation;
  if (httpStatus === 409) return EXIT_CODES.conflict;
  if (httpStatus >= 500) return EXIT_CODES.network;
  return EXIT_CODES.general;
}
