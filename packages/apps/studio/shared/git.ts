/**
 * Studio's pull requests, as the server and the browser exchange them (`studio/server/git`, `studio/client/git`): which
 * pull requests belong to an issue, what the code host last said about them and their checks, whether and how one may be
 * merged (the merge preflight), the workspace's connections to code hosts and each person's own authorization, the
 * repository settings Studio keeps (its connection, its branch rules, a sealed webhook secret, whether failing checks and
 * conflicts wake the agent), and the names Studio registers with the projects plugin: the workflow event `studio.merged`
 * and the entry condition `prMerged`.
 */

/**
 * The realtime topic that says Studio stored something new about a pull request (a webhook delivery, a poll, a merge),
 * so open pages read their pull requests again. Public and without content: each page reads what it may see.
 */
export const STUDIO_GIT_TOPIC = 'studio:git';
export interface StudioGitEvent {
  readonly kind: 'studio.git.changed';
}

/** The workflow event fired when every counted pull request of an issue is merged. */
export const MERGED_EVENT = 'studio.merged';

/** The entry condition: an issue enters the status only with enough merged pull requests. */
export const PR_MERGED_RULE = 'prMerged';

/** The inbox source of Studio's pull request items, and their types. */
export const GIT_INBOX_SOURCE = 'git';
/** A decision for the issue's owner: the pull request of an issue in review waits to be merged. */
export const PR_MERGE_REQUESTED = 'pr_merge_requested';
/** Information for the owner: the agent was woken too often for the same signal and stopped being woken. */
export const PR_SIGNAL_STOPPED = 'pr_signal_stopped';

/**
 * The issue activities of a linked pull request changed through Studio (`nb-studio pr edit|close|reopen`). Their
 * details: `pullRequestId`, `repo`, `number`, `url`, `title`; `fields` (what an edit changed: `title`, `body`, `base`,
 * `draft`, `ready`); `reason` and `unlinked` for a close.
 */
export const PR_ACTIVITIES = {
  edited: 'pr_edited',
  closed: 'pr_closed',
  reopened: 'pr_reopened',
} as const;
export const PR_EDIT_FIELDS = [
  'title',
  'body',
  'base',
  'draft',
  'ready',
] as const;
export type PullRequestEditField = (typeof PR_EDIT_FIELDS)[number];

/** The issue triggers a pull request starts runs for. */
export const PR_TRIGGERS = ['prChecksFailed', 'prConflict'] as const;
export type PullRequestTrigger = (typeof PR_TRIGGERS)[number];

/** How many times in a row the same signal wakes the agent before the owner is told instead. */
export const SIGNAL_WAKE_LIMIT = 3;

export type PullRequestState = 'open' | 'closed' | 'merged';
export type PullRequestCiState = 'pending' | 'success' | 'failure';
export type PullRequestLinkedBy = 'user' | 'agent' | 'system';

/**
 * One check of a pull request's head commit: a check run (`check`) or a commit status (`status`). `conclusion` is the
 * host's word once `completed` (`success`, `failure`, `neutral`, `skipped`, `cancelled`, `timed_out`…), null before.
 */
export interface GitCheck {
  readonly kind: 'check' | 'status';
  readonly name: string;
  readonly status: 'queued' | 'in_progress' | 'completed';
  readonly conclusion: string | null;
  readonly url: string | null;
}

export interface PullRequest {
  readonly id: string;
  /** `owner/name`. */
  readonly repo: string;
  readonly number: number;
  readonly url: string;
  readonly title: string;
  readonly state: PullRequestState;
  readonly draft: boolean;
  readonly headRef: string;
  readonly baseRef: string;
  readonly headSha: string;
  /** The commit a merge left on the base branch (a squash merge's single commit); null until merged. */
  readonly mergeCommitSha: string | null;
  readonly authorLogin: string;
  /** GitHub's `mergeable_state` (`clean`, `dirty` for a conflict, `blocked`, `unknown` while it computes…). */
  readonly mergeableState: string | null;
  readonly ciState: PullRequestCiState | null;
  /** The checks of `headSha` one by one, as last read; empty before the first read of that head. */
  readonly checks: readonly GitCheck[];
  readonly mergedAt: string | null;
  /** Who merged it: a Studio user when Studio merged it or a person marked it, else GitHub's login. */
  readonly mergedBy: {
    readonly userId: string | null;
    readonly name: string | null;
    readonly login: string | null;
  } | null;
  readonly mergedManually: boolean;
  readonly closedAt: string | null;
  /** When GitHub was last read for it. */
  readonly snapshotAt: string | null;
}

