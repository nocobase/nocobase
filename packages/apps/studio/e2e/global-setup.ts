/**
 * Starts the throwaway Studio every browser test runs against (`support/server.ts`), unless `NB_STUDIO_E2E_URL` names one
 * that is already running. `global-teardown.ts` stops it and removes its directory.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { STATE_FILE, startStudio } from './support/server.ts';

export default async function globalSetup(): Promise<void> {
  if (process.env.NB_STUDIO_E2E_URL) return;
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const started = Date.now();
  const state = await startStudio();
  console.log(
    `Studio e2e server: ${state.baseURL} (ready in ${Math.round((Date.now() - started) / 1000)} s, data in ${state.directory})`,
  );
}
