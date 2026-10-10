// What this command line makes of oclif's usage errors: a message that says what was wrong without repeating what was
// typed, and suggestions a caller can act on — the flag or command that was probably meant, and the help that lists the
// rest.
//
// oclif raises these before a command's `run()` starts, as parse errors inside the command or as "command not found"
// in the runner, and describes them only in prose that quotes the input: `Parsing --timeout … received: abc`,
// `--config=<value> cannot also be provided`, `Unexpected argument: <value>`. A mistyped command line can put a secret in
// any of those places — `--apikey <key>` leaves the key behind as an unexpected argument — so no value is echoed. Names
// the command declares, its flags, its arguments and their allowed values, are repeated; so is an unknown flag's name,
// reduced to its name first. Both places turn the error into the same `INVALID_USAGE` failure, so an agent reads
// `error.suggestions` rather than parsing text.
import { stripVTControlCharacters } from 'node:util';

import type { Interfaces } from '@oclif/core';

import {
  closestMatches,
  editDistance,
  matchDistance,
  nearest,
  typoAllowance,
} from './distance.ts';
import type { ScoredMatch } from './distance.ts';
import {
  INVALID_USAGE,
  OCLIF_HELP_HINT,
  isCommandError,
  isOclifParseError,
  type CommandSuggestion,
} from './errors.ts';
import { declaredFlags } from './flags.ts';
import { cliInvocation, type CliInvocation } from './invocation.ts';

export { INVALID_USAGE };

/** A usage error, described for a `CommandError`. */
export interface UsageFailure {
  readonly message: string;
  readonly suggestions: readonly CommandSuggestion[];
  readonly exit: number;
}

/** The command a usage error was raised for. */
export interface UsageContext {
  /** Its id as words, such as `['db', 'apply']`. */
  readonly words: readonly string[];
  /** Every long flag name it accepts, without dashes, `json` and `no-` forms included. */
  readonly flags: readonly string[];
  /** The names of its positional arguments, in order. */
  readonly args: readonly string[];
  /** The values each option flag restricts itself to, by flag name. */
  readonly options: Readonly<Record<string, readonly string[]>>;
  /** How the help it points at is run; `cliInvocation()` when absent. */
  readonly invocation?: CliInvocation;
}

/** The tree an unknown command is looked up in. */
export interface CommandTreeNames {
  /** Visible command ids in oclif's colon form, such as `db:apply`. */
  readonly commandIds: readonly string[];
  readonly topics: readonly string[];
  /** How the suggested commands are run; `cliInvocation()` when absent. */
  readonly invocation?: CliInvocation;
}

/** oclif's message for an id that names no command, from dispatch and from help. */
const COMMAND_NOT_FOUND = /^command (\S+) not found\.?$/iu;

/** A long flag name as oclif prints it, without the dashes. */
const FLAG_NAME = '([a-z][a-z0-9-]*)';

interface OclifUsageErrorShape {
  readonly oclif?: { readonly exit?: number | false };
  /** What `NonExistentFlagsError` carries: the arguments as typed, such as `--conection=main`. */
  readonly flags?: unknown;
  /** What the argument errors carry: the missing definitions, or the unexpected values. */
  readonly args?: unknown;
}

/**
 * The usage failure behind an error oclif raised while parsing a command's arguments, or `undefined` for any other
 * error, including a `CommandError` and a command's own `this.error()`.
 */
export function describeUsageError(
  error: unknown,
  context: UsageContext,
): UsageFailure | undefined {
  if (!(error instanceof Error) || isCommandError(error)) return undefined;
  if (!isOclifParseError(error)) return undefined;
  const shape = error as Error & OclifUsageErrorShape;
  const suggestions: CommandSuggestion[] = [];
  const meant = new Set<string>();
  for (const typed of unknownFlagNames(shape.flags)) {
    for (const name of closestMatches(typed, context.flags)) meant.add(name);
  }
  for (const name of meant) {
    suggestions.push({ message: `Did you mean --${name}?` });
  }
  const invocation = context.invocation ?? cliInvocation();
  suggestions.push({
    message: Array.isArray(shape.args)
      ? "See the command's arguments:"
      : "See the command's flags:",
    run: {
      command: invocation.command,
      args: [...invocation.args, ...context.words, '--help'],
    },
  });
  const exit = shape.oclif?.exit;
  return {
    message: usageMessage(shape, context),
    suggestions,
    exit: typeof exit === 'number' ? exit : 2,
  };
}

