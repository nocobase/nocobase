import { useField, useFieldSchema } from '@formily/react';
import { useCollectionManager } from '../../collection-manager';

/**
 * 是否显示 `允许多选` 开关
 */
export function useIsShowMultipleSwitch() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { getCollectionField } = useCollectionManager();

  const collectionField = fieldSchema['x-collection-field']
    ? getCollectionField(fieldSchema['x-collection-field'])
    : null;
  const uiSchema = collectionField?.uiSchema || fieldSchema;
  const hasMultiple = uiSchema['x-component-props']?.multiple === true;
  const fieldMode = field?.componentProps?.['mode'];
  return function IsShowMultipleSwitch() {
    return !field.readPretty && fieldSchema['x-component'] !== 'TableField' && hasMultiple && fieldMode !== 'SubTable';
  };
}
