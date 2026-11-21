import type { AuthorizationCheckSubjectPickerProps } from '@nocobase/app-plugin-authorization/client/settings';
import { NamespaceScope, useTranslation } from '@nocobase/i18n/client';
import { useCallback, type ReactElement } from 'react';

import { KeyOptionPicker } from '../components/key-option-picker.js';
import { useApiKeysAdminApi } from '../lib/admin-api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

/** Picks a member's personal key for Permission check, by its key id. */
export default function PickPersonalKey(
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
      (
        await admin.memberKeys({ ...(query ? { search: query } : {}) })
      ).data.map((key) => ({
        id: key.id,
        title: key.name ?? key.id,
        description: key.member.name,
      })),
    [admin],
  );
  const resolve = useCallback(
    async (keyId: string) => {
      const [key] = (await admin.memberKeys({ keyId })).data;
      return key
        ? {
            id: key.id,
            title: key.name ?? key.id,
            description: key.member.name,
          }
        : undefined;
    },
    [admin],
  );
  return (
    <KeyOptionPicker
      value={value}
      onChange={onChange}
      search={search}
      resolve={resolve}
      label={t('check.personalKey')}
    />
  );
}
