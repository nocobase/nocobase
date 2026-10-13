import type { ReactNode } from 'react';

export function errorId(id: string): string {
  return `${id}-error`;
}

/** The props that mark a control invalid and point it at its error message. */
export function invalidProps(
  id: string,
  error: ReactNode,
): { 'aria-invalid'?: true; 'aria-describedby'?: string } {
  return error ? { 'aria-describedby': errorId(id), 'aria-invalid': true } : {};
}
