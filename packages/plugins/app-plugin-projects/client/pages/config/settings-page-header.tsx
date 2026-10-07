import { useTranslation } from '@nocobase/i18n/client';
import { EyeIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { PageHeader } from '../../components/page-header.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';

/**
 * The heading of a settings page (`/config/<page>`): its title as the page's `h1`, one short description, the page's
 * actions, and a muted read-only notice beneath when the viewer may not change it.
 */
export function SettingsPageHeader({
  id,
  title,
  description,
  actions,
  readOnly = false,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly readOnly?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        id={id}
        title={title}
        description={description}
        actions={actions}
      />
      {readOnly ? (
        <Alert
          role='note'
          className='bg-muted/50 text-muted-foreground'
          data-settings-read-only
        >
          <EyeIcon />
          <AlertDescription>{t('settingsPage.readOnly')}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
