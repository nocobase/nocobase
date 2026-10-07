// Business commands from the server's manifest (`<bin> issue comment add …`): the CLI ships none of them. oclif hands
// an unknown command to the `command_not_found` hook (src/hooks/command-not-found.ts) and `--help` for one to the help
// class (src/dynamic/help.ts); both come here with the original argv, which `runAppCli` records, since oclif folds and
// splits the words.
//
// Each command is sent to its API route (`rest.ts`). `--json` prints the cli-envelope, success or failure, and nothing
// else on stdout.
import { Errors } from '@oclif/core';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import { appCliConfig } from '../config.ts';
import { asCliError, UsageError } from '../lib/command.ts';
import {
  CliCommandError,
  failureEnvelope,
  successEnvelope,
} from '../lib/envelope.ts';
import { globalFlags } from '../lib/globals.ts';
import { AppApiError } from '../lib/http.ts';
import { askUpdateHint, printUpdateHint } from '../lib/update-hint.ts';
import { loadManifest, type CliCommand, type CliManifest } from './manifest.ts';
import { renderAnswer, renderCommandHelp, renderTopicHelp } from './output.ts';
import { leadingWords } from './parse.ts';
import { executeRest, parseRestCall, type ApiAnswer } from './rest.ts';
import { currentSession, type Session } from './session.ts';

let originalArgv: readonly string[] | undefined;

/** Records the argv the CLI was started with (`runAppCli`). */
export function setOriginalArgv(argv: readonly string[]): void {
  originalArgv = [...argv];
}

export function getOriginalArgv(): readonly string[] {
  return originalArgv ?? process.argv.slice(2);
}

function unknownCommand(
  argv: readonly string[],
  hint?: string,
): Errors.CLIError {
  const typed = leadingWords(argv).join(' ');
  const { bin } = appCliConfig();
  return new Errors.CLIError(
    `Unknown command: ${bin} ${typed}. ${hint ?? `Run \`${bin} --help\` for the list.`}`,
    { exit: EXIT_CODES.notFound },
  );
}

/**
 * Why a command the line names is not offered, when the server describes it: another identity's, or needing an
 * action the caller does not hold. Undefined when the server knows no such command.
 */
export function withheldCommand(
  manifest: CliManifest,
  argv: readonly string[],
): CliCommandError | undefined {
  const words = leadingWords(argv);
  const byId = new Map(
    (manifest.withheld ?? []).map((command) => [command.id, command]),
  );
  const { bin, displayName } = appCliConfig();
  for (let count = words.length; count > 0; count -= 1) {
    const found = byId.get(words.slice(0, count).join(':'));
    if (!found) continue;
    const typed = `${bin} ${found.id.split(':').join(' ')}`;
    const run = manifest.identity.kind === 'run';
    if (found.reason === 'action')
      return new CliCommandError(
        'ACTION_REQUIRED',
        run
          ? `\`${typed}\` needs the action ${found.action}, which this run's agent is not given.`
          : `\`${typed}\` needs the action ${found.action}, which you do not hold.`,
        {
          exit: EXIT_CODES.auth,
          suggestions: [
            {
              message: run
                ? `Ask whoever configures the agent to give it ${found.action}, or a person to do it.`
                : `Ask whoever manages permissions in ${displayName} for ${found.action}.`,
            },
            {
              message: 'See who you act as and the actions you hold.',
              run: { command: bin, args: ['whoami'] },
            },
          ],
          details: { command: found.id, action: found.action },
        },
      );
    return new CliCommandError(
      'IDENTITY_MISMATCH',
      run
        ? `\`${typed}\` is a person's command; an agent's run cannot call it.`
        : `\`${typed}\` is only for an agent's run, with its run token.`,
      {
        exit: EXIT_CODES.auth,
        suggestions: [],
        details: { command: found.id, identities: found.identities },
      },
    );
  }
  return undefined;
}

export interface DynamicContext {
  readonly session: Session;
  readonly manifest: CliManifest;
}

/** The session and its manifest, or undefined when the CLI is neither in a run nor signed in. */
export async function loadDynamic(
  options: { readonly offline?: boolean } = {},
): Promise<DynamicContext | undefined> {
  const session = await currentSession();
  if (!session) return undefined;
  return { session, manifest: await loadManifest(session, options) };
}

export interface Resolved {
  readonly command: CliCommand;
  /** What follows the command's words. */
  readonly rest: readonly string[];
}

/**
 * The manifest command the line starts with, by its longest match. oclif splits words holding `:` and folds positional
 * words into the command id, so the original argv is the only exact source.
 */
