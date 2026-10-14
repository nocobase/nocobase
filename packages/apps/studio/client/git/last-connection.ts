/**
 * The Git connection last chosen for a working directory, kept in this browser so the next form starts on it. Storage
 * may be blocked; the forms then start on the first connection.
 */
export const LAST_CONNECTION_KEY = 'studio:git:connection';

export function readLastConnection(): string | null {
  try {
    return localStorage.getItem(LAST_CONNECTION_KEY);
  } catch {
    return null;
  }
}

export function writeLastConnection(id: string): void {
  try {
    localStorage.setItem(LAST_CONNECTION_KEY, id);
  } catch {
    // Not remembered; the choice still holds for this form.
  }
}
