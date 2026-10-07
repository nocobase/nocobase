// The runner's local policy: what its owner lets it take, in `~/.nocobase-runner/policy.json` on this machine. The
// owner writes it; no application can change it (nothing the runner hears from a server touches the file), and the
// agents the runner drives cannot read or write it (the runner's directory is protected from them).
//
//   {
//     "agents": ["Coder", "a1b2c3"],          // agent runs only for these agents, by name or id; [] for none
//     "subjects": ["NP-*"],                   // only on these subjects (a run's subject key, such as an issue key)
//     "repos": ["github.com/acme/*"],         // only these repositories, for runs and jobs alike
//     "build": true,                          // build jobs
//     "isolation": { "mode": "user", "user": "nocobase-build" },
//     "apps": { "acme": { "repos": ["github.com/acme/app"] } }
//   }
//
// Every field is optional; the lists are patterns with `*` for any run of characters. Without the file the runner takes
// everything its owner registered it for. `apps` narrows or widens the top level for one application (by its
// registration key, the application's id), field by field.
//
// The runner reports the lists with its registration and every heartbeat (`RunnerPolicy`), so the server chooses work
// that fits; it leaves out of its features what it does not take at all (`jobs.build`), so
// the server never hands that out; and it refuses at claim anything outside the policy anyway (`policyRefused`, which
// the server retries elsewhere). A file it cannot read or parse takes nothing until it is fixed: an owner who wrote a
// policy meant to restrict the runner.
//
// `isolation` runs the deterministic steps (a build job's command) as another, less privileged user, or in a
// container (runner/isolation.ts). The agents' own coding tools are not affected.
import { readFile } from 'node:fs/promises';

import { z } from 'zod';

import type { RunnerPaths } from '../lib/home.ts';
import {
  policyAllowsAgent,
  policyAllowsRepo,
  policyAllowsSubject,
  type JobPayload,
  type RunnerFeature,
  type RunnerPolicy,
  type RunPayload,
} from '../protocol/index.ts';

export const ISOLATION_MODES = ['none', 'user', 'container'] as const;

export type IsolationMode = (typeof ISOLATION_MODES)[number];

export interface IsolationConfig {
  readonly mode: IsolationMode;
  /** `user`: the account the steps run as, through `sudo -n -u <user>`. */
  readonly user?: string;
  /** `container`: the image the steps would run in. */
  readonly image?: string;
}

export interface PolicyRule {
  readonly agents?: readonly string[];
  readonly subjects?: readonly string[];
  readonly repos?: readonly string[];
  readonly build?: boolean;
  readonly isolation?: IsolationConfig;
}

export interface LocalPolicyFile extends PolicyRule {
  readonly apps?: Readonly<Record<string, PolicyRule>>;
}

/** The policy for one application, every field decided. */
export interface EffectivePolicy {
  /** The lists, as the runner reports them; undefined when there are none. */
  readonly reported: RunnerPolicy | undefined;
  readonly build: boolean;
  readonly isolation: IsolationConfig;
  /** Why the policy file could not be used, when it could not: the runner then takes nothing. */
  readonly error?: string;
}

const patterns = z.array(z.string().min(1).max(500)).max(200);

const IsolationSchema = z
  .object({
    mode: z.enum(ISOLATION_MODES),
    user: z
      .string()
      .regex(/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/u, 'must be a user name')
      .optional(),
    image: z.string().min(1).max(500).optional(),
  })
  .strict()
  .refine((value) => value.mode !== 'user' || value.user !== undefined, {
    message: 'mode "user" needs "user"',
  });

const RuleSchema = z
  .object({
    agents: patterns.optional(),
    subjects: patterns.optional(),
    repos: patterns.optional(),
    build: z.boolean().optional(),
    isolation: IsolationSchema.optional(),
  })
  .strict();

const FileSchema = RuleSchema.extend({
  apps: z.record(z.string(), RuleSchema).optional(),
}).strict();

/** What a runner with no usable policy takes: nothing. */
const NOTHING: EffectivePolicy = {
  reported: { agents: [], subjects: [], repos: [] },
  build: false,
  isolation: { mode: 'none' },
};

export type PolicyRead =
  { readonly policy: LocalPolicyFile } | { readonly error: string };

