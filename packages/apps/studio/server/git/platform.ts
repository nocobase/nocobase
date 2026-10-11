/**
 * The git platform adapter: everything Studio asks of a code host, in Studio's own terms. The rest of `studio/server/git`
 * (the service, the poller, webhooks, connections, `nb-studio pr open`) talks to a `GitPlatform` and never to a host's API;
 * `github.ts` is the only implementation, and tests run it against a GitHub stand-in through a mocked `fetch`.
 *
 * What a platform does:
 *
 * - **Pull requests**: open one, update its body, read it (conditionally: a read may carry the validator of the last
 *   answer and get `notModified`, which costs no rate limit), list a repository's, and merge one at a pinned head
 *   commit (the host refuses when the head moved).
 * - **Checks**: every check of a commit, each with its name, status, conclusion and page, folded into one CI state; and
 *   the failed ones with their annotations and the failing part of their logs.
 * - **Commits**: what a pinned commit is, by identity: the open pull requests whose head it is, whether a branch or
 *   another commit holds it, and the tags that point at it (how a CI upload is verified, `../builds`, and which issues a
 *   deployment carries, `../deploys`).
 * - **Repositories**: an account's permission on one, the repositories a credential reaches (paged), and creating one
 *   (with an initial commit and its default branch protected, or empty), generating one from a template repository,
 *   and protecting a branch.
 * - **Workflows**: a repository's workflows, a workflow's newest run, and running a run again (a project's
 *   initialization, `../projects-init`).
 * - **Files, branches and CI secrets**: a file's contents on a branch, writing one as a commit, a branch's head, a
 *   branch created (or moved) at a commit, and a CI secret written encrypted to the repository's key (setting a
 *   repository's CI up, `../builds/ci-setup.ts`).
 * - **Apps**: an app created on the host from a manifest (the form the browser posts, then the code converted into the
 *   app's credentials), its pages (install, settings), and an installation of it by id, with the permissions the
 *   account granted it.
 * - **Credentials**: an app's installation token (to call the API, or a short-lived push credential for some
 *   repositories), the installation of an account, and a person's own authorization: the OAuth web flow, the device
 *   flow, or a personal access token checked by calling the API as it (with its expiry when the host says).
 * - **Webhooks**: verifying a delivery and normalizing it into events: a pull request opened, updated, merged, closed or
 *   reopened, a push (and whether it created the branch), a tag, checks reported on a commit, and a workflow run.
 *
 * Tokens travel only in requests and never appear in errors.
 */
import type {
  GitCheck,
  GitProviderDescriptor,
  PullRequestCiState,
  PullRequestState,
  WebhookDeliveryReason,
} from '../../shared/git.js';

/** A file on a branch: its contents and the host's version of it (what an update names). */
export interface RepoFile {
  readonly sha: string;
  readonly content: string;
}

/** An installation of an app, with the permissions its account granted (`contents: write`, …). */
export interface Installation {
  readonly id: string;
  readonly account: string;
  readonly permissions: Readonly<Record<string, string>>;
  /** Where the account reviews the installation and accepts new permissions; null when the host does not say. */
  readonly htmlUrl: string | null;
}

/** A workflow a repository defines (GitHub Actions). */
export interface Workflow {
  readonly id: string;
  readonly name: string;
  /** `.github/workflows/<file>`. */
  readonly path: string;
  /** `active`, or why it does not run (`disabled_manually`, …). */
  readonly state: string;
  readonly htmlUrl: string | null;
}

/** One run of a workflow. */
export interface WorkflowRun {
  readonly id: string;
  readonly workflowId: string;
  readonly name: string | null;
  readonly path: string;
  readonly headBranch: string | null;
  readonly headSha: string;
  readonly status: string | null;
  readonly conclusion: string | null;
  readonly htmlUrl: string;
  readonly runAttempt: number;
}

/** A credential for one host's API: an installation token, a personal token or a person's OAuth token. */
export interface GitAuth {
  readonly apiBaseUrl: string;
  /** Null for a public repository read without a credential. */
  readonly token: string | null;
}

