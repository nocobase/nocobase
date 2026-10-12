/**
 * The issue page's "Related plans" (main column, `pages/issues/detail`): the projects plugin's plans about the issue
 * the viewer may see (`GET /api/projects/plans?issueId=`), such as the executors a status rule suggested, newest
 * first, each opening over the issue page (`plan-links.ts`), so leaving the plan comes back here. Nothing shows while
 * there are none, or when they cannot be read.
 *
 * The header opens and closes the list. It opens on its own while a plan awaits the viewer's decision, whose count the
 * header shows; otherwise it follows the person's last choice (`localStorage`), closed until they make one.
 */
import {
  PlanListItem,
  planKeys,
  usePlanApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { useTranslation } from '@nocobase/i18n/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRightIcon, ClipboardListIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';

import { usePlanLinkTo } from './plan-links.js';
import {
  awaitsViewer,
  readOpenChoice,
  writeOpenChoice,
} from './plans-state.js';

/** Plans per page of the section. */
const PAGE_SIZE = 10;

export function IssuePlansSection({
  issue,
}: {
  readonly issue: Pick<IssueDetail, 'id' | 'ownerUserId'>;
}): ReactElement | null {
  const api = usePlanApi();
  const viewer = useViewer();
  const query = { issueId: issue.id, limit: PAGE_SIZE };
  const pages = useInfiniteQuery({
    queryKey: [...planKeys.list(query), 'pages'],
    queryFn: ({ pageParam }) => api.plans({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    retry: false,
  });
  const plans = useMemo(
    () => pages.data?.pages.flatMap((page) => page.data) ?? [],
    [pages.data],
  );
  const awaiting = plans.filter((plan) =>
    awaitsViewer(plan, viewer?.userId, issue.ownerUserId),
  ).length;
  if (plans.length === 0) return null;
  return (
    <IssuePlansPanel
      plans={plans}
      awaiting={awaiting}
      hasMore={pages.hasNextPage}
      loadingMore={pages.isFetchingNextPage}
      onMore={() => void pages.fetchNextPage()}
    />
  );
}

/** The section once there are plans: the header that opens and closes it, and the list. */
export function IssuePlansPanel({
  plans,
  awaiting,
  hasMore,
  loadingMore,
  onMore,
}: {
  readonly plans: readonly Plan[];
  /** How many of them wait for the viewer's decision. */
  readonly awaiting: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly onMore: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const planTo = usePlanLinkTo();
  const [open, setOpen] = useState(
    () => awaiting > 0 || (readOpenChoice() ?? false),
  );
  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        writeOpenChoice(next);
      }}
      render={<section />}
      className='flex flex-col gap-3 border-t pt-6'
      aria-labelledby='studio-issue-plans-heading'
    >
      <h2 className='font-heading text-sm font-semibold'>
        <CollapsibleTrigger
          id='studio-issue-plans-heading'
          className='group/plans flex min-h-8 w-full items-center gap-2 text-left'
        >
          <ChevronRightIcon
            className='size-4 text-muted-foreground transition-transform group-data-[panel-open]/plans:rotate-90'
            aria-hidden
          />
          <ClipboardListIcon className='size-4' aria-hidden />
          {t('issuePlans.title')}
          <span className='text-muted-foreground'>
            {hasMore ? `${plans.length}+` : plans.length}
          </span>
          {awaiting > 0 ? (
            <Badge>{t('issuePlans.awaiting', { count: awaiting })}</Badge>
          ) : null}
        </CollapsibleTrigger>
      </h2>
      <CollapsibleContent className='space-y-3'>
        <ul aria-label={t('issuePlans.title')} className='-mx-3 space-y-0.5'>
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanListItem plan={plan} to={planTo(plan.id)} />
            </li>
          ))}
        </ul>
        {hasMore ? (
          <Button
            variant='ghost'
            size='sm'
            disabled={loadingMore}
            onClick={onMore}
          >
            {loadingMore ? <Spinner data-icon='inline-start' /> : null}
            {t('issuePlans.more')}
          </Button>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
