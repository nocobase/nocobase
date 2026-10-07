/**
 * What the runs domain needs from the domain a run works on, and tells it. The runs domain knows a subject only as
 * `{ kind, id }`; the application that owns the kind registers a binding for it (this plugin registers its own
 * `conversation`).
 */
import type { RunInput, WorkspaceDir } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Agent,
  AgentType,
  OnlineModelEntry,
} from '../../../shared/agents.js';
import type { I18nText } from '../../../shared/i18n.js';
import type { Runner } from '../../../shared/runners.js';
import type { Run } from '../../../shared/runs.js';
import type { Tx } from '../../kernel/tx.js';

/**
 * How the agent reaches the application's commands: `cli` for a runner agent (it types `acme issue get PM-12` in its
 * terminal), `tools` for an online agent (it runs the same command in its sandboxed shell, the `bash` tool). Both name
 * commands the same way; what differs is where files go (a working directory, or `/tmp`).
 */
export type CommandDialect = 'cli' | 'tools';

/** The dialect a run of `agent` speaks. */
export function dialectOf(agent: Pick<Agent, 'type'>): CommandDialect {
  return agent.type === 'online' ? 'tools' : 'cli';
}

/**
 * A command as a brief names it: `` `acme issue get` ``, with a flag named in `flag` after it (`--file`). Both
 * dialects run the CLI; `dialect` stays for the subject's own wording.
 */
export function commandRef(
  _dialect: CommandDialect,
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
  /** The runner claiming; null for a preview, and for an online run (which the application runs itself). */
  readonly runner: Runner | null;
  /** The run's input not yet handled, oldest first. */
  readonly inputs: readonly RunInput[];
  /** The application CLI command the agent talks to the application with (`acme`). */
  readonly cli: string;
  /** The application's name in prose (`agents.app.name`, such as `Acme`). */
  readonly appName: string;
  /** How the agent reaches the commands: name them with `commandRef(claim.dialect, claim.cli, id)`. */
  readonly dialect: CommandDialect;
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
  readonly turn: {
    readonly prompt: string;
    readonly previousSummary?: string;
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
   * For an online run: the entry of the agent's list the subject asks for (a conversation's choice). Ignored when the
   * agent does not list it; absent, the run uses the agent's first entry.
   */
  readonly model?: OnlineModelEntry;
}

export interface ContextProvider {
  /**
   * Called inside the claim's transaction, again for `GET /api/agents/runs/current/context`, and for a brief preview (a run
   * that is not stored, and no runner). Database reads only: no network, no model. Throwing leaves the run queued; a
   * run that fails to assemble three times fails `setupFailed`.
   */
  assemble(
    conn: DatabaseConnection,
    claim: ClaimContext,
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

export interface SubjectReports {
  describe(
    conn: DatabaseConnection,
    userId: string,
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, SubjectFacts>>;
}

export interface SubjectBinding {
  readonly kind: string;
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
  /** What the reports may say about the subjects; without it, runs on the kind are reported by id only. */
  readonly reports?: SubjectReports;
  /**
   * The agent types that may run on this kind; `['runner']` when absent. An online agent has no working directory, so a
   * kind offers `online` only when its runs need none (its assembly has no `dirs`); enqueueing a run of another type is
   * refused (`AGENT_TYPE_NOT_ALLOWED`).
   */
  readonly agentTypes?: readonly AgentType[];
}

/** Whether runs of `binding`'s kind may be given to an agent of `type`. */
export function takesType(
  binding: Pick<SubjectBinding, 'agentTypes'> | undefined,
  type: AgentType,
): boolean {
  return (binding?.agentTypes ?? ['runner']).includes(type);
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
