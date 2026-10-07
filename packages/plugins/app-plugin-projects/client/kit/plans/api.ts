/**
 * The browser API of `/api/projects/plans` and `/api/projects/intake` (`shared/plans.ts`, `shared/intake.ts`,
 * `shared/intake-ai.ts`), and their query keys. The keys sit under `['pm', 'plans']`, so the plugin's realtime refresh (domain `plans`) and a refresh of
 * everything reach them.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import type { QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Page } from '../../../shared/common.js';
import type {
  IntakeAiAvailability,
  IntakeAiJob,
  IntakeAiStartRequest,
} from '../../../shared/intake-ai.js';
import type {
  IntakeFile,
  IntakeSplitRequest,
  IntakeSplitResult,
  IntakeTextsResult,
} from '../../../shared/intake.js';
import type {
  CreatePlanRequest,
  EditPlanRequest,
  Plan,
  PlanListQuery,
  PlanRehearsal,
  PlanUndoPreview,
} from '../../../shared/plans.js';

export const planKeys = {
  all: ['pm', 'plans'] as const,
  plan: (id: string): QueryKey => ['pm', 'plans', 'one', id],
  list: (query: PlanListQuery): QueryKey => ['pm', 'plans', 'list', query],
  /** Whether the viewer can ask AI now. */
  intakeAi: ['pm', 'plans', 'intake-ai'] as const,
  intakeJob: (id: string): QueryKey => ['pm', 'plans', 'intake-ai', 'job', id],
};

const id = (value: string) => encodeURIComponent(value);

export class PlanApi {
  public constructor(private readonly api: ApiClient) {}

  public plan(planId: string): Promise<Plan> {
    return this.data({ path: `projects/plans/${id(planId)}` });
  }

  public async plans(query: PlanListQuery = {}): Promise<Page<Plan>> {
    const { cursor, limit, ...filters } = query;
    const { data, meta } = await this.api.request<{
      readonly data: Plan[];
      readonly meta?: { readonly nextPageToken?: string };
    }>({
      path: 'projects/plans',
      query: Object.fromEntries(
        Object.entries({
          ...filters,
          pageSize: limit,
          pageToken: cursor,
        }).filter(([, value]) => value !== undefined),
      ),
    });
    return { data, nextCursor: meta?.nextPageToken ?? null };
  }

  public rehearse(input: CreatePlanRequest): Promise<PlanRehearsal> {
    return this.data({
      path: 'projects/plans/rehearse',
      method: 'POST',
      json: input,
    });
  }

  public create(input: CreatePlanRequest): Promise<Plan> {
    return this.data({ path: 'projects/plans', method: 'POST', json: input });
  }

  public edit(planId: string, input: EditPlanRequest): Promise<Plan> {
    return this.data({
      path: `projects/plans/${id(planId)}`,
      method: 'PATCH',
      json: input,
    });
  }

  public act(
    planId: string,
    action: 'execute' | 'retry' | 'void',
    revision: number,
  ): Promise<Plan> {
    return this.data({
      path: `projects/plans/${id(planId)}/${action}`,
      method: 'POST',
      json: { revision },
    });
  }

  /** What undoing `planId` would revert now, and what it would leave alone. */
  public previewUndo(planId: string): Promise<PlanUndoPreview> {
    return this.data({
      path: `projects/plans/${id(planId)}/undo`,
      method: 'POST',
      json: { dryRun: true },
    });
  }

  /** Undoes `planId` at once; answers it, undone. */
  public undo(planId: string): Promise<Plan> {
    return this.data({
      path: `projects/plans/${id(planId)}/undo`,
      method: 'POST',
      json: {},
    });
  }

  public uploadIntakeFile(
    file: File,
    signal?: AbortSignal,
  ): Promise<IntakeFile> {
    const body = new FormData();
    body.append('file', file);
    return this.data({
      path: 'projects/intake/files',
      method: 'POST',
      body,
      ...(signal ? { signal } : {}),
    });
  }

  public async removeIntakeFile(fileId: string): Promise<void> {
    await this.api.request({
      path: `projects/intake/files/${id(fileId)}`,
      method: 'DELETE',
    });
  }

  public splitIntake(input: IntakeSplitRequest): Promise<IntakeSplitResult> {
    return this.data({
      path: 'projects/intake/split',
      method: 'POST',
      json: input,
    });
  }

  /** The text of the caller's uploaded files, as the split reads it. */
  public intakeTexts(fileIds: readonly string[]): Promise<IntakeTextsResult> {
    return this.data({
      path: 'projects/intake/extractTexts',
      method: 'POST',
      json: { fileIds },
    });
  }

  /** Whether the caller can ask AI to split, revise or break down now. */
  public intakeAiAvailability(): Promise<IntakeAiAvailability> {
    return this.data({ path: 'projects/intake/aiAvailability' });
  }

  public startIntakeAi(input: IntakeAiStartRequest): Promise<IntakeAiJob> {
    return this.data({
      path: 'projects/intake/aiJobs',
      method: 'POST',
      json: input,
    });
  }

  public intakeJob(jobId: string): Promise<IntakeAiJob> {
    return this.data({ path: `projects/intake/aiJobs/${id(jobId)}` });
  }

  public cancelIntakeJob(jobId: string): Promise<IntakeAiJob> {
    return this.data({
      path: `projects/intake/aiJobs/${id(jobId)}/cancel`,
      method: 'POST',
    });
  }

  private async data<T>(
    options: Parameters<ApiClient['request']>[0],
  ): Promise<T> {
    const { data } = await this.api.request<{ readonly data: T }>(options);
    return data;
  }
}

export function usePlanApi(): PlanApi {
  const api = useApiClient();
  return useMemo(() => new PlanApi(api), [api]);
}
