/**
 * A run: one attempt by one agent to work on one subject, and everything a runner receives when it claims one.
 *
 * Lifecycle: `queued → dispatched → running → completed | failed | cancelled`. A claim moves a run to `dispatched`
 * under a lease; `start` moves it to `running`. A run whose lease expires, whose runner goes offline, or that fails for
 * a retryable reason goes back to `queued` while attempts remain. Input that arrives while a run is `dispatched` or
 * `running` is added to that run and reported by `lease` and `status`.
 */
import { z } from 'zod';

import {
  AgentToolSchema,
  RunnerFeatureSchema,
  type AgentTool,
  type RunnerFeature,
} from './version.js';

export const RUN_STATUSES = [
  'queued',
  'dispatched',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

export const RunStatusSchema: z.ZodType<RunStatus> = z.enum(RUN_STATUSES);

/** Held by a runner. */
export const ACTIVE_RUN_STATUSES: readonly RunStatus[] = [
  'dispatched',
  'running',
];
/** Never change again. */
export const TERMINAL_RUN_STATUSES: readonly RunStatus[] = [
  'completed',
  'failed',
  'cancelled',
];

export const RUN_INPUT_TYPES = [
  'comment',
  'statusChange',
  'retry',
  'planDecided',
  'signal',
  'custom',
] as const;

export type RunInputType = (typeof RUN_INPUT_TYPES)[number];

export const ACTOR_KINDS = ['user', 'agent', 'system'] as const;

export type ActorKind = (typeof ACTOR_KINDS)[number];

export interface ActorRef {
  readonly kind: ActorKind;
  readonly id: string;
  readonly name: string;
}

export const ActorRefSchema: z.ZodType<ActorRef> = z.object({
  kind: z.enum(ACTOR_KINDS),
  id: z.string(),
  name: z.string(),
});

/**
 * Something the agent must take into account: what started the run, and anything added while it waits or works. A
 * run completes only once it reports every input it was given as handled (`CompleteRequest.handledInputIds`).
 */
export interface RunInput {
  readonly id: string;
  readonly type: RunInputType;
  /** ISO 8601. */
  readonly at: string;
  readonly actor: ActorRef;
  readonly text: string;
  readonly payload?: unknown;
}

export const RunInputSchema: z.ZodType<RunInput> = z.object({
  id: z.string().min(1),
  type: z.enum(RUN_INPUT_TYPES),
  at: z.string(),
  actor: ActorRefSchema,
  text: z.string(),
  payload: z.unknown().optional(),
});

/** Which application handed out the run. A runner connected to several applications tells them apart by `id`. */
export interface RunApp {
  readonly id: string;
  readonly name: string;
}

export const RunAppSchema: z.ZodType<RunApp> = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(200),
});

/**
 * What the run works on, as far as the runner needs to know: `key` names the work directory and is shown to people;
 * `title` and `url` are for display. The runner does not interpret any of it.
 */
export interface RunSubject {
  readonly key: string;
  readonly title?: string;
  readonly url?: string;
}

export const RunSubjectSchema: z.ZodType<RunSubject> = z.object({
  key: z.string().min(1).max(200),
  title: z.string().optional(),
  url: z.string().optional(),
});

export const PERMISSION_MODES = ['acceptEdits', 'plan', 'bypass'] as const;

export type PermissionMode = (typeof PERMISSION_MODES)[number];

/** How the runner decides what the agent's tools may do. */
export interface ToolPolicy {
  readonly permissionMode: PermissionMode;
  /** Regular expressions; a shell command must match one. */
  readonly allowedCommands: readonly string[];
  /** Regular expressions; a shell command matching one is refused even when allowed. */
  readonly deniedPatterns: readonly string[];
  /**
   * Regular expressions for commands that download and run code (`npx -y`, `pnpm dlx`, `curl … | sh` and the like).
   * The runner refuses those in every mode unless one of these matches the command.
   */
  readonly allowedDownloads?: readonly string[];
  readonly maxTurns?: number;
  /** A run with no event for this long is stopped. */
  readonly idleTimeoutMs: number;
}

