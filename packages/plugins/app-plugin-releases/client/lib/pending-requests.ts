import type { DeploymentRequestView } from '../../shared/releases.js';

/** Whether an App has a pending request, and whether the caller may decide one of them: by App id. */
export type PendingApps = ReadonlyMap<string, { readonly decidable: boolean }>;

export function pendingByApp(
  requests: readonly DeploymentRequestView[],
): PendingApps {
  const apps = new Map<string, { decidable: boolean }>();
  for (const request of requests) {
    if (request.status !== 'pending') continue;
    const decidable =
      (apps.get(request.appId)?.decidable ?? false) ||
      request.decidable === true;
    apps.set(request.appId, { decidable });
  }
  return apps;
}
