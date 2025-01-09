import { useFieldSchema } from '@formily/react';
import _ from 'lodash';

/**
 * A custom hook that determines if the current field schema is part of a template block
 *
 * @param includeRoot - When true, returns true for both root and child template elements.
 *                      When false, only returns true for child template elements.
 *                      Defaults to true.
 * @returns boolean - Returns true if the field is part of a template block, considering the includeRoot parameter
 *
 * @example
 * // Check if component is in any template block (including root)
 * const isInTemplate = useIsInTemplate();
 *
 * // Check if component is in template block but not the root
 * const isInTemplateNotRoot = useIsInTemplate(false);
 */
export const useIsInTemplate = (includeRoot = true) => {
  const fieldSchema = useFieldSchema();
  const templateBlock = _.get(fieldSchema, 'x-template-uid');
  return !!templateBlock && (includeRoot || !_.get(fieldSchema, 'x-template-root-uid'));
};
