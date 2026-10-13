/**
 * Agent sessions: a person's conversations with coding agents on their own computers, and the bridges that run them.
 *
 * A person reaches only their own computers and sessions; anyone else's answers as not found. Commands for a computer
 * wait in `agentSessionCommands` until its bridge polls. A poll waits up to `POLL_WAIT_MS` for one, woken at once by a
 * command on this instance and within a second by one on another. Each report of a bridge is appended to the
 * session's transcript in one transaction, and the owner's pages hear of it on the realtime topic.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  BRIDGE_PROTOCOL_VERSION,
  DISCOVERY_TIMEOUT_MS,
  type DiscoveredChoices,
  POLL_WAIT_MS,
  type BridgeCommand,
  type FolderListing,
  type PollRequest,
  type PollResponse,
  type PromptContent,
  type RegisterRequest,
  type RegisterResponse,
  type ReplyRequest,
  type ReportRequest,
  type ReportResponse,
  type SessionEvent,
  type SessionState,
  type SessionTarget,
} from '@nocobase/acp-bridge/protocol';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { z } from 'zod';

import type {
  AgentSessionsChange,
  Computer,
  Reference,
  Session,
  SessionLink,
  SessionProject,
  TranscriptEvent,
} from '../shared/api.js';
import { AgentSessionsError } from './errors.js';
import {
  defineSessionTool,
  TOOLS_PATH,
  type SessionTool,
  type ToolHost,
  type ToolTokens,
} from './tools.js';
import {
  allowedFolders,
  appendEvents,
  computers,
  computerView,
  enqueue,
  isOnline,
  images,
  links,
  lockSession,
  readEvents,
  redactor,
  sessions,
  sessionView,
  takeCommands,
  type ComputerRecord,
  type LinkRecord,
  type SessionRecord,
} from './store.js';
import type { ImageStorage } from './images.js';
import {
  NOTICE_DELAY_MS,
  noticeOf,
  type SessionNotices,
  type SessionNoticeType,
} from './notices.js';
import { workName, workNote, workSnapshot, type WorkItem } from './work.js';

/** Who reads: a person, and the language the answer is for. */
export interface Viewer {
  readonly userId: string;
  readonly locale?: string | undefined;
}

/** What a link kind's resolver says of one linked record. */
export type LinkView = Omit<SessionLink, 'kind' | 'refId' | 'decidedAt'>;

/** How something an application ties to sessions stands for a viewer, and how its work starts. */
export interface LinkResolver {
  /** The view of each of `refIds` the viewer may see; the others are left out. */
  resolve(
    refIds: readonly string[],
    viewer: Viewer,
  ): Promise<ReadonlyMap<string, LinkView>>;
  /** Starts the work on `refIds` as the viewer, when the application lets sessions start it. */
  start?(refIds: readonly string[], viewer: Viewer): Promise<void>;
  /**
   * What the agent should know of how each of `refIds` is going, as JSON, for the session's `list_session_work` tool:
   * who works on it, what it waits for, and the like.
   */
  progress?(
    refIds: readonly string[],
    viewer: Viewer,
  ): Promise<ReadonlyMap<string, unknown>>;
  /**
   * The records the viewer may mention in a message with `#` whose key or title contains `query`, best first, in
   * `projectId` when given.
   */
  search?(
    query: string,
    viewer: Viewer,
    options: { readonly projectId: string | null; readonly limit: number },
  ): Promise<readonly (LinkView & { readonly refId: string })[]>;
}

/** The projects sessions may work for, as the application keeps them. */
export interface ProjectSource {
  /** The projects the viewer may see, in the order to offer them. */
  list(viewer: Viewer): Promise<readonly SessionProject[]>;
}

/**
 * Where a bridge's replies wait for the request that asked for them, such as the application's cache. Requests and
 * replies may reach different instances, so several instances need a store they share.
 */
export interface ReplyStore {
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  take<T>(key: string): Promise<T | undefined>;
}

/** Something a person mentions in a message, such as an issue. */
export interface Mention {
  readonly kind: string;
  readonly refId: string;
}

export interface AgentSessionsServiceOptions {
  readonly database: DatabaseManager;
  /** Signs the tokens agents call the application's tools with; without it, sessions get no tools. */
  readonly toolTokens?: ToolTokens;
  /** Tells the owner's pages what changed. */
  readonly publish?: (userId: string, change: AgentSessionsChange) => void;
  /** Where bridges' replies wait; this instance's memory by default. */
  readonly replies?: ReplyStore;
  /** Where the images people send are kept; without it, the transcript keeps them as sent. */
  readonly images?: ImageStorage;
  /** Runs `task` after `delayMs`, as owners are told of what they did not see (`notices.ts`); a timer by default. */
  readonly schedule?: (task: () => Promise<void>, delayMs: number) => void;
  readonly now?: () => number;
}

export interface SessionPage {
  readonly sessions: readonly Session[];
  readonly nextPageToken?: string;
}

/** How often a waiting poll looks for commands another instance queued. */
const POLL_CHECK_MS = 1_000;
/** How long a request waits for the bridge's reply, and how often it looks for one another instance took. */
const REPLY_WAIT_MS = 10_000;
const REPLY_CHECK_MS = 250;
/** How many records a `#` search offers. */
const MENTION_LIMIT = 10;

export class AgentSessionsService {
  readonly #database: DatabaseManager;
  readonly #publish: (userId: string, change: AgentSessionsChange) => void;
  readonly #now: () => number;
  readonly #waiters = new Map<string, Set<() => void>>();
  readonly #linkKinds = new Map<string, LinkResolver>();
  readonly #tools: SessionTool[] = [];
  #toolServer = 'app';
  readonly #toolTokens: ToolTokens | undefined;
  #projects: ProjectSource | undefined;
  #instructions: string | undefined;
  #notices: SessionNotices | undefined;
  readonly #schedule: (task: () => Promise<void>, delayMs: number) => void;
  readonly #images: ImageStorage | undefined;
  readonly #replies: ReplyStore;
  readonly #replyWaiters = new Map<string, () => void>();

  constructor(options: AgentSessionsServiceOptions) {
    this.#database = options.database;
    this.#toolTokens = options.toolTokens;
    this.#replies = options.replies ?? memoryReplies();
    this.#images = options.images;
    this.#schedule = options.schedule ?? later;
    this.#publish = options.publish ?? (() => undefined);
    this.#now = options.now ?? Date.now;
    this.#tools.push(this.#workTool());
  }

