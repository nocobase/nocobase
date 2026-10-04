import { ApiClientError, type ApiClient } from '@nocobase/app-client';
import type {
  AppDetail,
  AppOverview,
  AppSummary,
  ConfigMode,
  ApiResponse,
  ListResponse,
  PageMeta,
  ReleaseRecord,
} from './types.js';

export type AppManagementStatus =
  | 'host-unavailable'
  | 'deployment-pending'
  | 'not-deployed'
  | 'failed'
  | 'running'
  | 'ready'
  | 'stopped'
  | 'unknown';

export type AppActionReason =
  | 'operationInProgress'
  | 'hostUnavailable'
  | 'deploymentInProgress'
  | 'deployReleaseFirst'
  | 'notRunning'
  | 'currentDeployment'
  | 'deploymentNotSucceeded'
  | 'unavailable';

export interface AppActionState {
  readonly enabled: boolean;
  readonly reason?: AppActionReason;
}

export function appManagementStatus(
  app: AppSummary | AppOverview | AppDetail,
): AppManagementStatus {
  if (!app.runtime.hostAvailable) return 'host-unavailable';
  if (app.hasPendingDeployment || app.runtime.state === 'pending') {
    return 'deployment-pending';
  }
  if (!app.app.currentDeploymentId) return 'not-deployed';
  if (app.runtime.state === 'failed') return 'failed';
  if (app.runtime.state === 'running') return 'running';
  const activation =
    'deployment' in app ? app.deployment.activation : app.startupMode;
  if (app.runtime.state === 'stopped') {
    return app.enabled && activation === 'lazy' ? 'ready' : 'stopped';
  }
  return 'unknown';
}

export function appActionState(
  app: AppSummary | AppOverview | AppDetail,
  action: 'start' | 'stop' | 'restart' | 'deploy' | 'rollback',
  busy = false,
): AppActionState {
  if (busy) return { enabled: false, reason: 'operationInProgress' };
  if (action === 'deploy' && !app.hasReleases) {
    return { enabled: false, reason: 'deployReleaseFirst' };
  }
  if ((action === 'deploy' || action === 'rollback') && !('runtime' in app)) {
    return { enabled: true };
  }
  const status = appManagementStatus(app);
  if (status === 'host-unavailable') {
    return { enabled: false, reason: 'hostUnavailable' };
  }
  if (status === 'deployment-pending') {
    return { enabled: false, reason: 'deploymentInProgress' };
  }
  if (action === 'deploy' || action === 'rollback') {
    return { enabled: true };
  }
  if (status === 'not-deployed') {
    return { enabled: false, reason: 'deployReleaseFirst' };
  }
  if (action === 'start') {
    return { enabled: status !== 'running' };
  }
  if (action === 'stop' || action === 'restart') {
    return status === 'running'
      ? { enabled: true }
      : { enabled: false, reason: 'notRunning' };
  }
  return { enabled: false, reason: 'unavailable' };
}

export function appStatusLabel(status: AppManagementStatus): string {
  const labels: Readonly<Record<AppManagementStatus, string>> = {
    'host-unavailable': 'Host unavailable',
    'deployment-pending': 'Deployment pending',
    'not-deployed': 'Not deployed',
    failed: 'Failed',
    running: 'Running',
    ready: 'Ready',
    stopped: 'Stopped',
    unknown: 'Status unavailable',
  };
  return labels[status];
}
export function configModeLabel(mode: ConfigMode): string {
  return mode === 'file'
    ? 'Config file'
    : mode === 'external'
      ? 'External'
      : 'Hub managed';
}

/**
 * Every Release of the App, newest first. The list is paged on the server, so this reads page after page until it
 * has them all: the workspace offers any of them for deployment.
 */
export async function loadReleases(
  api: ApiClient,
  appId: string,
): Promise<ReleaseRecord[]> {
  const releases: ReleaseRecord[] = [];
  for (let page = 1; ; page += 1) {
    const response = await api.request<ListResponse<ReleaseRecord, PageMeta>>({
      path: `hub/apps/${encodeURIComponent(appId)}/releases`,
      query: { page, pageSize: 100 },
    });
    releases.push(...response.data);
    if (
      response.data.length === 0 ||
      response.meta.page * response.meta.pageSize >= response.meta.total
    )
      return releases;
  }
}

