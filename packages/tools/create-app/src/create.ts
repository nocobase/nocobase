import path from 'node:path';
import { formatHelp, parseInput, type ParsedInput } from './lib/flags.ts';
import {
  installDependencies,
  syncSkills,
  verifyDriver,
} from './lib/install.ts';
import { ensureAllowBuilds } from './lib/pnpm-workspace.ts';
import {
  cancel,
  intro,
  log,
  note,
  outro,
  promptAppName,
  PromptCancelledError,
} from './lib/prompts.ts';
import {
  assertTargetIsUsable,
  assertValidAppName,
  removeDirectory,
  scaffoldFromTemplate,
} from './lib/scaffold.ts';
import {
  DEFAULT_REGISTRY,
  downloadTemplate,
  resolveTemplateKind,
  resolveTemplateSource,
} from './lib/template.ts';
import { buildHubEnvFile, readEnvExample } from './lib/hub.ts';
import { buildNpmrcFile } from './lib/npmrc.ts';
import {
  FAILURE_CODES,
  failureEnvelope,
  successEnvelope,
  type Envelope,
  type Stage,
} from './lib/output.ts';

export interface CreateAppOptions {
  argv: string[];
  version: string;
  binary: string;
}

/** How far creation got, and what it has produced so far. */
interface CreateState {
  stage: Stage;
  directory?: string;
  projectCreated: boolean;
  dependenciesInstalled: boolean;
  nextCommands?: string[];
  message?: string;
  warnings: string[];
}

/** One result on stdout in JSON mode; human progress uses stderr in that mode. */
function writeJson(envelope: Envelope): void {
  process.stdout.write(`${JSON.stringify(envelope)}\n`);
}

/**
 * A failure names the stage it stopped at, and whether the project exists: a failed install leaves a project to retry
 * `pnpm install` in, which creating it again would refuse. A suggestion's `run` runs as given, from wherever the caller
 * is, so the retry names the project with `--dir` rather than relying on the caller to enter it first.
 */
function failureOf(state: CreateState, message: string): Envelope {
  return failureEnvelope(
    {
      code: FAILURE_CODES[state.stage],
      message,
      suggestions:
        state.stage === 'install'
          ? [
              {
                message: `The project exists${state.directory ? ` at ${state.directory}` : ''}; retry the installation there, rather than creating it again:`,
                run: {
                  command: 'pnpm',
                  args: state.directory
                    ? ['--dir', state.directory, 'install']
                    : ['install'],
                },
              },
            ]
          : [],
      details: {
        stage: state.stage,
        ...(state.directory ? { directory: state.directory } : {}),
        projectCreated: state.projectCreated,
        dependenciesInstalled: state.dependenciesInstalled,
      },
    },
    state.warnings,
  );
}

export async function createApp(options: CreateAppOptions): Promise<number> {
  let input: ParsedInput;
  const state: CreateState = {
    stage: 'input',
    projectCreated: false,
    dependenciesInstalled: false,
    warnings: [],
  };
  try {
    input = await parseInput(options.argv);
  } catch (error) {
    const message = (error as Error).message;
    if (options.argv.includes('--json')) writeJson(failureOf(state, message));
    else process.stderr.write(`${message}\n`);
    return 2;
  }
  if (input.flags.help || input.flags.version) {
    const value = input.flags.help
      ? formatHelp(options.binary)
      : options.version;
    if (input.flags.json)
      writeJson(
        successEnvelope(
          input.flags.help ? { help: value } : { version: value },
        ),
      );
    else process.stdout.write(`${value}\n`);
    return 0;
  }
  const progress = (message: string): void => {
    if (input.flags.json) process.stderr.write(`${message}\n`);
    else log.info(message);
  };
  try {
    if (input.flags.json && !input.directory)
      throw new Error('DIRECTORY is required with --json.');
    if (!input.flags.json) intro('Create a NocoBase project');
    await run(input, state, progress);
    if (input.flags.json)
      writeJson(
        successEnvelope(
          {
            directory: state.directory,
            projectCreated: state.projectCreated,
            dependenciesInstalled: state.dependenciesInstalled,
            configured: false,
            nextCommands: state.nextCommands,
            message: state.message,
          },
          state.warnings,
        ),
      );
    else {
      note(
        [
          `cd ${input.directory ?? path.basename(state.directory ?? '')}`,
          ...(state.nextCommands ?? []),
        ].join('\n'),
        'Next steps',
      );
      outro('Done.');
    }
    return 0;
  } catch (error) {
    const message = (error as Error).message;
    if (input.flags.json) writeJson(failureOf(state, message));
    else
      cancel(
        `${message}${state.projectCreated ? `\nProject files are in ${state.directory}.` : ''}${state.stage === 'install' ? '\nRun pnpm install inside the project to retry.' : ''}`,
      );
    return error instanceof PromptCancelledError
      ? 130
      : state.stage === 'input'
        ? 2
        : 1;
  }
}

