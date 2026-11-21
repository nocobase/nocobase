import type { AuthorizationCheckSubjectPickerProps } from '@nocobase/app-plugin-authorization/client/settings';
import { NamespaceScope, useTranslation } from '@nocobase/i18n/client';
import { useCallback, type ReactElement } from 'react';

import { KeyOptionPicker } from '../components/key-option-picker.js';
import { useApiKeysAdminApi } from '../lib/admin-api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

/** Picks a system key for Permission check, by its key id. */
export default function PickSystemKey(
  props: AuthorizationCheckSubjectPickerProps,
): ReactElement {
  return (
    <NamespaceScope ns={API_KEYS_NAMESPACE}>
      <Picker {...props} />
    </NamespaceScope>
  );
}

function Picker({
  value,
  onChange,
}: AuthorizationCheckSubjectPickerProps): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const admin = useApiKeysAdminApi();
  const search = useCallback(
    async (query: string) =>
      (await admin.systemKeys(query ? { search: query } : {})).map((key) => ({
        id: key.id,
        title: key.name ?? key.id,
        description: t('check.systemIdentity'),
      })),
    [admin, t],
  );
  return (
    <KeyOptionPicker
      value={value}
      onChange={onChange}
      search={search}
      label={t('check.systemKey')}
    />
  );
}
