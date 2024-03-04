import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useBlockContext } from '../../../../block-provider/BlockProvider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useRecord, useRecordIndex } from '../../../../record-provider';
import { useCompile } from '../../../hooks';

/**
 * label = 'action' + x-component + actionTitle + [x-action] + [collectionName] + [blockName] + [record.name || record.title || recordIndex] + [postfix]
 * @param title
 * @returns
 */
export const useGetAriaLabelOfAction = (title: string) => {
  const record = useRecord();
  const recordIndex = useRecordIndex();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const component = fieldSchema['x-component'];
  let recordName = record?.name || record?.title || (recordIndex != null ? String(recordIndex) : '');
  let action = fieldSchema['x-action'];
  let { name: collectionName } = useCollection_deprecated();
  let { name: blockName } = useBlockContext() || {};
  const actionTitle = title || compile(fieldSchema.title);
  collectionName = collectionName ? `-${collectionName}` : '';
  blockName = blockName ? `-${blockName}` : '';
  action = action ? `-${action}` : '';
  recordName = recordName ? `-${recordName}` : '';

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return `action-${component}-${actionTitle}${action}${collectionName}${blockName}${recordName}${postfix}`;
    },
    [action, actionTitle, blockName, collectionName, component, recordName],
  );

  return {
    getAriaLabel,
  };
};