export async function uploadArtifact(
  api: ApiClient,
  appId: string,
  artifact: File,
): Promise<ReleaseRecord> {
  const result = await api.request<ApiResponse<ReleaseRecord>>({
    path: `hub/apps/${appId}/releases`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/gzip',
    },
    body: artifact,
  });
  return result.data;
}

export function isClientRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function shortId(value: string): string {
  return `#${value.slice(0, 8)}`;
}

export function applicationUrl(app: AppDetail): string | null {
  if (!app.hostUrl || !hasDeployment(app)) return null;
  if (app.hostUrl === '/')
    return `/${app.deployment.basePath.replace(/^\/+|\/+$/gu, '')}/`;
  try {
    return new URL(
      app.deployment.basePath.replace(/^\//u, ''),
      ensureSlash(app.hostUrl),
    ).toString();
  } catch {
    return null;
  }
}

export function hasDeployment(app: AppDetail): boolean {
  return (
    app.deployment.desiredReleaseId !== null ||
    app.deployment.observedReleaseId !== null
  );
}

export function ensureSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

export function initials(value: string): string {
  return value
    .split(/\s+/u)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function stateLabel(value: string): string {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : 'Unknown';
}

export function deploymentPhaseLabel(value: string): string {
  const labels: Readonly<Record<string, string>> = {
    resolving: 'Preparing release',
    verifying: 'Verifying release',
    extracting: 'Extracting files',
    preparing: 'Preparing application',
    starting: 'Starting application',
    health_check: 'Checking application health',
    switching: 'Activating release',
    cleaning: 'Cleaning up',
  };
  return labels[value] ?? stateLabel(value.replaceAll('_', ' '));
}

// `locale` is the application's language, from `useTranslation().i18n.language`. Omitting it falls back to the
// browser's own locale, which is a different language from the one the user chose in the application.
export function formatDate(value: string, locale?: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) || date.valueOf() <= 0
    ? '—'
    : new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
}

export function formatDateTime(value: string, locale?: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) || date.valueOf() <= 0
    ? '—'
    : new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export interface ReadableError {
  /** The `reason` of the server's error body, which is what code branches on. */
  readonly reason?: string;
  readonly status?: number;
  readonly isTechnical: boolean;
  readonly message: string;
  readonly technicalMessage: string;
}

const FALLBACK_ERROR_MESSAGE = 'The operation could not be completed.';

function serializeError(value: unknown): string {
  if (value instanceof Error) {
    return value.message || value.name;
  }
  if (typeof value === 'string') return value;
  try {
    const serialized = JSON.stringify(value, null, 2);
    return serialized ?? String(value);
  } catch {
    return String(value);
  }
}

function isTechnicalMessage(value: string): boolean {
  return /(?:ENOENT|EACCES|ECONNREFUSED|ETIMEDOUT|node:|\/(?:private|var|tmp|Users|home)\/|\bat\s+\S+\s+\()/iu.test(
    value,
  );
}

/**
 * What the interface shows for a failure. A failed request is an `ApiClientError`, whose `reason` identifies the
 * error; anything else is described by its message alone. A message that looks like a stack or a server path is kept
 * for the technical details and replaced by a generic sentence.
 */
export function readError(value: unknown): ReadableError {
  const message =
    (value instanceof Error ? value.message : undefined) ||
    (typeof value === 'string' ? value : undefined) ||
    FALLBACK_ERROR_MESSAGE;
  const technical = isTechnicalMessage(message);
  const payload = value instanceof ApiClientError ? value.payload : undefined;
  return {
    ...(value instanceof ApiClientError
      ? {
          ...(value.reason === undefined ? {} : { reason: value.reason }),
          status: value.status,
        }
      : {}),
    isTechnical: technical,
    message: technical ? FALLBACK_ERROR_MESSAGE : message,
    technicalMessage:
      payload !== undefined ? serializeError(payload) : serializeError(value),
  };
}
