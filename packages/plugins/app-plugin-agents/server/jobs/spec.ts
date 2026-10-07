/**
 * What an application enqueues: a job's spec as the runner will get it, except that secrets are named rather than
 * given. A variable may come from a stored variable (`{ name, secret: { scope, scopeId, name } }`, kept wherever the
 * secret source the application provides keeps them: the agents plugin's variables of an agent, a working directory or
 * a scope), and a repository's HTTPS token likewise (`repo.credentials`). The claim opens them through that source for
 * the runner that takes the job, which records the delivery; the stored job holds only the references.
 */
import {
  JOB_SPEC_SCHEMAS,
  type BuildJobSpec,
  type JobEnvVar,
  type JobKind,
  type JobRepo,
  type JobSpecs,
} from '@nocobase/agent-protocol';
import { z } from 'zod';

import { invalid } from '../kernel/errors.js';

/** A variable name: upper-case letters, digits and underscores, not starting with a digit. */
const VARIABLE_NAME_PATTERN = /^[A-Z_][A-Z0-9_]{0,127}$/u;

/** A stored variable, by where it is kept and its name. */
export interface SecretRef {
  readonly scope: string;
  readonly scopeId: string;
  readonly name: string;
}

export type JobEnvInput =
  JobEnvVar | { readonly name: string; readonly secret: SecretRef };

export type JobRepoInput = Omit<JobRepo, 'auth'> & {
  /** The HTTPS token git fetches with, from a stored variable; the runner's own git credentials when absent. */
  readonly credentials?: SecretRef & { readonly username?: string };
};

export type BuildJobSpecInput = Omit<BuildJobSpec, 'repo' | 'env'> & {
  readonly repo: JobRepoInput;
  readonly env?: readonly JobEnvInput[];
};

export interface JobSpecInputs {
  readonly build: BuildJobSpecInput;
}

export type JobSpecInput = JobSpecInputs[JobKind];

const SecretRefSchema = z.object({
  scope: z.string().min(1).max(32),
  scopeId: z.string().min(1).max(64),
  name: z.string().regex(VARIABLE_NAME_PATTERN),
});

const CredentialsSchema = SecretRefSchema.extend({
  username: z.string().min(1).max(200).optional(),
});

/** Only the references are checked here; the rest is checked by the protocol's schema once they are filled. */
const ReferencesSchema = z.object({
  repo: z.object({ credentials: CredentialsSchema.optional() }).loose(),
  env: z
    .array(
      z
        .object({ name: z.string(), secret: SecretRefSchema.optional() })
        .loose(),
    )
    .optional(),
});

export function refKey(ref: SecretRef): string {
  return `${ref.scope}\u0000${ref.scopeId}\u0000${ref.name}`;
}

/** The stored variables `input` names, each once. */
export function secretRefsOf(input: unknown): SecretRef[] {
  const parsed = ReferencesSchema.safeParse(input);
  if (!parsed.success) return [];
  const refs = new Map<string, SecretRef>();
  const add = (ref: SecretRef) => refs.set(refKey(ref), ref);
  if (parsed.data.repo.credentials) add(parsed.data.repo.credentials);
  for (const entry of parsed.data.env ?? [])
    if (entry.secret) add(entry.secret);
  return [...refs.values()];
}

function issueText(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue
    ? `${issue.path.join('.') || 'spec'}: ${issue.message}`
    : 'The job spec is invalid.';
}

/**
 * `input` as the runner gets it: references filled from `values` (by `refKey`), then checked against the executor's
 * schema. Throws `INVALID_REQUEST` naming the first problem.
 */
export function runnerSpec<K extends JobKind>(
  executor: K,
  input: unknown,
  values: ReadonlyMap<string, string>,
): JobSpecs[K] {
  const references = ReferencesSchema.safeParse(input);
  if (!references.success) throw invalid(issueText(references.error));
  const value = (ref: SecretRef): string => {
    const found = values.get(refKey(ref));
    if (found === undefined)
      throw invalid(
        `The variable ${ref.name} of ${ref.scope} ${ref.scopeId} is not set.`,
        { scope: ref.scope, scopeId: ref.scopeId, name: ref.name },
      );
    return found;
  };
  const raw = input as Record<string, unknown> & {
    repo: Record<string, unknown>;
  };
  const { credentials } = references.data.repo;
  const { credentials: _dropped, ...repo } = raw.repo;
  const filled: Record<string, unknown> = {
    ...raw,
    repo: {
      ...repo,
      ...(credentials
        ? {
            auth: {
              token: value(credentials),
              ...(credentials.username
                ? { username: credentials.username }
                : {}),
            },
          }
        : {}),
    },
  };
  filled.env = (references.data.env ?? []).map((entry) =>
    entry.secret
      ? { name: entry.name, value: value(entry.secret), secret: true }
      : entry,
  );
  const result = JOB_SPEC_SCHEMAS[executor].safeParse(filled);
  if (!result.success) throw invalid(issueText(result.error));
  return result.data;
}

/** Checks `input` as `runnerSpec` would, with every reference filled with a placeholder. */
export function checkSpecInput(executor: JobKind, input: unknown): void {
  const placeholders = new Map(
    secretRefsOf(input).map((ref) => [refKey(ref), 'x']),
  );
  runnerSpec(executor, input, placeholders);
}

/** How long the job may run, as its spec says; for the sweeper's backstop. */
export function timeoutSecOf(spec: unknown): number | null {
  const value =
    spec && typeof spec === 'object'
      ? (spec as { timeoutSec?: unknown }).timeoutSec
      : undefined;
  return typeof value === 'number' && value > 0 ? value : null;
}