  /** Lets sessions show, and start, what the application ties to them under `kind`. */
  registerLinkKind(kind: string, resolver: LinkResolver): void {
    this.#linkKinds.set(kind, resolver);
  }

  /** Tells owners of what happens in their sessions while they are not looking, and settles it (`notices.ts`). */
  registerNotices(notices: SessionNotices): void {
    this.#notices = notices;
  }

  /**
   * How the application wants the agents in sessions to work, such as what they do themselves and what they hand on,
   * in English: each session's agent is told it in its first message, again whenever it changes, and when its session
   * opens.
   */
  registerInstructions(text: string): void {
    this.#instructions = text.trim()
      ? `How to work in this session:\n${text.trim()}`
      : undefined;
  }

  /** Lets a session work for one of the application's projects, which its tools then default to. */
  registerProjects(source: ProjectSource): void {
    this.#projects = source;
  }

  /**
   * Offers `tools` to the agents in sessions as the MCP server `serverName`, such as `studio`. Sessions opened from
   * then on get them.
   */
  registerTools(serverName: string, tools: readonly SessionTool[]): void {
    this.#toolServer = serverName;
    this.#tools.push(...tools);
  }

  /** The tools' side of the service, for the MCP endpoint (`tools.ts`). */
  get toolHost(): ToolHost {
    return {
      serverName: this.#toolServer,
      tools: () => this.#tools,
      caller: async (token) => {
        const sessionId = this.#toolTokens?.verify(token);
        const session = sessionId
          ? await sessions(this.#conn()).findOne({ filter: { id: sessionId } })
          : undefined;
        return session && !session.archivedAt
          ? {
              userId: session.userId,
              sessionId: session.id,
              projectId: session.projectId ?? null,
            }
          : undefined;
      },
      instructions: async (caller) => {
        const viewer = await this.#ownerOf(caller);
        const project = caller.projectId
          ? (await this.listProjects(viewer)).find(
              (candidate) => candidate.id === caller.projectId,
            )
          : undefined;
        const work = workNote(await this.#work(viewer, caller.sessionId), null);
        const lines = [
          this.#instructions,
          project &&
            `This session works for the project "${project.name}" (id ${project.id}). File and look for work there unless the person names another project.`,
          work && `${work}\nCall \`list_session_work\` for how each is going.`,
        ].filter(Boolean);
        return lines.length > 0 ? lines.join('\n\n') : undefined;
      },
      link: (sessionId, kind, refId) => this.link(sessionId, kind, refId),
    };
  }

  /** Ties `refId` to the session, once, and tells its transcript. */
  async link(sessionId: string, kind: string, refId: string): Promise<void> {
    const changed = await this.#transaction(async (conn, now) => {
      const session = await lockSession(conn, sessionId, now);
      if (!session) throw new AgentSessionsError('sessionNotFound');
      if (await links(conn).findOne({ filter: { sessionId, kind, refId } }))
        return undefined;
      const appended = await this.#append(
        conn,
        session,
        [{ kind: 'link', at: now, linkKind: kind, refId }],
        now,
        {},
      );
      await links(conn).createOne({
        values: {
          id: randomUUID(),
          sessionId,
          kind,
          refId,
          seq: appended.lastSeq,
          decidedAt: null,
          createdAt: now,
        },
      });
      return appended;
    });
    if (changed) this.#changed(changed);
  }

  // People's computers.

  async listComputers(userId: string): Promise<Computer[]> {
    const rows = await computers(this.#conn()).findMany({
      filter: { userId },
      sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
    });
    return rows.map((row) => computerView(row, this.#now()));
  }

  async removeComputer(userId: string, computerId: string): Promise<void> {
    const { deletedCount } = await computers(this.#conn()).deleteMany({
      filter: { id: computerId, userId },
    });
    if (deletedCount !== 1) throw new AgentSessionsError('computerNotFound');
    this.#wake(computerId);
    this.#publish(userId, { kind: 'computers' });
  }

  /**
   * Sets the directories sessions on the computer may work in, each under what its bridge allows (`roots`); null lets
   * them work anywhere the bridge allows.
   */
  async updateComputer(
    userId: string,
    computerId: string,
    input: { readonly folders: readonly string[] | null },
  ): Promise<Computer> {
    const computer = await this.#computer(userId, computerId);
    const paths = pathsOf(computer);
    if (input.folders?.some((folder) => !paths.isAbsolute(folder)))
      throw new AgentSessionsError('directoryNotAllowed', 'folders');
    const folders =
      input.folders === null
        ? null
        : [...new Set(input.folders.map((folder) => paths.resolve(folder)))];
    if (folders?.some((folder) => !within(paths, computer.roots, folder)))
      throw new AgentSessionsError('directoryNotAllowed', 'folders');
    await computers(this.#conn()).updateMany({
      filter: { id: computer.id },
      values: { folders, updatedAt: this.#iso() },
    });
    this.#publish(userId, { kind: 'computers' });
    return computerView({ ...computer, folders }, this.#now());
  }

  /** The folders in `dir` on the computer, its owner's home directory by default, as its bridge lists them. */
  async listFolders(
    userId: string,
    computerId: string,
    dir: string | undefined,
  ): Promise<FolderListing> {
    const computer = await this.#computer(userId, computerId);
    if (!isOnline(computer, this.#now()))
      throw new AgentSessionsError('computerOffline');
    const listed = dir ?? computer.home ?? computer.roots[0];
    if (!listed || !within(pathsOf(computer), computer.roots, listed))
      throw new AgentSessionsError('directoryNotAllowed', 'path');
    const requestId = randomUUID();
    await enqueue(
      this.#conn(),
      computer.id,
      { type: 'listFolders', requestId, path: listed },
      this.#iso(),
    );
    this.#wake(computer.id);
    const reply = await this.#awaitReply(`${computer.id}:${requestId}`);
    if (!reply.listing)
      throw new AgentSessionsError('folderUnavailable', 'path');
    return reply.listing;
  }

  // The bridge.

  /** Request-scoped discovery uses no Studio session or persisted choice cache. */
  async discoverChoices(
    userId: string,
    computerId: string,
    input: {
      readonly agentId: string;
      readonly cwd: string;
      readonly settings: Readonly<Record<string, string>>;
    },
  ): Promise<DiscoveredChoices> {
    const computer = await this.#computer(userId, computerId);
    if (!isOnline(computer, this.#now()))
      throw new AgentSessionsError('computerOffline');
    if (
      !computer.agents.some(
        (agent) => agent.id === input.agentId && !agent.problem,
      )
    )
      throw new AgentSessionsError('agentUnavailable', 'agentId');
    const paths = pathsOf(computer);
    if (
      !paths.isAbsolute(input.cwd) ||
      !within(paths, allowedFolders(computer), input.cwd)
    )
      throw new AgentSessionsError('directoryNotAllowed', 'cwd');
    const requestId = randomUUID();
    await enqueue(
      this.#conn(),
      computer.id,
      {
        type: 'discoverChoices',
        requestId,
        agentId: input.agentId,
        cwd: paths.resolve(input.cwd),
        settings: input.settings,
      },
      this.#iso(),
    );
    this.#wake(computer.id);
    const reply = await this.#awaitReply(
      `${computer.id}:${requestId}`,
      DISCOVERY_TIMEOUT_MS + 10_000,
    );
    if (!reply.discovery || reply.error)
      throw new AgentSessionsError(
        'discoveryFailed',
        undefined,
        reply.error ? redactor.text(reply.error) : undefined,
      );
    return reply.discovery;
  }

  /** Takes the bridge's reply to a command that asked for one, for the request waiting on it. */
  async reply(userId: string, request: ReplyRequest): Promise<void> {
    const computer = await this.#computer(userId, request.computerId);
    const key = `${computer.id}:${request.requestId}`;
    await this.#replies.set(key, request, (DISCOVERY_TIMEOUT_MS + 10_000) * 2);
    this.#replyWaiters.get(key)?.();
  }

  /**
   * Records the computer, as new or as the one `computerId` names. Registered by its owner signed in, it gets a new key,
   * which revokes the one before; registered with its key (`keyed`), it keeps it. A bridge registers when it starts, so
   * when another run of the bridge registers, whatever its sessions were doing has stopped: their turns are over and
   * nothing waits for permission.
   */
  async register(
    userId: string,
    request: RegisterRequest,
    keyed = false,
  ): Promise<RegisterResponse> {
    if (request.protocol !== BRIDGE_PROTOCOL_VERSION)
      throw new AgentSessionsError('upgradeRequired');
    const now = this.#iso();
    const key = keyed
      ? undefined
      : `nbc_${randomBytes(32).toString('base64url')}`;
    const values = {
      ...request.computer,
      home: request.computer.home ?? null,
      bridgeStartedAt: request.bridgeStartedAt,
      ...(key ? { keyHash: keyHash(key) } : {}),
      lastSeenAt: now,
      updatedAt: now,
    };
    const known = request.computerId
      ? await computers(this.#conn()).findOne({
          filter: { id: request.computerId, userId },
        })
      : undefined;
    if (keyed && !known) throw new AgentSessionsError('computerNotFound');
    const computerId = known?.id ?? randomUUID();
    if (known)
      await computers(this.#conn()).updateMany({
        filter: { id: computerId },
        values,
      });
    else
      await computers(this.#conn()).createOne({
        values: {
          id: computerId,
          userId,
          ...values,
          choices: {},
          createdAt: now,
        },
      });

    const restarted = known?.bridgeStartedAt !== request.bridgeStartedAt;
    const interrupted = !restarted
      ? []
      : await sessions(this.#conn()).findMany({
          filter: (f) =>
            f.and([
              f.string('computerId').eq(computerId),
              f.or([
                f.boolean('running').isTrue(),
                f.number('pendingPermissions').gt(0),
              ]),
            ]),
        });
    for (const session of interrupted) {
      const changed = await this.#transaction(async (conn, at) => {
        const locked = await lockSession(conn, session.id, at);
        if (!locked) return undefined;
        const notice: SessionEvent = {
          kind: 'notice',
          at,
          level: 'warning',
          message:
            'The bridge on the computer restarted, so the agent stopped what it was doing.',
        };
        return this.#append(conn, locked, [notice], at, {
          running: false,
          pendingPermissions: 0,
        });
      });
      if (changed) this.#changed(changed);
    }
    this.#publish(userId, { kind: 'computers' });
    return { computerId, ...(key ? { key } : {}) };
  }

  /** The computer whose bridge holds `key`, or undefined for a key no computer has (any more). */
  async computerOfKey(
    key: string,
  ): Promise<{ readonly id: string; readonly userId: string } | undefined> {
    const computer = await computers(this.#conn()).findOne({
      filter: { keyHash: keyHash(key) },
    });
    return computer && { id: computer.id, userId: computer.userId };
  }

  /** Answers with the computer's waiting commands, waiting for some when asked to. */
  async poll(
    userId: string,
    request: PollRequest,
    signal: AbortSignal,
  ): Promise<PollResponse> {
    const computer = await this.#computer(userId, request.computerId);
    const wasOnline = isOnline(computer, this.#now());
    await computers(this.#conn()).updateMany({
      filter: { id: computer.id },
      values: { lastSeenAt: this.#iso() },
    });
    if (!wasOnline) this.#publish(userId, { kind: 'computers' });
    const deadline = this.#now() + (request.wait ? POLL_WAIT_MS : 0);
    for (;;) {
      const commands = await takeCommands(this.#conn(), computer.id);
      if (commands.length > 0 || signal.aborted || this.#now() >= deadline)
        return { commands };
      await this.#sleep(
        computer.id,
        Math.min(POLL_CHECK_MS, deadline - this.#now()),
        signal,
      );
      if (
        !(await computers(this.#conn()).findOne({
          filter: { id: computer.id },
        }))
      ) {
        throw new AgentSessionsError('computerNotFound');
      }
    }
  }

  /** Appends what the bridge observed to the session; a report already taken is ignored. */
  async report(
    userId: string,
    request: ReportRequest,
  ): Promise<ReportResponse> {
    const computer = await this.#computer(userId, request.computerId);
    const changed = await this.#transaction(async (conn, now) => {
      const session = await lockSession(conn, request.sessionId, now);
      if (
        !session ||
        session.userId !== userId ||
        session.computerId !== computer.id
      ) {
        throw new AgentSessionsError('sessionNotFound');
      }
      const repeated =
        session.bridgeStartedAt === request.bridgeStartedAt &&
        request.batch <= Number(session.reportedBatch);
      if (repeated)
        return {
          session,
          lastSeq: Number(session.lastSeq),
          open: session.archivedAt === null,
          added: [],
        };
      let running = Boolean(session.running);
      let pending = Number(session.pendingPermissions);
      for (const event of request.events) {
        if (event.kind === 'turnStarted') running = true;
        if (event.kind === 'turnEnded') [running, pending] = [false, 0];
        if (event.kind === 'permissionRequested') pending += 1;
        if (event.kind === 'permissionResolved')
          pending = Math.max(0, pending - 1);
      }
      const result = await this.#append(conn, session, request.events, now, {
        running,
        pendingPermissions: pending,
        reportedBatch: request.batch,
        bridgeStartedAt: request.bridgeStartedAt,
        ...(request.state
          ? {
              state: redactor.value(request.state),
              acpSessionId: request.state.acpSessionId,
              settings: Object.fromEntries(
                request.state.choices.map((choice) => [
                  choice.id,
                  choice.currentValue,
                ]),
              ),
            }
          : {}),
      });
      return {
        ...result,
        open: session.archivedAt === null,
        added: request.events,
      };
    });
    this.#changed(changed);
    this.#watch(changed.session, changed.added, changed.lastSeq);
    if (request.state) {
      await this.#learnOffer(computer, changed.session.agentId, request.state);
    }
    return { open: changed.open };
  }

  // Sessions.

  async listSessions(
    viewer: Viewer,
    query: {
      readonly archived: boolean;
      readonly pageSize: number;
      readonly pageToken?: string | undefined;
    },
  ): Promise<SessionPage> {
    const rows = await sessions(this.#conn()).findMany({
      filter: (f) =>
        f.and([
          f.string('userId').eq(viewer.userId),
          query.archived
            ? f.date('archivedAt').notEmpty()
            : f.date('archivedAt').empty(),
        ]),
      sort: (sort) => [
        sort.field('lastActivityAt').desc(),
        sort.field('id').desc(),
      ],
      limit: query.pageSize + 1,
      ...(query.pageToken === undefined
        ? {}
        : { cursor: parsePageToken(query.pageToken) }),
    });
    const page = rows.slice(0, query.pageSize);
    const last = page.at(-1);
    return {
      sessions: await this.#views(viewer, page),
      ...(rows.length > query.pageSize && last
        ? { nextPageToken: pageToken(last) }
        : {}),
    };
  }

  async getSession(viewer: Viewer, sessionId: string): Promise<Session> {
    return (
      await this.#views(viewer, [await this.#session(viewer.userId, sessionId)])
    )[0];
  }

  async createSession(
    viewer: Viewer,
    input: {
      readonly computerId: string;
      readonly agentId: string;
      readonly cwd: string;
      readonly content: readonly PromptContent[];
      /** Explicit settings validated authoritatively by the agent before the first prompt. */
      readonly settings?: Readonly<Record<string, string>> | undefined;
      /** The project the session works for, from `listProjects`. */
      readonly projectId?: string | null | undefined;
      /** What the first message mentions with `#`. */
      readonly mentions?: readonly Mention[] | undefined;
    },
  ): Promise<Session> {
    const { userId } = viewer;
    const computer = await this.#computer(
      userId,
      input.computerId,
      'computerId',
    );
    if (!isOnline(computer, this.#now()))
      throw new AgentSessionsError('computerOffline');
    const agent = computer.agents.find(
      (candidate) => candidate.id === input.agentId,
    );
    if (!agent || agent.problem)
      throw new AgentSessionsError('agentUnavailable', 'agentId');
    if (!within(pathsOf(computer), allowedFolders(computer), input.cwd))
      throw new AgentSessionsError('directoryNotAllowed', 'cwd');
    const projectId = input.projectId ?? null;
    if (
      projectId !== null &&
      !(await this.listProjects(viewer)).some(
        (project) => project.id === projectId,
      )
    )
      throw new AgentSessionsError('projectNotFound', 'projectId');
    const mentioned = await this.#mentioned(viewer, input.mentions ?? []);
    const settings = input.settings ?? {};
    const now = this.#iso();
    const sessionId = randomUUID();
    await sessions(this.#conn()).createOne({
      values: {
        id: sessionId,
        userId,
        computerId: computer.id,
        agentId: agent.id,
        projectId,
        cwd: pathsOf(computer).resolve(input.cwd),
        title: null,
        firstMessage: redactor.text(firstLine(input.content)),
        acpSessionId: null,
        state: null,
        settings,
        toldWork: null,
        toldInstructions: null,
        seenSeq: 0,
        noticedSeq: null,
        locale: viewer.locale ?? null,
        running: false,
        pendingPermissions: 0,
        lastSeq: 0,
        reportedBatch: 0,
        bridgeStartedAt: null,
        archivedAt: null,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    await this.#send(viewer, sessionId, input.content, mentioned);
    return this.getSession(viewer, sessionId);
  }

  async updateSession(
    viewer: Viewer,
    sessionId: string,
    input: {
      readonly title?: string | null | undefined;
      readonly archived?: boolean | undefined;
    },
  ): Promise<Session> {
    const { userId } = viewer;
    const session = await this.#session(userId, sessionId);
    const now = this.#iso();
    const title =
      input.title === undefined ? undefined : input.title?.trim() || null;
    const archive =
      input.archived !== undefined &&
      input.archived !== (session.archivedAt !== null);
    await sessions(this.#conn()).updateMany({
      filter: { id: sessionId },
      values: {
        ...(title === undefined ? {} : { title }),
        ...(archive ? { archivedAt: input.archived ? now : null } : {}),
        ...(archive && input.archived ? { noticedSeq: null } : {}),
        updatedAt: now,
      },
    });
    if (archive && input.archived) {
      await this.#command(session, { type: 'close', sessionId }, false);
      if (session.noticedSeq !== null)
        await this.#notices?.settle({ userId, sessionId, outcome: 'archived' });
    }
    this.#publish(userId, {
      kind: 'session',
      sessionId,
      lastSeq: Number(session.lastSeq),
    });
    return this.getSession(viewer, sessionId);
  }

  /** Records that the owner saw the session up to event `seq`; seeing what they were told of settles it. */
  async markSeen(
    userId: string,
    sessionId: string,
    seq: number,
  ): Promise<void> {
    const session = await this.#session(userId, sessionId);
    const seen = Math.min(seq, Number(session.lastSeq));
    if (seen <= Number(session.seenSeq)) return;
    const settles =
      session.noticedSeq !== null && seen >= Number(session.noticedSeq);
    await sessions(this.#conn()).updateMany({
      filter: (f) =>
        f.and([f.string('id').eq(sessionId), f.number('seenSeq').lt(seen)]),
      values: { seenSeq: seen, ...(settles ? { noticedSeq: null } : {}) },
    });
    if (settles)
      await this.#notices?.settle({ userId, sessionId, outcome: 'seen' });
  }

  /** An image sent in the session, for its owner: its bytes and type. */
  async image(
    userId: string,
    sessionId: string,
    file: string,
  ): Promise<{ readonly bytes: Uint8Array; readonly mimeType: string }> {
    await this.#session(userId, sessionId);
    const record =
      this.#images && UUID.test(file)
        ? await images(this.#conn()).findOne({
            filter: { id: file, sessionId },
          })
        : undefined;
    if (!this.#images || !record) throw new AgentSessionsError('imageNotFound');
    return {
      bytes: await this.#images.bytes(record),
      mimeType: record.mimeType,
    };
  }

  async listEvents(
    userId: string,
    sessionId: string,
    query: { readonly after: number; readonly limit: number },
  ): Promise<TranscriptEvent[]> {
    await this.#session(userId, sessionId);
    return readEvents(this.#conn(), sessionId, query.after, query.limit);
  }

  /**
   * Sends the person's message; the agent answers it after any turn already running. What it mentions with `#` is tied
   * to the session as decided, so the session shows it without asking to start it, and the agent is told what it is.
   */
  async prompt(
    viewer: Viewer,
    sessionId: string,
    content: readonly PromptContent[],
    mentions: readonly Mention[] = [],
  ): Promise<TranscriptEvent> {
    await this.#writable(viewer.userId, sessionId);
    return this.#send(
      viewer,
      sessionId,
      content,
      await this.#mentioned(viewer, mentions),
    );
  }

  /** The projects a session may work for, as the viewer sees them; none when the application has no projects. */
  async listProjects(viewer: Viewer): Promise<readonly SessionProject[]> {
    return this.#projects ? this.#projects.list(viewer) : [];
  }

  /** What the viewer may mention with `#` whose key or title contains `query`, in `projectId` first when given. */
  async searchMentions(
    viewer: Viewer,
    query: string,
    projectId: string | null,
  ): Promise<Reference[]> {
    const found = await Promise.all(
      [...this.#linkKinds].map(async ([kind, resolver]) =>
        resolver.search
          ? (
              await resolver.search(query, viewer, {
                projectId,
                limit: MENTION_LIMIT,
              })
            ).map((view): Reference => ({
              kind,
              refId: view.refId,
              key: view.key,
              title: view.title,
              group: view.group,
              status: view.status,
            }))
          : [],
      ),
    );
    return found.flat().slice(0, MENTION_LIMIT);
  }

  async #send(
    viewer: Viewer,
    sessionId: string,
    content: readonly PromptContent[],
    mentioned: readonly (Mention & LinkView)[],
  ): Promise<TranscriptEvent> {
    const session = await this.#session(viewer.userId, sessionId);
    const promptId = randomUUID();
    const work = await this.#work(viewer, sessionId, mentioned);
    const note = workNote(work, session.toldWork);
    const toldInstructions =
      this.#instructions && instructionsHash(this.#instructions);
    const instructions =
      toldInstructions !== session.toldInstructions
        ? this.#instructions
        : undefined;
    // The agent reads the application's instructions until it was told them, what the message mentions, and the
    // session's work when it changed since it was last told; the transcript keeps the message as written.
    const told: readonly PromptContent[] = [
      ...content,
      ...(instructions ? [{ type: 'text' as const, text: instructions }] : []),
      ...(mentioned.length > 0
        ? [
            {
              type: 'text' as const,
              text: `Mentioned:\n${mentioned.map((item) => `- ${workName(item)}${item.status ? ` (${item.status.label})` : ''}`).join('\n')}`,
            },
          ]
        : []),
      ...(note ? [{ type: 'text' as const, text: note }] : []),
    ];
    const kept = this.#images
      ? await this.#images.keep(
          { id: sessionId, userId: session.userId },
          content,
        )
      : content;
    const changed = await this.#transaction(async (conn, now) => {
      const locked = (await lockSession(conn, sessionId, now))!;
      const result = await this.#append(
        conn,
        locked,
        [{ kind: 'prompt', at: now, promptId, content: kept }],
        now,
        {
          ...(note ? { toldWork: workSnapshot(work) } : {}),
          ...(instructions ? { toldInstructions } : {}),
          ...(viewer.locale ? { locale: viewer.locale } : {}),
        },
      );
      for (const item of mentioned) {
        const filter = { sessionId, kind: item.kind, refId: item.refId };
        if (await links(conn).findOne({ filter })) continue;
        await links(conn).createOne({
          values: {
            id: randomUUID(),
            ...filter,
            seq: result.lastSeq,
            decidedAt: now,
            createdAt: now,
          },
        });
      }
      await enqueue(
        conn,
        session.computerId,
        {
          type: 'prompt',
          session: this.#target(locked),
          promptId,
          content: told,
        },
        now,
      );
      return result;
    });
    this.#wake(session.computerId);
    this.#changed(changed);
    return {
      kind: 'prompt',
      at: changed.session.lastActivityAt,
      promptId,
      content,
      seq: changed.lastSeq,
    };
  }

  /** Stops the running turn and drops the messages waiting behind it. */
  async cancel(userId: string, sessionId: string): Promise<void> {
    const session = await this.#writable(userId, sessionId);
    await this.#command(session, {
      type: 'cancel',
      session: this.#target(session),
    });
  }

  async answer(
    userId: string,
    sessionId: string,
    input: { readonly requestId: string; readonly optionId: string | null },
  ): Promise<void> {
    const session = await this.#writable(userId, sessionId);
    const changed = await this.#transaction(async (conn, now) => {
      const locked = (await lockSession(conn, sessionId, now))!;
      if (!(await isWaiting(conn, sessionId, input.requestId))) {
        throw new AgentSessionsError('permissionRequestNotFound');
      }
      const resolved: SessionEvent = {
        kind: 'permissionResolved',
        at: now,
        requestId: input.requestId,
        optionId: input.optionId,
        reason: 'answered',
      };
      const result = await this.#append(conn, locked, [resolved], now, {
        pendingPermissions: Math.max(0, Number(locked.pendingPermissions) - 1),
      });
      await enqueue(
        conn,
        session.computerId,
        { type: 'permission', session: this.#target(locked), ...input },
        now,
      );
      return result;
    });
    this.#wake(session.computerId);
    this.#changed(changed);
  }

  /** Changes one of the session's choices, such as its mode or model, and keeps it for later reopenings. */
  async choose(
    viewer: Viewer,
    sessionId: string,
    input: { readonly choiceId: string; readonly value: string },
  ): Promise<Session> {
    const session = await this.#writable(viewer.userId, sessionId);
    const choice = session.state?.choices.find(
      (candidate) => candidate.id === input.choiceId,
    );
    if (!choice?.options.some((option) => option.value === input.value)) {
      throw new AgentSessionsError('choiceNotFound', 'value');
    }
    // Keep acknowledged settings until the bridge reports the complete resulting configuration.
    await this.#command(session, {
      type: 'choose',
      session: this.#target(session),
      ...input,
    });
    return this.getSession(viewer, sessionId);
  }

  /**
   * Settles what the session's owner decided about records tied to the session: starts the work on `start` through the
   * kind's resolver, and leaves `skip` as it is. Either way the session stops asking about them.
   */
  async decideLinks(
    viewer: Viewer,
    sessionId: string,
    input: {
      readonly kind: string;
      readonly start: readonly string[];
      readonly skip: readonly string[];
    },
  ): Promise<Session> {
    const session = await this.#session(viewer.userId, sessionId);
    const tied = new Set(
      (
        await links(this.#conn()).findMany({
          filter: { sessionId, kind: input.kind },
        })
      ).map((link) => link.refId),
    );
    const unknown = [...input.start, ...input.skip].find(
      (refId) => !tied.has(refId),
    );
    if (unknown !== undefined)
      throw new AgentSessionsError('linkNotFound', 'refIds');
    const resolver = this.#linkKinds.get(input.kind);
    if (input.start.length > 0) {
      if (!resolver?.start)
        throw new AgentSessionsError('linkNotFound', 'kind');
      await resolver.start(input.start, viewer);
    }
    const decided = [...input.start, ...input.skip];
    if (decided.length > 0) {
      await links(this.#conn()).updateMany({
        filter: (f) =>
          f.and([
            f.string('sessionId').eq(sessionId),
            f.string('kind').eq(input.kind),
            f.or(decided.map((refId) => f.string('refId').eq(refId))),
          ]),
        values: { decidedAt: this.#iso() },
      });
    }
    this.#publish(viewer.userId, {
      kind: 'session',
      sessionId,
      lastSeq: Number(session.lastSeq),
    });
    return this.getSession(viewer, sessionId);
  }

  // Internals.

  /** Keeps what the agent offered, its choices and commands, for the computer's next new session of it. */
  async #learnOffer(
    computer: ComputerRecord,
    agentId: string,
    state: SessionState,
  ): Promise<void> {
    const values = {
      ...(state.choices.length > 0 &&
      !same(computer.choices[agentId], state.choices)
        ? { choices: { ...computer.choices, [agentId]: state.choices } }
        : {}),
      ...(state.commands.length > 0 &&
      !same(computer.commands[agentId], state.commands)
        ? { commands: { ...computer.commands, [agentId]: state.commands } }
        : {}),
    };
    if (Object.keys(values).length === 0) return;
    await computers(this.#conn()).updateMany({
      filter: { id: computer.id },
      values,
    });
  }

  /** The bridge's reply to a command, once it reaches this instance or the store another one put it in. */
  async #awaitReply(
    key: string,
    timeout: number = REPLY_WAIT_MS,
  ): Promise<ReplyRequest> {
    for (let waited = 0; waited < timeout; waited += REPLY_CHECK_MS) {
      const reply = await this.#replies.take<ReplyRequest>(key);
      if (reply) return reply;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(done, REPLY_CHECK_MS);
        const waiters = this.#replyWaiters;
        waiters.set(key, done);
        function done(): void {
          clearTimeout(timer);
          waiters.delete(key);
          resolve();
        }
      });
    }
    throw new AgentSessionsError('computerNotAnswering');
  }

  /** What the bridge needs to run a command of the session. */
  #target(session: SessionRecord): SessionTarget {
    const tools =
      this.#tools.length > 0 && this.#toolTokens
        ? {
            name: this.#toolServer,
            path: TOOLS_PATH,
            token: this.#toolTokens.sign(session.id),
          }
        : null;
    return {
      id: session.id,
      agentId: session.agentId,
      cwd: session.cwd,
      acpSessionId: session.acpSessionId,
      settings: session.settings,
      tools,
    };
  }

  async #views(
    viewer: Viewer,
    rows: readonly SessionRecord[],
  ): Promise<Session[]> {
    if (rows.length === 0) return [];
    const now = this.#now();
    const owned = new Map(
      (
        await computers(this.#conn()).findMany({
          filter: { userId: viewer.userId },
        })
      ).map((row) => [row.id, row]),
    );
    const tied = await links(this.#conn()).findMany({
      filter: (f) => f.or(rows.map((row) => f.string('sessionId').eq(row.id))),
      sort: (sort) => sort.field('seq').asc(),
    });
    const resolved = await this.#resolve(viewer, tied);
    const projects = rows.some((row) => row.projectId)
      ? new Map(
          (await this.listProjects(viewer)).map((project) => [
            project.id,
            project,
          ]),
        )
      : new Map<string, SessionProject>();
    return rows.map((row) =>
      sessionView(row, {
        computer: owned.get(row.computerId),
        project: row.projectId ? (projects.get(row.projectId) ?? null) : null,
        now,
        links: tied.flatMap((link) => {
          const view =
            link.sessionId === row.id
              ? resolved.get(`${link.kind}:${link.refId}`)
              : undefined;
          return view
            ? [
                {
                  kind: link.kind,
                  refId: link.refId,
                  ...view,
                  decidedAt: link.decidedAt,
                },
              ]
            : [];
        }),
      }),
    );
  }

  /** How each record tied to sessions stands for the viewer, by `kind:refId`; one they may not see is left out. */
  async #resolve(
    viewer: Viewer,
    tied: readonly LinkRecord[],
  ): Promise<Map<string, LinkView>> {
    const resolved = new Map<string, LinkView>();
    for (const [kind, resolver] of this.#linkKinds) {
      const refIds = [
        ...new Set(
          tied.filter((link) => link.kind === kind).map((link) => link.refId),
        ),
      ];
      if (refIds.length === 0) continue;
      for (const [refId, view] of await resolver.resolve(refIds, viewer))
        resolved.set(`${kind}:${refId}`, view);
    }
    return resolved;
  }

  /** The work tied to the session, in the order it was tied, with `also` after it when not tied yet. */
  async #work(
    viewer: Viewer,
    sessionId: string,
    also: readonly (Mention & LinkView)[] = [],
  ): Promise<WorkItem[]> {
    const tied = await links(this.#conn()).findMany({
      filter: { sessionId },
      sort: (sort) => sort.field('seq').asc(),
    });
    const resolved = await this.#resolve(viewer, tied);
    const item = (kind: string, refId: string, view: LinkView): WorkItem => ({
      kind,
      refId,
      key: view.key,
      title: view.title,
      status: view.status?.label ?? null,
      group: view.group,
    });
    const items = tied.flatMap((link) => {
      const view = resolved.get(`${link.kind}:${link.refId}`);
      return view ? [item(link.kind, link.refId, view)] : [];
    });
    const known = new Set(items.map((entry) => `${entry.kind}:${entry.refId}`));
    for (const mention of also)
      if (!known.has(`${mention.kind}:${mention.refId}`))
        items.push(item(mention.kind, mention.refId, mention));
    return items;
  }

  /** The owner a tool is called for, in the language they last wrote to the session in. */
  async #ownerOf(caller: {
    readonly userId: string;
    readonly sessionId: string;
  }): Promise<Viewer> {
    const session = await sessions(this.#conn()).findOne({
      filter: { id: caller.sessionId },
    });
    return { userId: caller.userId, locale: session?.locale ?? undefined };
  }

  /** The tool every session's agent has: the work tied to its session, and how each is going. */
  #workTool(): SessionTool {
    return defineSessionTool({
      name: 'list_session_work',
      description:
        'Lists the work tied to this session, what was created in it or mentioned in its messages, with how each stands and, where the application tells, how it is going: who works on it, what it waits for, its pull request. When the person asks about the tasks or their progress without naming others, they mean these: call this first.',
      input: z.object({}),
      run: async (_input, caller) => {
        const viewer = await this.#ownerOf(caller);
        const work = await this.#work(viewer, caller.sessionId);
        const progress = new Map<string, unknown>();
        for (const [kind, resolver] of this.#linkKinds) {
          const refIds = work
            .filter((item) => item.kind === kind)
            .map((item) => item.refId);
          if (!resolver.progress || refIds.length === 0) continue;
          for (const [refId, detail] of await resolver.progress(refIds, viewer))
            progress.set(`${kind}:${refId}`, detail);
        }
        return work.map(({ kind, refId, ...item }) => ({
          ...item,
          progress: progress.get(`${kind}:${refId}`) ?? null,
        }));
      },
    });
  }

  /** The records mentioned, as the viewer sees them; one the viewer cannot see is refused. */
  async #mentioned(
    viewer: Viewer,
    mentions: readonly Mention[],
  ): Promise<(Mention & LinkView)[]> {
    const found: (Mention & LinkView)[] = [];
    for (const kind of new Set(mentions.map((mention) => mention.kind))) {
      const refIds = [
        ...new Set(
          mentions
            .filter((mention) => mention.kind === kind)
            .map((mention) => mention.refId),
        ),
      ];
      const views = await this.#linkKinds.get(kind)?.resolve(refIds, viewer);
      for (const refId of refIds) {
        const view = views?.get(refId);
        if (!view)
          throw new AgentSessionsError('referenceNotFound', 'mentions');
        found.push({ kind, refId, ...view });
      }
    }
    return found;
  }

  async #computer(
    userId: string,
    computerId: string,
    field?: string,
  ): Promise<ComputerRecord> {
    const computer = await computers(this.#conn()).findOne({
      filter: { id: computerId, userId },
    });
    if (!computer) throw new AgentSessionsError('computerNotFound', field);
    return computer;
  }

  async #session(userId: string, sessionId: string): Promise<SessionRecord> {
    const session = await sessions(this.#conn()).findOne({
      filter: { id: sessionId, userId },
    });
    if (!session) throw new AgentSessionsError('sessionNotFound');
    return session;
  }

  /** The session, when its owner may send it something now. */
  async #writable(userId: string, sessionId: string): Promise<SessionRecord> {
    const session = await this.#session(userId, sessionId);
    if (session.archivedAt) throw new AgentSessionsError('sessionArchived');
    const computer = await computers(this.#conn()).findOne({
      filter: { id: session.computerId },
    });
    if (!isOnline(computer, this.#now()))
      throw new AgentSessionsError('computerOffline');
    return session;
  }

  async #command(
    session: SessionRecord,
    command: BridgeCommand,
    publish = true,
  ): Promise<void> {
    await enqueue(this.#conn(), session.computerId, command, this.#iso());
    this.#wake(session.computerId);
    if (publish)
      this.#publish(session.userId, {
        kind: 'session',
        sessionId: session.id,
        lastSeq: Number(session.lastSeq),
      });
  }

  /** Appends `added` to a locked session and writes `values` with its new `lastSeq` and last activity. */
  async #append(
    conn: DatabaseConnection,
    session: SessionRecord,
    added: readonly SessionEvent[],
    now: string,
    values: Partial<SessionRecord>,
  ): Promise<{ readonly session: SessionRecord; readonly lastSeq: number }> {
    const lastSeq = await appendEvents(conn, session, added, now);
    const written = {
      ...values,
      lastSeq,
      ...(added.length > 0 ? { lastActivityAt: now } : {}),
      updatedAt: now,
    };
    await sessions(conn).updateMany({
      filter: { id: session.id },
      values: written,
    });
    return { session: { ...session, ...written }, lastSeq };
  }

  /**
   * Tells the owner, a little later, of what the bridge reported that they have not seen by then (`notices.ts`), and
   * settles a request for permission once they answered it.
   */
  #watch(
    session: SessionRecord,
    added: readonly SessionEvent[],
    seq: number,
  ): void {
    const notices = this.#notices;
    if (!notices) return;
    for (const event of added) {
      if (
        event.kind === 'permissionResolved' &&
        event.reason === 'answered' &&
        session.noticedSeq !== null
      )
        this.#schedule(
          () =>
            notices.settle({
              userId: session.userId,
              sessionId: session.id,
              types: ['permissionRequested'],
              outcome: 'answered',
            }),
          0,
        );
      const notice = noticeOf(event);
      if (notice)
        this.#schedule(
          () => this.#notify(session.id, notice, event.at, seq),
          NOTICE_DELAY_MS,
        );
    }
  }

  /** Tells the owner of `notice`, unless they saw the session up to `seq` or the request no longer waits. */
  async #notify(
    sessionId: string,
    notice: {
      readonly type: SessionNoticeType;
      readonly detail: string | null;
    },
    at: string,
    seq: number,
  ): Promise<void> {
    const conn = this.#conn();
    const session = await sessions(conn).findOne({ filter: { id: sessionId } });
    if (
      !this.#notices ||
      !session ||
      session.archivedAt ||
      Number(session.seenSeq) >= seq ||
      (notice.type === 'permissionRequested' &&
        Number(session.pendingPermissions) === 0)
    )
      return;
    const computer = await computers(conn).findOne({
      filter: { id: session.computerId },
    });
    await this.#notices.send({
      key: `${session.id}:${seq}:${notice.type}`,
      type: notice.type,
      userId: session.userId,
      sessionId: session.id,
      title:
        session.title ?? (session.state?.title?.trim() || session.firstMessage),
      agent:
        computer?.agents.find((agent) => agent.id === session.agentId)?.name ??
        session.agentId,
      detail: notice.detail,
      at,
    });
    await sessions(conn).updateMany({
      filter: { id: session.id },
      values: { noticedSeq: Math.max(seq, Number(session.noticedSeq ?? 0)) },
    });
  }

  #changed(changed: {
    readonly session: SessionRecord;
    readonly lastSeq: number;
  }): void {
    this.#publish(changed.session.userId, {
      kind: 'session',
      sessionId: changed.session.id,
      lastSeq: changed.lastSeq,
    });
  }

  #transaction<T>(
    work: (conn: DatabaseConnection, now: string) => Promise<T>,
  ): Promise<T> {
    return this.#database.transaction((conn) => work(conn, this.#iso()));
  }

  #conn(): DatabaseConnection {
    return this.#database.connection();
  }

  #iso(): string {
    return new Date(this.#now()).toISOString();
  }

  #wake(computerId: string): void {
    for (const wake of this.#waiters.get(computerId) ?? []) wake();
  }

  #sleep(computerId: string, ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const waiters = this.#waiters.get(computerId) ?? new Set<() => void>();
      this.#waiters.set(computerId, waiters);
      const timer = setTimeout(done, ms);
      signal.addEventListener('abort', done, { once: true });
      waiters.add(done);
      function done(): void {
        clearTimeout(timer);
        signal.removeEventListener('abort', done);
        waiters.delete(done);
        resolve();
      }
    });
  }
}

