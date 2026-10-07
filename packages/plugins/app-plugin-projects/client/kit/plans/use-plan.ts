/**
 * One plan, read and acted on: the query, and the actions as mutations that put the plan the server answers into
 * the cache. Acting on a plan can change issues and projects, so those are refreshed too; a conflict (someone acted
 * meanwhile) reloads the plan.
 */
import { ApiClientError } from '@nocobase/app-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import type {
  EditPlanRequest,
  Plan,
  PlanRowCheck,
  PlanUndoPreview,
} from '../../../shared/plans.js';
import { pmKeys } from '../../api/keys.js';
import { planKeys, usePlanApi } from './api.js';
import { errorMetadata } from '../../hooks/use-notify.js';

/** Codes after which the plan shown is out of date. */
const RELOAD_CODES: ReadonlySet<string> = new Set([
  'REVISION_CONFLICT',
  'PLAN_NOT_OPEN',
  'PLAN_EXPIRED',
  'UNDO_EXPIRED',
  'NOTHING_TO_UNDO',
]);

export type PlanAction = 'execute' | 'retry' | 'void';

export interface PlanMutations {
  readonly busy: boolean;
  act(action: PlanAction, plan: Plan): Promise<Plan>;
  edit(plan: Plan, request: EditPlanRequest): Promise<Plan>;
  /** Undoes it at once (after the person saw the preview); answers it, undone. */
  undo(plan: Plan): Promise<Plan>;
}

export function usePlanQuery(
  planId: string,
  initial?: Plan,
): UseQueryResult<Plan> {
  const api = usePlanApi();
  return useQuery({
    queryKey: planKeys.plan(planId),
    queryFn: () => api.plan(planId),
    enabled: planId !== '',
    ...(initial ? { initialData: initial } : {}),
  });
}

/**
 * What undoing `plan` would do now (`POST /plans/{planId}/undo` with `dryRun`), asked afresh each time `enabled`
 * turns on and never cached.
 */
export function usePlanUndoPreview(
  planId: string,
  enabled: boolean,
): UseQueryResult<PlanUndoPreview> {
  const api = usePlanApi();
  return useQuery({
    queryKey: [...planKeys.plan(planId), 'undo-preview'],
    queryFn: () => api.previewUndo(planId),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

/**
 * The plan actions as mutations: each puts the plan the server answers into the cache, an execution or an undo
 * refreshes issues and projects, and a conflict (someone acted meanwhile) reloads the plan.
 */
export function usePlanMutations(): PlanMutations {
  const api = usePlanApi();
  const queryClient = useQueryClient();
  const store = (plan: Plan) => {
    queryClient.setQueryData(planKeys.plan(plan.id), plan);
    void queryClient.invalidateQueries({
      queryKey: [...planKeys.all, 'list'],
    });
  };
  const failed = (plan: Plan) => (error: unknown) => {
    if (error instanceof ApiClientError && RELOAD_CODES.has(error.reason ?? ''))
      void queryClient.invalidateQueries({
        queryKey: planKeys.plan(plan.id),
      });
  };
  const changedWork = () => {
    for (const queryKey of [pmKeys.issues, ['pm', 'issue'], pmKeys.projects])
      void queryClient.invalidateQueries({ queryKey });
  };

  const act = useMutation({
    mutationFn: ({ action, plan }: { action: PlanAction; plan: Plan }) =>
      api.act(plan.id, action, plan.revision),
    onSuccess: (next, { action }) => {
      store(next);
      if (action === 'execute') changedWork();
    },
    onError: (error, { plan }) => failed(plan)(error),
  });
  const edit = useMutation({
    mutationFn: ({ plan, request }: { plan: Plan; request: EditPlanRequest }) =>
      api.edit(plan.id, request),
    onSuccess: store,
    onError: (error, { plan }) => failed(plan)(error),
  });
  const undo = useMutation({
    mutationFn: (plan: Plan) => api.undo(plan.id),
    onSuccess: (next) => {
      store(next);
      changedWork();
    },
    onError: (error, plan) => failed(plan)(error),
  });

  return {
    busy: act.isPending || edit.isPending || undo.isPending,
    act: (action, plan) => act.mutateAsync({ action, plan }),
    edit: (plan, request) => edit.mutateAsync({ plan, request }),
    undo: (plan) => undo.mutateAsync(plan),
  };
}

/** The per-row checks of a refused plan (`PLAN_INVALID` with `metadata.rows`), in row order, or null for any other error. */
export function invalidRows(error: unknown): readonly PlanRowCheck[] | null {
  if (!(error instanceof ApiClientError) || error.reason !== 'PLAN_INVALID')
    return null;
  const rows = errorMetadata(error)?.rows;
  return Array.isArray(rows) ? (rows as PlanRowCheck[]) : null;
}
