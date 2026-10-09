/**
 * Three claim-time extension points the application fills, beside the subject binding: sections it adds to every
 * brief, mounts (directories of files the runner places beside the agent), and repository access (who the run's
 * commits name and the short-lived credentials its checkouts push with). None knows what it carries; the application
 * decides (the assembling application adds its knowledge base through the first two, and its code host connections through the third).
 *
 * - A brief section is text appended to the brief's context layer, after the subject's own context, in `order`. The
 *   context layer is not part of the session fingerprint, so a section that changes does not end a resumable session.
 *   Sections run inside the claim's transaction and for a brief preview (without a runner): database reads only.
 * - A mount is offered per run (`forRun`, in the claim's transaction, only when the runner announces the `mounts`
 *   feature), and served while the runner holds the run (`bundle`). Its hash is not part of the session fingerprint
 *   either: when a run resumes its session, the mount's `resumeNote` is added to the turn instead.
 *
 * - Repository access is asked per run (`forRun`, in the claim's transaction) once the run has repositories to check
 *   out. Its credentials are minted in `prepare` (a network call is fine there), handed to the runner in the payload
 *   and never stored; the claim remembers them as secrets, so nothing the run reports carries them.
 *
 * Inside the claim's transaction a provider reads through the claim's connection only: on SQLite that transaction
 * holds the one connection there is, so anything else (a person's permissions, another plugin's services) would wait
 * for it. What a provider needs from outside it reads in `prepare`, which runs for the run before its claim's
 * transaction (and before a preview) and whose answer the provider gets back as `prepared`.
 */
