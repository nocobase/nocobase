import { useTranslation } from '@nocobase/i18n/client';
import { ShieldCheck } from 'lucide-react';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  ConfigurationItem,
  InterfaceItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

export default function AuthorizationOverview() {
  const { t } = useTranslation(packageMetadata.name);
  const steps = [
    'responsibility',
    'model',
    'grant',
    'rules',
    'verify',
    'revoke',
  ].map((key) => t(`authorizationOverview.steps.${key}`));
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication>
        <InterfaceItem
          names={['settingsRoles']}
          title={t('featureOverview.layout.authorizationInterface')}
          description={t('featureOverview.layout.authorizationDescription')}
          icon={ShieldCheck}
        />
        <InterfaceItem
          names={['settingsDefaultAccess']}
          title={t('featureOverview.layout.defaultAccessInterface')}
          icon={ShieldCheck}
        />
        {(['sharing', 'restriction'] as const).map((key) => (
          <ConfigurationItem
            key={key}
            title={t(`authorizationOverview.roles.${key}.title`)}
            description={t('featureOverview.layout.inspectHint')}
            icon={ShieldCheck}
          />
        ))}
      </CurrentApplication>
      <ConfigurationActions>
        <ConfigurationAction
          title={t('featureOverview.layout.authorizationActionTitle')}
          description={t(
            'featureOverview.layout.authorizationActionDescription',
          )}
          prompt={t('authorizationOverview.prompt')}
          steps={steps}
        />
        <ConfigurationAction
          title={t('featureOverview.layout.authorizationRulesTitle')}
          description={t(
            'featureOverview.layout.authorizationRulesDescription',
          )}
          prompt={`${t('featureOverview.layout.improvePrompt', { goal: t('featureOverview.layout.authorizationRulesTitle') })}\n\n${t('authorizationOverview.prompt')}`}
          steps={steps}
          configuration={
            <p className='text-sm leading-6 text-muted-foreground'>
              {t('authorizationOverview.configurationHint')}
            </p>
          }
        />
      </ConfigurationActions>
    </div>
  );
}
