import { useTranslation } from '@nocobase/i18n/client';
import { useCallback } from 'react';

import type { NameText } from '../../shared/kinds.js';

/** A candidate's name in the viewer's language: its `nameText` when its kind ships one, else its name as stored. */
export function usePrincipalName(): (principal: {
  readonly name: string;
  readonly nameText?: NameText;
}) => string {
  const { t } = useTranslation();
  return useCallback(
    ({ name, nameText }) =>
      nameText
        ? t(nameText.key, { ns: nameText.ns, defaultValue: name })
        : name,
    [t],
  );
}
