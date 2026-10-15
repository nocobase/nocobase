import { ApiError } from '@nocobase/app-server/router';

export function reportError(status: 'INVALID_ARGUMENT' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'FAILED_PRECONDITION' | 'ABORTED', reason: string, message: string): ApiError {
  return new ApiError({ status, reason, domain: 'project-reports', message });
}
