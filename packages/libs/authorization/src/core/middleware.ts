import type { Context } from 'hono';
import type { AuthorizationSubject, KeyScope, Principal } from './types.js';

export interface AuthorizationSubjectCollection {
  add(subject: AuthorizationSubject): void;
  values(): readonly AuthorizationSubject[];
}

export interface AuthorizationMiddlewareRequest {
  readonly http: Context;
  principal?: Principal;
  readonly subjects: AuthorizationSubjectCollection;
  /** The scope of the credential the request arrived with; a step that recognizes a scoped credential sets it. */
  keyScope?: KeyScope;
}

export type AuthorizationMiddlewareNext = () => Promise<void>;

export type AuthorizationMiddleware = (
  request: AuthorizationMiddlewareRequest,
  next: AuthorizationMiddlewareNext,
) => Promise<void>;

export function createAuthorizationMiddlewareRequest(
  http: Context,
): AuthorizationMiddlewareRequest {
  const values: AuthorizationSubject[] = [];
  const keys = new Set<string>();
  return {
    http,
    subjects: {
      add(subject: AuthorizationSubject): void {
        const key = `${subject.type}\u0000${subject.id}`;
        if (keys.has(key)) return;
        keys.add(key);
        values.push(subject);
      },
      values(): readonly AuthorizationSubject[] {
        return [...values];
      },
    },
  };
}

export async function runAuthorizationMiddlewares(
  middlewares: readonly AuthorizationMiddleware[],
  request: AuthorizationMiddlewareRequest,
  complete: AuthorizationMiddlewareNext,
): Promise<void> {
  let current = -1;
  const dispatch = async (index: number): Promise<void> => {
    if (index <= current) {
      throw new Error('Authorization middleware called next() more than once');
    }
    current = index;
    const middleware = middlewares[index];
    if (!middleware) {
      await complete();
      return;
    }
    await middleware(request, () => dispatch(index + 1));
  };
  await dispatch(0);
}
