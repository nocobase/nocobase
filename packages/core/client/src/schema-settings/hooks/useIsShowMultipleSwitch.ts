import { useField, useFieldSchema } from '@formily/react';
import { useCollectionManager } from '../../collection-manager';

/**
 * 是否显示 `允许多选` 开关
 */
export function useIsShowMultipleSwitch() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { getCollectionField } = useCollectionManager();

  const collectionField = getCollectionField(fieldSchema['x-collection-field']);
  const uiSchema = collectionField?.uiSchema || fieldSchema;
  const hasMultiple = uiSchema['x-component-props']?.multiple === true;

  return function IsShowMultipleSwitch() {
    return !field.readPretty && fieldSchema['x-component'] !== 'TableField' && hasMultiple;
  };
}
