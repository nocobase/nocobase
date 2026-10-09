import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { useQueryClient } from '@tanstack/react-query';
import { RocketIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { DecisionActionsBar } from '#extensions/nocobase-inbox/decision-actions-bar';
import { InboxPage } from '#extensions/nocobase-inbox/inbox-page';
import type {
  InboxCollectionCategory,
  InboxEntry,
  InboxNotice,
} from '#extensions/nocobase-inbox/model';
import {
  defaultInboxCategories,
  defineInboxRenderer,
  type InboxPartProps,
  type InboxRegistry,
} from '#extensions/nocobase-inbox/registry';
import type { InboxSource } from '#extensions/nocobase-inbox/source';

import { demoItems, demoNotices, demoPlans } from './inbox-data.js';
import { DemoPlanDetail, DemoPlanGroup } from './inbox-plans.js';

// What the sample source knows, changed in memory as deployments are decided.
let notices: InboxNotice[] = [...demoNotices];

const waits = (notice: InboxNotice): boolean =>
  notice.kind === 'decision' && notice.resolvedAt === null;

/**
 * A source over sample data: the deployment requests among the items, which ones still wait, and how many. An
 * application implements the same three calls over its own API.
 */
const demoSource: InboxSource = {
  id: 'demo',
  notices: (ids) =>
    Promise.resolve(
      notices.filter((notice) => ids.includes(notice.notificationId)),
    ),
  waiting: () =>
    Promise.resolve(
      notices.filter(waits).flatMap((notice) => {
        const item = demoItems.find(
          (candidate) => candidate.notificationId === notice.notificationId,
        );
        return item ? [{ item, notice }] : [];
      }),
    ),
  pending: () => Promise.resolve({ decision: notices.filter(waits).length }),
};

function DeployActions({
  entry,
  title,
  onDecided,
}: InboxPartProps<null>): ReactElement {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  return (
    <DecisionActionsBar
      itemTitle={title}
      pending={pending}
      disabled={false}
      onRun={(decision) => {
        setPending(decision);
        window.setTimeout(() => {
          notices = notices.map((notice) =>
            notice.notificationId === entry.item.notificationId
              ? {
                  ...notice,
                  resolvedAt: new Date().toISOString(),
                  outcome: decision === 'approve' ? 'approved' : 'rejected',
                }
              : notice,
          );
          setPending(null);
          onDecided();
          void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
        }, 400);
      }}
    />
  );
}

function field(entry: InboxEntry, name: string): string {
  const value = entry.notice?.data?.[name];
  return typeof value === 'string' ? value : '';
}

/** The renderer of the sample deployment requests: their wording and the approve and reject buttons. */
const deploysRenderer = defineInboxRenderer<null>({
  source: 'deploys',
  icon: () => RocketIcon,
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- the renderer's hook; plain words need no other hook
  useWording: () => ({
    label: (_entry, where) =>
      where === 'detail' ? 'Deployment request' : 'Deployment',
    text: (entry) => ({
      title: `${field(entry, 'release')} of ${field(entry, 'app')} to ${field(entry, 'environment')}`,
      sentence: `${field(entry, 'requester')} asks to deploy it.`,
    }),
    outcome: (outcome) => (outcome === 'approved' ? 'Approved' : 'Rejected'),
    open: 'Open the request',
  }),
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- the renderer's hook, which needs no other hook here
  useCanAct: (entry) =>
    entry.notice?.resolvedAt ? { state: 'none' } : { state: 'yes' },
  Actions: DeployActions,
  Body: ({ entry }) => (
    <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm'>
      <dt className='text-muted-foreground'>Application</dt>
      <dd>{field(entry, 'app')}</dd>
      <dt className='text-muted-foreground'>Release</dt>
      <dd className='font-mono'>{field(entry, 'release')}</dd>
      <dt className='text-muted-foreground'>Environment</dt>
      <dd>{field(entry, 'environment')}</dd>
    </dl>
  ),
});

/** Sample plans, a kind whose records live in another API: its detail uses the header every inbox item shares. */
const demoPlansCategory: InboxCollectionCategory = {
  type: 'collection',
  id: 'plans',
  label: () => 'Plans',
  param: 'plan',
  after: 'decision',
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- the category's hook; sample data needs no other hook
  useCollection: ({ filter, selectedId, onSelect }) => ({
    count: demoPlans.length,
    loaded: true,
    group: <DemoPlanGroup selectedId={selectedId} onSelect={onSelect} />,
    list:
      filter.kind === 'plans' ? (
        <DemoPlanGroup selectedId={selectedId} onSelect={onSelect} />
      ) : null,
  }),
  Detail: DemoPlanDetail,
};

const demoRegistry: InboxRegistry = {
  renderers: [deploysRenderer],
  feeds: [],
  categories: [...defaultInboxCategories, demoPlansCategory],
};

/**
 * The inbox block as an application's `/inbox` route renders it: the in-app items, with a source that marks the
 * deployment requests among them as decisions and a renderer that words and decides them.
 */
export function InboxDemoPage(): ReactElement {
  return <InboxPage source={demoSource} registry={demoRegistry} />;
}
