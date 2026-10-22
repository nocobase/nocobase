/**
 * What the runs domain needs from the domain a run works on, and tells it. The runs domain knows a subject only as
 * `{ kind, id }`; the application that owns the kind registers a binding for it (this plugin registers its own
 * `conversation`).
 */
import type {
  RunInput,
  WorkspaceDir,
  WorkspaceCommitEvidence,
  FailureReason,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import type { I18nText } from '../../../shared/i18n.js';
import type { Runner } from '../../../shared/runners.js';
import type { Run } from '../../../shared/runs.js';
import type { Tx } from '../../kernel/tx.js';

/** A command as a brief names it: `` `acme issue get` ``, with a flag named in `flag` after it (`--file`). */
export function commandRef(
  cli: string,
  commandId: string,
  flag?: string,
): string {
  const command = `${cli} ${commandId.replaceAll(':', ' ')}`;
  return flag ? `\`${command} --${flag}\`` : `\`${command}\``;
}

/** What a claim (or a brief preview, without a runner) hands the subject's domain. */
export interface ClaimContext {
  readonly run: Run;
  readonly agent: Agent;
  /** The runner claiming; null for a preview. */
  readonly runner: Runner | null;
  /** The run's input not yet handled, oldest first. */
  readonly inputs: readonly RunInput[];
  /** The application CLI command the agent talks to the application with (`acme`). */
  readonly cli: string;
  /** The application's name in prose (`agents.app.name`, such as `Acme`). */
  readonly appName: string;
}

/**
 * A working directory of the subject, in order (the first is the primary one): a git repository to check out, or a
 * directory already on one runner (`runnerId`), used as it is, which only that runner may take. `scopeId` is where the
 * directory's own variables and default skills are kept (scope `workdir`), when it has any.
 */
export type SubjectDir = WorkspaceDir & {
  readonly scopeId?: string;
  readonly runnerId?: string;
};

/** Where the subject keeps variables and default skills beyond its directories': the group it belongs to, say. */
export interface SubjectScope {
  /** A scope key the application registered (`agents.scopes`). */
  readonly scope: string;
  readonly scopeId: string;
}

/** The subject's part of a run payload; the runs domain adds the rules, the workspace and the skills. */
export interface SubjectAssembly {
  /**
   * `key` names the run's working directory (and a checkout's branch, as the subject's domain chooses); `title` and
   * `url` are what a person sees of the subject; `noun` is what the brief calls it (`ticket`, `document`).
   */
  readonly subject: {
    readonly key: string;
    readonly title?: string;
    readonly url: string;
    readonly noun: string;
  };
  /**
   * The brief's system layer, when the subject's runs follow other rules altogether (a conversation answers in its own
   * text). Absent: the platform's rules for working on a subject, with `guidance`.
   */
  readonly system?: string;
  /**
   * The subject's own lines of the platform's rules: how the agent reports progress and results, and which moves it may
   * make (`rules`, each one line of the rules list), and what it does when it cannot get the environment working
   * (`whenBlocked`, one line of the environment check). Absent: the agent says so in its last message.
   */
  readonly guidance?: {
    readonly rules: readonly string[];
    readonly whenBlocked?: string;
  };
  /** The brief's task layer: why the agent runs now and how to finish. */
  readonly task: string;
  /** The brief's context layer: the subject as it is now. */
  readonly context: string;
  /** Effective inputs selected by the subject for this turn; absent, deliver all claim inputs. */
  readonly inputs?: readonly RunInput[];
  readonly turn: {
    readonly prompt: string;
    readonly previousSummary?: string;
    /**
     * Added to a runner's turn once the claim knows whether the tool's session resumes (`resumed`) or starts fresh
     * (`fresh`): what is new since the agent's last run, say, which only a resumed session can rely on.
     */
    readonly resumed?: string;
    readonly fresh?: string;
  };
  /** Passed to the agent unchanged (`acme run context`). */
  readonly data: Readonly<Record<string, unknown>>;
  readonly dirs: readonly SubjectDir[];
  /**
   * Scopes whose variables and default skills the run also gets, before its directories' (the group it belongs to):
   * variables merge these scopes, in order < directories < agent.
   */
  readonly scopes: readonly SubjectScope[];
  /**
   * The runner's work directory for this run in place of the subject's (`RunWorkspace.key`), such as a coordinating
   * agent's that checks nothing out and so never waits for the subject's lock. Letters, digits, `.`, `_` and `-`.
   */
  readonly workspaceKey?: string;
  /**
   * The run only reads (a review, reading a failed check): the runner gives it a work directory of its own with the
   * same branches checked out and pushes nothing (`RunWorkspace.readOnly`), so it runs alongside the run that writes.
   */
  readonly readOnly?: boolean;
}

export interface ContextProvider {
  /** Read external permissions before the claim transaction; assembly receives this result as its third argument. */
  prepare?(run: Run): Promise<unknown>;
  /**
   * Optional subject policy, checked when queued work is claimed, inside that transaction and before assembly.
   * Return a rejection to cancel this run normally: no payload, token, failure count, or retry is produced. Throwing
   * remains an assembly failure. Also asked before input is appended to or delivered to a working run, where a
   * rejection keeps the input from that run. Not called for previews or reading an already working run's context.
   */
  admit?(
    conn: DatabaseConnection,
    claim: ClaimContext,
    prepared?: unknown,
  ): Promise<{ readonly reason: string; readonly detail?: string } | null>;

  /**
   * Optional input policy: of `claim.inputs`, the ones this turn should act on. Applied, with `admit`, when input is
   * appended to a working run and when it is delivered to one; what it leaves out is marked handled, never delivered.
   * The claim keeps using `SubjectAssembly.inputs`. Absent, every input is delivered.
   */
  selectInputs?(
    conn: DatabaseConnection,
    claim: ClaimContext,
  ): Promise<readonly RunInput[]>;

  /**
   * Called inside the claim's transaction, again for `GET /api/agents/runs/current/context`, and for a brief preview (a run
   * that is not stored, and no runner). Database reads only: no network, no model. Throwing leaves the run queued; a
   * run that fails to assemble three times fails `setupFailed`.
   */
  assemble(
    conn: DatabaseConnection,
    claim: ClaimContext,
    prepared?: unknown,
  ): Promise<SubjectAssembly>;
}

/**
 * A made-up subject of a kind, for "Preview full prompt": what a run on one would be told, without a real one. Every
 * made-up value is marked with `sampleValue`, so nobody mistakes it for data.
 */
export interface SubjectSample {
  /**
   * The assembly of the made-up subject, as `ContextProvider.assemble` would give it for a real one. Database reads only,
   * and never of a subject: the application's own settings at most. `claim.run.subject.id` is `sample`.
   */
  assemble(
    conn: DatabaseConnection,
    claim: ClaimContext,
  ): Promise<SubjectAssembly>;
  /**
   * What wakes the agent on it, as the run's inputs; without it, one signal saying the previewing person gave it the
   * subject.
   */
  inputs?(
    user: { readonly id: string; readonly name: string },
    at: string,
  ): readonly RunInput[];
}

export interface WorkSink {
  /** In the stop request's transaction, once, before any terminal callback. A null actor is a system stop. */
  onCancelRequested?(tx: Tx, run: Run): Promise<void>;
  /**
   * In the transaction that ended the run: completed, cancelled, or failed with no attempt left. A failed run's
   * `failureReason` says why; this is where the subject's domain asks people what next (retry, reassign, cancel).
   */
  onRunFinished?(tx: Tx, run: Run): Promise<void>;
}

/** What the reports know of one subject. */
export interface SubjectFacts {
  /** What a person reads for it (`TKT-12 Retry callbacks`). */
  readonly label: string;
  /** Whether the person asking may see it; runs on a subject they may not see are left out of their reports. */
  readonly visible: boolean;
  /** The group it belongs to, which the reports group and filter by. */
  readonly group: { readonly id: string; readonly name: string } | null;
}

/** Whether the work on subjects of a kind is over (`SubjectBinding.workspaces`). */
export interface SubjectWorkspaces {
  /**
   * The subjects a directory's key names (`TASK-42`), for a directory without a run the application knows: each key
   * with every subject it may name, so an ambiguous key is left alone. A subject that is gone names none.
   */
  resolveKeys?(
    conn: DatabaseConnection,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, readonly string[]>>;
  /**
   * @deprecated No longer read: a directory of a subject whose work is over is removed without commits proving its
   * pushes, and runners are always told none.
   */
  commits?(
    conn: DatabaseConnection,
    subjectIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly WorkspaceCommitEvidence[]>>;
  /**
   * Of `subjectIds` (of the binding's kind, each at most once), the ones whose work is over, such as a ticket that is
   * done or cancelled: runners remove the working directories they keep for them, whatever those still hold. Ids it does not know, or cannot decide, are left out; they are kept. Read inside `conn`, without writing.
   */
  settled(
    conn: DatabaseConnection,
    subjectIds: readonly string[],
  ): Promise<ReadonlySet<string>>;
}

export interface SubjectReports {
  describe(
    conn: DatabaseConnection,
    userId: string,
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, SubjectFacts>>;
}

export interface SubjectBinding {
  readonly kind: string;
  /** Reads current issue visibility outside database transactions for comment-origin work. */
  readonly commentActorMayRead?: (
    subjectId: string,
    userId: string,
  ) => Promise<boolean>;
  /** Current owner assignment key, used only for comment-origin personal runner consent. */
  readonly commentOwnerKey?: (
    conn: DatabaseConnection,
    subjectId: string,
  ) => Promise<string | null>;
  /** Overrides execution identity for selected work. Undefined preserves the caller's identity; a null actorUserId refuses it.
   * Read in the enqueue/claim transaction. Claimed runs keep their identity until they finish.
   */
  readonly actsAs?: (
    conn: DatabaseConnection,
    work: {
      readonly subjectId: string;
      readonly agentId: string;
      readonly causedByRunId?: string;
      /** Server-managed comment execution mode; absent for independent events. */
      readonly commentExecution?: Run['commentExecution'];
      readonly actorUserId?: string;
      readonly inputs: readonly Pick<RunInput, 'actor' | 'payload'>[];
    },
  ) => Promise<
    | { readonly actorUserId: string | null; readonly reason?: string }
    | undefined
  >;
  /**
   * Reads the current responsible inside the request's transaction, before confirming or rejecting. Null means
   * nobody answers for it (including a deleted subject). Applications with mutable responsibility must bind this;
   * without it, requests use their recorded responsible and the application must call `requests.reassign` on changes.
   */
  readonly responsibleUserId?: (
    conn: DatabaseConnection,
    subjectId: string,
  ) => Promise<string | null>;
  /**
   * Runs on this kind belong to the people they involve (who woke the agent, the owner): no one else sees them, or
   * their transcripts and briefs, whatever they may manage (a private conversation).
   */
  readonly private?: boolean;
  /** What a person calls one (`Ticket`); the kind when absent. */
  readonly title?: I18nText;
  /** What a person calls the group one belongs to (`SubjectFacts.group`, a `Project`), for the usage page. */
  readonly groupTitle?: I18nText;
  /** Where the application shows one and its group, `{id}` standing for the id (`/issues/{id}`), for the usage page. */
  readonly path?: string;
  readonly groupPath?: string;
  /** The reasons a run on it starts (`input.payload.trigger`), as the run panel names them. */
  readonly triggers?: Readonly<Record<string, I18nText>>;
  /** Offered as a scenario of "Preview full prompt" on the agent page, rendered on a made-up subject of the kind. */
  readonly preview?: SubjectSample;
  readonly context: ContextProvider;
  readonly sink?: WorkSink;
  /**
   * How long a run on this kind may wait in the queue, counted from its last change or from when its delay passed;
   * past that the sweeper fails it as `queuedExpired`. Without it (or 0), queued runs wait for a runner however long it takes.
   */
  readonly queuedExpiryMs?: number;
  /** Per-run queued withdrawal policy, evaluated under the claim's agent lock by the periodic sweep. Reads only. */
  readonly queuedTimeout?: (
    conn: DatabaseConnection,
    run: Run,
    now: Date,
  ) => Promise<{
    readonly reason: FailureReason;
    readonly detail: string;
  } | null>;
  /** What the reports may say about the subjects; without it, runs on the kind are reported by id only. */
  readonly reports?: SubjectReports;
  /**
   * Whether the work on a subject is over, so runners may remove the working directories they keep for it. Without
   * it, no subject of the kind counts as over and runners keep their directories under their own retention rules.
   */
  readonly workspaces?: SubjectWorkspaces;
}

export interface SubjectRegistry {
  /** Returns what removes the binding. A kind has one binding. */
  register(binding: SubjectBinding): () => void;
  get(kind: string): SubjectBinding | undefined;
  /** Every binding, in the order they were registered. */
  list(): SubjectBinding[];
}

export function createSubjectRegistry(): SubjectRegistry {
  const bindings = new Map<string, SubjectBinding>();
  return {
    register(binding) {
      if (bindings.has(binding.kind))
        throw new Error(`Subject kind already registered: ${binding.kind}`);
      bindings.set(binding.kind, binding);
      return () => {
        if (bindings.get(binding.kind) === binding)
          bindings.delete(binding.kind);
      };
    },
    get: (kind) => bindings.get(kind),
    list: () => [...bindings.values()],
  };
}