/**
 * The usage failure behind oclif's "command not found", or `undefined` for any other error: the closest command ids,
 * the topic's help when the first word is a topic, and the command that lists everything.
 */
export function describeUnknownCommand(
  error: unknown,
  tree: CommandTreeNames,
): UsageFailure | undefined {
  if (!(error instanceof Error) || isCommandError(error)) return undefined;
  const match = COMMAND_NOT_FOUND.exec(error.message);
  if (match?.[1] === undefined) return undefined;
  const invocation = tree.invocation ?? cliInvocation();
  const run = (...args: string[]): CommandSuggestion['run'] => ({
    command: invocation.command,
    args: [...invocation.args, ...args],
  });
  const typed = match[1].split(':').filter(Boolean);
  const suggestions: CommandSuggestion[] = closestCommandIds(
    typed,
    tree.commandIds,
  ).map((id) => {
    const words = id.split(':');
    return {
      message: `Did you mean ${words.join(' ')}?`,
      run: run(...words),
    };
  });
  const [topic] = typed;
  if (suggestions.length === 0 && topic !== undefined) {
    if (tree.topics.includes(topic)) {
      if (typed.length > 1) {
        suggestions.push({
          message: `See the ${topic} commands:`,
          run: run(topic, '--help'),
        });
      }
    } else {
      // A misspelled topic: its commands are too long to be close to one word, but the topic itself may be.
      for (const meant of closestMatches(topic, tree.topics)) {
        suggestions.push({
          message: `Did you mean ${meant}? See its commands:`,
          run: run(meant, '--help'),
        });
      }
    }
  }
  suggestions.push({
    message: 'List every command:',
    run: run('commands', '--json'),
  });
  return {
    message: `Command "${typed.join(' ')}" not found.`,
    suggestions,
    exit: 2,
  };
}

/**
 * The command ids closest to what was typed. Each id is compared with as many leading words as it has, because oclif
 * folds every word it cannot place into the id it reports, positional arguments included: `plugn register audit-log`
 * arrives as `plugn:register:audit-log` and still finds `plugin register`.
 */
export function closestCommandIds(
  typed: readonly string[],
  commandIds: readonly string[],
): string[] {
  const scored: ScoredMatch[] = [];
  for (const id of commandIds) {
    const words = id.split(':');
    const input = typed.slice(0, words.length).join(' ');
    const candidate = words.join(' ');
    if (input === '' || input === typed.join(' ')) {
      // Compared in full: the usual typo threshold, with no allowance for a prefix.
      const distance = matchDistance(input, candidate);
      if (distance !== undefined) scored.push({ candidate: id, distance });
      continue;
    }
    // Compared on a prefix of what was typed: close only by edit distance, so trailing arguments never make every
    // one-word command look like a match.
    const distance = editDistance(input, candidate);
    if (distance <= typoAllowance(input)) {
      scored.push({ candidate: id, distance });
    }
  }
  return nearest(scored);
}

/** A command class as the usage context reads it. */
export interface UsageCommand {
  readonly flags?: Interfaces.FlagInput;
  readonly baseFlags?: Interfaces.FlagInput;
  readonly args?: Interfaces.ArgInput;
  readonly enableJsonFlag?: boolean;
}

/** The usage context of `command`, answering to `words`. */
export function usageContextFor(
  command: UsageCommand,
  words: readonly string[],
): UsageContext {
  const options: Record<string, readonly string[]> = {};
  for (const [name, flag] of Object.entries(declaredFlags(command))) {
    if (flag.type === 'option' && flag.options !== undefined) {
      options[name] = flag.options;
    }
  }
  return {
    words,
    flags: acceptedFlagNames(command),
    args: Object.keys(command.args ?? {}),
    options,
  };
}

/** Every long flag name `command` accepts, as `UsageContext.flags` lists them. Hidden flags are left out. */
export function acceptedFlagNames(command: UsageCommand): string[] {
  const names = command.enableJsonFlag === true ? ['json'] : [];
  for (const [name, flag] of Object.entries(declaredFlags(command))) {
    if (flag.hidden === true) continue;
    names.push(name, ...(flag.aliases ?? []));
    if (flag.type === 'boolean' && flag.allowNo) names.push(`no-${name}`);
  }
  return names;
}

