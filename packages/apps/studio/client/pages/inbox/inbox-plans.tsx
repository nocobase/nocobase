import {
  PlanListItem,
  PmEmpty,
  PmLoadError,
  usePlanQuery,
} from '@nocobase/app-plugin-projects/client/kit';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { useTranslation } from '@nocobase/i18n/client';
import { ClipboardListIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { InboxDetailHeader } from '@/extensions/nocobase-inbox/inbox-detail';
import { PlanCard } from '@/extensions/nocobase-plan-card/plan-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import {
  PLAN_FILTERS,
  plansOf,
  usePlanPages,
  type PlanFilter,
  type PlanPages,
} from '../../inbox/plans.js';

function LoadMorePlans({
  pages,
}: {
  readonly pages: PlanPages;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!pages.hasNextPage) return null;
  return (
    <div className='flex justify-center'>
      <Button
        variant='ghost'
        size='sm'
        disabled={pages.isFetchingNextPage}
        onClick={() => void pages.fetchNextPage()}
      >
        {pages.isFetchingNextPage ? <Spinner data-icon='inline-start' /> : null}
        {t('inbox.loadMore')}
      </Button>
    </div>
  );
}

function PlanList({
  plans,
  selectedId,
  onSelect,
}: {
  readonly plans: readonly Plan[];
  readonly selectedId: string | null;
  readonly onSelect: (planId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <ul aria-label={t('inbox.tabs.plans')} className='space-y-0.5'>
      {plans.map((plan) => (
        <li key={plan.id}>
          <PlanListItem
            plan={plan}
            selected={plan.id === selectedId}
            onSelect={() => onSelect(plan.id)}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * The inbox's plans (`inbox/plans.ts`), listed when the kind filter is Plans: the plans the viewer decides, newest
 * first, filtered by status and loaded page by page. Selecting one shows it in the detail pane (`InboxPlanDetail`).
 * Without `onFilter`, as the To do view lists them, the status stays `filter` and no status filter shows.
 */
export function InboxPlans({
  filter,
  selectedId,
  onFilter,
  onSelect,
}: {
  readonly filter: PlanFilter;
  readonly selectedId: string | null;
  readonly onFilter?: (filter: PlanFilter) => void;
  readonly onSelect: (planId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const pages = usePlanPages(filter);
  const plans = plansOf(pages);
  const items = PLAN_FILTERS.map((value) => ({
    value,
    label: t(`inbox.plans.filter.${value}`),
  }));

  let content: ReactElement;
  if (pages.isError && !pages.data)
    content = (
      <PmLoadError
        title={t('inbox.plans.loadFailed')}
        error={pages.error}
        onRetry={() => void pages.refetch()}
      />
    );
  else if (!pages.data)
    content = (
      <div role='status' aria-label={t('common.loading')} className='space-y-2'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-16 w-full rounded-lg' />
        ))}
      </div>
    );
  else if (plans.length === 0)
    content = !onFilter ? (
      <PmEmpty
        icon={<ClipboardListIcon />}
        title={t('inbox.plans.noneOpen')}
        description={t('inbox.plans.emptyDescription')}
        className='border-none bg-transparent'
      />
    ) : filter === 'all' ? (
      <PmEmpty
        icon={<ClipboardListIcon />}
        title={t('inbox.plans.empty')}
        description={t('inbox.plans.emptyDescription')}
        className='border-none bg-transparent'
      />
    ) : (
      <PmEmpty
        icon={<ClipboardListIcon />}
        title={t('inbox.plans.noMatch')}
        description={t('inbox.plans.noMatchDescription')}
        className='border-none bg-transparent'
        action={
          <Button variant='outline' size='sm' onClick={() => onFilter('all')}>
            {t('inbox.plans.clearFilter')}
          </Button>
        }
      />
    );
  else
    content = (
      <div className='space-y-3'>
        <PlanList plans={plans} selectedId={selectedId} onSelect={onSelect} />
        <LoadMorePlans pages={pages} />
      </div>
    );

  if (!onFilter) return content;
  return (
    <div className='space-y-3'>
      <div className='px-1'>
        <Select
          items={items}
          value={filter}
          onValueChange={(next: PlanFilter | null) => {
            if (next) onFilter(next);
          }}
        >
          <SelectTrigger
            size='sm'
            className='w-full sm:w-48'
            aria-label={t('inbox.plans.filterLabel')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {content}
    </div>
  );
}

/**
 * The plans still waiting on the viewer as a group of the inbox list when every kind shows: the loaded open plans of
 * `pages` (`usePlanPages('open')`) except those an item already stands for (an executor suggestion's plan). Nothing
 * shows while there are none.
 */
export function InboxOpenPlans({
  pages,
  exclude,
  selectedId,
  onSelect,
}: {
  readonly pages: PlanPages;
  readonly exclude: ReadonlySet<string>;
  readonly selectedId: string | null;
  readonly onSelect: (planId: string) => void;
}): ReactElement | null {
  const { t } = useTranslation();
  const plans = plansOf(pages, exclude);
  if (plans.length === 0) return null;
  return (
    <section aria-labelledby='studio-inbox-group-plans' className='space-y-1'>
      <h2
        id='studio-inbox-group-plans'
        className='flex items-center gap-2 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase'
      >
        {t('inbox.tabs.plans')}
        <span className='tabular-nums'>
          {pages.hasNextPage ? `${plans.length}+` : plans.length}
        </span>
      </h2>
      <PlanList plans={plans} selectedId={selectedId} onSelect={onSelect} />
      <LoadMorePlans pages={pages} />
    </section>
  );
}

/**
 * A plan in the detail pane, under the header every inbox item shares (`InboxDetailHeader`): the plan's title links to
 * its own page, its facts and the actions the viewer may take sit right under it, and its description and rows below.
 */
export function InboxPlanDetail({
  planId,
  onBack,
}: {
  readonly planId: string | null;
  readonly onBack: () => void;
}): ReactElement {
  const { t } = useTranslation();
  if (!planId)
    return (
      <div className='flex h-full items-center justify-center p-6'>
        <PmEmpty
          icon={<ClipboardListIcon />}
          title={t('inbox.plans.nothingSelected')}
          className='border-none bg-transparent'
        />
      </div>
    );
  return <PlanDetail key={planId} planId={planId} onBack={onBack} />;
}

const PLAN_TITLE_ID = 'studio-inbox-plan-title';

function PlanDetail({
  planId,
  onBack,
}: {
  readonly planId: string;
  readonly onBack: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const query = usePlanQuery(planId);
  const header = {
    titleId: PLAN_TITLE_ID,
    icon: (
      <ClipboardListIcon
        className='size-4 shrink-0 text-muted-foreground'
        aria-hidden='true'
      />
    ),
    kind: t('inbox.plans.label'),
    onBack,
    backLabel: t('inbox.back'),
  };
  if (!query.data)
    return (
      <PlanArticle>
        <InboxDetailHeader
          {...header}
          title={
            query.isError ? (
              t('inbox.plans.label')
            ) : (
              <Skeleton className='h-7 w-2/3' />
            )
          }
        />
        <div className='flex-1 p-5 md:px-6'>
          {query.isError ? (
            <PmLoadError
              title={t('inbox.plans.loadOneFailed')}
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : (
            <Skeleton className='h-24 w-full rounded-lg' />
          )}
        </div>
      </PlanArticle>
    );
  return (
    <PlanCard
      planId={planId}
      plan={query.data}
      linkTitle={false}
      frame={({ title, href, meta, actions, content }) => (
        <PlanArticle>
          <InboxDetailHeader
            {...header}
            title={title}
            href={href}
            openLabel={t('inbox.plans.open')}
            meta={meta}
            actions={actions}
          />
          <div className='flex-1 p-5 md:px-6'>{content}</div>
        </PlanArticle>
      )}
    />
  );
}

function PlanArticle({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <article
      className='flex min-h-full flex-col'
      aria-labelledby={PLAN_TITLE_ID}
      data-testid='studio-inbox-plan'
    >
      {children}
    </article>
  );
}