export const ToolPolicySchema: z.ZodType<ToolPolicy> = z.object({
  permissionMode: z.enum(PERMISSION_MODES),
  allowedCommands: z.array(z.string()),
  deniedPatterns: z.array(z.string()),
  allowedDownloads: z.array(z.string()).optional(),
  maxTurns: z.number().int().positive().optional(),
  idleTimeoutMs: z.number().int().positive(),
});

/**
 * The coding tool to run and how: the entry of the agent's list the server picked for this runner (the first whose tool
 * it has signed in). `model` is passed to the tool as its model; absent, the tool runs its default. A model the tool's
 * account cannot use fails the run `modelUnavailable`. `effort` is the entry's reasoning effort, one of the tool's
 * (`TOOL_EFFORTS`); absent, the tool's default.
 */
export interface RunTool {
  readonly kind: AgentTool;
  readonly model?: string;
  readonly effort?: string;
  readonly policy: ToolPolicy;
}

export const RunToolSchema: z.ZodType<RunTool> = z.object({
  kind: AgentToolSchema,
  model: z.string().optional(),
  effort: z.string().optional(),
  policy: ToolPolicySchema,
});

/**
 * What the agent is told. The application renders everything it knows (its own rules, the task, the subject, the
 * agent's instructions) into `system`; the runner passes it to the tool as the system prompt, replacing two
 * placeholders with what only it knows when the text contains them: `{{runner.workspaceNotes}}` with its notes on the
 * working directories, and `{{runner.workspaceInit}}` with the initialization prompts of the directories it prepared
 * for this run (see `WorkspaceDir.initPrompt`), or nothing.
 */
export interface RunPrompt {
  readonly system: string;
  /** The first turn's prompt. */
  readonly turn: string;
  /** `resume` only when the runner holds `resumeSessionId` in the same working directory; otherwise start fresh. */
  readonly session: 'fresh' | 'resume';
  readonly resumeSessionId?: string;
}

export const RunPromptSchema: z.ZodType<RunPrompt> = z.object({
  system: z.string(),
  turn: z.string(),
  session: z.enum(['fresh', 'resume']),
  resumeSessionId: z.string().optional(),
});

/** The placeholder in `RunPrompt.system` the runner replaces with its notes on the working directories. */
export const WORKSPACE_NOTES_PLACEHOLDER = '{{runner.workspaceNotes}}';

/**
 * The placeholder in `RunPrompt.system` the runner replaces with the initialization prompts of the working directories
 * it prepared fresh for this run (a first checkout, or the first use of a directory for this subject), each under the
 * directory's path; with nothing when it prepared none, or none has a prompt.
 */
export const WORKSPACE_INIT_PLACEHOLDER = '{{runner.workspaceInit}}';

/**
 * What the agent is to do in a working directory it was just given (`run pnpm install, then copy .env.example to
 * .env`): plain text for the agent, delivered only when the runner prepared the directory fresh. Never run by the
 * runner.
 */
const initPrompt = z.string().max(10_000).optional();

/** A repository the runner checks out before the agent starts (the `checkout` feature). */
export interface RepoDir {
  readonly kind: 'repo';
  readonly url: string;
  readonly defaultBranch: string;
  /**
   * The branch the run works on, such as `agent/PM-12`; the only branch the agent may push. Never `defaultBranch`,
   * except with `initial`.
   */
  readonly branch: string;
  /** Where to check it out, relative to the run's working directory. */
  readonly path: string;
  /** What people call it, for the agent's notes. */
  readonly name?: string;
  readonly initPrompt?: string;
  /**
   * The repository is empty and this run makes its first commit: the runner checks it out with no commit on
   * `defaultBranch`, which is also `branch`, and the agent pushes the default branch itself (a project initialized by an
   * agent). The application gives it only to that one run; a runner refuses a run on the default branch without it.
   */
  readonly initial?: true;
}

const repoDirObject = z.object({
  kind: z.literal('repo'),
  url: z.string().min(1),
  defaultBranch: z.string().min(1),
  branch: z.string().min(1),
  path: z
    .string()
    .min(1)
    .refine(
      (value) =>
        !value.startsWith('/') &&
        !value.split(/[\\/]/u).some((part) => part === '..' || part === ''),
      'must be a relative path inside the working directory',
    ),
  name: z.string().max(255).optional(),
  initPrompt,
  initial: z.literal(true).optional(),
});

export const RepoDirSchema: z.ZodType<RepoDir> = repoDirObject;

