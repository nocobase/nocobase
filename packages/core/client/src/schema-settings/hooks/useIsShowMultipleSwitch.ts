import { useField, useFieldSchema } from '@formily/react';

/**
 * 是否显示 `允许多选` 开关
 */
export function useIsShowMultipleSwitch() {
  const field = useField();
  const fieldSchema = useFieldSchema();

  const hasMultiple = fieldSchema['x-component-props']?.multiple !== undefined;

  return function IsShowMultipleSwitch() {
    return !field.readPretty && fieldSchema['x-component'] !== 'TableField' && hasMultiple;
  };
}
