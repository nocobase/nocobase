/** The browser side of `/api/previews` and `/api/deploys` (`shared/previews.ts`). */
import type { ApiClient } from '@nocobase/app-client';

import type {
  DeployMarks,
  IssuePreviews,
  PreviewListItem,
  PreviewVariablesInput,
  ProjectEnvironments,
  UnreleasedIssues,
} from '../../shared/previews.js';

export const previewKeys = {
  issue: (issueId: string) => ['studio', 'previews', 'issue', issueId] as const,
  marks: (issueId: string) => ['studio', 'deploys', 'marks', issueId] as const,
  unreleased: (projectId: string) =>
    ['studio', 'deploys', 'unreleased', projectId] as const,
  environments: (projectId: string) =>
    ['studio', 'deploys', 'environments', projectId] as const,
  project: (projectId: string) =>
    ['studio', 'previews', 'project', projectId] as const,
};

/** The issue's previews, with the first administrator's password for whoever may edit the issue. */
export async function readPreviews(
  api: ApiClient,
  issue: string,
): Promise<IssuePreviews> {
  return (
    await api.request<{ data: IssuePreviews }>({
      path: 'previews/status',
      query: { issueId: issue, adminPassword: 'true' },
    })
  ).data;
}

/** Destroys the issue's preview of one App, then reads the issue's previews again. */
export async function destroyPreview(
  api: ApiClient,
  issue: string,
  appId: string,
): Promise<IssuePreviews> {
  await api.request({
    method: 'POST',
    path: 'previews/down',
    json: { issueId: issue, appId },
  });
  return readPreviews(api, issue);
}

/** Deploys the head's build of one preview again, then reads the issue's previews again. */
export async function retryPreview(
  api: ApiClient,
  issue: string,
  appId: string,
): Promise<IssuePreviews> {
  await api.request({
    method: 'POST',
    path: 'previews/retry',
    json: { issueId: issue, appId },
  });
  return readPreviews(api, issue);
}

/** Saves what a blocked preview misses (it then deploys), then reads the issue's previews again. */
export async function setPreviewVariables(
  api: ApiClient,
  input: PreviewVariablesInput,
): Promise<IssuePreviews> {
  await api.request({
    method: 'POST',
    path: 'previews/variables',
    json: input,
  });
  return readPreviews(api, input.issueId);
}

export async function readMarks(
  api: ApiClient,
  issueIds: readonly string[],
): Promise<DeployMarks> {
  return (
    await api.request<{ data: DeployMarks }>({
      path: 'deploys/marks',
      query: { issueIds: issueIds.join(',') },
    })
  ).data;
}

/** What runs on the project's staging and production Apps. */
export async function readEnvironments(
  api: ApiClient,
  projectId: string,
): Promise<ProjectEnvironments> {
  return (
    await api.request<{ data: ProjectEnvironments }>({
      path: `deploys/projects/${encodeURIComponent(projectId)}/environments`,
    })
  ).data;
}

export async function readUnreleased(
  api: ApiClient,
  projectId: string,
): Promise<UnreleasedIssues> {
  return (
    await api.request<{ data: UnreleasedIssues }>({
      path: `deploys/projects/${encodeURIComponent(projectId)}/unreleasedIssues`,
    })
  ).data;
}

/** The live previews of one project's issues the viewer may see. */
export async function readProjectPreviews(
  api: ApiClient,
  projectId: string,
): Promise<PreviewListItem[]> {
  return (
    await api.request<{ data: PreviewListItem[] }>({
      path: 'previews',
      query: { projectId },
    })
  ).data;
}

/** An App address as a link: a path on Studio's origin is made absolute. */
export function absoluteUrl(url: string): string {
  if (/^https?:\/\//iu.test(url)) return url;
  return new URL(url, window.location.origin).toString();
}
