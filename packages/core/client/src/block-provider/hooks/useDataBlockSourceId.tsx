import { useRecordData } from '../..';
import { useCollectionManager_deprecated } from '../../collection-manager';

export const useDataBlockSourceId = ({ association, useSourceId }: { association: string; useSourceId?: any }) => {
  const sourceId = useSourceId?.();
  const recordData = useRecordData();
  const { getCollectionField } = useCollectionManager_deprecated();

  return sourceId || recordData?.[getCollectionField(association)?.sourceKey || 'id'];
};
