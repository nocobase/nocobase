import { formatHelp, parseCreatePluginArgs } from './lib/flags.ts';
import {
  failureEnvelope,
  successEnvelope,
  writeEnvelope,
  type JsonCliError,
} from './lib/output.ts';
import { createPlugin } from './lib/scaffold.ts';

export { parseCreatePluginArgs } from './lib/flags.ts';
export { createPlugin } from './lib/scaffold.ts';
export { normalizePluginName } from './lib/names.ts';
export {
  normalizePluginCapabilities,
  PLUGIN_CAPABILITIES,
  type PluginCapabilities,
  type PluginCapability,
} from './lib/capabilities.ts';

export interface RunCreatePluginCliOptions {
  readonly argv: readonly string[];
  readonly binary: string;
  readonly repoRoot?: string;
  readonly version: string;
}

function classifyCreatePluginError(error: unknown): JsonCliError {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('No plugin capabilities were selected.')) {
    return {
      code: 'NO_CAPABILITIES_SELECTED',
      message,
      suggestions: [
        { message: 'Add --with <capability>.' },
        { message: 'Use --empty to create only the package foundation.' },
      ],
    };
  }
  if (message.startsWith('Unknown plugin capability:')) {
    return {
      code: 'UNKNOWN_CAPABILITY',
      message,
      suggestions: [{ message: 'Select a capability listed by --help.' }],
    };
  }
  if (message === '--with requires a capability value.') {
    return {
      code: 'MISSING_CAPABILITY_VALUE',
      message,
      suggestions: [{ message: 'Add a supported capability after --with.' }],
    };
  }
  if (message === '--empty cannot be combined with --with.') {
    return {
      code: 'CONFLICTING_CAPABILITY_SELECTION',
      message,
      suggestions: [
        { message: 'Use either --empty or one or more --with options.' },
      ],
    };
  }
  if (message.startsWith('Target already exists:')) {
    return {
      code: 'TARGET_ALREADY_EXISTS',
      message,
      suggestions: [
        {
          message:
            'Choose another plugin name or inspect the existing package.',
        },
      ],
    };
  }
  return {
    code: 'CREATE_PLUGIN_FAILED',
    message,
    suggestions: [
      { message: 'Run plugin:create --help and correct the request.' },
    ],
  };
}

function capabilityReason(file: string): string {
  if (file.startsWith('database/') || file.startsWith('tests/database/'))
    return 'database';
  if (file.startsWith('cli/') || file.startsWith('tests/cli/')) return 'cli';
  if (file.startsWith('server/locales/')) return 'server.locales';
  if (
    file.startsWith('server/providers/') ||
    file.startsWith('server/services/') ||
    file === 'server/tokens.ts' ||
    file === 'tests/server/service-provider.test.ts'
  )
    return 'server.service-providers';
  if (
    file.startsWith('server/routes/') ||
    file === 'tests/server/routes.test.ts'
  )
    return 'server.routes';
  if (file.startsWith('server/jobs/') || file === 'tests/server/jobs.test.ts')
    return 'server.jobs';
  if (file.startsWith('client/locales/')) return 'client.locales';
  if (file === 'client/routes.ts' || file === 'tests/client/routes.test.ts')
    return 'client.routes';
  if (
    file === 'client/components/plugin-component.tsx' ||
    file === 'tests/client/component.test.tsx'
  )
    return 'client.components';
  if (
    file.startsWith('client/providers/') ||
    file === 'tests/client/service-provider.test.ts'
  )
    return 'client.service-providers';
  if (
    file.startsWith('client/react-providers/') ||
    file === 'client/contexts.ts' ||
    file === 'client/components/provider.tsx' ||
    file === 'tests/client/react-provider.test.tsx'
  )
    return 'client.react-providers';
  if (
    file.startsWith('registry/') ||
    file === 'registry.config.json' ||
    file === 'components.json' ||
    file === 'client/styles.css'
  )
    return 'registry';
  if (file.startsWith('skills/')) return 'skills';
  if (file === 'client/index.ts' || file === 'client/plugin.ts')
    return 'derived-client-plugin';
  if (
    file === 'server/index.ts' ||
    file === 'server/plugin.ts' ||
    file === 'tests/server/plugin.test.ts'
  )
    return 'derived-server-plugin';
  return 'package-foundation';
}

export async function runCreatePluginCli(
  options: RunCreatePluginCliOptions,
): Promise<number> {
  try {
    const input = parseCreatePluginArgs(options.argv);
    if (input.flags.help || input.flags.version) {
      const value = input.flags.help
        ? formatHelp(options.binary)
        : options.version;
      if (input.flags.json)
        writeEnvelope(
          successEnvelope(
            input.flags.help ? { help: value } : { version: value },
          ),
        );
      else process.stdout.write(`${value}\n`);
      return 0;
    }

    const result = await createPlugin({
      description: input.flags.description,
      displayName: input.flags.displayName,
      dryRun: input.flags.dryRun,
      empty: input.flags.empty,
      install: input.flags.install,
      capabilities: input.flags.capabilities,
      name: input.name!,
      repoRoot: options.repoRoot,
    });
    if (input.flags.json) {
      writeEnvelope(
        successEnvelope(
          {
            mode: input.flags.dryRun ? 'dry-run' : 'create',
            plugin: {
              shortName: result.shortName,
              packageName: result.packageName,
              targetDirectory: result.targetDirectory,
            },
            requestedCapabilities: input.flags.capabilities,
            capabilities: result.capabilities,
            derivedStructure: {
              clientPlugin:
                result.capabilities.client.reactProviders ||
                result.capabilities.client.locales ||
                result.capabilities.client.serviceProviders ||
                result.capabilities.client.routes,
              serverPlugin:
                result.capabilities.database ||
                result.capabilities.server.jobs ||
                result.capabilities.server.locales ||
                result.capabilities.server.serviceProviders ||
                result.capabilities.server.routes,
            },
            files: result.files.map((file) => ({
              path: file,
              reason: capabilityReason(file),
            })),
            writes: input.flags.dryRun ? [] : result.files,
            commands:
              input.flags.dryRun || !input.flags.install
                ? []
                : ['CI=true pnpm install --no-frozen-lockfile'],
            nextSteps: [
              `pnpm --filter ${result.packageName} check`,
              `pnpm nocobase plugin register ${result.shortName} --workspace-root . --app app-template-default`,
            ],
          },
          input.flags.dryRun ? 'success-noop' : 'success',
        ),
      );
      return 0;
    }
    if (input.flags.dryRun) {
      process.stdout.write(
        `Would create ${result.packageName} at ${result.targetDirectory}\n`,
      );
      for (const file of result.files) {
        process.stdout.write(`  ${file}\n`);
      }
      return 0;
    }

    process.stdout.write(
      `Created ${result.packageName} at ${result.targetDirectory}\n`,
    );
    if (!input.flags.install) {
      process.stdout.write(
        'Skipped dependency installation. Run CI=true pnpm install --no-frozen-lockfile before committing.\n',
      );
    }
    process.stdout.write(
      `Next: register ${result.packageName} in the target application's package.json.\n`,
    );
    return 0;
  } catch (error) {
    if (options.argv.includes('--json')) {
      writeEnvelope(failureEnvelope(classifyCreatePluginError(error)));
      return 1;
    }
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.stderr.write(`Run ${options.binary} --help for usage.\n`);
    return 1;
  }
}
