import type { KeyScopeRecordsProps } from '@nocobase/app-plugin-authorization/client/settings';
import { useCallback, type ReactElement } from 'react';

import { useApiKeysApi } from '../lib/api.js';
import { RecordPicker } from './record-picker.js';

/**
 * The records a system key's data scope is limited to, chosen from those the person giving the key can see through
 * that composite action: the server checks every one again when the key is saved.
 */
export function ScopeRecordPicker(props: KeyScopeRecordsProps): ReactElement {
  const api = useApiKeysApi();
  const { resource, action, scope } = props;
  const load = useCallback(
    (search: string | undefined) =>
      api.scopeRecords({
        resource: resource.id,
        action,
        scope,
        ...(search ? { search } : {}),
      }),
    [api, resource.id, action, scope],
  );
  return (
    <RecordPicker
      business={`${resource.id}.${action}.${scope}`}
      value={props.value}
      readOnly={props.readOnly}
      allowAll={false}
      load={load}
      onChange={(next) => props.onChange(next ?? [])}
    />
  );
}