/** What Studio stores of a pull request (`studioPullRequests`). */
export interface PullRequestSnapshot {
  readonly repo: string;
  readonly number: number;
  readonly url: string;
  readonly title: string;
  readonly body: string | null;
  readonly state: PullRequestState;
  readonly draft: boolean;
  readonly headRef: string;
  readonly baseRef: string;
  readonly headSha: string;
  readonly authorLogin: string;
  readonly mergeableState: string | null;
  readonly mergedAt: string | null;
  readonly mergedByLogin: string | null;
  /** The commit the merge made, only for a merged pull request. */
  readonly mergeCommitSha: string | null;
  readonly closedAt: string | null;
}

/** A pull request read on its own: the snapshot, and the host's mergeability (false on a conflict, null computing). */
export interface PullRequestRead {
  readonly snapshot: PullRequestSnapshot;
  readonly mergeable: boolean | null;
}

/** A conditional read: `notModified` when the validator still matches, else the body and its new validator. */
export type Conditional<T> =
  | { readonly notModified: true }
  | {
      readonly notModified: false;
      readonly body: T;
      readonly etag: string | null;
    };

/** The validators of a commit's two check reads (statuses, check runs). */
export interface CheckEtags {
  readonly status: string | null;
  readonly runs: string | null;
}

/** Every check of a commit, folded (`ciState`) and one by one. */
export interface ChecksRead {
  readonly ciState: PullRequestCiState | null;
  readonly checks: readonly GitCheck[];
  readonly etags: CheckEtags;
}

/** A line a check pointed at, with what it said (a check run's annotation). */
export interface CheckAnnotation {
  readonly path: string;
  readonly startLine: number | null;
  readonly endLine: number | null;
  /** `failure`, `warning` or `notice`. */
  readonly level: string;
  readonly title: string | null;
  readonly message: string;
}

/** A check that failed on a commit, with what explains it: its report, its annotations and its log's failing part. */
export interface FailedCheck {
  readonly id: string;
  readonly name: string;
  /** `failure`, `timed_out` or `cancelled`. */
  readonly conclusion: string;
  readonly url: string | null;
  /** The check's own report: its title and summary, when it wrote one. */
  readonly summary: string | null;
  readonly annotations: readonly CheckAnnotation[];
  /** The failing part of its log (`ci-logs.ts`), or null: see `logUnavailable`. */
  readonly log: string | null;
  /**
   * Why there is no log: `notActions` (a check another CI reported, whose log the host does not have), `unavailable`
   * (gone after its retention, or unreadable), `rateLimited` (the host's rate limit: only the annotations), or `budget`
   * (the commit's logs reached their size limit). Null when `log` is there.
   */
  readonly logUnavailable:
    'notActions' | 'unavailable' | 'rateLimited' | 'budget' | null;
}

/** What an account may do in a repository, from most to least. */
export type RepoPermission =
  'admin' | 'maintain' | 'write' | 'triage' | 'read' | 'none';

/** A repository as a picker lists it. */
export interface RepoSummary {
  /** The host's id, stable across renames. */
  readonly id: string;
  /** `owner/name`. */
  readonly fullName: string;
  readonly owner: string;
  readonly name: string;
  readonly private: boolean;
  readonly defaultBranch: string;
  /** The HTTPS clone URL. */
  readonly cloneUrl: string;
  readonly webUrl: string;
  readonly description: string | null;
  /** A template repository: new repositories may be generated from it. */
  readonly isTemplate: boolean;
}

export interface RepoPage {
  readonly items: readonly RepoSummary[];
  readonly hasMore: boolean;
  /** How many the credential reaches in all, when the host says (an installation's list does); null otherwise. */
  readonly total: number | null;
}

/**
 * Where an app's installation tokens are kept between calls, by a key the platform makes: a value is reused until
 * `expiresAt`. Without one a platform keeps them in memory.
 */
export interface AppTokenCache {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, expiresAt: Date): Promise<void>;
}

