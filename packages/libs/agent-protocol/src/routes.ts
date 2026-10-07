/**
 * Where each message is sent. Paths are relative to the application's origin (including any base path the
 * application is served under). `:runId`, `:jobId` and the like are path parameters; fill them with `routePath`.
 *
 * Every endpoint is the agents plugin's (`@nocobase/app-plugin-agents`), under its namespace `/api/agents`: the runner
 * protocol under `/api/agents/runners` (a run's own endpoints, skills and mounts there too, served under the runner's
 * key), the distribution under `/api/agents/dist`, the run's own under `/api/agents/runs/current`, and the CLI's custom
 * commands under `/api/agents/cli`; the CLI's manifest is the application's, `GET /api/cli/manifest`.
 *
 * Every JSON answer is `{ data }` (`{ data, meta }` for a list); a failure is the standard error body (`errors.ts`).
 *
 * Headers:
 *
 * - Every request sends `content-type: application/json` (except a multipart command upload).
 * - Runner endpoints send `HEADERS.protocol` with `PROTOCOL_VERSION` and authenticate with `HEADERS.runnerKey`, except
 *   `register`, which carries its one-time registration token in the body.
 * - Run endpoints authenticate with `HEADERS.runToken`; they are what the CLI calls during a run.
 * - CLI endpoints accept `HEADERS.runToken` during a run, or a personal API key (`x-api-key`) for a person; so does every
 *   API route whose security lists the run token.
 *
 * No other header is required, and credentials never travel in a query string.
 */
export const RUNNER_BASE = '/api/agents/runners';
export const RUN_BASE = '/api/agents/runs/current';
export const CLI_BASE = '/api/agents/cli';

export const RUNNER_ROUTES = {
  /** `POST` `RegisterRequest` → `RegisterResponse`. */
  register: '/api/agents/runners/register',
  /** `POST` `HeartbeatRequest` → `HeartbeatResponse`. */
  heartbeat: '/api/agents/runners/heartbeat',
  /** `POST` `ClaimRequest` → `ClaimResponse`; `?wait=true` holds the request up to `pollTimeoutMs` when there is no work. */
  claim: '/api/agents/runners/claim',
  /** `POST` `LeaseRequest` → `LeaseResponse`. */
  lease: '/api/agents/runners/runs/:runId/lease',
  /** `POST` `StartRequest` → `StartResponse`. */
  start: '/api/agents/runners/runs/:runId/start',
  /** `POST` `EventsRequest` → `EventsResponse`. */
  events: '/api/agents/runners/runs/:runId/events',
  /** `GET` → `StatusResponse`. */
  status: '/api/agents/runners/runs/:runId/status',
  /** `POST` `CompleteRequest` → `FinishResponse`. */
  complete: '/api/agents/runners/runs/:runId/complete',
  /** `POST` `FailRequest` → `FinishResponse`. */
  fail: '/api/agents/runners/runs/:runId/fail',
  /** `POST` `CancelAckRequest` → `FinishResponse`. */
  cancelAck: '/api/agents/runners/runs/:runId/cancelAck',
  /** `GET` → `SkillBundle`: one of the run's skills (`RunSkill.bundleUrl`), while the runner holds the run. */
  skill: '/api/agents/runners/runs/:runId/skills/:slug',
  /** `GET` → `MountBundle`: one of the run's mounts (`RunMount.bundleUrl`), while the runner holds the run. */
  mount: '/api/agents/runners/runs/:runId/mounts/:name',
  /** `POST` `{}` → `JobLeaseResponse`: renews a job's lease. Jobs (`jobs.ts`) are claimed through `claim`. */
  jobLease: '/api/agents/runners/jobs/:jobId/lease',
  /** `POST` `JobStartRequest` → `JobLeaseResponse`. */
  jobStart: '/api/agents/runners/jobs/:jobId/start',
  /** `POST` `JobEventsRequest` → `EventsResponse`. */
  jobEvents: '/api/agents/runners/jobs/:jobId/events',
  /** `GET` → `JobStatusResponse`. */
  jobStatus: '/api/agents/runners/jobs/:jobId/status',
  /** `POST` `JobCompleteRequest` → `JobFinishResponse`. */
  jobComplete: '/api/agents/runners/jobs/:jobId/complete',
  /** `POST` `JobFailRequest` → `JobFinishResponse`. */
  jobFail: '/api/agents/runners/jobs/:jobId/fail',
  /** `POST` `{}` → `JobFinishResponse`. */
  jobCancelAck: '/api/agents/runners/jobs/:jobId/cancelAck',
} as const;

/**
 * Distribution (`dist.ts`): the runner and the application's CLI as standalone tarballs, and the install script.
 * The script itself needs no credential; everything else accepts a runner key, an unused registration token
 * (`HEADERS.registrationToken`, so the install script can download before it registers), a download token
 * (`HEADERS.downloadToken`, the CLI alone for one platform), or a signed-in person.
 */
export const DIST_BASE = '/api/agents/dist';

export const DIST_ROUTES = {
  /** `GET` → the shell script behind "Add runner"'s one-line install (`text/x-shellscript`); no credential. */
  installScript: '/api/agents/dist/installScript',
  /** `GET` → `DistManifest`. */
  manifest: '/api/agents/dist/manifest',
  /**
   * `GET` → `DistArtifact`: the current version of `:product` for `:target`, or 404 `PLATFORM_UNSUPPORTED`.
   * `?format=env` answers `key=value` lines (`version`, `url`, `sha256`, `size`) for a shell to read.
   */
  resolve: '/api/agents/dist/products/:product/targets/:target',
  /** `GET` → the tarball bytes, with `x-checksum-sha256`. An artifact's `url` names it. */
  file: '/api/agents/dist/products/:product/versions/:version/files/:file',
  /** `POST` → a short-lived download token a signed-in person hands to the install script (`HEADERS.downloadToken`). */
  downloadTokens: '/api/agents/dist/downloadTokens',
} as const;

export const RUN_ROUTES = {
  /** `GET` → `RunSelf`: the run the token belongs to, with its pending input. */
  self: '/api/agents/runs/current',
  /** `GET` → what the application knows about the run's subject, as it chooses to describe it. */
  context: '/api/agents/runs/current/context',
} as const;

export const CLI_ROUTES = {
  /**
   * `GET` → the application's command manifest for the caller (`CliManifest` of `@nocobase/app-server/router`): every
   * command its API document describes, each an API route.
   */
  manifest: '/api/cli/manifest',
} as const;

/** `path` with its `:name` parameters replaced, URI-encoded. */
export function routePath(
  path: string,
  params: Readonly<Record<string, string>>,
): string {
  return path.replace(/:([A-Za-z]+)/gu, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : encodeURIComponent(value);
  });
}