/**
 * Why a pull request cannot be merged from Studio. `merged`, `closed` and
 * `draft`: its state; `conflicts`: GitHub's `mergeable` is false or `mergeable_state` is `dirty`; `computing`: GitHub has
 * not worked out mergeability yet (`mergeable` null, only on a fresh read); `ciPending`, `ciFailed`, `ciMissing`: the
 * head commit's checks are running, failed, or there are none; `notConfigured`: the repository has no connection; and
 * `protected`: GitHub refused the merge for branch protection (a review or an up-to-date branch), seen only on merging.
 */
export const MERGE_BLOCKERS = [
  'merged',
  'closed',
  'draft',
  'conflicts',
  'computing',
  'ciPending',
  'ciFailed',
  'ciMissing',
  'notConfigured',
  'protected',
] as const;
export type PullRequestMergeBlocker = (typeof MERGE_BLOCKERS)[number];

/**
 * The first reason the pull request cannot be merged, or null. `mergeable` is GitHub's flag from a fresh read (null
 * while it computes); left out, only the stored state counts and `mergeableState = dirty` is the only conflict.
 */
export function mergeBlockerOf(
  pr: Pick<PullRequest, 'state' | 'draft' | 'mergeableState' | 'ciState'>,
  mergeable?: boolean | null,
): PullRequestMergeBlocker | null {
  if (pr.state === 'merged') return 'merged';
  if (pr.state === 'closed') return 'closed';
  if (pr.draft) return 'draft';
  if (mergeable === false || pr.mergeableState === 'dirty') return 'conflicts';
  if (mergeable === null) return 'computing';
  if (pr.ciState === 'pending') return 'ciPending';
  if (pr.ciState === 'failure') return 'ciFailed';
  if (pr.ciState !== 'success') return 'ciMissing';
  return null;
}

/** The squash commit's title: `<title> (#<number>)`, "Merge pull request" for an empty title. */
export function mergeCommitTitle(
  pr: Pick<PullRequest, 'title' | 'number'>,
): string {
  return `${pr.title.trim() || 'Merge pull request'} (#${pr.number})`;
}

/**
 * Why merging leaves the issue where it is: it is finished already, this pull request does not count toward moving it,
 * other counted pull requests are not merged yet, or its workflow has no transition on `studio.merged` from its status.
 */
export type PullRequestMergeKeepReason =
  'terminal' | 'optedOut' | 'otherPrs' | 'noTransition';

/** What merging does to the issue: it moves to `statusKey`, or stays for `keepReason`. */
export interface PullRequestMergeOutcome {
  readonly statusKey: string | null;
  readonly statusName: string | null;
  readonly keepReason: PullRequestMergeKeepReason | null;
}

/** `POST /api/git/pullRequests/:pullRequestId/checkMerge?issueId=`: the pull request as GitHub has it now. */
export interface PullRequestMergePreflight {
  readonly blocker: PullRequestMergeBlocker | null;
  readonly method: 'squash';
  /** The head the merge is of; the confirmation sends it back as `expectedHeadSha`. */
  readonly headSha: string;
  readonly baseRef: string;
  readonly commitTitle: string;
  readonly statusAfter: PullRequestMergeOutcome;
}

/** `POST /api/git/pullRequests/:pullRequestId/merge?issueId=`. */
export interface MergePullRequestRequest {
  /** The head the person confirmed; 409 `PR_CHANGED` when GitHub's head moved since. */
  readonly expectedHeadSha: string;
}

