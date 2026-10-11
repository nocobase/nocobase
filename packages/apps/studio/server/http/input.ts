/**
 * Validated input and list bodies for Studio's routes: Hono's `validator()` over `parseApiInput`, so handlers read only
 * `context.req.valid(...)`. Put these after the authentication and permission middleware.
 */
import {
  parseApiInput,
  type ApiInputSchema,
} from '@nocobase/app-server/router';
import { validator } from 'hono/validator';
import { z } from 'zod';

export function params<T>(schema: ApiInputSchema<T>) {
  return validator('param', (value) => parseApiInput(schema, value));
}

export function query<T>(schema: ApiInputSchema<T>) {
  return validator('query', (value) => parseApiInput(schema, value));
}

/** Validates the JSON body (`{}` without one). */
export function json<T>(schema: ApiInputSchema<T>) {
  return validator('json', (value) => parseApiInput(schema, value));
}

/** A bounded list, answered whole. */
export function boundedList<T>(data: readonly T[]): {
  readonly data: readonly T[];
  readonly meta: { readonly total: number };
} {
  return { data, meta: { total: data.length } };
}

/** A comma-separated list of ids in the query string (`a,b`), at most `max` of them. */
export function idList(max: number) {
  return z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string()).max(max));
}
