/**
 * "Waiting for you" on the issue page: the decisions about this issue still
 * waiting on the viewer (`GET /api/inbox/waiting?subject=issue:<id>`), each as a card worded and decided by its
 * inbox contributor (`registry.ts`): an approval, a design proposal, a failed run, a suggested executor, a pull request
 * to merge, a blocked agent. A card offers its contributor's actions, or, for a decision a section of the page already
 * holds (the design proposal), the way there (`Here`); deciding marks the inbox item read. Nothing renders while
 * nothing waits.
 *
 * The issue page places it above the description; while a card decides the issue's pending approval, the page leaves out
 * the projects plugin's own approval card (`useWaitingCoversApproval`, `use-waiting.ts`).
 */
import { useInboxActions } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { PmTag } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { APP_NS, useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Skeleton } from '@/components/ui/skeleton';

import { InboxTypeIcon } from '@/extensions/nocobase-inbox/inbox-item';
import {
  relativeTime,
  type InboxEntry,
} from '@/extensions/nocobase-inbox/model';
import { ContributorScope } from '@/extensions/nocobase-inbox/registry-scope';
import {
  rendererKey,
  type InboxCanAct,
  type InboxEntryRenderer,
} from '@/extensions/nocobase-inbox/registry';

import { useRendererOf } from './use-registry.js';
import { useWaiting } from './use-waiting.js';

export function IssueWaitingSection({
  issue,
}: {
  readonly issue: IssueDetail;
}): ReactElement | null {
  const { t } = useTranslation(APP_NS);
  const entries = useWaiting(issue).data ?? [];
  if (entries.length === 0) return null;
  return (
    <section
      className='space-y-3'
      aria-labelledby='studio-issue-waiting'
      data-testid='studio-issue-waiting'
    >
      <h2
        id='studio-issue-waiting'
        className='flex items-center gap-2 font-heading text-sm font-semibold'
      >
        {t('inbox.here.title')}
        <PmTag tone='amber' className='px-1.5 py-0 tabular-nums'>
          {entries.length}
        </PmTag>
      </h2>
      <ul className='space-y-2'>
        {entries.map((entry) => (
          <li key={entry.item.id}>
            <WaitingCard entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function WaitingCard({ entry }: { readonly entry: InboxEntry }): ReactElement {
  const renderer = useRendererOf()(entry);
  return (
    <ContributorScope
      key={rendererKey(renderer)}
      namespace={renderer.namespace}
      resources={renderer.resources}
    >
      <CardBody entry={entry} renderer={renderer} />
    </ContributorScope>
  );
}

const noModel = (): never => null as never;
const noAction = (): InboxCanAct => ({ state: 'none' });

function CardBody({
  entry,
  renderer,
}: {
  readonly entry: InboxEntry;
  readonly renderer: InboxEntryRenderer<never>;
}): ReactElement {
  // Studio's own wording (the frame), whatever namespace the contributor's is.
  const { t, i18n } = useTranslation(APP_NS);
  const actions = useInboxActions();
  // The renderer is fixed for this component (keyed by it), so its hooks always run in the same order.
  const wording = renderer.useWording();
  const useModel = renderer.useModel ?? noModel;
  const model = useModel(entry);
  const useCanAct = renderer.useCanAct ?? noAction;
  const canAct = useCanAct(entry, model);
  const { title, sentence } = wording.text(entry, model);
  const { item } = entry;
  const parts = {
    entry,
    model,
    title,
    onDecided: () => {
      if (!item.readAt) actions.mark(item.id, 'read').catch(() => undefined);
    },
  };
  const { Actions, Brief, Here } = renderer;
  let decide: ReactNode = null;
  if (Here) decide = <Here {...parts} />;
  else if (canAct.state === 'loading')
    decide = (
      <div
        role='status'
        aria-label={t('common.loading')}
        className='flex gap-2'
      >
        <Skeleton className='h-7 w-16' />
        <Skeleton className='h-7 w-16' />
      </div>
    );
  else if (canAct.state === 'no')
    decide = <p className='text-sm text-muted-foreground'>{canAct.reason}</p>;
  else if (canAct.state === 'yes' && Actions) decide = <Actions {...parts} />;

  return (
    <article
      className='relative overflow-hidden rounded-lg border bg-card text-card-foreground'
      data-decision={entry.notice?.type}
      aria-label={title}
    >
      <span
        aria-hidden='true'
        className='absolute inset-y-0 left-0 w-1 bg-amber-500'
      />
      <div className='space-y-3 py-3 pr-4 pl-5'>
        <header className='flex items-start gap-2.5'>
          <span className='mt-0.5'>
            <InboxTypeIcon entry={entry} renderer={renderer} />
          </span>
          <div className='min-w-0 flex-1 space-y-0.5'>
            <p className='text-xs font-medium text-muted-foreground'>
              {wording.label(entry, 'detail')}
            </p>
            <p className='text-sm font-semibold wrap-anywhere'>{title}</p>
            {sentence ? (
              <p className='text-sm text-muted-foreground wrap-anywhere'>
                {sentence}
              </p>
            ) : null}
          </div>
          <time
            className='shrink-0 text-xs text-muted-foreground'
            dateTime={item.createdAt}
            title={new Date(item.createdAt).toLocaleString(i18n.language)}
          >
            {relativeTime(item.createdAt, i18n.language)}
          </time>
        </header>
        {Brief ? <Brief {...parts} /> : null}
        <div className='flex flex-wrap items-center gap-3 border-t pt-3'>
          <div className='min-w-0 flex-1'>{decide}</div>
          <Link
            to={{
              pathname: '/inbox',
              search: `?view=todo&item=${encodeURIComponent(item.id)}`,
            }}
            className='ml-auto shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
          >
            {t('inbox.here.viewInInbox')}
          </Link>
        </div>
      </div>
    </article>
  );
}