/**
 * A directory that already exists on the runner (the `directories` feature): the agent works in it in place, with no
 * checkout and no branch. Only the runner the application chose gets such a run, and it holds one run at a time in a
 * directory.
 */
export interface LocalDir {
  readonly kind: 'directory';
  /** Absolute, on the runner. */
  readonly path: string;
  readonly name?: string;
  readonly initPrompt?: string;
}

const localDirObject = z.object({
  kind: z.literal('directory'),
  path: z
    .string()
    .min(1)
    .max(1024)
    .refine(
      (value) => value.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(value),
      'must be an absolute path',
    ),
  name: z.string().max(255).optional(),
  initPrompt,
});

export const LocalDirSchema: z.ZodType<LocalDir> = localDirObject;

/** One working directory of a run. */
export type WorkspaceDir = RepoDir | LocalDir;

export const WorkspaceDirSchema: z.ZodType<WorkspaceDir> = z.discriminatedUnion(
  'kind',
  [repoDirObject, localDirObject],
);

export interface EnvVar {
  readonly name: string;
  readonly value: string;
}

export const EnvVarSchema: z.ZodType<EnvVar> = z.object({
  name: z.string().min(1),
  value: z.string(),
});

/** A short-lived HTTPS credential for one repository URL. */
export interface RepoCredential {
  /** The repository's URL exactly as a `RepoDir` names it. */
  readonly url: string;
  readonly username: string;
  readonly password: string;
  readonly expiresAt: string;
}

export const RepoCredentialSchema: z.ZodType<RepoCredential> = z.object({
  url: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  expiresAt: z.string(),
});

/**
 * How the run's commits are made and its repositories reached (runners with the `checkout` feature):
 *
 * - `author`: the author and committer of every commit the agent makes, the person the application says the work is
 *   for;
 * - `trailers`: lines added to every commit message, such as `Co-authored-by: Agent <agent+1@acme.noreply>`;
 * - `credentials`: short-lived credentials by repository URL, which the runner fetches and pushes that repository with
 *   (a git credential helper for the agent). They live in memory only: never written to disk, gone with the run. The
 *   push guard still allows only the run's branch.
 */
export interface RunGit {
  readonly author?: { readonly name: string; readonly email: string };
  readonly trailers?: readonly string[];
  readonly credentials?: readonly RepoCredential[];
}

export const RunGitSchema: z.ZodType<RunGit> = z.object({
  author: z
    .object({
      name: z.string().min(1).max(255),
      email: z.string().min(3).max(255),
    })
    .optional(),
  trailers: z.array(z.string().min(1).max(500)).max(20).optional(),
  credentials: z.array(RepoCredentialSchema).optional(),
});

/**
 * Where the agent works. `dirs` is ordered: the first is the primary working directory, where the agent starts. With
 * none, the agent starts in an empty directory the runner keeps for the subject.
 */
export interface RunWorkspace {
  readonly dirs: readonly WorkspaceDir[];
  /**
   * Variables for the agent's process, already merged by the application (secrets among them, only for a runner with
   * the `secrets` feature). The runner injects them and never writes them to disk.
   */
  readonly env: readonly EnvVar[];
  /** Variable names whose values the runner takes from its own configuration or environment; never from the server. */
  readonly passthrough?: readonly string[];
  /**
   * Start over: the runner removes what it prepared for this subject (its checkouts, the agent's home and its record of
   * prepared directories) before preparing the workspace again. It never removes a `directory` entry's contents.
   */
  readonly clean?: boolean;
  /** Commit identity and repository credentials; absent when the application gives none (the host's own are used). */
  readonly git?: RunGit;
}

export const RunWorkspaceSchema: z.ZodType<RunWorkspace> = z.object({
  dirs: z.array(WorkspaceDirSchema),
  env: z.array(EnvVarSchema),
  passthrough: z.array(z.string()).optional(),
  clean: z.boolean().optional(),
  git: RunGitSchema.optional(),
});

/**
 * A skill in the open Agent Skills format (a directory with `SKILL.md`), fetched by the runner from `bundleUrl`
 * (`RUNNER_ROUTES.skill`, with the runner's key) and cached by `(slug, hash)`.
 */