/** Whether the permission request was asked and not yet answered. */
async function isWaiting(
  conn: DatabaseConnection,
  sessionId: string,
  requestId: string,
): Promise<boolean> {
  const recent = await readEventsOfKinds(conn, sessionId);
  let waiting = false;
  for (const event of recent) {
    if (event.kind === 'permissionRequested' && event.requestId === requestId)
      waiting = true;
    if (
      (event.kind === 'permissionResolved' && event.requestId === requestId) ||
      event.kind === 'turnEnded'
    ) {
      waiting = false;
    }
  }
  return waiting;
}

/** The session's most recent events, oldest first: enough to see the current turn. */
async function readEventsOfKinds(
  conn: DatabaseConnection,
  sessionId: string,
): Promise<TranscriptEvent[]> {
  const session = await sessions(conn).findOne({ filter: { id: sessionId } });
  const lastSeq = Number(session?.lastSeq ?? 0);
  return readEvents(conn, sessionId, Math.max(0, lastSeq - 500), 500);
}

/** How paths are written on the computer: Windows's, or POSIX's everywhere else. */
function pathsOf(
  computer: Pick<ComputerRecord, 'platform'>,
): path.PlatformPath {
  return computer.platform === 'win32' ? path.win32 : path.posix;
}

/** Whether `cwd`, absolute, is one of `roots` or inside one, as `paths` reads them. */
function within(
  paths: path.PlatformPath,
  roots: readonly string[],
  cwd: string,
): boolean {
  if (!paths.isAbsolute(cwd)) return false;
  const resolved = paths.resolve(cwd);
  return roots.some((root) => {
    const relative = paths.relative(root, resolved);
    return (
      relative === '' ||
      (!relative.startsWith('..') && !paths.isAbsolute(relative))
    );
  });
}