/** An app's own credentials: what signs its requests for installation tokens. */
export interface AppCredentials {
  readonly apiBaseUrl: string;
  readonly appId: string;
  /** PEM. */
  readonly privateKey: string;
  /** Where its installation tokens are kept. */
  readonly tokenCache?: AppTokenCache;
}

/** A token with its expiry, such as an installation token or a person's OAuth token. */
export interface ExpiringToken {
  readonly token: string;
  readonly expiresAt: string | null;
}

/** A short-lived credential git pushes and fetches with over HTTPS. */
export interface PushCredential {
  readonly username: string;
  readonly password: string;
  readonly expiresAt: string;
}

/** A person's OAuth tokens. */
export interface OAuthTokens {
  readonly accessToken: string;
  readonly expiresAt: string | null;
  readonly refreshToken: string | null;
  readonly refreshExpiresAt: string | null;
}

/** The account a credential belongs to, as git commits name it. */
export interface PlatformUser {
  readonly id: string;
  readonly login: string;
  readonly name: string | null;
  /** The primary verified address when the credential may read it, else the host's no-reply address. */
  readonly email: string;
  /** When the credential itself expires, when the host says (a personal access token's expiry); else null. */
  readonly tokenExpiresAt: string | null;
}

/** A device authorization started: the code the person enters at `verificationUri`. */
export interface DeviceAuthorization {
  readonly deviceCode: string;
  readonly userCode: string;
  readonly verificationUri: string;
  readonly expiresIn: number;
  readonly interval: number;
}

/** One poll of a device authorization. `disabled`: the app does not allow the device flow. */
export type DevicePoll =
  | { readonly status: 'granted'; readonly tokens: OAuthTokens }
  | {
      readonly status:
        'pending' | 'slowDown' | 'expired' | 'denied' | 'disabled';
      readonly interval?: number;
    };

export interface OAuthClient {
  /** `scheme://host` of the host's web pages. */
  readonly webUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

/** What an app created from a manifest is to be: its name and the URLs on Studio it names. */
export interface AppManifestInput {
  /** The host's web origin. */
  readonly webUrl: string;
  /** The organization that owns the app; null for the person's own account. */
  readonly organization: string | null;
  readonly name: string;
  readonly homepageUrl: string;
  readonly webhookUrl: string;
  /** Off when the host cannot reach Studio (it polls instead). */
  readonly webhookActive: boolean;
  /** Where the host sends the browser back with the code to convert. */
  readonly redirectUrl: string;
  /** Where the host sends a person back after they authorize the app (the OAuth web flow). */
  readonly callbackUrl: string;
  /** Where the host sends the browser back after the app was installed. */
  readonly setupUrl: string;
  /** Opaque, handed back with the code. */
  readonly state: string;
}

/** An app the host created from a manifest, with its credentials. */
export interface CreatedApp {
  readonly appId: string;
  readonly slug: string;
  readonly name: string;
  readonly clientId: string;
  readonly clientSecret: string;
  /** PEM. */
  readonly privateKey: string;
  readonly webhookSecret: string | null;
  /** The organization that owns it; null for a person's own account. */
  readonly organization: string | null;
}

/** A normalized webhook event. */
export type GitEvent =
  | { readonly type: 'ping' }
  | {
      readonly type: 'pullRequest';
      readonly action:
        'opened' | 'updated' | 'ready' | 'reopened' | 'merged' | 'closed';
      readonly snapshot: PullRequestSnapshot;
      /** Whether the delivery said anything about mergeability; when not, what Studio knows stays. */
      readonly mergeableReported: boolean;
    }
  | {
      readonly type: 'push';
      readonly branch: string;
      /** Whether the push created the branch (its first commit when `before` is all zeros). */
      readonly created: boolean;
      readonly before: string | null;
      readonly after: string | null;
    }
  | {
      readonly type: 'workflowRun';
      readonly action: 'requested' | 'in_progress' | 'completed';
      readonly run: WorkflowRun;
    }
  | { readonly type: 'tag'; readonly tag: string }
  | {
      readonly type: 'checks';
      readonly sha: string;
      /** What the delivery itself says, for when the host cannot be read. */
      readonly reported: PullRequestCiState | null;
    };

/** A delivery as a platform reads it: its id and event name, which repository and installation it is about, and what it says. */
export interface WebhookParse {
  readonly deliveryId: string | null;
  readonly event: string | null;
  /** `owner/name`, when the delivery names one. */
  readonly repo: string | null;
  readonly installationId: string | null;
  /** The event, or why Studio has nothing to do with it. */
  readonly result:
    | { readonly event: GitEvent }
    | {
        readonly ignored: Extract<
          WebhookDeliveryReason,
          'notJson' | 'unsupportedEvent' | 'unsupportedAction' | 'noRuns'
        >;
      };
}

export interface GitPlatform {
  /** Which provider it is, and what it offers (`providers.ts`). */
  readonly descriptor: GitProviderDescriptor;
  /** Where a host's REST API is, from its web origin (`overrides` by host, `studio.git.apiBaseUrls`). */
  apiBaseUrlOf(
    webUrl: string,
    overrides?: Readonly<Record<string, string>>,
  ): string;

