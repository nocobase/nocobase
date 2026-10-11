/** Stops the Studio that global setup started and removes its temporary directory. */
import { existsSync, rmSync } from 'node:fs';

import { STATE_FILE, readState, stopStudio } from './support/server.ts';

export default async function globalTeardown(): Promise<void> {
  if (process.env.NB_STUDIO_E2E_URL || !existsSync(STATE_FILE)) return;
  const state = readState();
  await stopStudio(state);
  if (state.directory && !process.env.NB_STUDIO_E2E_KEEP)
    rmSync(state.directory, { recursive: true, force: true });
  rmSync(STATE_FILE, { force: true });
}
