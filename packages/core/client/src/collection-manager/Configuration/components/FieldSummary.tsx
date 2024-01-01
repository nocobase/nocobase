import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Summary from './Summary';
import { useCollectionManagerV2 } from '../../../application';

export const FieldSummary = (props) => {
  const { t } = useTranslation();
  const collectionManager = useCollectionManagerV2();
  const schema = useMemo(() => {
    return collectionManager.getCollectionFieldInterface(props.schemaKey);
  }, [collectionManager, props.schemaKey]);

  return <Summary label={t('Field interface')} schema={schema} />;
};

FieldSummary.displayName = 'FieldSummary';