  // --- Pull requests -----------------------------------------------------------------------------------------------
  /** The most recently updated first. */
  listPullRequests(
    auth: GitAuth,
    repo: string,
    etag: string | null,
  ): Promise<Conditional<PullRequestSnapshot[]>>;
  getPullRequest(
    auth: GitAuth,
    repo: string,
    number: number,
    etag: string | null,
  ): Promise<Conditional<PullRequestRead>>;
  openPullRequest(
    auth: GitAuth,
    repo: string,
    input: {
      readonly title: string;
      readonly body: string;
      readonly head: string;
      readonly base: string;
      readonly draft: boolean;
    },
  ): Promise<PullRequestRead>;
  updatePullRequestBody(
    auth: GitAuth,
    repo: string,
    number: number,
    body: string,
  ): Promise<PullRequestSnapshot>;
  /** Changes what is given: the title, the body, the base branch, or open/closed (`state`). */
  updatePullRequest(
    auth: GitAuth,
    repo: string,
    number: number,
    input: {
      readonly title?: string;
      readonly body?: string;
      readonly base?: string;
      readonly state?: 'open' | 'closed';
    },
  ): Promise<PullRequestSnapshot>;
  /** Turns it into a draft, or marks it ready for review. */
  setPullRequestDraft(
    auth: GitAuth,
    repo: string,
    number: number,
    draft: boolean,
  ): Promise<PullRequestSnapshot>;
  /** Comments on the pull request's conversation. */
  commentOnPullRequest(
    auth: GitAuth,
    repo: string,
    number: number,
    body: string,
  ): Promise<void>;
  /** Squash-merges at `sha`; refused (409) when the head moved. */
  mergePullRequest(
    auth: GitAuth,
    repo: string,
    number: number,
    input: { readonly sha: string; readonly commitTitle: string },
  ): Promise<{ sha: string }>;

  // --- Checks ------------------------------------------------------------------------------------------------------
  /** Every check of a commit; `notModified` only when both reads still match their validators. */
  getChecks(
    auth: GitAuth,
    repo: string,
    sha: string,
    etags: CheckEtags,
  ): Promise<
    | { readonly notModified: true }
    | ({ readonly notModified: false } & ChecksRead)
  >;

  /**
   * The checks that failed on a commit, with their annotations and, for a CI job the host runs, the failing part of its
   * log. Read only on demand (a person or an agent looking into a failure), never while polling. Refused (the rate limit
   * included) when the commit's checks cannot be read; a log or annotations that cannot be are left out.
   */
  failedChecks(
    auth: GitAuth,
    repo: string,
    sha: string,
  ): Promise<FailedCheck[]>;

