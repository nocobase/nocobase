import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { InboxSource } from '../agents/conversation/inbox.js';
import type { StudioInbox } from './service.js';

/** Studio's inbox, bound by `StudioInboxProvider`. */
export const studioInboxToken: ServiceToken<StudioInbox> =
  createServiceToken<StudioInbox>('studio/inbox');

/** Studio's inbox as a person and their agents read it (`inbox list`), bound by `StudioInboxProvider`. */
export const studioInboxSourceToken: ServiceToken<InboxSource> =
  createServiceToken<InboxSource>('studio/inbox-source');