export interface RunSkill {
  /** The skill's directory name and its `name` in `SKILL.md`. */
  readonly slug: string;
  /** What people call it. */
  readonly name: string;
  readonly version: string;
  /** Changes whenever any of its files does. */
  readonly hash: string;
  readonly description: string;
  readonly bundleUrl: string;
}

export const SKILL_SLUG_PATTERN: RegExp = /^[a-z0-9][a-z0-9-]{0,63}$/u;

export const RunSkillSchema: z.ZodType<RunSkill> = z.object({
  slug: z.string().regex(SKILL_SLUG_PATTERN),
  name: z.string(),
  version: z.string(),
  hash: z.string().min(1),
  description: z.string(),
  bundleUrl: z.string().min(1),
});

/**
 * One file of a skill, relative to the skill's directory. `content` is the text, or with `encoding: 'base64'` the
 * bytes of a binary file. An `executable` file is written with the executable bit, as a script.
 */
export interface SkillFile {
  readonly path: string;
  readonly content: string;
  readonly encoding?: 'base64';
  readonly executable?: boolean;
}

/** `GET RUNNER_ROUTES.skill`: a skill's files, `SKILL.md` among them. */
export interface SkillBundle {
  readonly slug: string;
  readonly version: string;
  readonly hash: string;
  readonly files: readonly SkillFile[];
}

const relativeFile = z
  .string()
  .min(1)
  .max(255)
  .refine(
    (value) =>
      !value.startsWith('/') &&
      !value
        .split(/[\\/]/u)
        .some((part) => part === '..' || part === '' || part === '.'),
    'must be a relative path inside the skill',
  );

export const SkillBundleSchema: z.ZodType<SkillBundle> = z.object({
  slug: z.string().regex(SKILL_SLUG_PATTERN),
  version: z.string(),
  hash: z.string().min(1),
  files: z.array(
    z.object({
      path: relativeFile,
      content: z.string(),
      encoding: z.literal('base64').optional(),
      executable: z.boolean().optional(),
    }),
  ),
});

/**
 * A directory of files the application wants beside the agent (the `mounts` feature): fetched from `bundleUrl`
 * (`RUNNER_ROUTES.mount`, with the runner's key) unless the runner's cache has that `(name, hash)`, and written afresh
 * at `target` inside the subject's work directory before the agent starts. The runner knows nothing of what the files
 * are: the application names them in `note`, which the runner adds to its notes on the working directories, and in the
 * system prompt. A runner without the feature ignores `mounts`; an application never requires it for a run, so the
 * run goes ahead without the files.
 */
export interface RunMount {
  /** Unique among the run's mounts (`MOUNT_NAME_PATTERN`). */
  readonly name: string;
  /** Changes whenever any of its files does. */
  readonly hash: string;
  readonly bundleUrl: string;
  /** Relative to the subject's work directory; the runner empties it and writes the bundle there. */
  readonly target: string;
  /** One line for the agent's workspace notes, about what the directory holds. */
  readonly note?: string;
}

export const MOUNT_NAME_PATTERN: RegExp = /^[a-z][a-z0-9-]{0,31}$/u;

/** A relative path with no `..`, empty or `.` segment. */
function isRelativeInside(value: string): boolean {
  return (
    !value.startsWith('/') &&
    !/^[A-Za-z]:/u.test(value) &&
    !value
      .split(/[\\/]/u)
      .some((part) => part === '..' || part === '' || part === '.')
  );
}

export const RunMountSchema: z.ZodType<RunMount> = z.object({
  name: z.string().regex(MOUNT_NAME_PATTERN),
  hash: z.string().min(1).max(128),
  bundleUrl: z.string().min(1),
  target: z
    .string()
    .min(1)
    .max(255)
    .refine(
      isRelativeInside,
      'must be a relative path inside the work directory',
    ),
  note: z.string().max(2000).optional(),
});

/** One file of a mount, relative to its target directory. */
export interface MountFile {
  readonly path: string;
  readonly content: string;
}

/** `GET RUNNER_ROUTES.mount`: the files of one of the run's mounts. */
export interface MountBundle {
  readonly name: string;
  readonly hash: string;
  readonly files: readonly MountFile[];
}

