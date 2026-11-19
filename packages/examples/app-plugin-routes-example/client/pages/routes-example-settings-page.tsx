import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

/** A plugin's settings page: the application's settings shell supplies the menu, the breadcrumb and the guard. */
export default function RoutesExampleSettingsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-routes-example');
  return (
    <section className='flex w-full flex-col gap-2 p-4 sm:p-6 md:p-8'>
      <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em]'>
        {t('settingsTitle', { defaultValue: 'Routes example settings' })}
      </h1>
      <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
        {t('settingsBody', {
          defaultValue:
            'This settings page comes from a plugin. It is declared with defineSettingsRoutes(), joins the System category and is mounted under /settings.',
        })}
      </p>
    </section>
  );
}