  // --- Commits -----------------------------------------------------------------------------------------------------
  /** The open pull requests whose head commit is `sha`. */
  openPullRequestsAt(
    auth: GitAuth,
    repo: string,
    sha: string,
  ): Promise<PullRequestSnapshot[]>;
  /** Whether `branch` holds `sha`: its head, or an ancestor of it. False for an unknown commit. */
  branchContains(
    auth: GitAuth,
    repo: string,
    branch: string,
    sha: string,
  ): Promise<boolean>;
  /**
   * Whether `head` contains `sha`: it is `head`, or an ancestor of it (the compare API, `sha...head`). False for an
   * unknown commit.
   */
  commitContains(
    auth: GitAuth,
    repo: string,
    head: string,
    sha: string,
  ): Promise<boolean>;
  /** The branches whose head is `sha`. */
  branchesAt(auth: GitAuth, repo: string, sha: string): Promise<string[]>;
  /** The tags that point at `sha` (an annotated tag by its commit). */
  tagsAt(auth: GitAuth, repo: string, sha: string): Promise<string[]>;

  // --- Repositories ------------------------------------------------------------------------------------------------
  repoPermission(
    auth: GitAuth,
    repo: string,
    login: string,
  ): Promise<RepoPermission>;
  /** The repositories the credential reaches: an installation's, or a person's or a token's own. */
  listRepos(
    auth: GitAuth,
    source: 'installation' | 'user',
    page: { readonly page: number; readonly perPage: number },
  ): Promise<RepoPage>;
  /**
   * Creates a repository with an initial commit, then protects its default branch; `protected` says whether that
   * worked. With `empty`, the repository has no commit and no branch, so nothing is protected.
   */
  createRepo(
    auth: GitAuth,
    input: {
      readonly owner: string;
      /** Whether `owner` is an organization (else the credential's own account). */
      readonly organization: boolean;
      readonly name: string;
      readonly private: boolean;
      readonly description: string | null;
      readonly empty?: boolean;
    },
  ): Promise<{ repo: RepoSummary; protected: boolean }>;
  /** Protects `branch` (no force pushes or deletions, changes through pull requests); false when the host refuses. */
  protectBranch(auth: GitAuth, repo: string, branch: string): Promise<boolean>;
  /** One repository the credential reaches, or null when it reaches none by that name. */
  getRepo(auth: GitAuth, repo: string): Promise<RepoSummary | null>;
  /**
   * Generates a repository from a template repository (`template`, `owner/name`). Its default branch is left
   * unprotected: an initialization workflow may still commit to it (`protectBranch` once it is done).
   */
  generateRepo(
    auth: GitAuth,
    template: string,
    input: {
      readonly owner: string;
      readonly name: string;
      readonly private: boolean;
      readonly description: string | null;
    },
  ): Promise<RepoSummary>;

  // --- Workflows ---------------------------------------------------------------------------------------------------
  /** The repository's workflows (every page). */
  listWorkflows(auth: GitAuth, repo: string): Promise<Workflow[]>;
  /** The newest run of a workflow (`workflowId`, an id or a file name), or null when it never ran. */
  latestWorkflowRun(
    auth: GitAuth,
    repo: string,
    workflowId: string,
  ): Promise<WorkflowRun | null>;
  /** Runs a workflow run again, as a new attempt. */
  rerunWorkflowRun(auth: GitAuth, repo: string, runId: string): Promise<void>;

  // --- Files, branches and CI secrets -------------------------------------------------------------------------------
  /** A text file on a branch, or null when there is none. */
  readFile(
    auth: GitAuth,
    repo: string,
    path: string,
    branch: string,
  ): Promise<RepoFile | null>;
  /** Writes a text file as one commit on `branch`; `sha` names the version replaced (none to create it). */
  putFile(
    auth: GitAuth,
    repo: string,
    input: {
      readonly path: string;
      readonly content: string;
      readonly message: string;
      readonly branch: string;
      readonly sha?: string | null;
    },
  ): Promise<{ readonly sha: string; readonly commitSha: string }>;
  /** The head commit of a branch, or null when there is no such branch. */
  branchSha(
    auth: GitAuth,
    repo: string,
    branch: string,
  ): Promise<string | null>;
  /** Creates `name` at `fromSha`, or moves it there when it exists. */
  createBranch(
    auth: GitAuth,
    repo: string,
    input: { readonly name: string; readonly fromSha: string },
  ): Promise<void>;
  /** Writes a CI secret (GitHub: an Actions repository secret), encrypted to the repository's own key. */
  setCiSecret(
    auth: GitAuth,
    repo: string,
    input: { readonly name: string; readonly value: string },
  ): Promise<void>;