export const MountBundleSchema: z.ZodType<MountBundle> = z.object({
  name: z.string().regex(MOUNT_NAME_PATTERN),
  hash: z.string().min(1).max(128),
  files: z.array(
    z.object({
      path: z
        .string()
        .min(1)
        .max(1024)
        .refine(isRelativeInside, 'must be a relative path inside the mount'),
      content: z.string(),
    }),
  ),
});

/**
 * Where the runner gets the application's command-line tool:
 *
 * - `npm`: installs `package@version` once into its own cache;
 * - `tarball`: downloads a package tarball, checks its SHA-256 and installs it the same way;
 * - `preinstalled`: uses the command already on the runner's PATH;
 * - `archive`: downloads a standalone tarball the application serves (`DIST_ROUTES.file`, with the runner's key),
 *   checks its SHA-256 and unpacks it once per version; it bundles its own Node, so no npm is needed. Only for a
 *   runner with the `archives` feature.
 *
 * A runner may also be told locally where a CLI lives (`nocobase-runner register --cli acme=/path`), which wins.
 */
export type CliPackage =
  | { readonly kind: 'npm'; readonly package: string; readonly version: string }
  | { readonly kind: 'tarball'; readonly url: string; readonly sha256: string }
  | { readonly kind: 'preinstalled' }
  | {
      readonly kind: 'archive';
      readonly version: string;
      /** A path on the application's origin, or a URL on that origin. */
      readonly url: string;
      readonly sha256: string;
    };

export const CliPackageSchema: z.ZodType<CliPackage> = z.discriminatedUnion(
  'kind',
  [
    z.object({
      kind: z.literal('npm'),
      package: z.string().min(1),
      version: z.string().min(1),
    }),
    z.object({
      kind: z.literal('tarball'),
      url: z.string().min(1),
      sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    }),
    z.object({ kind: z.literal('preinstalled') }),
    z.object({
      kind: z.literal('archive'),
      version: z.string().min(1).max(64),
      url: z.string().min(1),
      sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    }),
  ],
);

/**
 * The application's command-line tool the agent talks to the application with. The runner puts `name` first on the
 * agent's PATH and writes `credential.content` as JSON to `credential.file` (relative to the working directory, 0600)
 * for the run, deleting it when the run ends; the run's token is never put in the environment. The runner bundles no
 * application commands and does not interpret `content`, except that it fills in `content.server` with the address it
 * reaches the application at when the application leaves it out.
 */
export interface RunCli {
  /** The command name, such as `acme`. */
  readonly name: string;
  readonly package: CliPackage;
  readonly credential: {
    readonly file: string;
    readonly content: Readonly<Record<string, unknown>>;
  };
}

/**
 * Set by the runner, for the application's CLI process only (in the command it puts on the agent's PATH, never in the
 * agent's own environment), to the absolute path of the run's credential file: the agent may work in a directory
 * outside the runner's working directory, where walking up would not find the file. A CLI reads this before looking
 * for `credential.file` at or above its working directory.
 */
export const RUN_CREDENTIALS_ENV = 'AGENT_RUN_CREDENTIALS';

/**
 * The keychain service (macOS Keychain, Secret Service, Windows Credential Manager) under which an application's CLI
 * keeps the signed-in person's API key, such as `acme-cli` for `acme`. A runner keeps the agent's keychain tools away
 * from the items of this service, and only these: the coding tools read their own logins from the same keychain.
 */
export function cliKeychainService(name: string): string {
  return `${name}-cli`;
}

export const CLI_NAME_PATTERN: RegExp = /^[a-z][a-z0-9-]{0,63}$/u;

export const RunCliSchema: z.ZodType<RunCli> = z.object({
  name: z.string().regex(CLI_NAME_PATTERN),
  package: CliPackageSchema,
  credential: z.object({
    file: z
      .string()
      .min(1)
      .max(200)
      .refine(
        (file) =>
          !file.startsWith('/') &&
          !file.split(/[\\/]/u).some((part) => part === '..' || part === ''),
        'must be a relative path inside the working directory',
      ),
    content: z.record(z.string(), z.unknown()),
  }),
});

