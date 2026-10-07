import {
  ApiError,
  type ApiErrorOptions,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';

/** The domain of every error release management reports. */
export const RELEASES_ERROR_DOMAIN = 'releases';

export type ReleasesErrorOptions = Pick<
  ApiErrorOptions,
  'httpStatus' | 'fieldViolations' | 'metadata' | 'cause'
>;

/** A refusal of release management; the HTTP API answers it in the standard error body. */
export class ReleasesError extends ApiError {
  public constructor(
    message: string,
    reason: string,
    status: ApiErrorStatus,
    options: ReleasesErrorOptions = {},
  ) {
    super({
      status,
      reason,
      domain: RELEASES_ERROR_DOMAIN,
      message,
      ...options,
    });
    this.name = 'ReleasesError';
  }
}

/** A missing record; `id` goes into `metadata`, so a route can tell which reference it was. */
export function notFound(
  what: string,
  reason: string,
  id?: string,
): ReleasesError {
  return new ReleasesError(
    `${what} not found.`,
    reason,
    'NOT_FOUND',
    id === undefined ? {} : { metadata: { id } },
  );
}

export function forbidden(
  message: string = 'You do not have permission to do this.',
  reason: string = 'FORBIDDEN',
): ReleasesError {
  return new ReleasesError(message, reason, 'PERMISSION_DENIED');
}

/**
 * Runs `work`, turning the not-found error of a record the request body names into an `INVALID_ARGUMENT` on that
 * field: only the record the URL names answers 404.
 */
export async function referencedBy<T>(
  references: Readonly<
    Record<string, { readonly reason: string; readonly id: string | undefined }>
  >,
  work: () => Promise<T>,
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ReleasesError && error.status === 'NOT_FOUND')
      for (const [field, { reason, id }] of Object.entries(references))
        if (
          id !== undefined &&
          error.reason === reason &&
          error.metadata?.['id'] === id
        )
          throw new ReleasesError(error.message, reason, 'INVALID_ARGUMENT', {
            fieldViolations: [{ field, description: error.message }],
          });
    throw error;
  }
}
