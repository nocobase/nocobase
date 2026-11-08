import { useTranslation } from '@nocobase/i18n/client';
import { useParams } from 'react-router';
import packageMetadata from '../../../package.json' with { type: 'json' };
import ApiKeysReadiness from './api-keys-readiness.js';
import {
  FEATURE_OVERVIEWS,
  type FeatureOverviewId,
} from './feature-overview-catalog.js';
import { capabilityPages } from './capability-pages.js';
import {
  CurrentApplication,
  ConfigurationItem,
  InterfaceItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

export default function FeatureOverview() {
  const { entryId } = useParams();
  if (!entryId || !Object.hasOwn(FEATURE_OVERVIEWS, entryId)) return null;
  return <Overview key={entryId} id={entryId as FeatureOverviewId} />;
}

function Overview({ id }: { id: FeatureOverviewId }) {
  const { t } = useTranslation(packageMetadata.name);
  const prefix = `featureOverview.entries.${id}`;
  const ui = `featureOverview.layout.entries.${id}`;
  if (id === 'app-plugin-api-keys') {
    return (
      <ApiKeysReadiness
        personalGuide={
          <ConfigurationAction
            title={t('featureOverview.apiKeys.personalTitle')}
            description={t('featureOverview.apiKeys.personalGuideHint')}
            prompt={t(`${prefix}.prompt`)}
            steps={[0, 1, 2, 3].map((i) => t(`${prefix}.steps.${i}`))}
          />
        }
        applicationGuide={
          <ConfigurationAction
            title={t('featureOverview.apiKeys.applicationTitle')}
            description={t('featureOverview.apiKeys.applicationGuideHint')}
            prompt={t('featureOverview.apiKeys.application.prompt')}
            steps={[0, 1, 2, 3].map((i) =>
              t(`featureOverview.apiKeys.application.steps.${i}`),
            )}
          />
        }
      />
    );
  }
  const page = capabilityPages[id];
  const steps = [0, 1, 2, 3].map((i) => t(`${prefix}.steps.${i}`));
  const title = t(`${ui}.title`);
  const extendTitle = t(`${ui}.extendTitle`);
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication>
        {page ? (
          <InterfaceItem {...page} title={title} />
        ) : (
          <ConfigurationItem
            title={title}
            description={t('featureOverview.layout.inspectHint')}
          />
        )}
      </CurrentApplication>
      <ConfigurationActions>
        <ConfigurationAction
          title={t('featureOverview.layout.setupFor', { feature: title })}
          description={t('featureOverview.layout.setupDescription')}
          prompt={t(`${prefix}.prompt`)}
          steps={steps}
        />
        <ConfigurationAction
          title={extendTitle}
          description={t(`${ui}.extendDescription`)}
          prompt={`${t('featureOverview.layout.improvePrompt', { goal: extendTitle })}\n\n${t(`${prefix}.prompt`)}`}
          steps={steps}
          configuration={
            <p className='text-sm leading-6 text-muted-foreground'>
              {t(`${prefix}.configuration`)}
            </p>
          }
        />
      </ConfigurationActions>
    </div>
  );
}
