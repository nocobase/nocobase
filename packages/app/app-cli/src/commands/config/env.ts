import type { Command } from '@oclif/core';

import { AppCommand, appContextOf } from '../../context.ts';
import { runConfigEnv, type ConfigEnvResult } from '../../lib/config-env.ts';

export default class AppConfigEnv extends AppCommand {
  static override summary =
    'List the environment variables the application reads.';
  static override description =
    'Loads the application the way a start would, without starting it, and lists every environment variable it reads: the ones its configuration sections declare, each with the configuration path it sets, and the ones the runtime reads itself. Values are never printed, because many are secrets; each variable is marked set or not set in the environment the application would start with, .env files included, and as a secret or required where it is one. `config variables` describes each variable in full. A variable an environment variable sets overrides the configuration file.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  public async run(): Promise<ConfigEnvResult> {
    await this.parse(AppConfigEnv);
    // runConfigEnv destroys the scope of the runtime it loads.
    const result = await runConfigEnv({
      loadRuntime: () => appContextOf(this).loadRuntime(),
    });
    const { variables } = result;

    const width = Math.max(
      ...variables.map((variable) => variable.name.length),
    );
    for (const variable of variables) {
      const marks = [
        variable.required ? 'required' : undefined,
        variable.secret ? 'secret' : undefined,
      ].filter(Boolean);
      this.log(
        `${variable.set ? '●' : '○'} ${variable.name.padEnd(width)}  ${
          variable.path ?? variable.description ?? ''
        }${marks.length > 0 ? `  [${marks.join(', ')}]` : ''}`,
      );
    }
    this.log('');
    this.log(
      '● set in the environment   ○ not set   `config variables` describes each one',
    );
    return result;
  }
}
