/** Shows a delegation's news as its event card (`ChatExtensions.renderNews`); other news reads as its line. */
import type { NewsNotice } from '@nocobase/app-plugin-agents/client/chat';
import type { ReactNode } from 'react';

import { DELEGATION_NEWS } from '../../../shared/delegations.js';
import { DelegationCard } from './card.js';
import { eventOf } from './headline.js';

export function renderDelegationNews(notice: NewsNotice): ReactNode {
  const params = notice.params;
  const event = eventOf(params?.event);
  if (notice.type !== DELEGATION_NEWS || !params?.delegationId || !event)
    return null;
  return <DelegationCard params={params} event={event} />;
}
