import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parseDatabaseIntegrationArguments } from './integration-arguments.js';

/** The Compose service a dialect's tests run against, and how its address reaches them. */
export interface DatabaseServiceOptions {
  readonly name: string;
  readonly composeFile: string;
  readonly service: string;
  readonly containerPort: number;
  readonly hostEnvironmentVariable: string;
  readonly portEnvironmentVariable: string;
  readonly initServices?: readonly string[];
  readonly testEnvironment?: Readonly<Record<string, string>>;
}

export interface DatabaseIntegrationRunnerOptions extends DatabaseServiceOptions {
  readonly testArguments?: readonly string[];
}

export interface DatabaseServiceCommandOptions extends DatabaseServiceOptions {
  /** What runs once the service is healthy, with its address in the environment. */
  readonly command: string;
  readonly args: readonly string[];
  /** Added to the command's environment after the service address. */
  readonly environment?: Readonly<Record<string, string>>;
  /** Keep the service until Enter is pressed when the command fails. */
  readonly pauseOnFailure?: boolean;
}

interface RunResult {
  readonly code: number;
  readonly signal: NodeJS.Signals | null;
}

/**
 * Runs one dialect's integration suite in a disposable, isolated Compose
 * project. Dialect packages only provide service-specific configuration.
 */
export async function runDatabaseIntegration(
  options: DatabaseIntegrationRunnerOptions,
): Promise<number> {
  let parsedArguments: ReturnType<typeof parseDatabaseIntegrationArguments>;
  try {
    parsedArguments = parseDatabaseIntegrationArguments(
      options.testArguments ?? [],
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
  return runWithDatabaseService({
    ...options,
    command: 'pnpm',
    args: [
      'exec',
      'vitest',
      'run',
      'tests/integration/core-suite.test.ts',
      ...(!parsedArguments.vitestArguments.some(
        (argument) =>
          argument === '--reporter' || argument.startsWith('--reporter='),
      )
        ? ['--reporter=verbose']
        : []),
      ...parsedArguments.vitestArguments,
    ],
    ...(parsedArguments.testFiles.length > 0
      ? {
          environment: {
            DB_TEST_FILES: JSON.stringify(parsedArguments.testFiles),
          },
        }
      : {}),
    pauseOnFailure: parsedArguments.pauseOnFailure,
  });
}

/**
 * Starts a dialect's database in a disposable Compose project with a random
 * name and published port, runs one command against it, and removes the
 * project, its volumes and orphans afterwards. `KEEP_TEST_DB=1` keeps it.
 */
export async function runWithDatabaseService(
  options: DatabaseServiceCommandOptions,
): Promise<number> {
  const projectName = createProjectName(options.name);
  const pauseOnFailure =
    process.env.PAUSE_ON_FAILURE === '1' || options.pauseOnFailure === true;
  let keepEnvironment = process.env.KEEP_TEST_DB === '1';
  let activeProcess: ChildProcess | undefined;
  let receivedSignal: NodeJS.Signals | undefined;

  const run = async (
    command: string,
    args: readonly string[],
    environment: NodeJS.ProcessEnv = process.env,
    captureOutput = false,
    allowFailure = false,
  ): Promise<{ result: RunResult; output: string }> => {
    const promise = runProcess(command, args, environment, captureOutput);
    activeProcess = promise.process;
    const result = await promise.result;
    activeProcess = undefined;
    if (!allowFailure && (result.code !== 0 || result.signal)) {
      throw new Error(
        `${command} ${args.join(' ')} exited with ${formatExit(result)}`,
      );
    }
    return { result, output: await promise.output };
  };

  const compose = (
    args: readonly string[],
    captureOutput = false,
    allowFailure = false,
  ) =>
    run(
      'docker',
      [
        'compose',
        '--project-name',
        projectName,
        '--file',
        options.composeFile,
        ...args,
      ],
      process.env,
      captureOutput,
      allowFailure,
    );

  const handleSignal = (signal: NodeJS.Signals): void => {
    receivedSignal = signal;
    activeProcess?.kill(signal);
  };

  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);

  const cleanup = async (): Promise<void> => {
    if (keepEnvironment) {
      console.error(
        `[db-testkit] Keeping ${projectName} for inspection after the test run.`,
      );
      return;
    }
    await compose(['down', '--volumes', '--remove-orphans'], false, true);
  };

  try {
    console.error(`[db-testkit] Starting ${options.name} tests.`);
    await compose(['down', '--volumes', '--remove-orphans'], false, true);
    console.error(`[db-testkit] Starting ${options.service} database service.`);
    await compose(['up', '--detach', '--wait', options.service]);

    for (const initService of options.initServices ?? []) {
      console.error(
        `[db-testkit] Running ${initService} initialization service.`,
      );
      await compose(['run', '--rm', initService]);
    }

    const portResult = await compose(
      ['port', options.service, String(options.containerPort)],
      true,
    );
    const port = parsePublishedPort(portResult.output);
    const testResult = await run(
      options.command,
      options.args,
      {
        ...process.env,
        ...options.testEnvironment,
        [options.hostEnvironmentVariable]: '127.0.0.1',
        [options.portEnvironmentVariable]: String(port),
        ...options.environment,
      },
      false,
      true,
    );
    console.error(
      `[db-testkit] ${options.name} tests exited with ${formatExit(testResult.result)}.`,
    );
    if (pauseOnFailure && testResult.result.code !== 0) {
      keepEnvironment = true;
      await pauseForInspection(projectName);
    }
    if (receivedSignal) return 128 + signalExitCode(receivedSignal);
    return testResult.result.code;
  } catch (error) {
    if (receivedSignal) return 128 + signalExitCode(receivedSignal);
    console.error(error instanceof Error ? error.message : error);
    return 1;
  } finally {
    process.off('SIGINT', handleSignal);
    process.off('SIGTERM', handleSignal);
    try {
      await cleanup();
    } catch (error) {
      console.error(
        `[db-testkit] Failed to clean up ${projectName}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

function runProcess(
  command: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv,
  captureOutput: boolean,
): {
  process: ChildProcess;
  result: Promise<RunResult>;
  output: Promise<string>;
} {
  const child = spawn(command, args, {
    stdio: captureOutput ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: environment,
  });
  let output = '';
  if (child.stdout)
    child.stdout.on('data', (chunk: Buffer | string) => {
      output += String(chunk);
    });
  const result = new Promise<RunResult>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve({ code: code ?? 1, signal });
    });
  });
  return {
    process: child,
    result,
    output: Promise.resolve().then(async () => {
      await result;
      return output;
    }),
  };
}

function createProjectName(name: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `nocobase-${name}-${process.pid}-${random}`.replace(
    /[^a-z0-9_-]/gi,
    '-',
  );
}

function parsePublishedPort(output: string): number {
  const match = output.trim().match(/:(\d+)\s*$/m);
  if (!match)
    throw new Error(`Could not determine the published port: ${output}`);
  return Number(match[1]);
}

function formatExit(result: RunResult): string {
  return result.signal ? `signal ${result.signal}` : `code ${result.code}`;
}

function signalExitCode(signal: NodeJS.Signals): number {
  if (signal === 'SIGINT') return 2;
  if (signal === 'SIGTERM') return 15;
  return 1;
}

async function pauseForInspection(projectName: string): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      `[db-testkit] --pause-on-failure was requested, but no interactive terminal is available.`,
    );
    return;
  }
  console.error(
    `[db-testkit] Test database ${projectName} is still running. Press Enter to clean it up and exit.`,
  );
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    await readline.question('');
  } finally {
    readline.close();
  }
}

export {
  parseDatabaseIntegrationArguments,
  type DatabaseIntegrationTestArguments,
} from './integration-arguments.js';
