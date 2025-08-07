/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useCallback } from 'react';
import { useDesignable } from '../../hooks/useDesignable';
import { UseRequestResult } from '../../../api-client/hooks/useRequest';

export interface PopupContext {
  dataSource?: string;
  collection?: string;
  association?: string;
  /**
   * if true, the context will never be updated
   */
  doNotUpdateContext?: boolean;
  readonly blockService?: UseRequestResult<any>;
}

export const CONTEXT_SCHEMA_KEY = 'x-action-context';

/**
 * support only in Action or AssociationField, because it depends on a specific schema structure
 * @returns
 */
export const usePopupContextInActionOrAssociationField = () => {
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();

  const updatePopupContext = useCallback(
    (newContext: PopupContext, customSchema?: ISchema) => {
      const schema = customSchema || fieldSchema;
      const oldContext = getPopupContextFromActionOrAssociationFieldSchema(schema);
      newContext = _.omitBy(newContext, _.isNil) as PopupContext;

      if (_.isEqual(newContext, oldContext) || oldContext?.doNotUpdateContext) {
        return;
      }

      schema[CONTEXT_SCHEMA_KEY] = newContext;

      return dn.emit('initializeActionContext', {
        schema: {
          'x-uid': schema['x-uid'],
          [CONTEXT_SCHEMA_KEY]: newContext,
        },
      });
    },
    [fieldSchema, dn],
  );

  return {
    /**
     * update the value of the x-nb-popup-context field in the popup schema
     */
    updatePopupContext,
  };
};

/**
 * @param fieldSchema support only schema of Action or AssociationField, because it depends on a specific schema structure
 * @returns
 */
export function getPopupContextFromActionOrAssociationFieldSchema(fieldSchema: ISchema) {
  return fieldSchema[CONTEXT_SCHEMA_KEY] as PopupContext;
}