/** The owner's policy file: an empty policy when there is none, the problem when it cannot be used. */
export async function readLocalPolicy(
  paths: Pick<RunnerPaths, 'policy'>,
): Promise<PolicyRead> {
  let text: string;
  try {
    text = await readFile(paths.policy, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return { policy: {} };
    return {
      error: `${paths.policy} cannot be read: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return { error: `${paths.policy} is not valid JSON.` };
  }
  const parsed = FileSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: `${paths.policy}: ${issue ? `${issue.path.join('.') || 'policy'}: ${issue.message}` : 'invalid'}.`,
    };
  }
  return { policy: parsed.data };
}

/** The policy for the application registered as `appKey`: its `apps` entry over the top level, field by field. */
export function policyFor(read: PolicyRead, appKey: string): EffectivePolicy {
  if ('error' in read) return { ...NOTHING, error: read.error };
  const { apps, ...top } = read.policy;
  const rule: PolicyRule = { ...top, ...(apps?.[appKey] ?? {}) };
  const reported: RunnerPolicy = {
    ...(rule.agents ? { agents: [...rule.agents] } : {}),
    ...(rule.subjects ? { subjects: [...rule.subjects] } : {}),
    ...(rule.repos ? { repos: [...rule.repos] } : {}),
  };
  return {
    reported: Object.keys(reported).length > 0 ? reported : undefined,
    build: rule.build !== false,
    isolation: rule.isolation ?? { mode: 'none' },
  };
}

/**
 * The features the runner reports to one application: its own, without the kinds of work the policy refuses, and
 * without the deterministic steps when their isolation is configured but cannot be had here (`isolationProblem`).
 */
export function featuresFor(
  features: readonly RunnerFeature[],
  policy: EffectivePolicy,
  isolationProblem: string | undefined,
): RunnerFeature[] {
  const refused = new Set<RunnerFeature>();
  if (!policy.build || isolationProblem !== undefined)
    refused.add('jobs.build');
  return features.filter((feature) => !refused.has(feature));
}

/** Why the policy refuses a claimed run, or undefined when it takes it. */
export function refuseRun(
  policy: EffectivePolicy,
  payload: RunPayload,
): string | undefined {
  if (policy.error)
    return `The runner's policy cannot be used: ${policy.error}`;
  const lists = policy.reported;
  if (lists?.agents !== undefined) {
    if (!payload.agent)
      return 'The runner takes only some agents, and the run does not say which agent it is for.';
    if (!policyAllowsAgent(lists, payload.agent))
      return `The runner's policy does not take runs of agent ${payload.agent.name}.`;
  }
  if (!policyAllowsSubject(lists, payload.subject.key))
    return `The runner's policy does not take work on ${payload.subject.key}.`;
  for (const dir of payload.workspace.dirs)
    if (dir.kind === 'repo' && !policyAllowsRepo(lists, dir.url))
      return `The runner's policy does not take the repository ${dir.url}.`;
  return undefined;
}

/** Why the policy refuses a claimed job, or undefined when it takes it. */
export function refuseJob(
  policy: EffectivePolicy,
  payload: JobPayload,
  isolationProblem: string | undefined,
): string | undefined {
  if (policy.error)
    return `The runner's policy cannot be used: ${policy.error}`;
  const { job } = payload;
  if (!policy.build) return "The runner's policy does not take build jobs.";
  if (isolationProblem !== undefined)
    return `The runner cannot isolate the build: ${isolationProblem}`;
  if (!policyAllowsRepo(policy.reported, job.spec.repo.url))
    return `The runner's policy does not take the repository ${job.spec.repo.url}.`;
  return undefined;
}

/** What the runner tells one application of itself under its owner's policy. */
export interface PolicyReport {
  readonly policy: EffectivePolicy;
  /** Why the configured isolation cannot be had here, when it cannot: no build job then. */
  readonly isolationProblem: string | undefined;
  readonly features: RunnerFeature[];
}

/** The isolation checks already made, by configuration, with when; checked again after a while. */
const isolationChecks = new Map<
  string,
  { readonly at: number; readonly problem: string | undefined }
>();
const ISOLATION_CHECK_MS = 5 * 60_000;

/**
 * The policy for `appKey` read from the owner's file now, whether its isolation can be had (`check`, cached for a few
 * minutes per configuration), and the features the runner reports under it.
 */
export async function policyReport(
  paths: Pick<RunnerPaths, 'policy'>,
  appKey: string,
  features: readonly RunnerFeature[],
  check: (config: IsolationConfig) => Promise<string | undefined>,
): Promise<PolicyReport> {
  const policy = policyFor(await readLocalPolicy(paths), appKey);
  let isolationProblem: string | undefined;
  if (policy.isolation.mode !== 'none') {
    const key = JSON.stringify(policy.isolation);
    const cached = isolationChecks.get(key);
    if (cached && Date.now() - cached.at < ISOLATION_CHECK_MS)
      isolationProblem = cached.problem;
    else {
      isolationProblem = await check(policy.isolation);
      isolationChecks.set(key, { at: Date.now(), problem: isolationProblem });
    }
  }
  return {
    policy,
    isolationProblem,
    features: featuresFor(features, policy, isolationProblem),
  };
}
