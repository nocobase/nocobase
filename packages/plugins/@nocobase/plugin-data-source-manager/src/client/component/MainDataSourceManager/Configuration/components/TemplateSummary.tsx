import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '@nocobase/client';
import Summary from './Summary';

export const TemplateSummary = (props: { schemaKey: string }) => {
  const { t } = useTranslation();
  const { getTemplate } = useCollectionManager();
  const schema = useMemo(() => {
    return getTemplate(props.schemaKey);
  }, [getTemplate, props.schemaKey]);

  return <Summary label={t('Collection template')} schema={schema} />;
};

TemplateSummary.displayName = 'TemplateSummary';
