import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { useNotify } from '../../../access/notify.js';
import { roleErrorKey } from './roles-model.js';

/** A failed role write, in the words of the role pages. */
export function useRoleError(): (error: unknown) => void {
  const { t } = useTranslation();
  const notify = useNotify();
  return (error) =>
    notify.error(
      null,
      t(
        error instanceof ApiClientError
          ? roleErrorKey(error.reason, error.status)
          : 'common.requestFailed',
      ),
    );
}
