// Step `variables`: the names the run asks this runner for (`workspace.passthrough`) must be ones it provides, its
// local variables or the names its owner passes. A missing one fails the run before anything is prepared, saying how
// to provide it; the application does not choose runners by them.
import { runnerCommandLine } from '../../host.ts';
import { forbidden, missingVariables, providedVariables } from '../env.ts';
import { PrepareError, type PrepareStep } from './types.ts';

/** Why a run cannot start without `names`, and how to provide them. */
export function missingVariablesMessage(names: readonly string[]): string {
  const first = names[0] ?? 'NAME';
  return (
    `This runner does not provide ${names.length === 1 ? 'the variable' : 'the variables'} ${names.join(', ')} ` +
    `the run asks it for. Set ${names.length === 1 ? 'it' : 'each'} on this machine with ` +
    `\`${runnerCommandLine('env', 'set', first)}\`, or pass it from the runner's environment with ` +
    `\`${runnerCommandLine('start', '--pass-env', first)}\` ` +
    `(\`${runnerCommandLine('service', 'install', '--pass-env', first)}\` for a service).`
  );
}

export const variablesStep: PrepareStep = {
  name: 'variables',
  failure: 'setupFailed',
  run(context) {
    const reserved = (context.payload.workspace.passthrough ?? []).filter(
      forbidden,
    );
    if (reserved.length > 0)
      return Promise.reject(
        new PrepareError(
          'setupFailed',
          `The run asks for reserved variables ${reserved.join(', ')}. Remove or rename these declarations; the runner owns these names and cannot provide them through env set or --pass-env.`,
        ),
      );
    const missing = missingVariables(
      context.payload.workspace.passthrough ?? [],
      providedVariables(
        process.env,
        context.passEnv,
        context.registration.variables,
      ),
    );
    return missing.length > 0
      ? Promise.reject(
          new PrepareError('setupFailed', missingVariablesMessage(missing)),
        )
      : Promise.resolve();
  },
};
