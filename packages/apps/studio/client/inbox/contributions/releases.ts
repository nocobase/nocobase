/**
 * The inbox entry of release management (source `releases`, sent by `server/releases/inbox.ts`):
 *
 * - `deployment_requested`: a decision for each approver of a protected environment; approving or
 *   rejecting calls the plugin's own API, and its `request.decided` event settles every approver's card;
 * - `deployment_request_decided`: the requester hears how someone else decided;
 * - `deployment_failed`: whoever asked for a deployment hears it failed, with the error.
 *
 * A request's items open its dialog over the App's page (`/releases/:appId/requests/:requestId`), where an approver
 * decides it, whatever path the card was sent with; a failed deployment opens the App's page, and a card without its
 * App opens the request's dialog over the Apps list (`/releases/requests/:requestId`), which the plugin keeps. The cards
 * carry the names they show, so nothing is loaded.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleCheckIcon,
  RocketIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react';

import {
  isSettled,
  kindOf,
  type InboxEntry,
} from '@/extensions/nocobase-inbox/model';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import { useDeploymentError } from './releases-errors.js';
import { DeploymentRequestActions, ReleasesBody } from './releases-parts.js';
import {
  field,
  RELEASES_NAMESPACE,
  releasesResources,
} from './releases.locales.js';

const ICONS: Readonly<Record<string, LucideIcon>> = {
  deployment_requested: RocketIcon,
  deployment_request_decided: CircleCheckIcon,
  deployment_failed: TriangleAlertIcon,
};

const typeOf = (entry: InboxEntry) =>
  entry.notice?.type ?? 'deployment_requested';

export const releasesRenderer = defineInboxRenderer<null>({
  source: 'releases',
  types: [
    'deployment_requested',
    'deployment_request_decided',
    'deployment_failed',
  ],
  namespace: RELEASES_NAMESPACE,
  resources: releasesResources,
  icon: (entry) => ICONS[typeOf(entry)] ?? RocketIcon,
  useWording() {
    const { t } = useTranslation();
    const errorText = useDeploymentError();
    return {
      label: (entry, where) =>
        t(`${where === 'detail' ? 'headings' : 'types'}.${typeOf(entry)}`),
      text: (entry) => {
        const values = {
          app: field(entry, 'appName') ?? field(entry, 'appId') ?? t('unknown'),
          release: field(entry, 'releaseVersion') ?? t('unknown'),
          environment: field(entry, 'environmentName') ?? t('unknown'),
          decider: field(entry, 'deciderName') ?? t('someone'),
        };
        switch (typeOf(entry)) {
          case 'deployment_request_decided':
            return {
              title: t(
                field(entry, 'decision') === 'rejected'
                  ? 'rejectedTitle'
                  : 'approvedTitle',
                values,
              ),
              sentence: field(entry, 'note'),
            };
          case 'deployment_failed': {
            const error = field(entry, 'error');
            return {
              title: t('failedTitle', values),
              sentence: error ? errorText(error) : null,
            };
          }
          default: {
            const requester = field(entry, 'requesterName');
            const rollback = field(entry, 'kind') === 'rollback';
            return {
              title: t(rollback ? 'rollbackTitle' : 'title', values),
              sentence: requester
                ? t(rollback ? 'rollbackSentence' : 'sentence', { requester })
                : field(entry, 'note'),
            };
          }
        }
      },
      outcome: (outcome) => t(`outcomes.${outcome}`, { defaultValue: outcome }),
      open: t('open'),
    };
  },
  // The registry calls it as a hook; this one needs none.
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
  useCanAct: (entry) =>
    kindOf(entry) === 'decision' &&
    typeOf(entry) === 'deployment_requested' &&
    !isSettled(entry)
      ? { state: 'yes' }
      : { state: 'none' },
  Actions: DeploymentRequestActions,
  Body: ReleasesBody,
  link: (entry) => {
    const appId = field(entry, 'appId');
    const requestId =
      typeOf(entry) === 'deployment_failed' ? null : field(entry, 'requestId');
    if (appId && requestId)
      return `/releases/${encodeURIComponent(appId)}/requests/${encodeURIComponent(requestId)}`;
    if (appId) return `/releases/${encodeURIComponent(appId)}`;
    return requestId
      ? `/releases/requests/${encodeURIComponent(requestId)}`
      : null;
  },
  context: (entry) => {
    const appId = field(entry, 'appId');
    return appId ? { ids: [appId] } : {};
  },
});