/** A pull request as an issue shows it: with who linked it and what the viewer may do. */
export interface IssuePullRequest extends PullRequest {
  /** Opening succeeds even if its preview label needs a later retry. */
  readonly previewLabelSyncFailed?: boolean;
  readonly linkedBy: {
    readonly type: PullRequestLinkedBy;
    readonly id: string | null;
    readonly name: string | null;
  };
  readonly autoCompleteDisabled: boolean;
  readonly linkedAt: string;
  /**
   * Why it cannot be merged by what Studio last read (`mergeBlockerOf` without a fresh flag, and `notConfigured`
   * without a connection); null when it looks mergeable. Only a hint: merging checks the host again first.
   */
  readonly mergeBlocker: PullRequestMergeBlocker | null;
}

/**
 * An open pull request whose title or body names the issue's key: only a suggestion, linked once a person confirms it
 * (`POST …/pull-requests` with its URL) or gone once they dismiss it.
 */
export interface PullRequestSuggestion {
  readonly pullRequestId: string;
  readonly repo: string;
  readonly number: number;
  readonly url: string;
  readonly title: string;
  readonly state: PullRequestState;
}

/**
 * An issue's pull request section: `GET /api/git/pullRequests?issueId=` answers `data` and the rest in `meta`.
 */
export interface IssuePullRequests {
  readonly data: readonly IssuePullRequest[];
  /** For whoever may link: pull requests that name the issue and wait for a person to confirm them. */
  readonly suggestions: readonly PullRequestSuggestion[];
  /** Whether the viewer may merge (the issue's owner, or a manager of its project). */
  readonly canMerge: boolean;
  /** Whether the viewer may link and unlink (whoever may edit the issue). */
  readonly canLink: boolean;
  /**
   * Whether the issue has a Pull request section at all: the workspace has a connection to a code host and the issue's
   * project a linked repository, or the issue already has pull requests.
   */
  readonly applicable: boolean;
}

/** `GET /api/git/marks?issueIds=a,b`: what an issue's mark shows, for the issues that have pull requests. */
export interface PullRequestMark {
  readonly count: number;
  readonly merged: number;
  /** `merged` when every one is, `open` while one is open, else `closed`. */
  readonly state: PullRequestState;
  /** Of the open ones: `failure` when one fails, `pending` while one runs, `success` when all pass. */
  readonly ciState: PullRequestCiState | null;
  /** An open one conflicts with its base. */
  readonly conflict: boolean;
  /** The first open one (else the first), for a link. */
  readonly url: string;
  readonly label: string;
}

/** At most this many issues per marks request. */
export const MARKS_MAX = 100;

export interface LinkPullRequestRequest {
  /** `https://github.com/<owner>/<name>/pull/<number>`, or a GitHub Enterprise URL of the same shape. */
  readonly url: string;
}

/**
 * The GitHub webhook events Studio handles. `check_run` and `status` are read like `check_suite`; `push` checks the
 * mergeability of the open pull requests based on the pushed branch, as GitHub sends nothing when a push to the base
 * leaves one conflicting.
 */
export const WEBHOOK_EVENTS = [
  'pull_request',
  'check_suite',
  'check_run',
  'status',
  'push',
] as const;

/**
 * What became of a delivery: `processed`; `ignored` (verified, but nothing for Studio: another event or action, a check
 * suite without check runs, a pull request no issue links); `invalidSignature`; `failed` (Studio could not process it;
 * GitHub may redeliver it).
 */
export type WebhookDeliveryStatus =
  'processed' | 'ignored' | 'invalidSignature' | 'failed';

/** Why a verified delivery was ignored or failed, for the setup wizard. */
export type WebhookDeliveryReason =
  | 'notJson'
  | 'otherRepository'
  | 'unsupportedEvent'
  | 'unsupportedAction'
  | 'noRuns'
  | 'notLinked'
  | 'error';

export interface WebhookDelivery {
  readonly at: string;
  /** `X-GitHub-Event`. */
  readonly event: string | null;
  readonly status: WebhookDeliveryStatus;
  readonly reason: WebhookDeliveryReason | null;
}

