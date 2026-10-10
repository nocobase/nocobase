/**
 * Where a repository's CI stands, from what CI reported (`CiReportedApp`, `shared/ci-modes.ts`): every App a build was
 * reported for, in the environment the App runs in, with its last build and last upload; and the Apps recorded for the
 * repository (`studioRepoApps`) that no build names, which are not connected.
 *
 * A build of a pull request (or of an App named `<appId>-pr-<n>`) counts for the application `<appId>`: the row of
 * its pull requests' Apps. The environment is the App's own (`environmentOf`: the App, else its preview, else its
 * link), never guessed from its name; a pull request's App gone with its pull request falls back to the Preview
 * environment, and any other App nobody knows any more is left out. An App is connected only by its own builds:
 * another App's reports say nothing of it.
 *
 * Someone may take an App off the list (`hidden`, `ci-setup.ts` `removeApp`): the builds reported until then no
 * longer count for it, so it shows again once CI reports it again.
 */
import {
  CI_PREVIEW_ENVIRONMENT,
  type CiReportedApp,
} from '../../shared/ci-modes.js';
import type { BuildRecord } from './store.js';

const PREVIEW_APP = /^(.+)-pr-\d+$/u;

/** A pull request's App's application: `crm` of `crm-pr-12`. */
export function previewBaseOf(appId: string): string {
  return PREVIEW_APP.exec(appId)?.[1] ?? appId;
}

/** An App taken off the list, and when: builds reported until then do not count for it. */
export interface HiddenCiApp {
  readonly environmentId: string;
  readonly appId: string;
  readonly pullRequests: boolean;
  readonly hiddenAt: Date;
}

/** The key of a row: its environment, App and whether it stands for pull requests. */
export const ciRowKey = (row: {
  readonly environmentId: string;
  readonly appId: string;
  readonly pullRequests: boolean;
}): string =>
  `${row.environmentId}\u0000${row.appId}\u0000${row.pullRequests ? 'pr' : 'app'}`;

export function reportedApps(input: {
  readonly builds: readonly BuildRecord[];
  /** The Apps recorded for the repository, each in its environment. */
  readonly recorded: readonly {
    readonly appId: string;
    readonly environmentId: string;
  }[];
  /** The environment an App runs in, or ran in; null when nobody knows it. */
  readonly environmentOf: (appId: string) => string | null;
  readonly hidden?: readonly HiddenCiApp[];
}): CiReportedApp[] {
  const hidden = new Map(
    (input.hidden ?? []).map((entry) => [ciRowKey(entry), entry.hiddenAt]),
  );
  const found = new Map<string, CiReportedApp>();
  const later = (a: string | null, b: Date | null): string | null => {
    const candidate = b?.toISOString() ?? null;
    if (!a) return candidate;
    if (!candidate) return a;
    return candidate > a ? candidate : a;
  };
  for (const build of input.builds) {
    const pullRequests =
      build.pullRequestId !== null || PREVIEW_APP.test(build.appId);
    const environmentId =
      input.environmentOf(build.appId) ??
      (pullRequests ? CI_PREVIEW_ENVIRONMENT : null);
    if (!environmentId) continue;
    const appId = pullRequests ? previewBaseOf(build.appId) : build.appId;
    const key = ciRowKey({ environmentId, appId, pullRequests });
    const hiddenAt = hidden.get(key);
    if (hiddenAt && build.updatedAt.getTime() <= hiddenAt.getTime()) continue;
    const current = found.get(key);
    const newer =
      !current?.lastBuildAt ||
      build.updatedAt.toISOString() > current.lastBuildAt;
    found.set(key, {
      environmentId,
      appId,
      pullRequests,
      lastBuildAt: newer
        ? build.updatedAt.toISOString()
        : (current?.lastBuildAt ?? null),
      lastBuildState: newer
        ? build.state
        : (current?.lastBuildState ?? build.state),
      lastDeployAt: later(current?.lastDeployAt ?? null, build.uploadedAt),
      connected: true,
    });
  }
  for (const link of input.recorded) {
    const environmentId = input.environmentOf(link.appId) ?? link.environmentId;
    const key = ciRowKey({
      environmentId,
      appId: link.appId,
      pullRequests: false,
    });
    if (found.has(key)) continue;
    found.set(key, {
      environmentId,
      appId: link.appId,
      pullRequests: false,
      lastBuildAt: null,
      lastBuildState: null,
      lastDeployAt: null,
      connected: false,
    });
  }
  return [...found.values()].sort(
    (a, b) =>
      (b.lastBuildAt ?? '').localeCompare(a.lastBuildAt ?? '') ||
      a.appId.localeCompare(b.appId),
  );
}
