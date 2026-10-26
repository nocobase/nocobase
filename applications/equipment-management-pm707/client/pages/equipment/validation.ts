import { ApiClientError } from '@nocobase/app-client';
import { z } from 'zod';
export class RequiredFieldError extends Error {
  constructor(readonly field: string) {
    super('A required field is missing.');
  }
}
const violations = z.object({
  error: z.object({
    fieldViolations: z.array(z.object({ field: z.string() })).optional(),
  }),
});
export function invalidFields(error: unknown): string[] {
  if (error instanceof RequiredFieldError) return [error.field];
  if (!(error instanceof ApiClientError)) return [];
  const parsed = violations.safeParse(error.payload);
  return parsed.success
    ? (parsed.data.error.fieldViolations || []).map(
        (v) => v.field.split('.').at(-1) || v.field,
      )
    : [];
}
export function focusInvalid(error: unknown): void {
  const field = invalidFields(error)[0];
  if (field) document.getElementById('eq-' + field)?.focus();
}
