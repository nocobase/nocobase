import type { Runner } from '../../shared/runners.js';

export {
  createRunnerService,
  REGISTRATION_TOKEN_TTL_MS,
  upgradeRequiredOf,
  type RunnerService,
  type RunnerServiceDeps,
} from './runner.service.js';
export {
  absentRunners,
  findRunner,
  runnersRepo,
  storedToolChoice,
  toRunner,
} from './runner.store.js';
export { createSlots, type HeldItems, type Slots } from './slots.js';
export { createWorkSignal, type WorkSignal } from './signal.js';
export {
  createRunnerSweeper,
  type RunnerSweeper,
  type SweepReport,
} from './sweeper.js';

/** What the runner routes set for a request authenticated by a runner key. */
export interface RunnerEnv {
  Variables: { runner: Runner };
}
