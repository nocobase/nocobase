import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';

export function ModelsLink({
  explain = false,
}: {
  readonly explain?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const { can, isPending } = useCan({
    resource: { type: 'settings', id: 'agents.services' },
    action: 'read',
  });
  if (isPending) return null;
  return can ? (
    <Button
      variant='outline'
      size='sm'
      nativeButton={false}
      render={<Link to='/models' />}
    >
      {t('onlineAgent.openModels')}
    </Button>
  ) : explain ? (
    <p>{t('onlineAgent.noModels.readOnly')}</p>
  ) : null;
}
