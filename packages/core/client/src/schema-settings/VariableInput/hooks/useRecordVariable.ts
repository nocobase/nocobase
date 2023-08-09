import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  schema: any;
  collectionName: string;
}

export const useRecordVariable = (props: Props) => {
  const { t } = useTranslation();

  const currentRecordVariable = useBaseVariable({
    schema: props.schema,
    name: '$record',
    title: t('Current record'),
    collectionName: props.collectionName,
  });

  return currentRecordVariable;
};
