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

export interface PopupContext {
  dataSource: string;
  collection?: string;
  association?: string;
  sourceId?: string;
  /**
   * Context for the parent popup record variable
   */
  parentPopupRecord?: {
    /** collection name */
    collection: string;
    filterByTk: string;
  };
}

export interface SubPageContext extends PopupContext {
  /**
   * Context for the parent popup record variable
   */
  parentPopupRecord: {
    /** collection name */
    collection: string;
    filterByTk: string;
  };
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
    (context: PopupContext) => {
      context = _.omitBy(context, _.isNil) as PopupContext;

      if (_.isEqual(context, getPopupContextFromActionOrAssociationFieldSchema(fieldSchema))) {
        return;
      }

      fieldSchema[CONTEXT_SCHEMA_KEY] = context;

      return dn.emit('patch', {
        schema: {
          'x-uid': fieldSchema['x-uid'],
          [CONTEXT_SCHEMA_KEY]: context,
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