/** A repository's settings, as its project's managers see them; the webhook secret is never sent back. */
export interface GitRepoSettings {
  /** `owner/name`; null when the working directory is not linked to a repository of a connection. */
  readonly repo: string | null;
  /** `<origin>/<owner>/<name>`, the repository's page. */
  readonly webUrl: string | null;
  /** The connection Studio reads and writes the repository through. */
  readonly connection: GitConnectionChoice | null;
  /** The branch rules, in order: the first names the branches agents work on (`branchOf`). */
  readonly branchRules: readonly string[];
  readonly wakeOnChecks: boolean;
  readonly wakeOnConflict: boolean;
  readonly polledAt: string | null;
  readonly pollError: string | null;
  /** Where GitHub posts this repository's events: absolute with `app.publicOrigin`, else a path on Studio's origin. */
  readonly webhookUrl: string | null;
  readonly hasWebhookSecret: boolean;
  readonly lastDelivery: WebhookDelivery | null;
  /** Last signed delivery received by this endpoint, persisted at most every ten minutes per process. */
  readonly lastReceivedAt: string | null;
  /** A secret is set and the last delivery was verified: Studio polls this repository only as a slow fallback. */
  readonly webhookHealthy: boolean;
  /** How often Studio reads the repository now, in seconds. */
  readonly pollSeconds: number;
}

export interface UpdateGitRepoRequest {
  /** A new webhook secret; null removes it; left out keeps it. */
  readonly webhookSecret?: string | null;
  readonly wakeOnChecks?: boolean;
  readonly wakeOnConflict?: boolean;
  /** The branch rules, each with `{key}` once; at least one. */
  readonly branchRules?: readonly string[];
}

// --- Branch rules ------------------------------------------------------------------------------------------------------

/** Where an issue's key goes in a branch rule. */
export const BRANCH_KEY = '{key}';
/** The branch rule a repository starts with: agents work on `agent/PM-12`. */
export const DEFAULT_BRANCH_RULE = 'agent/{key}';
export const BRANCH_RULES_MAX = 10;
export const BRANCH_RULE_MAX = 100;

