import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Summary from './Summary';
import { useCollectionManagerV2 } from '../../../application';

export const TemplateSummary = (props: { schemaKey: string }) => {
  const { t } = useTranslation();
  const collectionManager = useCollectionManagerV2();
  const schema = useMemo(() => {
    return collectionManager.getCollectionTemplate(props.schemaKey).getOptions();
  }, [collectionManager, props.schemaKey]);

  return <Summary label={t('Collection template')} schema={schema} />;
};

TemplateSummary.displayName = 'TemplateSummary';
