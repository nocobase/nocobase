/**
 * The inbox's own wording (the frame around each contributor's parts). It is taken outside a contributor's namespace
 * (`ContributorScope`) and passed in, so the frame reads the same whichever namespace the contributor's parts use.
 */
import { useTranslation } from '@nocobase/i18n/client';

import type { InboxAction } from './inbox-actions.js';
import type { InboxTranslate } from './model.js';

export interface InboxFrameText {
  readonly t: InboxTranslate;
  readonly language: string;
}

/** The inbox's own wording, in the namespace the inbox renders in. Call it outside `ContributorScope`. */
export function useInboxFrameText(): InboxFrameText {
  const { t, i18n } = useTranslation();
  return { t, language: i18n.language };
}

/** The label of an action, in the inbox's wording. */
export function actionLabel(t: InboxTranslate, action: InboxAction): string {
  switch (action) {
    case 'read':
      return t('inbox.actions.read', { defaultValue: 'Mark as read' });
    case 'unread':
      return t('inbox.actions.unread', { defaultValue: 'Mark as unread' });
    case 'delete':
      return t('inbox.actions.delete', { defaultValue: 'Delete' });
  }
}
