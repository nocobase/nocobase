import { useTranslation } from '@nocobase/i18n/client';

import { ACCESS_NAMESPACE } from '../../../../shared/access.js';

import type { IssueComment } from '../../../../shared/comments.js';
import { USER_KIND } from '../../../../shared/kinds.js';
import { useKindLabel } from '../../../lib/kinds.js';

/** Who wrote a comment: the name the server resolved, else the kind's name. */
export function useAuthorLabel(): (comment: IssueComment) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const kindLabel = useKindLabel();
  return (comment) =>
    comment.authorName ??
    (comment.authorType === USER_KIND
      ? t('common.unknown')
      : kindLabel(comment.authorType));
}
