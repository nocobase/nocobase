import { useTranslation } from '@nocobase/i18n/client';
import { Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import packageMetadata from '../../../package.json' with { type: 'json' };
import { buttonVariants } from '#components/ui/button';
import {
  CurrentApplication,
  InterfaceItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

export default function DatabaseExplorerOverview() {
  const { t } = useTranslation(packageMetadata.name);
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={
          <>
            <p>{t('databaseExplorerOverview.current.boundary')}</p>
            <Link
              to='/capabilities/db'
              className={buttonVariants({
                variant: 'link',
                size: 'sm',
                className: 'h-auto p-0 text-xs',
              })}
            >
              {t('databaseExplorerOverview.current.database')}
              <ArrowRight aria-hidden />
            </Link>
          </>
        }
      >
        <InterfaceItem
          names={['databaseExplorer']}
          title={t('databaseExplorerOverview.current.title')}
          description={t('databaseExplorerOverview.current.description')}
          icon={Database}
        />
      </CurrentApplication>
      <ConfigurationActions>
        {(['interface', 'access'] as const).map((action) => (
          <ConfigurationAction
            key={action}
            title={t(`databaseExplorerOverview.actions.${action}.title`)}
            description={t(
              `databaseExplorerOverview.actions.${action}.description`,
            )}
            prompt={t(`databaseExplorerOverview.actions.${action}.prompt`)}
            steps={(['inspect', 'configure', 'complete'] as const).map((step) =>
              t(`databaseExplorerOverview.actions.${action}.${step}`),
            )}
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