async function run(
  input: ParsedInput,
  state: CreateState,
  progress: (message: string) => void,
): Promise<void> {
  const name = input.directory ?? (await promptAppName());
  assertValidAppName(name);
  const targetDirectory = path.resolve(process.cwd(), name);
  state.directory = targetDirectory;
  state.stage = 'scaffold';
  await assertTargetIsUsable(targetDirectory);
  const registry =
    input.flags.registry ?? process.env.NOCOBASE_REGISTRY ?? DEFAULT_REGISTRY;
  const source = resolveTemplateSource(input.flags.template, {
    tag: input.flags['template-tag'],
  });
  state.stage = 'download';
  progress(`Downloading ${source}`);
  const template = await downloadTemplate({ registry, source });
  state.stage = 'scaffold';
  try {
    const kind = resolveTemplateKind(input.flags.template, {
      name: template.name,
      nocobase: { templateKind: template.kind },
    });
    const extraFiles: Record<string, string> = {
      '.npmrc': buildNpmrcFile({ registry }),
    };
    if (kind === 'hub')
      extraFiles['.env'] = buildHubEnvFile({
        example: await readEnvExample(template.directory),
      });
    await scaffoldFromTemplate({
      name,
      targetDirectory,
      templateDirectory: template.directory,
      extraFiles,
    });
    state.projectCreated = true;
    await ensureAllowBuilds(targetDirectory);
    // Creation stops at a project that can be configured, not at one that can run. Which database an application uses
    // is decided by the driver it depends on, and configuring it is `config init`'s job — so the next steps name it
    // rather than this command writing a configuration nobody asked for.
    state.nextCommands =
      kind === 'hub'
        ? [
            'pnpm nocobase config init',
            'pnpm nocobase config check',
            'pnpm build',
            'pnpm start',
          ]
        : [
            'pnpm nocobase config init',
            'pnpm nocobase config check',
            'pnpm dev',
          ];
    state.message =
      'Configure the application with pnpm nocobase config init before starting it. That uses SQLite; for another database, install its driver and name the dialect, for example: pnpm add @nocobase/db-postgres, then pnpm nocobase config init --dialect postgres';
    progress(`Created ${name}. ${state.message}`);
  } finally {
    await removeDirectory(template.directory);
  }
  if (!input.flags.install) {
    state.nextCommands?.unshift('pnpm install');
    return;
  }
  state.stage = 'install';
  progress('Installing dependencies with pnpm');
  await installDependencies({
    directory: targetDirectory,
    registry,
    onOutput: (chunk) => {
      process.stderr.write(chunk);
    },
  });
  state.dependenciesInstalled = true;
  state.stage = 'verify';
  const verification = await verifyDriver(targetDirectory);
  if (!verification.ok)
    throw new Error(
      verification.reason ?? 'Database driver verification failed.',
    );
  progress('Synchronizing NocoBase package skills');
  const synchronized = await syncSkills(targetDirectory);
  if (!synchronized.ok) {
    const warning =
      synchronized.reason ?? 'Could not synchronize NocoBase package skills.';
    state.warnings.push(warning);
    progress(warning);
  }
}
