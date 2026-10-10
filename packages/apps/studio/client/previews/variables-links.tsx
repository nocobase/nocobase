/** Links to where a blocked preview's missing variables are set, for the issue page and the inbox card. */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

/**
 * The two places a preview's missing variables are set: its environment (every preview there), offered only to who
 * may set it (`environmentId` null otherwise), and its own App.
 */
export function VariablesLinks({
  appId,
  environmentId,
}: {
  readonly appId: string;
  readonly environmentId: string | null;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <p className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
      {environmentId ? (
        <Link
          to={`/environments/${encodeURIComponent(environmentId)}?tab=variables`}
          className='text-primary underline-offset-4 hover:underline'
          data-variables-link='environment'
        >
          {t('previews.variables.setOnEnvironment')}
        </Link>
      ) : null}
      <Link
        to={`/releases/${encodeURIComponent(appId)}?tab=variables`}
        className='text-primary underline-offset-4 hover:underline'
        data-variables-link='app'
      >
        {t('previews.variables.setOnApp')}
      </Link>
    </p>
  );
}
