import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../hooks';
import Summary from './Summary';

export const TemplateSummary = (props: { schemaKey: string }) => {
  const { t } = useTranslation();
  const { getTemplate } = useCollectionManager_deprecated();
  const schema = useMemo(() => {
    return getTemplate(props.schemaKey);
  }, [getTemplate, props.schemaKey]);

  return <Summary label={t('Collection template')} schema={schema} />;
};

TemplateSummary.displayName = 'TemplateSummary';
