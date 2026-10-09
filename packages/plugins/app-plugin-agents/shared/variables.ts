/**
 * Variables (environment variables, every one a secret) as the browser and the server's admin API exchange them. A
 * value is encrypted at rest and write-only: lists show names and who changed them; reading values back is a separate,
 * audited request.
 *
 * Variables are set on an agent, on a working directory (`workdir`), or on a scope the application registers (the
 * group a run's subject belongs to, say), and a run gets them merged: the subject's scopes < its working directories <
 * the agent, a later scope replacing an earlier one's value.
 *
 * A run's variables go to whichever runner takes it, including a personal runner of whoever may use the agent: sharing
 * an agent shares the tokens it works with. A variable marked `teamRunnersOnly` keeps a run that gets it off personal
 * runners: only a team runner takes such a run.
 */

/** The scopes this plugin knows; the application registers the others (`GET agents/vocabulary` lists them). */
export const CORE_VARIABLE_SCOPES = ['agent', 'workdir'] as const;

/** `agent`, `workdir` or a scope key the application registered. */
export type VariableScope = string;

export interface Variable {
  readonly name: string;
  /** Only team runners receive it: a run that gets it waits for one (`secretsNotAllowed`); absent means false. */
  readonly teamRunnersOnly?: boolean;
  readonly updatedAt: string;
  readonly updatedById: string | null;
  readonly updatedByName: string | null;
}

/** A variable named by where it is kept, such as one that asks for a team runner. */
export interface VariableRef {
  readonly scope: VariableScope;
  readonly scopeId: string;
  readonly name: string;
}

export interface VariableValue {
  readonly name: string;
  readonly value: string;
}

export const VARIABLE_AUDIT_ACTIONS = [
  'set',
  'delete',
  'reveal',
  'deliver',
] as const;

export type VariableAuditAction = (typeof VARIABLE_AUDIT_ACTIONS)[number];

/** Who did what with a scope's variables; `deliver` is a runner receiving them for a run or a job. */
export interface VariableAudit {
  readonly id: string;
  readonly at: string;
  readonly action: VariableAuditAction;
  readonly names: readonly string[];
  readonly userId: string | null;
  readonly userName: string | null;
  readonly runId: string | null;
  readonly jobId: string | null;
  readonly runnerId: string | null;
}

/** Upper-case letters, digits and underscores, not starting with a digit. */
export const VARIABLE_NAME_PATTERN: RegExp = /^[A-Z_][A-Z0-9_]{0,127}$/u;

/** A value's size limit, in UTF-8 bytes. */
export const VARIABLE_VALUE_MAX_BYTES: number = 8 * 1024;

/** The prefix of the environment variables the application's CLI reads, from its command name (`my-cli` → `MY_CLI_`). */
export function cliEnvPrefix(cli: string): string {
  return `${cli.toUpperCase().replace(/[^A-Z0-9]+/gu, '_')}_`;
}

/**
 * Names a run may not set: what the runner owns and, given the application's CLI command (`cli`), what reaches that CLI.
 */
export function isReservedVariable(name: string, cli?: string): boolean {
  return (
    ['PATH', 'HOME', 'TMPDIR', 'SHELL', 'USER'].includes(name) ||
    /^(AGENT_RUN_|GIT_)/u.test(name) ||
    (cli !== undefined && name.startsWith(cliEnvPrefix(cli)))
  );
}

export type VariableNameProblem =
  'required' | 'pattern' | 'reserved' | 'duplicate';

/** Why `name` cannot be a new variable among `existing`, or null. */
export function variableNameProblem(
  name: string,
  existing: readonly string[] = [],
  cli?: string,
): VariableNameProblem | null {
  if (!name) return 'required';
  if (!VARIABLE_NAME_PATTERN.test(name)) return 'pattern';
  if (isReservedVariable(name, cli)) return 'reserved';
  if (existing.includes(name)) return 'duplicate';
  return null;
}
