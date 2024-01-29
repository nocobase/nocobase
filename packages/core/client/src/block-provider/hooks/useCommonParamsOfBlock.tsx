import { useMemo } from 'react';
import { useAssociationNames } from '.';
import { useParamsOfRelationshipBlocks } from '../BlockProvider';

export const useCommonParamsOfBlock = (props) => {
  const { getAssociationAppends } = useAssociationNames(props?.dataSource);
  const { appends, updateAssociationValues } = getAssociationAppends();
  const paramsFromRecord = useParamsOfRelationshipBlocks({ association: props.association });
  const params = useMemo(() => {
    if (!props?.params?.['appends']) {
      return { ...props?.params, appends, ...paramsFromRecord };
    }
    return { ...props?.params, ...paramsFromRecord };
  }, [appends, paramsFromRecord, props?.params]);

  return {
    params,
    updateAssociationValues,
  };
};
