/**
 * The protocol version and the capability vocabulary.
 *
 * There is one integer version. It changes only when an existing message changes incompatibly; additions are made
 * compatible instead (new optional fields, new endpoints) and are announced as features. Compatibility between a run
 * and a runner is decided by features, never by comparing versions: a run declares what it `requires`, a runner
 * declares the `features` it has, and the server hands a run only to a runner whose features cover its requirements.
 */
import { z } from 'zod';

/**
 * The protocol this package describes. A server rejects a runner that speaks another one (`PROTOCOL_UNSUPPORTED`).
 *
 * Version 2 made the run payload application-agnostic: `app`, `subject`, `tool`, `prompt`, `workspace`, `skills` and
 * `cli` replaced `token`, `subjectRef`, `agent`, `brief`, `turn`, `repos`, `environment`, `secrets`, `toolPolicy`,
 * `commands` and `context`.
 *
 * Version 3 made the workspace an ordered list of working directories (`workspace.dirs`: repositories to check out, or
 * a directory the runner already has), dropped setup scripts (`workspace.setup`, the `environments` feature) and
 * runner labels, and added skill bundles (`RUNNER_ROUTES.skill`).
 *
 * Version 4 added jobs (`jobs.ts`): deterministic steps beside runs, handed out by the same claim
 * (`ClaimResponse.jobs`), reported on their own endpoints (`RUNNER_ROUTES.job*`) and in the heartbeat (`jobs`), and
 * announced per kind as features (`jobs.build`; a `jobs.git.check` kind was removed before any release). Nothing of
 * version 3 changed, so a server speaking 4 still serves a runner speaking 3 (`MIN_PROTOCOL_VERSION`); that runner
 * announces no job feature and is never handed a job. The number moved so that a runner announcing a job feature is refused cleanly by a server that does
 * not know jobs, rather than failing to parse its features.
 *
 * Version 5 added mounts (`RunPayload.mounts`, `RUNNER_ROUTES.mount`, the `mounts` feature): directories of files the
 * application places beside the agent. Nothing of version 4 changed, and a run never requires the feature, so a server
 * speaking 5 serves runners speaking 3 and 4 and gives them no mounts. The number moved so that a runner announcing
 * `mounts` is refused cleanly by a server that does not know it.
 *
 * Version 6 added a working directory's preparation (steps the runner ran itself before the agent started), removed
 * again before any release: nothing of it remains.
 *
 * Version 7 added the runner's local policy (`RunnerPolicy` on register and heartbeat), the agent a run is for
 * (`RunPayload.agent`) and the `policyRefused` failure, put every endpoint under the agents plugin's namespace
 * (`/api/agents/runners`, `/api/agents/dist`) with `{ data }` answers and the standard error body (before any release,
 * so no runner of an earlier version is served at other addresses), and a repository's first commit (`RepoDir.initial`: a run that checks out an empty
 * repository on its default branch and may push it). Nothing of version 6 changed otherwise.
 *
 * Limits per coding tool (`ToolSlots` on register, `load.tools` on heartbeat, `tools` on claim) were added within
 * version 7 as optional fields: a server that does not know them ignores them, and a runner that does not send them is
 * bounded by its total slots only.
 *
 * The names of the variables a runner provides (`variables` on register and heartbeat) were added the same way, for
 * the application to show which runners offer what a run asks for by name (`RunWorkspace.passthrough`). A runner fails
 * a run whose passthrough names it does not provide before the agent starts; the server does not choose runners by them.
 *
 * Tool model capabilities (`ToolInfo.models`, supported efforts, detection timestamp/status/reason) were added
 * within version 7 as optional fields. Older receivers ignore them; absent fields mean unknown capabilities.
 *
 * Requested tool detection is announced through optional `toolsRefreshSupported` on register and heartbeat.
 * The server stores it as `tools.refresh`; runners omit that enum value on the wire so version 7 receivers accept them.
 *
 * The `prepareNetwork` failure was added within version 7 the other way round: the application announces it per run
 * (`RunHeader.acceptedFailures`), and a runner reports `checkoutFailed` to one that does not (`acceptedFailure`).
 */
export const PROTOCOL_VERSION = 7;

/** The oldest protocol a server speaking `PROTOCOL_VERSION` still serves. */
export const MIN_PROTOCOL_VERSION = 3;

/** Whether a server speaking `PROTOCOL_VERSION` serves a runner that speaks `version`. */
export function isProtocolSupported(version: number): boolean {
  return (
    Number.isInteger(version) &&
    version >= MIN_PROTOCOL_VERSION &&
    version <= PROTOCOL_VERSION
  );
}

/**
 * What a runner can do beyond the baseline (claim, lease, events, complete/fail).
 *
 * - `input`: accepts input while a run is running (`status.inputs`, and the `handledInputIds` fence on complete).
 * - `steer`: injects input into the running turn instead of waiting for a turn boundary.
 * - `attachments`: the agent can upload files through the CLI.
 * - `checkout`: checks repositories out before the agent starts (`workspace.dirs` entries of kind `repo`).
 * - `directories`: works in a directory that already exists on the runner, in place (entries of kind `directory`).
 * - `secrets`: receives secrets from the server and injects them without writing them to disk.
 * - `skills`: installs the run's skills (`RunPayload.skills`) where its tool finds them.
 * - `archives`: installs the application's CLI from a standalone tarball the application serves (`CliPackage` of
 *   kind `archive`).
 * - `jobs.build`: executes build jobs (`jobs.ts`, `jobFeature`).
 * - `tools.refresh`: accepts a tool detection request on heartbeat and acknowledges the fresh report.
 * - `mounts`: places the run's mounts (`RunPayload.mounts`) in its work directory before the agent starts.
 */
