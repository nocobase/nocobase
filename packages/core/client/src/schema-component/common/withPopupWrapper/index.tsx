/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback } from 'react';
import { RecursionField, useFieldSchema, useField } from '@formily/react';
import { cloneDeep } from 'lodash';
import { popupSchema } from './schema';
import { useDesignable, useActionContext, ActionContext, SchemaComponentOptions } from '../../';
import { CollectionProvider, useCollection } from '../../../data-source';

export const useInsertSchema = () => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback((ss) => {
    const schema = fieldSchema.reduceProperties((buf, s) => {
      if (s['x-component'] === 'Action.Container') {
        return s;
      }
      return buf;
    }, null);
    if (!schema) {
      insertAfterBegin(cloneDeep(ss));
    }
  }, []);
  return insert;
};

// 高阶组件：用来包装每个组件并添加弹窗功能
function withPopupWrapper<T>(WrappedComponent: React.ComponentType<T>) {
  return (props: T) => {
    const [visible, setVisible] = useState(false);
    const insertPopup = useInsertSchema();
    const collection = useCollection();
    const ctx = useActionContext();
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const { enableLink } = fieldSchema['x-component-props'];
    const handleClick = () => {
      insertPopup(popupSchema);
      setVisible(true);
    };

    return enableLink ? (
      <a onClick={handleClick}>
        <WrappedComponent {...props} />
        <ActionContext.Provider value={{ ...ctx, visible: visible, setVisible: setVisible }}>
          <CollectionProvider name={collection.name}>
            <SchemaComponentOptions>
              <RecursionField
                onlyRenderProperties
                basePath={field?.address}
                schema={fieldSchema}
                filterProperties={(s) => {
                  return s['x-component'] === 'Action.Container';
                }}
              />
            </SchemaComponentOptions>
          </CollectionProvider>
        </ActionContext.Provider>
      </a>
    ) : (
      <WrappedComponent {...props} />
    );
  };
}

export { withPopupWrapper };