  // --- Credentials -------------------------------------------------------------------------------------------------
  /** The account a credential belongs to. */
  currentUser(auth: GitAuth): Promise<PlatformUser>;
  /** The installation of an app on an account (an organization or a user), or null. */
  findInstallation(
    app: AppCredentials,
    account: string,
  ): Promise<string | null>;
  /**
   * An installation token: for the API with the installation's permissions, or, with `repositories`, limited to them
   * and to writing their contents (a push credential).
   */
  installationToken(
    app: AppCredentials,
    installationId: string,
    options?: { readonly repositories?: readonly string[] },
  ): Promise<ExpiringToken>;
  /** An installation of the app by its id, with the account it is on; null when it is not the app's. */
  getInstallation(
    app: AppCredentials,
    installationId: string,
  ): Promise<Installation | null>;
  /** The permissions Studio's app asks for that `granted` (an installation's) lacks, as `name:level`. */
  missingPermissions(granted: Readonly<Record<string, string>>): string[];
  /** The form that creates the app on the host from a manifest, posted by the person's browser. */
  appManifestForm(input: AppManifestInput): {
    readonly action: string;
    readonly manifest: string;
  };
  /** Exchanges the code the host sent back for the app it created and its credentials. */
  convertAppManifest(apiBaseUrl: string, code: string): Promise<CreatedApp>;
  /** An app's pages on the host: where it is installed, and its settings. */
  appUrls(
    webUrl: string,
    app: { readonly slug: string; readonly organization: string | null },
  ): { readonly install: string; readonly settings: string };
  /** How git authenticates with an installation token over HTTPS. */
  pushCredential(token: ExpiringToken): PushCredential;
  /** Where a person authorizes the app. */
  authorizeUrl(
    client: Omit<OAuthClient, 'clientSecret'>,
    input: { readonly redirectUri: string; readonly state: string },
  ): string;
  exchangeCode(
    client: OAuthClient,
    input: { readonly code: string; readonly redirectUri: string },
  ): Promise<OAuthTokens>;
  refreshToken(client: OAuthClient, refreshToken: string): Promise<OAuthTokens>;
  /** Starts the device flow: the code a person enters on the host; null when the app does not allow the flow. */
  startDeviceAuthorization(
    client: Omit<OAuthClient, 'clientSecret'>,
  ): Promise<DeviceAuthorization | null>;
  /** Asks once whether the person entered the code. */
  pollDeviceAuthorization(
    client: Omit<OAuthClient, 'clientSecret'>,
    deviceCode: string,
  ): Promise<DevicePoll>;

  // --- Webhooks ----------------------------------------------------------------------------------------------------
  /** The event a delivery names, read before it is verified (to record what an unverified one claimed to be). */
  webhookEventOf(headers: (name: string) => string | null): string | null;
  /** Whether the delivery is signed with `secret`. */
  verifyWebhook(
    secret: string,
    body: Uint8Array,
    headers: (name: string) => string | null,
  ): Promise<boolean>;
  parseWebhook(
    body: Uint8Array,
    headers: (name: string) => string | null,
  ): WebhookParse;
}

/**
 * A host's answer that is not a success; `status` 0 when it could not be reached. Never carries a token. `retryAt` is
 * set only when the host refused because of its rate limit: when it says the limit lifts.
 */
export class GitApiError extends Error {
  public readonly retryAt: string | null;

  public constructor(
    public readonly status: number,
    message: string,
    options: { readonly retryAt?: string | null } = {},
  ) {
    super(message);
    this.name = 'GitApiError';
    this.retryAt = options.retryAt ?? null;
  }

  /** Whether the host refused because of its rate limit. */
  public get rateLimited(): boolean {
    return this.retryAt !== null;
  }
}
