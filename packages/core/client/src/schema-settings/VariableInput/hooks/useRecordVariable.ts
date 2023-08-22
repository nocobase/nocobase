import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionField: CollectionFieldOptions;
  schema: any;
  collectionName: string;
  noDisabled?: boolean;
}

export const useRecordVariable = (props: Props) => {
  const { t } = useTranslation();

  const currentRecordVariable = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nRecord',
    title: t('Current record'),
    collectionName: props.collectionName,
    noDisabled: props.noDisabled,
  });

  return currentRecordVariable;
};
