import { ApiClientError } from '@nocobase/app-client';
import { useDemoTask, type DemoTask } from '../../hooks/demo.js';

export function businessErrorKey(error: unknown): string {
  const status = error instanceof ApiClientError ? error.status : 500;
  const key =
    status === 401
      ? 'session'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'missing'
          : status === 409
            ? 'active'
            : 'failed';
  return `business.errors.${key}`;
}
export function useBusinessTask(missingKey?: string): DemoTask {
  return useDemoTask((error) =>
    missingKey && error instanceof ApiClientError && error.status === 404
      ? missingKey
      : businessErrorKey(error),
  );
}
