import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import { AppCommand, appContextOf } from '../../context.ts';
import {
  runConfigVariables,
  type ConfigVariablesResult,
} from '../../lib/config-variables.ts';

export default class AppConfigVariables extends AppCommand {
  static override summary =
    'Describe the environment variables the application reads, for a deployment.';
  static override description =
    'Loads the application the way a start would, without starting it, and builds its variables manifest: every environment variable it reads, with the configuration path each sets, a description, whether it is a secret, whether a deployment must supply it, whether a deployment may generate it and whether it is read only on the first start. A variable is required when neither the code defaults nor config.example.yml give its path a value — an example placeholder such as admin123 counts as none — and nothing can generate it. Values from the environment and config.yml play no part and are never printed. `pnpm build` writes the manifest to dist/variables.json with --out.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --out dist/variables.json',
  ];

  static override flags: {
    out: Interfaces.OptionFlag<string | undefined>;
  } = {
    out: Flags.string({
      description:
        'Write the manifest as JSON to this file, relative to the working directory.',
    }),
  };

  public async run(): Promise<ConfigVariablesResult> {
    const { flags } = await this.parse(AppConfigVariables);
    // runConfigVariables destroys the scope of the runtime it loads.
    const result = await runConfigVariables({
      loadRuntime: () => appContextOf(this).loadRuntime(),
      ...(flags.out === undefined ? {} : { out: flags.out }),
    });
    const { variables } = result.manifest;
    const width = Math.max(
      ...variables.map((variable) => variable.name.length),
    );
    for (const variable of variables) {
      const marks = [
        variable.required ? 'required' : undefined,
        variable.secret ? 'secret' : undefined,
        variable.generate ? `generate:${variable.generate}` : undefined,
        variable.firstStartOnly ? 'first start' : undefined,
      ].filter(Boolean);
      this.log(
        `${variable.name.padEnd(width)}  ${variable.path ?? '(runtime)'}${
          marks.length > 0 ? `  [${marks.join(', ')}]` : ''
        }`,
      );
      if (variable.description) {
        this.log(`${''.padEnd(width)}  ${variable.description}`);
      }
    }
    if (result.file) {
      this.log('');
      this.log(`Wrote ${result.file}`);
    }
    return result;
  }
}
