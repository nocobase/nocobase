/**
 * The inbox's plans (`pages/inbox/inbox-plans.tsx`), listed with the kind filter on Plans and, while open, as a group
 * of the list: the projects plugin's plans the viewer decides (`GET /api/projects/plans` without `issueId`), which are
 * the plans agents proposed in the viewer's conversations and the executors status rules suggest to them. The status
 * filter maps onto the list's own `status`: `open` is what still waits for a decision (pending, and failed or out of
 * date until checked again), `expired` includes an open plan past its expiry.
 */
import { planKeys, usePlanApi } from '@nocobase/app-plugin-projects/client/kit';
import type {
  Plan,
  PlanListQuery,
} from '@nocobase/app-plugin-projects/shared/plans';
import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';

export const PLAN_FILTERS = [
  'all',
  'open',
  'executed',
  'voided',
  'expired',
] as const;
export type PlanFilter = (typeof PLAN_FILTERS)[number];

export function readPlanFilter(value: string | null): PlanFilter {
  return PLAN_FILTERS.find((filter) => filter === value) ?? 'all';
}

/** The list query of a filter. */
export function planQueryOf(filter: PlanFilter): PlanListQuery {
  return filter === 'all' ? {} : { status: filter };
}

export type PlanPages = UseInfiniteQueryResult<
  InfiniteData<{
    readonly data: readonly Plan[];
    readonly nextCursor?: string | null;
  }>
>;

/** The plans of `filter` the viewer decides, newest first, page by page. */
export function usePlanPages(filter: PlanFilter, enabled = true): PlanPages {
  const api = usePlanApi();
  const query = planQueryOf(filter);
  return useInfiniteQuery({
    queryKey: [...planKeys.list(query), 'pages'],
    queryFn: ({ pageParam }) => api.plans({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

/** The loaded plans of `pages`, except those in `exclude`. */
export function plansOf(
  pages: PlanPages,
  exclude?: ReadonlySet<string>,
): readonly Plan[] {
  const plans = pages.data?.pages.flatMap((page) => page.data) ?? [];
  return exclude ? plans.filter((plan) => !exclude.has(plan.id)) : plans;
}