function firstLine(content: readonly PromptContent[]): string {
  const text = content.find((part) => part.type === 'text')?.text ?? '';
  return text.trim().split('\n')[0].slice(0, 200) || 'Image';
}

function pageToken(session: SessionRecord): string {
  return Buffer.from(
    JSON.stringify([session.lastActivityAt, session.id]),
  ).toString('base64url');
}

/** The keyset of the last session of the page before, as `findMany`'s cursor. */
function parsePageToken(
  token: string,
): Pick<SessionRecord, 'lastActivityAt' | 'id'> {
  try {
    const [at, id] = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    ) as unknown[];
    if (
      typeof at === 'string' &&
      !Number.isNaN(Date.parse(at)) &&
      typeof id === 'string' &&
      id
    ) {
      return { lastActivityAt: at, id };
    }
  } catch {
    // Reported below.
  }
  throw new AgentSessionsError('invalidPageToken', 'pageToken');
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Replies kept in this instance's memory, for an application of one instance. */
function memoryReplies(): ReplyStore {
  const kept = new Map<string, { value: unknown; until: number }>();
  return {
    set(key, value, ttl = REPLY_WAIT_MS) {
      kept.set(key, { value, until: Date.now() + ttl });
      return Promise.resolve();
    },
    take<T>(key: string) {
      const entry = kept.get(key);
      kept.delete(key);
      return Promise.resolve(
        entry && entry.until > Date.now() ? (entry.value as T) : undefined,
      );
    },
  };
}

/** Tells whether a session's agent was told the application's instructions as they are now. */
function instructionsHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** The stored form of a computer's key. */
function keyHash(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

/** Runs `task` after `delayMs` in this process, without keeping it alive; a failure is only logged. */
function later(task: () => Promise<void>, delayMs: number): void {
  setTimeout(() => {
    task().catch((error: unknown) =>
      console.error(
        'Agent sessions could not tell an owner of a session.',
        error,
      ),
    );
  }, delayMs).unref();
}
