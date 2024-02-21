import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../hooks';
import Summary from './Summary';

export const FieldSummary = (props) => {
  const { t } = useTranslation();
  const { getInterface } = useCollectionManager_deprecated();
  const schema = useMemo(() => {
    return getInterface(props.schemaKey);
  }, [getInterface, props.schemaKey]);

  return <Summary label={t('Field interface')} schema={schema} />;
};

FieldSummary.displayName = 'FieldSummary';
