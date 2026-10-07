import {
  isSecretPath,
  requiredOf,
  RUNTIME_ENVIRONMENT_VARIABLES,
} from '@nocobase/app-server/config';

import type { AppCommandRuntime } from '../context.ts';
import { readConfigExample } from './config-variables.ts';

export interface ConfigEnvVariable {
  readonly name: string;
  /** The configuration path the variable sets, for one a section declares. */
  readonly path?: string;
  /** What the runtime does with it, for one the runtime reads itself. */
  readonly description?: string;
  /** Whether the environment the application would start with sets it. The value is never reported. */
  readonly set: boolean;
  /** Whether the value is a secret, for one a section declares. */
  readonly secret?: boolean;
  /**
   * Whether a deployment must supply it, for one a section declares: nothing else gives its path a value. See
   * `config variables`.
   */
  readonly required?: boolean;
}

export interface ConfigEnvResult {
  readonly variables: readonly ConfigEnvVariable[];
}

export interface ConfigEnvOptions {
  /** Loads the application exactly as a start would, without starting it. */
  readonly loadRuntime: () => Promise<AppCommandRuntime>;
}

/**
 * Lists every environment variable the application reads: those its configuration sections declare in `env`, and
 * those the runtime reads itself. Values are left out because many are secrets; whether each is set is enough to tell
 * what the environment changes.
 */
export async function runConfigEnv(
  options: ConfigEnvOptions,
): Promise<ConfigEnvResult> {
  const runtime = await options.loadRuntime();
  try {
    const environment = runtime.env;
    const isSet = (name: string): boolean =>
      environment[name] !== undefined && environment[name] !== '';
    const defaults = runtime.config.layers().defaults;
    const example = await readConfigExample(runtime.paths.deploymentRootDir);
    const declared = Object.entries(
      runtime.config.environmentVariableMappings(),
    )
      .map(([name, mapping]) => ({
        name,
        path: mapping.path,
        set: isSet(name),
        secret: mapping.secret ?? isSecretPath(mapping.path),
        required: requiredOf(mapping, defaults, example),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
    const runtimeRead = RUNTIME_ENVIRONMENT_VARIABLES.map((variable) => ({
      name: variable.name,
      description: variable.description,
      set: isSet(variable.name),
    }));
    return { variables: [...declared, ...runtimeRead] };
  } finally {
    await runtime.scope.destroy();
  }
}