export const RUNNER_FEATURES = [
  'input',
  'steer',
  'attachments',
  'checkout',
  'directories',
  'secrets',
  'skills',
  'archives',
  'jobs.build',
  'mounts',
  'tools.refresh',
] as const;

export type RunnerFeature = (typeof RUNNER_FEATURES)[number];

export const RunnerFeatureSchema: z.ZodType<RunnerFeature> =
  z.enum(RUNNER_FEATURES);

/** The features in `requires` that `features` lacks; empty when the runner may take the run. */
export function missingFeatures(
  requires: readonly string[],
  features: readonly string[],
): string[] {
  const available = new Set(features);
  return requires.filter((feature) => !available.has(feature));
}

/** The coding tools a runner can drive. */
export const AGENT_TOOLS = ['claude', 'codex', 'opencode', 'pi'] as const;

export type AgentTool = (typeof AGENT_TOOLS)[number];

export const AgentToolSchema: z.ZodType<AgentTool> = z.enum(AGENT_TOOLS);

/**
 * Models each coding tool is commonly run with, as its `--model` (or equivalent) takes them, for editors to suggest. Not
 * a limit: a tool takes any model its account may use, and an empty model runs the tool's default.
 *
 * This list goes stale as providers release models, so keep it to the current generation and check it against the
 * providers' own model lists whenever one ships: Anthropic's models overview
 * (https://platform.claude.com/docs/en/about-claude/models/overview) and OpenAI's
 * (https://developers.openai.com/api/docs/models). Claude Code keeps its `opus` / `sonnet` / `haiku` aliases, which
 * follow the newest model of each family, followed by the full ids; OpenCode and Pi name a model `provider/model` so
 * providers with the same model id stay distinct; Codex takes the bare id. Last checked on 2026-10-09. List only ids
 * the provider publishes; this list does not establish availability on any runner.
 */
export const TOOL_MODEL_SUGGESTIONS: Readonly<
  Record<AgentTool, readonly string[]>
> = {
  claude: [
    'opus',
    'sonnet',
    'haiku',
    'claude-opus-5-5',
    'claude-sonnet-5',
    'claude-haiku-4-5',
    'claude-fable-5-1',
  ],
  codex: ['gpt-6.1-sol', 'gpt-6-astra', 'gpt-6-luna'],
  opencode: [
    'anthropic/claude-opus-5-5',
    'anthropic/claude-sonnet-5',
    'anthropic/claude-haiku-4-5',
    'anthropic/claude-fable-5-1',
    'openai/gpt-6.1-sol',
    'openai/gpt-6-astra',
    'openai/gpt-6-luna',
  ],
  pi: [
    'anthropic/claude-opus-5-5',
    'anthropic/claude-sonnet-5',
    'anthropic/claude-haiku-4-5',
    'anthropic/claude-fable-5-1',
    'openai/gpt-6.1-sol',
    'openai/gpt-6-astra',
    'openai/gpt-6-luna',
  ],
};

/**
 * The reasoning efforts each coding tool takes, weakest first, as its effort option names them (Claude Code `effort`,
 * Codex `effort`, OpenCode a model's variant, Pi `--thinking`). An agent's entry names one of its tool's, or none for
 * the tool's default; an adapter passes nothing for a value its tool does not take (an OpenCode model without that
 * variant).
 */
export const TOOL_EFFORTS: Readonly<Record<AgentTool, readonly string[]>> = {
  claude: ['low', 'medium', 'high', 'xhigh', 'max'],
  codex: ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
  opencode: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
  pi: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'],
};

/** Request headers. Credentials travel only in these headers, never in a URL. */
export const HEADERS = {
  /** A runner's key, on every `/runner/*` request except `register`. */
  runnerKey: 'x-nocobase-runner-key',
  /** A run token, on every `/run/*` and CLI request an agent makes during its run. */
  runToken: 'x-nocobase-run-token',
  /** The sender's `PROTOCOL_VERSION`, on every runner request. */
  protocol: 'x-nocobase-protocol',
  /** An unused one-time registration token: lets the install script download the runner before it registers. */
  registrationToken: 'x-nocobase-registration-token',
  /** A short-lived download token: lets the install script download the CLI for one platform, and nothing else. */
  downloadToken: 'x-nocobase-download-token',
  /** A person's API key, for CLI endpoints outside a run. */
  apiKey: 'x-api-key',
} as const;

/** Timings both sides agree on, in milliseconds. A server may announce others in `RegisterResponse`. */
export const TIMINGS = {
  /** How often a runner sends a heartbeat. */
  heartbeatIntervalMs: 15_000,
  /** How long a `claim?wait=1` request is held when there is no work. */
  pollTimeoutMs: 25_000,
  /** How long a lease lasts; a runner renews it every `leaseRenewMs`. */
  leaseMs: 45_000,
  leaseRenewMs: 15_000,
  /** A runner not heard from for this long is offline, and its runs go back to the queue. */
  offlineAfterMs: 150_000,
  /** A dispatched run not started within this long goes back to the queue. */
  startTimeoutMs: 300_000,
  /** A cancellation not acknowledged within this long is recorded as cancelled anyway. */
  cancelGraceMs: 60_000,
} as const;
