import { useTranslation } from '@nocobase/i18n/client';
import { KeyRound, Users, ListFilter, Share2, ShieldCheck } from 'lucide-react';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  InterfaceItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

const managementEntries = [
  { key: 'roles', names: ['settingsRoles'], icon: KeyRound },
  { key: 'assignments', names: ['settingsUsers'], icon: Users },
  { key: 'defaultAccess', names: ['settingsDefaultAccess'], icon: ListFilter },
  { key: 'sharing', names: ['settingsSharingRules'], icon: Share2 },
  {
    key: 'restriction',
    names: ['settingsRestrictionRules'],
    icon: ShieldCheck,
  },
] as const;

export default function AuthorizationOverview() {
  const { t } = useTranslation(packageMetadata.name);
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={<p>{t('authorizationOverview.management.hint')}</p>}
      >
        {managementEntries.map(({ key, names, icon }) => (
          <InterfaceItem
            key={key}
            names={names}
            title={t(`authorizationOverview.management.${key}.title`)}
            description={t(
              `authorizationOverview.management.${key}.description`,
            )}
            icon={icon}
          />
        ))}
      </CurrentApplication>
      <ConfigurationActions>
        {(
          [
            'business',
            'roles',
            'assignments',
            'defaultAccess',
            'sharing',
            'restriction',
          ] as const
        ).map((action) => (
          <ConfigurationAction
            key={action}
            title={t(`authorizationOverview.actions.${action}.title`)}
            description={t(
              `authorizationOverview.actions.${action}.description`,
            )}
            prompt={t(`authorizationOverview.actions.${action}.prompt`)}
            steps={['inspect', 'configure', 'verify'].map((step) =>
              t(`authorizationOverview.actions.${action}.${step}`),
            )}
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
