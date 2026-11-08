import type { ReactElement } from 'react';
import { useDetailCopy } from './use-detail-copy.js';
import { useParams } from 'react-router';
import ApiKeysReadiness from './api-keys-readiness.js';
import {
  FEATURE_OVERVIEWS,
  type FeatureOverviewId,
} from './feature-overview-catalog.js';
import { ConfigurationAction } from './detail-layout.js';
import { ModuleOverview } from './module-overview.js';
import { moduleOverviews } from './module-overviews.js';
import { exampleOverviews } from './example-overviews.js';

export default function FeatureOverview(): ReactElement | null {
  const { entryId } = useParams();
  if (!entryId || !Object.hasOwn(FEATURE_OVERVIEWS, entryId)) return null;
  return <Overview key={entryId} id={entryId as FeatureOverviewId} />;
}

function Overview({ id }: { id: FeatureOverviewId }): ReactElement | null {
  const { t } = useDetailCopy();
  const prefix = `featureOverview.entries.${id}`;
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
  const definition = moduleOverviews[id] ?? exampleOverviews[id];
  return definition ? <ModuleOverview definition={definition} /> : null;
}
