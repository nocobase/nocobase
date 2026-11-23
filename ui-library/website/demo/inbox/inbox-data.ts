import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';

import type { InboxNotice } from '#extensions/nocobase-inbox/model';

// Sample in-app messages and what an application's source knows about them: two deployment requests waiting on the
// viewer, one already approved, and plain notifications nobody adds anything to.
const ago = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

export const demoItems: InboxItem[] = [
  {
    id: 'm1',
    deliveryId: 'd1',
    notificationId: 'n1',
    title: 'Deploy v2.4.0 of CRM to production',
    body: 'Lina asks to deploy v2.4.0 of CRM to production.',
    target: { type: 'route', path: '/releases/requests/r1' },
    category: 'releases',
    createdAt: ago(4),
  },
  {
    id: 'm2',
    deliveryId: 'd2',
    notificationId: 'n2',
    title: 'Weekly report is ready',
    body: 'The sales report for week 40 is ready to read.',
    target: { type: 'route', path: '/reports/week-40' },
    category: 'reports',
    createdAt: ago(35),
  },
  {
    id: 'm3',
    deliveryId: 'd3',
    notificationId: 'n3',
    title: 'Deploy v1.9.2 of Billing to staging',
    body: 'Carl asks to deploy v1.9.2 of Billing to staging.',
    target: { type: 'route', path: '/releases/requests/r2' },
    category: 'releases',
    createdAt: ago(90),
  },
  {
    id: 'm4',
    deliveryId: 'd4',
    notificationId: 'n4',
    title: 'Mia commented on Onboarding checklist',
    body: 'Can we add the security training to week one?',
    readAt: ago(60),
    category: 'projects',
    createdAt: ago(180),
  },
  {
    id: 'm5',
    deliveryId: 'd5',
    notificationId: 'n5',
    title: 'Deploy v2.3.1 of CRM to production',
    body: 'Lina asks to deploy v2.3.1 of CRM to production.',
    readAt: ago(1400),
    category: 'releases',
    createdAt: ago(1500),
  },
  {
    id: 'm6',
    deliveryId: 'd6',
    notificationId: 'n6',
    title: 'Nightly backup finished',
    body: 'All 12 databases were backed up.',
    readAt: ago(2800),
    createdAt: ago(2900),
  },
];

function deployNotice(
  notificationId: string,
  app: string,
  release: string,
  environment: string,
  requester: string,
  resolved?: { readonly at: string; readonly outcome: string },
): InboxNotice {
  return {
    notificationId,
    source: 'deploys',
    kind: 'decision',
    type: 'deploy_requested',
    subject: { type: 'app', id: app.toLowerCase(), label: app },
    decisionKey: `deploy:${notificationId}`,
    data: { app, release, environment, requester },
    count: 1,
    resolvedAt: resolved?.at ?? null,
    outcome: resolved?.outcome ?? null,
  };
}

export const demoNotices: InboxNotice[] = [
  deployNotice('n1', 'CRM', 'v2.4.0', 'production', 'Lina'),
  deployNotice('n3', 'Billing', 'v1.9.2', 'staging', 'Carl'),
  deployNotice('n5', 'CRM', 'v2.3.1', 'production', 'Lina', {
    at: ago(1400),
    outcome: 'approved',
  }),
];

/** What the notification plugin's `GET /notifications/preferences` answers: the kinds, each with its category. */
export const demoPreferences = {
  channelTypes: ['in-app'],
  kinds: [
    { id: 'releases.requested', category: 'Releases', categoryKey: 'releases' },
    { id: 'reports.ready', category: 'Reports', categoryKey: 'reports' },
    { id: 'projects.commented', category: 'Projects', categoryKey: 'projects' },
  ].map((kind) => ({
    ...kind,
    contributor: 'demo',
    name: kind.id,
    channels: [],
  })),
};
