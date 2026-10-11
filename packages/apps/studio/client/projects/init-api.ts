/**
 * New projects and their initialization in the browser (`/api/projectSetups`, `server/projects-init/routes.ts`), and a
 * working directory added to a project (`/api/projects/:projectId/codeLocations`).
 */
import type { ApiClient } from '@nocobase/app-client';

import type {
  AddCodeLocationRequest,
  CodeLocationResult,
  NewProjectRequest,
  NewProjectResult,
  ProjectInitView,
} from '../../shared/project-init.js';

export const projectInitKeys = {
  init: (projectId: string) => ['studio', 'project-init', projectId] as const,
};

export class ProjectInitApi {
  public constructor(private readonly api: ApiClient) {}

  public async create(input: NewProjectRequest): Promise<NewProjectResult> {
    return (
      await this.api.request<{ data: NewProjectResult }>({
        method: 'POST',
        path: 'projectSetups',
        json: input,
      })
    ).data;
  }

  /** Adds a working directory to the project, a new repository created now. */
  public async addCodeLocation(
    projectId: string,
    input: AddCodeLocationRequest,
  ): Promise<CodeLocationResult> {
    return (
      await this.api.request<{ data: CodeLocationResult }>({
        method: 'POST',
        path: `projects/${encodeURIComponent(projectId)}/codeLocations`,
        json: input,
      })
    ).data;
  }

  /** The project's initialization, or null when it has none. */
  public async init(
    projectId: string,
    signal?: AbortSignal,
  ): Promise<ProjectInitView | null> {
    return (
      await this.api.request<{ data: ProjectInitView | null }>({
        path: `projectSetups/${encodeURIComponent(projectId)}`,
        signal,
      })
    ).data;
  }

  /** Runs the failed initialization workflow again. */
  public async retry(projectId: string): Promise<ProjectInitView> {
    return (
      await this.api.request<{ data: ProjectInitView }>({
        method: 'POST',
        path: `projectSetups/${encodeURIComponent(projectId)}/retry`,
      })
    ).data;
  }
}