export function resolveCommand(
  manifest: CliManifest,
  argv: readonly string[],
): Resolved | undefined {
  const words = leadingWords(argv);
  const byId = new Map(
    manifest.commands.map((command) => [command.id, command]),
  );
  for (let count = words.length; count > 0; count -= 1) {
    const command = byId.get(words.slice(0, count).join(':'));
    if (command) return { command, rest: argv.slice(count) };
  }
  return undefined;
}

/** The help for a business command or a topic of them; undefined when the manifest has neither. */
export function dynamicHelp(
  manifest: CliManifest,
  argv: readonly string[],
): string | undefined {
  const resolved = resolveCommand(manifest, argv);
  if (resolved) return renderCommandHelp(resolved.command);
  return renderTopicHelp(manifest, leadingWords(argv));
}

interface Outcome {
  readonly help?: string;
  readonly answer?: ApiAnswer;
  readonly json: boolean;
}

async function runResolved(
  session: Session,
  { command, rest }: Resolved,
): Promise<Outcome> {
  const call = await parseRestCall(command, rest);
  if (call.help) return { help: renderCommandHelp(command), json: call.json };
  return {
    answer: await executeRest(session, command, call),
    json: call.json,
  };
}

function exitCodeOf(error: unknown): number {
  if (error instanceof AppApiError) return error.exitCode;
  if (error instanceof UsageError) return error.exit;
  if (error instanceof CliCommandError) return error.exit;
  return EXIT_CODES.general;
}

/** Runs the business command `argv` names; writes its output; throws a `CLIError` on failure. */
export async function runDynamic(
  argv: readonly string[],
  write: (text: string) => void = (text) => process.stdout.write(`${text}\n`),
): Promise<void> {
  const json = argv.includes('--json');
  const typed = leadingWords(argv).join(' ');
  const fail = (error: unknown): Error => {
    if (!json) return asCliError(error);
    write(
      JSON.stringify(
        failureEnvelope(typed, error, [], appCliConfig().bin),
        null,
        2,
      ),
    );
    return new Errors.ExitError(exitCodeOf(error));
  };
  let context: DynamicContext | undefined;
  try {
    context = await loadDynamic({
      offline: argv.includes('--help') || argv.includes('-h'),
    });
  } catch (error) {
    throw fail(error);
  }
  if (!context) {
    const error = unknownCommand(
      argv,
      `Business commands need a run, or \`${appCliConfig().bin} login\` first.`,
    );
    throw json
      ? fail(new UsageError(error.message, EXIT_CODES.notFound))
      : error;
  }
  // A person's command asks whether a newer CLI is served, and says so after its own output.
  const hint =
    context.session.kind === 'user'
      ? askUpdateHint(context.session)
      : Promise.resolve(undefined);
  try {
    await runContext(context, argv, json, write, fail);
  } finally {
    await printUpdateHint(hint);
  }
}

async function runContext(
  context: DynamicContext,
  argv: readonly string[],
  json: boolean,
  write: (text: string) => void,
  fail: (error: unknown) => Error,
): Promise<void> {
  const resolved = resolveCommand(context.manifest, argv);
  if (!resolved) {
    if (argv.includes('--help') || argv.includes('-h')) {
      const topic = renderTopicHelp(context.manifest, leadingWords(argv));
      if (topic) {
        write(topic);
        return;
      }
    }
    const withheld = withheldCommand(context.manifest, argv);
    if (withheld) throw fail(withheld);
    const error = unknownCommand(argv);
    throw json
      ? fail(new UsageError(error.message, EXIT_CODES.notFound))
      : error;
  }
  const name = resolved.command.id.split(':').join(' ');
  try {
    const outcome = await runResolved(context.session, resolved);
    if (outcome.help !== undefined) {
      write(outcome.help);
      return;
    }
    const answer = outcome.answer ?? { data: null };
    const { dryRun, quiet } = globalFlags();
    if (outcome.json)
      write(
        JSON.stringify(
          successEnvelope(
            name,
            answer,
            [],
            dryRun ? 'success-noop' : 'success',
          ),
          null,
          2,
        ),
      );
    else if (!quiet) write(renderAnswer(resolved.command, answer));
  } catch (error) {
    if (!json) throw asCliError(error);
    write(
      JSON.stringify(
        failureEnvelope(name, error, [], appCliConfig().bin),
        null,
        2,
      ),
    );
    throw new Errors.ExitError(exitCodeOf(error));
  }
}
