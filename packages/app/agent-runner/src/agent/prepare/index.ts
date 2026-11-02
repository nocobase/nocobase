// Preparing a run before the agent starts: an ordered list of steps (`PREPARE_STEPS`), each a module of this
// directory. The worker runs them in order, records the step under way in the run's record, and fails the run with the
// step's failure reason when one throws, except that a lock another live process holds, found by any step, is
// `workspaceBusy` (`stepFailure`); what a step learns it leaves on the context for the steps after it and for the
// agent's start.
//
//   variables  the variables the run asks the runner for by name are ones it provides (`workspace.passthrough`)
//   workspace  register shared task use and create a private attempt directory; reset only when the run asks (`workspace.clean`)
//   cli        install or reuse the application's CLI, put it on the agent's PATH, write the run's credentials
//   dirs       fetch or create stable worktrees and register in-place directory use
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
import { variablesStep } from './variables.ts';
import { workspaceStep } from './workspace.ts';

export {
  agentCwd,
  PrepareError,
  stepFailure,
  workspaceKey,
  type PrepareContext,
  type PrepareStep,
} from './types.ts';

export const PREPARE_STEPS: readonly PrepareStep[] = [
  variablesStep,
  workspaceStep,
  cliStep,
  dirsStep,
  skillsStep,
  mountsStep,
];
