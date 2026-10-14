import { useLiveSessions } from '../api.js';

/** Keeps what the plugin's pages read current while they are open. */
export function LiveSessions(): null {
  useLiveSessions();
  return null;
}