export interface RunHeader {
  readonly id: string;
  /** From 1; grows each time the run goes back to the queue. */
  readonly attempt: number;
  readonly maxAttempts: number;
  /** Lower runs first. */
  readonly priority: number;
  readonly createdAt: string;
  readonly leaseExpiresAt: string;
  readonly requires: readonly RunnerFeature[];
  /**
   * The `seq` this attempt's first event takes. `seq` counts a run's events across all its attempts, so an attempt
   * continues where the previous one stopped (the server sends the highest stored `seq` plus one) and never collides
   * with events an earlier attempt, possibly on another runner, already stored.
   */
  readonly firstSeq: number;
}

export const RunHeaderSchema: z.ZodType<RunHeader> = z.object({
  id: z.string(),
  attempt: z.number().int().positive(),
  maxAttempts: z.number().int().positive(),
  priority: z.number().int(),
  createdAt: z.string(),
  leaseExpiresAt: z.string(),
  requires: z.array(RunnerFeatureSchema),
  firstSeq: z.number().int().positive(),
});

/**
 * Everything a runner needs to run an agent, assembled in the claim's transaction: a run that cannot be assembled is
 * not claimed. It names no business concept: the application has rendered what the agent must know into `prompt`, and
 * what the agent can do into the commands of its CLI (`cli`). The run's credential and `workspace.env` appear only
 * here and only once.
 */
export interface RunPayload {
  readonly run: RunHeader;
  readonly app: RunApp;
  readonly subject: RunSubject;
  readonly tool: RunTool;
  readonly prompt: RunPrompt;
  /** The input present at claim time; later input arrives through `lease` and `status`. */
  readonly inputs: readonly RunInput[];
  readonly workspace: RunWorkspace;
  /** Delivered by runners with the `skills` feature; others ignore it. */
  readonly skills: readonly RunSkill[];
  /** Files placed beside the agent, for runners with the `mounts` feature only (protocol 5); absent otherwise. */
  readonly mounts?: readonly RunMount[];
  readonly cli: RunCli;
  /**
   * The agent the run is for (protocol 7), so a runner can hold it against its owner's local policy (`RunnerPolicy`);
   * shown to no one and never sent to the coding tool.
   */
  readonly agent?: RunAgentRef;
}

/** Which agent a run is for. */
export interface RunAgentRef {
  readonly id: string;
  readonly name: string;
}

export const RunPayloadSchema: z.ZodType<RunPayload> = z.object({
  run: RunHeaderSchema,
  app: RunAppSchema,
  subject: RunSubjectSchema,
  tool: RunToolSchema,
  prompt: RunPromptSchema,
  inputs: z.array(RunInputSchema),
  workspace: RunWorkspaceSchema,
  skills: z.array(RunSkillSchema),
  mounts: z.array(RunMountSchema).optional(),
  cli: RunCliSchema,
  agent: z
    .object({ id: z.string().min(1).max(64), name: z.string().max(200) })
    .optional(),
});

/**
 * What an application usually writes into `RunCli.credential.content`, and what `@nocobase/app-cli-client` reads: the
 * run token, the run, and where the command manifest is. `server` may be left for the runner to fill in.
 */
export interface RunCliCredential {
  readonly server: string;
  readonly token: string;
  readonly runId: string;
  /** Origin-relative, or absolute. */
  readonly manifestUrl?: string;
  readonly expiresAt: string;
}

export const RunCliCredentialSchema: z.ZodType<RunCliCredential> = z.object({
  server: z.string().min(1),
  token: z.string().min(1),
  runId: z.string().min(1),
  manifestUrl: z.string().optional(),
  expiresAt: z.string(),
});

/** `GET /api/agents/runs/current`: the run a run token belongs to. */
export interface RunSelf {
  readonly runId: string;
  readonly attempt: number;
  readonly status: RunStatus;
  readonly agent: { readonly id: string; readonly name: string };
  readonly subjectRef: { readonly kind: string; readonly id: string };
  readonly actorUserId: string;
  readonly cancelRequested: boolean;
  /** Input not yet reported as handled. */
  readonly inputs: readonly RunInput[];
}

export const RunSelfSchema: z.ZodType<RunSelf> = z.object({
  runId: z.string(),
  attempt: z.number().int().positive(),
  status: RunStatusSchema,
  agent: z.object({ id: z.string(), name: z.string() }),
  subjectRef: z.object({ kind: z.string(), id: z.string() }),
  actorUserId: z.string(),
  cancelRequested: z.boolean(),
  inputs: z.array(RunInputSchema),
});