import {
  MOUNT_NAME_PATTERN,
  routePath,
  RUNNER_ROUTES,
  type MountBundle,
  type RepoDir,
  type RunGit,
  type RunMount,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type { Run } from '../../../shared/runs.js';
import type { ClaimContext, SubjectAssembly } from './ports.js';

/** Before the claim's transaction: what a provider needs from outside the claim's connection. */
export type ExtensionPrepare = (run: Run) => Promise<unknown>;

export interface BriefSectionProvider {
  /** Unique among the sections. */
  readonly key: string;
  /** Lower first; sections without one follow, in the order they were registered. */
  readonly order?: number;
  readonly prepare?: ExtensionPrepare;
  /** Markdown appended to the context layer, or null for nothing on this run. */
  section(
    conn: DatabaseConnection,
    claim: ClaimContext,
    assembly: SubjectAssembly,
    prepared: unknown,
  ): Promise<string | null>;
}

export interface BriefSectionRegistry {
  /** Returns what removes the section. */
  register(provider: BriefSectionProvider): () => void;
  list(): readonly BriefSectionProvider[];
}

export function createBriefSectionRegistry(): BriefSectionRegistry {
  const providers = new Map<string, BriefSectionProvider>();
  return {
    register(provider) {
      if (providers.has(provider.key))
        throw new Error(`Brief section already registered: ${provider.key}`);
      providers.set(provider.key, provider);
      return () => {
        if (providers.get(provider.key) === provider)
          providers.delete(provider.key);
      };
    },
    list: () =>
      [...providers.values()]
        .map((provider, index) => ({ provider, index }))
        .sort(
          (a, b) =>
            (a.provider.order ?? Number.POSITIVE_INFINITY) -
              (b.provider.order ?? Number.POSITIVE_INFINITY) ||
            a.index - b.index,
        )
        .map(({ provider }) => provider),
  };
}

/** The subject's context with every contributed section after it, as the brief's context layer gets it. */
export async function withSections(
  conn: DatabaseConnection,
  sections: BriefSectionRegistry | undefined,
  claim: ClaimContext,
  assembly: SubjectAssembly,
  prepared: Prepared,
): Promise<SubjectAssembly> {
  const added: string[] = [];
  for (const provider of sections?.list() ?? []) {
    const text = await provider.section(
      conn,
      claim,
      assembly,
      prepared.get(`section:${provider.key}`),
    );
    if (text?.trim()) added.push(text.trim());
  }
  if (added.length === 0) return assembly;
  return {
    ...assembly,
    context: [assembly.context.trim(), ...added]
      .filter((part) => part !== '')
      .join('\n\n'),
  };
}

/** What a mount provider is told at claim time. */
export interface MountContext {
  /** The claim; its runner is set and announces `mounts`. */
  readonly claim: ClaimContext;
  readonly assembly: SubjectAssembly;
  /** Whether the run resumes the session its runner kept for the subject. */
  readonly session: 'fresh' | 'resume';
  /**
   * The same for every run of one agent on one subject and thread, the unit a session belongs to: a provider compares
   * what it mounts now with what it mounted last under the same key.
   */
  readonly sessionKey: string;
}

/** What a provider mounts for a run. */
export interface MountOffer {
  /** Changes whenever any file of the bundle would. */
  readonly hash: string;
  /** Relative to the subject's work directory. */
  readonly target: string;
  /** One line for the agent's workspace notes. */
  readonly note?: string;
  /** Added to the turn prompt when the run resumes its session: what changed since the session last saw the mount. */
  readonly resumeNote?: string;
}

export interface RunMountProvider {
  /** `MOUNT_NAME_PATTERN`; unique among the providers. */
  readonly name: string;
  readonly prepare?: ExtensionPrepare;
  /**
   * In the claim's transaction, through its connection: database reads, and writes of the provider's own records.
   * Null mounts nothing.
   */
  forRun(
    conn: DatabaseConnection,
    context: MountContext,
    prepared: unknown,
  ): Promise<MountOffer | null>;
  /** The files of what `forRun` last offered `runId`; null when it offered nothing. */
  bundle(
    conn: DatabaseConnection,
    request: { readonly runId: string },
  ): Promise<MountBundle | null>;
}

export interface RunMountRegistry {
  /** Returns what removes the provider. */
  register(provider: RunMountProvider): () => void;
  get(name: string): RunMountProvider | undefined;
  list(): readonly RunMountProvider[];
}

export function createRunMountRegistry(): RunMountRegistry {
  const providers = new Map<string, RunMountProvider>();
  return {
    register(provider) {
      if (!MOUNT_NAME_PATTERN.test(provider.name))
        throw new Error(`Not a mount name: ${provider.name}`);
      if (providers.has(provider.name))
        throw new Error(`Mount already registered: ${provider.name}`);
      providers.set(provider.name, provider);
      return () => {
        if (providers.get(provider.name) === provider)
          providers.delete(provider.name);
      };
    },
    get: (name) => providers.get(name),
    list: () => [...providers.values()],
  };
}

/** The key of the session a run belongs to: its agent, subject and thread. */
export function sessionKeyOf(run: ClaimContext['run']): string {
  return [run.agentId, run.subject.kind, run.subject.id, run.threadScope].join(
    '\n',
  );
}

/** The mounts of a run, and what a resumed session is told of them. */
export async function mountsFor(
  conn: DatabaseConnection,
  registry: RunMountRegistry | undefined,
  context: MountContext,
  prepared: Prepared,
): Promise<{ mounts: RunMount[]; resumeNotes: string[] }> {
  const mounts: RunMount[] = [];
  const resumeNotes: string[] = [];
  for (const provider of registry?.list() ?? []) {
    const offer = await provider.forRun(
      conn,
      context,
      prepared.get(`mount:${provider.name}`),
    );
    if (!offer) continue;
    mounts.push({
      name: provider.name,
      hash: offer.hash,
      // Relative to the server, as a skill's: the runner resolves it against the address it registered with.
      bundleUrl: routePath(RUNNER_ROUTES.mount, {
        runId: context.claim.run.id,
        name: provider.name,
      }),
      target: offer.target,
      ...(offer.note ? { note: offer.note } : {}),
    });
    if (context.session === 'resume' && offer.resumeNote?.trim())
      resumeNotes.push(offer.resumeNote.trim());
  }
  return { mounts, resumeNotes };
}

/** What a repository access provider is told at claim time. */
export interface RepoAccessContext {
  readonly claim: ClaimContext;
  /** The run's checkouts, as the runner receives them. */
  readonly repos: readonly RepoDir[];
}

export interface RepoAccessProvider {
  /** Unique among the providers. */
  readonly key: string;
  readonly prepare?: ExtensionPrepare;
  /** Outside the transaction: revoke credentials prepared for a claim that was not delivered. Required when prepare mints credentials; idempotent. */
  readonly discard?: (run: Run, prepared: unknown) => Promise<void>;
  /** In the claim's transaction, through its connection: database reads only. Null gives nothing. */
  forRun(
    conn: DatabaseConnection,
    context: RepoAccessContext,
    prepared: unknown,
  ): Promise<RunGit | null>;
}

export interface RepoAccessRegistry {
  /** Returns what removes the provider. */
  register(provider: RepoAccessProvider): () => void;
  list(): readonly RepoAccessProvider[];
}

export function createRepoAccessRegistry(): RepoAccessRegistry {
  const providers = new Map<string, RepoAccessProvider>();
  return {
    register(provider) {
      if (providers.has(provider.key))
        throw new Error(
          `Repository access already registered: ${provider.key}`,
        );
      providers.set(provider.key, provider);
      return () => {
        if (providers.get(provider.key) === provider)
          providers.delete(provider.key);
      };
    },
    list: () => [...providers.values()],
  };
}

/**
 * The run's git, from every provider: the first author given, every trailer and credential in order (one credential
 * per URL, the first).
 */
export async function repoAccessFor(
  conn: DatabaseConnection,
  registry: RepoAccessRegistry | undefined,
  context: RepoAccessContext,
  prepared: Prepared,
): Promise<RunGit | null> {
  if (context.repos.length === 0) return null;
  let author: RunGit['author'];
  const trailers: string[] = [];
  const credentials = new Map<
    string,
    NonNullable<RunGit['credentials']>[number]
  >();
  for (const provider of registry?.list() ?? []) {
    const given = await provider.forRun(
      conn,
      context,
      prepared.get(`repo:${provider.key}`),
    );
    if (!given) continue;
    author ??= given.author;
    for (const trailer of given.trailers ?? [])
      if (!trailers.includes(trailer)) trailers.push(trailer);
    for (const credential of given.credentials ?? [])
      if (!credentials.has(credential.url))
        credentials.set(credential.url, credential);
  }
  if (!author && trailers.length === 0 && credentials.size === 0) return null;
  return {
    ...(author ? { author } : {}),
    ...(trailers.length > 0 ? { trailers } : {}),
    ...(credentials.size > 0 ? { credentials: [...credentials.values()] } : {}),
  };
}

/** What the providers prepared for one run, by `section:<key>`, `mount:<name>` and `repo:<key>`. */
export type Prepared = ReadonlyMap<string, unknown>;

/**
 * Runs every provider's `prepare` for `run`, outside any transaction. A provider whose preparation fails gets
 * undefined, and is told so by its own absent answer; the claim goes on.
 */
export async function prepareExtensions(
  run: Run,
  sections: BriefSectionRegistry | undefined,
  mounts: RunMountRegistry | undefined,
  onError?: (error: unknown) => void,
  repoAccess?: RepoAccessRegistry,
): Promise<Prepared> {
  const prepared = new Map<string, unknown>();
  const hooks: [string, ExtensionPrepare][] = [
    ...(sections?.list() ?? []).flatMap((provider) =>
      provider.prepare
        ? [
            [`section:${provider.key}`, provider.prepare] as [
              string,
              ExtensionPrepare,
            ],
          ]
        : [],
    ),
    ...(mounts?.list() ?? []).flatMap((provider) =>
      provider.prepare
        ? [
            [`mount:${provider.name}`, provider.prepare] as [
              string,
              ExtensionPrepare,
            ],
          ]
        : [],
    ),
    ...(repoAccess?.list() ?? []).flatMap((provider) =>
      provider.prepare
        ? [
            [`repo:${provider.key}`, provider.prepare] as [
              string,
              ExtensionPrepare,
            ],
          ]
        : [],
    ),
  ];
  for (const [key, prepare] of hooks)
    try {
      prepared.set(key, await prepare(run));
    } catch (error) {
      onError?.(error);
    }
  return prepared;
}