/** What was wrong with the command line, naming only what the command declares. */
function usageMessage(
  error: Error & OclifUsageErrorShape,
  context: UsageContext,
): string {
  const raw = stripVTControlCharacters(error.message);
  const message = raw.endsWith(OCLIF_HELP_HINT)
    ? raw.slice(0, -OCLIF_HELP_HINT.length)
    : raw;
  const declared = (name: string | undefined): name is string =>
    name !== undefined && context.flags.includes(name);

  if (message.startsWith('Nonexistent flag')) {
    const unknown = unknownFlagNames(error.flags);
    return unknown.length > 0
      ? `Unknown ${plural('flag', unknown)} ${flagList(unknown)}.`
      : 'Unknown flag.';
  }
  if (message.startsWith('Missing') && Array.isArray(error.args)) {
    const missing = (error.args as readonly { name?: unknown }[])
      .map((arg) => arg.name)
      .filter(
        (name): name is string =>
          typeof name === 'string' && context.args.includes(name),
      );
    return missing.length > 0
      ? `Missing required ${plural('argument', missing)} ${missing.map((name) => `<${name}>`).join(', ')}.`
      : 'Missing a required argument.';
  }
  if (message.startsWith('Unexpected argument')) {
    return context.args.length === 0
      ? 'This command takes no positional arguments.'
      : `Too many arguments; this command takes ${context.args.map((name) => `<${name}>`).join(', ')}.`;
  }
  const invalid = new RegExp(
    `^(?:Parsing|Expected) --${FLAG_NAME}[ =]`,
    'u',
  ).exec(message)?.[1];
  if (declared(invalid)) {
    const allowed = context.options[invalid];
    return allowed === undefined
      ? `Invalid value for --${invalid}.`
      : `Invalid value for --${invalid}; expected one of: ${allowed.join(', ')}.`;
  }
  if (message.startsWith('Expected ') && message.includes(' to be one of: ')) {
    // An argument's value outside its declared options. The options follow the last marker; the value precedes it.
    const allowed = message.slice(
      message.lastIndexOf(' to be one of: ') + ' to be one of: '.length,
    );
    return `Invalid value for an argument; expected one of: ${allowed.split('\n')[0]?.trim() ?? ''}.`;
  }
  if (message.startsWith('The following error')) {
    const reasons = message
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((reason) => describeFlagReason(reason, declared));
    if (reasons.length > 0 && reasons.every((reason) => reason !== undefined)) {
      // Two exclusive flags are reported once from each side.
      return [...new Set(reasons)].join(' ');
    }
    return 'Invalid combination of flags.';
  }
  return 'Invalid command arguments.';
}

/** One reason oclif gives for rejecting the flags, when it can be repeated without a value. */
function describeFlagReason(
  reason: string,
  declared: (name: string | undefined) => name is string,
): string | undefined {
  const required = new RegExp(
    `^Missing required flag (?:--)?${FLAG_NAME}$`,
    'u',
  ).exec(reason)?.[1];
  if (declared(required)) return `Missing required flag --${required}.`;
  const conflict = new RegExp(
    `^--${FLAG_NAME}(?:=.*)? cannot also be provided when using --${FLAG_NAME}$`,
    'u',
  ).exec(reason);
  if (declared(conflict?.[1]) && declared(conflict?.[2])) {
    const [first, second] = [conflict[1], conflict[2]].sort();
    return `--${first} cannot be combined with --${second}.`;
  }
  // `dependsOn`, `exactlyOne` and `combinable` list flag names only.
  if (
    /^(?:All of|One of|Only) the following (?:must|can) be provided when using --/u.test(
      reason,
    ) &&
    !reason.includes('=') &&
    [...reason.matchAll(new RegExp(`--${FLAG_NAME}`, 'gu'))].every((match) =>
      declared(match[1]),
    )
  ) {
    return `${reason}.`;
  }
  return undefined;
}

/**
 * The long flag names in what `NonExistentFlagsError` reports. Only the part of a `--name=value` token before `=` is
 * kept, and only when it has the shape of a long flag, so a value that happens to start with a dash is not echoed.
 */
function unknownFlagNames(flags: unknown): string[] {
  if (!Array.isArray(flags)) return [];
  return [
    ...new Set(
      flags
        .map((token) =>
          /^--([a-z][a-z0-9-]{0,39})(?:=|$)/iu.exec(String(token)),
        )
        .map((match) => match?.[1])
        .filter((name): name is string => name !== undefined),
    ),
  ];
}

function flagList(names: readonly string[]): string {
  return names.map((name) => `--${name}`).join(', ');
}

function plural(word: string, items: readonly unknown[]): string {
  return items.length === 1 ? word : `${word}s`;
}