/** Why a branch rule is refused, or null: it holds `{key}` once, and the rest is a plain branch name. */
export function branchRuleProblem(rule: string): string | null {
  const trimmed = rule.trim();
  if (!trimmed || trimmed.length > BRANCH_RULE_MAX)
    return `A branch rule is 1 to ${BRANCH_RULE_MAX} characters.`;
  if (trimmed.split(BRANCH_KEY).length !== 2)
    return 'A branch rule holds {key} exactly once.';
  const sample = trimmed.replace(BRANCH_KEY, 'PM-1');
  if (
    /[\s~^:?*[\\]|\.\.|\/\/|^\/|\/$|\.lock$|@\{/u.test(sample) ||
    sample.startsWith('-')
  )
    return 'A branch rule must make a valid branch name.';
  return null;
}

/** The branch a rule names for an issue: `agent/{key}` and `PM-12` make `agent/PM-12`. */
export function branchOf(rule: string, key: string): string {
  return rule.trim().replace(BRANCH_KEY, key);
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/**
 * The issue key a branch names by the first rule it matches (any case: `agent/pm-12` is `PM-12`), or null. A key is a
 * project prefix and a number.
 */
export function issueKeyOfBranch(
  rules: readonly string[],
  branch: string,
): string | null {
  for (const rule of rules) {
    const [before = '', after = ''] = rule.trim().split(BRANCH_KEY);
    const match = new RegExp(
      `^${escapeRegExp(before)}([A-Za-z][A-Za-z0-9]{0,9})-(\\d{1,9})${escapeRegExp(after)}$`,
      'iu',
    ).exec(branch.trim());
    if (match?.[1] && match[2])
      return `${match[1].toUpperCase()}-${Number(match[2])}`;
  }
  return null;
}

// --- Connections -------------------------------------------------------------------------------------------------------

/** The code hosts Studio connects to: each is a provider with its descriptor and its platform on the server. */
export const GIT_PROVIDERS = ['github'] as const;
export type GitProvider = (typeof GIT_PROVIDERS)[number];

/**
 * How the workspace reaches a code host: an app installed on an account (`app`: the app's id and private key, the
 * installation; its OAuth client lets people authorize it for themselves), or a token (`token`). A workspace has as
 * many as it needs; one app installed on several accounts is one connection per installation, sharing the app's
 * credentials and its webhook.
 */
export type GitConnectionKind = 'app' | 'token';

/**
 * How a person connects their own account on a host: the OAuth web flow of a connection's app (`oauth`), its device
 * flow (`device`: a code entered on the host, for a Studio the host cannot reach), or a personal access token they paste
 * (`token`).
 */
export const GIT_PERSONAL_METHODS = ['oauth', 'device', 'token'] as const;
export type GitPersonalMethod = (typeof GIT_PERSONAL_METHODS)[number];

/** What a provider is, as the settings pages present it; the server pairs each with its `GitPlatform`. */
export interface GitProviderDescriptor {
  readonly id: GitProvider;
  /** Its name for people, `GitHub`. */
  readonly label: string;
  /** The icon the client draws for it. */
  readonly icon: GitProvider;
  /** The host a new connection reaches unless told otherwise; another origin is a self-hosted server. */
  readonly defaultWebUrl: string;
  /** The kinds of connection it takes, the recommended first. */
  readonly connectionKinds: readonly GitConnectionKind[];
  /** How people connect their own account on it. */
  readonly personalMethods: readonly GitPersonalMethod[];
  /** Whether Studio can create its app on the host from a manifest (`startAppManifest`). */
  readonly appManifest: boolean;
  /** What Studio can set up on a repository's CI by itself. */
  readonly capabilities: {
    /** Whether Studio writes the CI's API key as a secret of the repository (`setCiSecret`). */
    readonly ciSecrets: boolean;
    /** What the host calls such a secret, for people. */
    readonly ciSecretName: string;
  };
}

export const GIT_PROVIDER_DESCRIPTORS: Readonly<
  Record<GitProvider, GitProviderDescriptor>
> = {
  github: {
    id: 'github',
    label: 'GitHub',
    icon: 'github',
    defaultWebUrl: 'https://github.com',
    connectionKinds: ['app', 'token'],
    personalMethods: ['oauth', 'device', 'token'],
    appManifest: true,
    capabilities: { ciSecrets: true, ciSecretName: 'GitHub Actions secret' },
  },
};

/** A connection as a picker lists it, for anyone who links repositories. */
export interface GitConnectionChoice {
  readonly id: string;
  readonly provider: GitProvider;
  readonly kind: GitConnectionKind;
  readonly name: string;
  /** The account it reaches: the installation's organization or user, or the token's owner. */
  readonly account: string | null;
  /** `scheme://host` of the host's web pages. */
  readonly webUrl: string;
  /** Made by the demo data: Studio never calls its host, and every call that would is refused (`GIT_CONNECTION_DEMO`). */
  readonly demo: boolean;
  /**
   * Where the repositories it may reach are chosen on the host: an app's installation settings, a token's settings;
   * null for a demo connection or an app not installed yet.
   */
  readonly repositoryAccessUrl: string | null;
  /** When it was added: lists show the oldest first (`connectionsByAge`). */
  readonly createdAt: string;
}

type AgedConnection = Pick<GitConnectionChoice, 'id' | 'createdAt'>;

/** Older first, by when each was added; the id breaks a tie. */
export function compareConnectionAge(
  a: AgedConnection,
  b: AgedConnection,
): number {
  return (
    Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** Connections in the order they were added, oldest first: how every list and picker shows them. */
export function connectionsByAge<T extends AgedConnection>(
  connections: readonly T[],
): T[] {
  return [...connections].sort(compareConnectionAge);
}

/** The connection a picker starts on: the one last chosen while it still exists, else the oldest. */
export function preferredConnection<T extends AgedConnection>(
  connections: readonly T[],
  remembered: string | null,
): T | undefined {
  return (
    connections.find((item) => item.id === remembered) ??
    connectionsByAge(connections)[0]
  );
}

/**
 * A connection as its administrators see it (`GET /api/git/connections`). Credentials are write-only: only
 * whether each is set comes back.
 */
export interface GitConnection extends GitConnectionChoice {
  readonly appId: string | null;
  readonly clientId: string | null;
  readonly installationId: string | null;
  readonly hasPrivateKey: boolean;
  readonly hasClientSecret: boolean;
  readonly hasToken: boolean;
  readonly hasWebhookSecret: boolean;
  /** An app's webhook endpoint: absolute with `app.publicOrigin`, else a path on Studio's origin. */
  readonly webhookUrl: string | null;
  /** Where the host sends a person back after they authorize the app. */
  readonly callbackUrl: string | null;
  /** An app Studio created from a manifest: its slug on the host; null for one entered by hand. */
  readonly appSlug: string | null;
  /** Where the app is installed on another account (a created app only). */
  readonly installUrl: string | null;
  /** The app's settings on the host, where its device flow is turned on (a created app only). */
  readonly appSettingsUrl: string | null;
  /** How people may connect their own account through it (`personalMethodsOf`). */
  readonly personalMethods: readonly GitPersonalMethod[];
  /** Whether people may use a personal access token of their own on its host. */
  readonly allowPersonalTokens: boolean;
  readonly lastDelivery: WebhookDelivery | null;
  readonly lastReceivedAt: string | null;
  /** How many repositories projects' working directories link through it. */
  readonly usedBy: number;
  /**
   * The permissions an app connection's installation lacks of those Studio asks for, as `name:level`
   * (`secrets:write`): someone accepts them on the host (`permissionsUrl`). Empty for a token connection, and when the
   * host could not be asked.
   */
  readonly missingPermissions: readonly string[];
  /** Where the installation's account reviews and accepts the app's permissions; null when unknown. */
  readonly permissionsUrl: string | null;
  readonly updatedAt: string;
}

/**
 * `GET /api/git/connections/:connectionId/usage`: the projects' working directories that link a repository through
 * the connection, by repository name and then project.
 */
export interface GitConnectionUse {
  readonly resourceId: string;
  readonly projectId: string;
  readonly projectName: string;
  /** `owner/name` on the host. */
  readonly repo: string;
}

/** `GET /api/git/connections/:connectionId/reach`: how many repositories it reaches now, read live from the host. */
export interface GitConnectionReach {
  readonly repositories: number;
  /** A token's repositories are counted page by page, up to a limit: there are more than `repositories`. */
  readonly more: boolean;
}

/**
 * `POST /api/git/connections` (`kind`, `name` and the credentials of the kind required) and `PATCH …/:connectionId`. A
 * credential left out stays; null removes it.
 */
export interface SaveGitConnectionRequest {
  /** `github` by default. */
  readonly provider?: GitProvider;
  readonly kind?: GitConnectionKind;
  /**
   * On adding an app connection: another installation of the same app. The app's id, private key, OAuth client and
   * webhook secret are taken from that connection (they never pass through the browser); only `name` and `account` (or
   * `installationId`) are given.
   */
  readonly sameAppAs?: string;
  readonly name?: string;
  /** github.com by default; a GitHub Enterprise Server's origin otherwise. */
  readonly webUrl?: string;
  /** The account an app is installed on; Studio finds the installation when `installationId` is left out. */
  readonly account?: string | null;
  readonly appId?: string | null;
  readonly installationId?: string | null;
  readonly clientId?: string | null;
  readonly privateKey?: string | null;
  readonly clientSecret?: string | null;
  readonly token?: string | null;
  readonly webhookSecret?: string | null;
  /** Whether people may use a personal access token of their own (true by default). */
  readonly allowPersonalTokens?: boolean;
}

/** `GET /api/git/status`: whether anything about git shows at all, and what the viewer may pick. */
export interface GitStatus {
  /** At least one connection: without one, every git entry point is hidden and projects work without repositories. */
  readonly enabled: boolean;
  readonly connections: readonly GitConnectionChoice[];
  /** Whether the viewer may manage connections. */
  readonly canManage: boolean;
  /** `app.publicOrigin`, when configured: whether a host can deliver webhooks to Studio (`webhooksReachable`). */
  readonly publicOrigin: string | null;
}

/**
 * `POST /api/git/connections/startAppManifest`: an app to create on the host from a manifest, owned by the person
 * (`organization` null) or by an organization.
 */
export interface StartGitAppManifestRequest {
  /** `github` by default. */
  readonly provider?: GitProvider;
  readonly organization?: string | null;
  /** The provider's default host unless given (a GitHub Enterprise Server's origin). */
  readonly webUrl?: string;
}

/** The form the browser posts to the host: `manifest` is the field's value (JSON), `action` where it goes. */
export interface GitAppManifestForm {
  readonly action: string;
  readonly manifest: string;
  /** Whether the app's webhook starts on; off when the host cannot reach Studio, which then polls. */
  readonly webhookActive: boolean;
}

const PRIVATE_HOST =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|\[::1?\]|\[f[cd][0-9a-f]*:.*\]|\[fe80:.*\])$/iu;

/**
 * Whether a host at `webUrl` can deliver webhooks to Studio at `publicOrigin`: not without a configured public origin,
 * never to a loopback or `.local` name, and to a private address only from a self-hosted server (another origin than
 * `publicHostUrl`, which is on the internet).
 */
export function webhooksReachable(
  publicOrigin: string | null,
  webUrl: string,
  publicHostUrl: string,
): boolean {
  if (!publicOrigin || !URL.canParse(publicOrigin)) return false;
  const host = new URL(publicOrigin).hostname.toLowerCase();
  if (!PRIVATE_HOST.test(host)) return true;
  if (/^(localhost|.*\.localhost|127\.|\[::1\]|0\.0\.0\.0)/u.test(host))
    return false;
  const sameOrigin = (a: string, b: string): boolean =>
    URL.canParse(a) &&
    URL.canParse(b) &&
    new URL(a).origin === new URL(b).origin;
  return !sameOrigin(webUrl, publicHostUrl);
}

/** A person's own authorization on a host (Account settings › Git). Their token never leaves the server. */
export interface GitPersonalAuthorization {
  readonly connectionId: string;
  readonly login: string;
  readonly name: string | null;
  readonly email: string;
  readonly method: GitPersonalMethod;
  readonly connectedAt: string;
  /**
   * When it stops working unless the person connects again: a personal access token's expiry (when the host says), or
   * an OAuth authorization's that cannot be refreshed. Null when it does not expire, or renews itself.
   */
  readonly expiresAt: string | null;
}

/**
 * A connection a person may connect their own account through, and how. Only those offering a way are listed, and
 * those the person already connected through (so they can disconnect); never a demo connection.
 */
export interface GitPersonalHost {
  readonly connection: GitConnectionChoice;
  /** What it offers, in order; empty only for one connected through that no longer offers a way. */
  readonly methods: readonly GitPersonalMethod[];
  readonly authorization: GitPersonalAuthorization | null;
}

/** `GET /api/git/authorizations`: one entry per linkable or linked connection (an app's installations count once). */
export interface GitPersonalAuthorizations {
  readonly hosts: readonly GitPersonalHost[];
}

/** `POST /api/git/authorizations/:connectionId/startDeviceFlow`: the code to enter on the host. */
export interface GitDeviceAuthorization {
  /** Opaque: hands the pending authorization back to `pollDeviceFlow`. */
  readonly handle: string;
  readonly userCode: string;
  /** Where the person enters the code. */
  readonly verificationUri: string;
  readonly expiresAt: string;
  /** Seconds to wait between polls. */
  readonly interval: number;
}

/**
 * `POST /api/git/authorizations/:connectionId/pollDeviceFlow` `{ handle }`: `pending` until the person enters the code,
 * `slowDown` (wait `interval` seconds from now on), `connected` (the authorization is stored), or over: `expired` or
 * `denied`.
 */
export interface GitDevicePoll {
  readonly status: 'pending' | 'slowDown' | 'connected' | 'expired' | 'denied';
  readonly interval?: number;
  readonly authorization?: GitPersonalAuthorization;
}

/** Days before a personal authorization expires that the account page warns. */
export const GIT_PERSONAL_EXPIRY_WARNING_DAYS = 7;

/** A repository a connection reaches, as the working directory picker lists it. */
export interface GitRepoChoice {
  readonly id: string;
  /** `owner/name`. */
  readonly fullName: string;
  readonly owner: string;
  readonly name: string;
  readonly private: boolean;
  readonly defaultBranch: string;
  readonly cloneUrl: string;
  readonly webUrl: string;
  readonly description: string | null;
  /** A template repository: new repositories may be generated from it. */
  readonly isTemplate: boolean;
}

/** A page of `GET /api/git/connections/:connectionId/repositories?q=&pageToken=` (`data`, `meta.nextPageToken`). */
export interface GitRepoList {
  readonly items: readonly GitRepoChoice[];
  readonly hasMore: boolean;
}

/** `POST /api/git/connections/:connectionId/repositories`. */
export interface CreateGitRepoRequest {
  /** The organization or user; the connection's account by default. */
  readonly owner?: string;
  readonly name: string;
  readonly private: boolean;
  readonly description?: string | null;
  /** No initial commit and no branch (a project an agent initializes); nothing is protected. */
  readonly empty?: boolean;
}

/** A new repository generated from a template repository (`template`, `owner/name`) the connection reaches. */
export interface GenerateGitRepoRequest extends CreateGitRepoRequest {
  readonly template: string;
}

export interface CreatedGitRepo {
  readonly repo: GitRepoChoice;
  /** Whether its default branch could be protected (never for an empty or a generated repository). */
  readonly protected: boolean;
}

/**
 * A workflow of a repository (`GET /api/git/connections/:connectionId/repositories/:owner/:name/workflows`), which a new project
 * may name as its initialization workflow.
 */
export interface GitWorkflow {
  readonly id: string;
  readonly name: string;
  /** `.github/workflows/<file>`. */
  readonly path: string;
  /** `active`, or why it does not run. */
  readonly state: string;
  readonly htmlUrl: string | null;
}

/** The workflow a new project from a template repository is initialized by, unless the person chooses another. */
export const DEFAULT_INIT_WORKFLOW = '.github/workflows/nb-studio-init.yml';

/** The workflow the wizard preselects among a template repository's: the convention's, when it has it. */
export function preselectedInitWorkflow<T extends { readonly path: string }>(
  workflows: readonly T[],
): T | null {
  return workflows.find((item) => item.path === DEFAULT_INIT_WORKFLOW) ?? null;
}

// --- Commit attribution ------------------------------------------------------------------------------------------------

/**
 * Who a run's commits name: the person who asked for the work as author, and the agent as co-author (`withAgent`, a
 * `Co-authored-by` trailer), or the person alone (`meOnly`).
 */
export const COMMIT_ATTRIBUTIONS = ['withAgent', 'meOnly'] as const;
export type CommitAttribution = (typeof COMMIT_ATTRIBUTIONS)[number];
export const DEFAULT_ATTRIBUTION: CommitAttribution = 'withAgent';
/** The person's own choice, a user preference; without it the project's default holds. */
export const ATTRIBUTION_PREFERENCE = 'git.attribution';

/** `GET`/`PUT /api/git/projects/:projectId`: what a project's runs do with git. */
export interface GitProjectSettings {
  readonly attribution: CommitAttribution;
}

/** The trailer that names an agent as co-author. */
export function agentCoAuthor(agent: {
  readonly id: string;
  readonly name: string;
}): string {
  return `Co-authored-by: ${agent.name.replace(/[<>\n]/gu, '').trim() || 'Agent'} <agent+${agent.id}@studio.noreply>`;
}

/** The longest token Studio stores. */
export const GIT_TOKEN_MAX = 500;
/** The longest private key Studio stores. */
export const GIT_PRIVATE_KEY_MAX = 10_000;
/** A webhook secret's length: GitHub signs with any, Studio asks for one hard to guess. */
export const WEBHOOK_SECRET_MIN = 16;
export const WEBHOOK_SECRET_MAX = 200;
