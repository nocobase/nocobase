// Preparing a run before the agent starts: an ordered list of steps (`PREPARE_STEPS`), each a module of this
// directory. The worker runs them in order, records the step under way in the run's record, and fails the run with the
// step's failure reason when one throws; what a step learns it leaves on the context for the steps after it and for
// the agent's start.
//
//   workspace  lock the subject's work directory; start over when the run asks (`workspace.clean`)
//   cli        install or reuse the application's CLI, put it on the agent's PATH, write the run's credentials
//   dirs       the working directories: check repositories out, take directories used in place
//   skills     fetch the run's skills (cached by hash) and place them in the runner's folder
//   mounts     fetch the run's mounts (cached by hash) and copy each to its target in the work directory
//
// What a working directory needs beyond its checkout is the agent's job, following the repository's instructions and
// the directory's initialization prompt. A new step is a module with `{ name, failure, run }` added to the list where
// it belongs.
import { cliStep } from './cli.ts';
import { dirsStep } from './dirs.ts';
import { mountsStep } from './mounts.ts';
import { skillsStep } from './skills.ts';
import type { PrepareStep } from './types.ts';
import { workspaceStep } from './workspace.ts';

export {
  agentCwd,
  PrepareError,
  type PrepareContext,
  type PrepareStep,
} from './types.ts';

export const PREPARE_STEPS: readonly PrepareStep[] = [
  workspaceStep,
  cliStep,
  dirsStep,
  skillsStep,
  mountsStep,
];
