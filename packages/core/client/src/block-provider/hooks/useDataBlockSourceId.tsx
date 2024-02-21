import { useRecord } from '../..';
import { useCollectionManager_deprecated } from '../../collection-manager';

export const useDataBlockSourceId = ({ association, useSourceId }: { association: string; useSourceId?: any }) => {
  const sourceId = useSourceId?.();
  const record = useRecord();
  const { getCollectionField } = useCollectionManager_deprecated();

  return sourceId || record?.[getCollectionField(association)?.sourceKey || 'id'];
};
