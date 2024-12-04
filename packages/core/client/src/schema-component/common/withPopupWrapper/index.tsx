/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { cloneDeep } from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { ActionContextProvider, SchemaComponentOptions, useActionContext, useDesignable } from '../../';
import { PopupVisibleProvider } from '../../antd/page/PagePopups';
import { usePopupUtils } from '../../antd/page/pagePopupUtils';
import { popupSchema } from './schema';

import { CollectionProvider, useCollection } from '../../../data-source';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';

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

const filterProperties = (s) => {
  return s['x-component'] === 'Action.Container';
};

// 高阶组件：用来包装每个组件并添加弹窗功能
function withPopupWrapper<T>(WrappedComponent: React.ComponentType<T>) {
  return (props: T) => {
    const [visible, setVisible] = useState(false);
    const [formValueChanged, setFormValueChanged] = useState(false);
    const insertPopup = useInsertSchema();
    const collection = useCollection();
    const ctx = useActionContext();
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const { enableLink, openMode, openSize } = fieldSchema?.['x-component-props'] || {};
    const { visibleWithURL, setVisibleWithURL } = usePopupUtils();
    const { openPopup } = usePopupUtils();

    const openPopupRef = useRef(null);
    openPopupRef.current = openPopup;

    const handleClick = () => {
      insertPopup(popupSchema);
      openPopupRef.current();
      console.log(333);
    };
    const { setSubmitted } = ctx;

    const handleVisibleChange = useCallback(
      (value: boolean): void => {
        setVisible?.(value);
        setVisibleWithURL?.(value);
      },
      [setVisibleWithURL],
    );
    return enableLink ? (
      <PopupVisibleProvider visible={false}>
        <ActionContextProvider
          button={<WrappedComponent {...props} />}
          visible={visible || visibleWithURL}
          setVisible={handleVisibleChange}
          formValueChanged={formValueChanged}
          setFormValueChanged={setFormValueChanged}
          openMode={openMode}
          openSize={openSize}
          containerRefKey={'field-popup'}
          fieldSchema={fieldSchema}
          setSubmitted={setSubmitted}
        >
          <CollectionProvider name={collection.name}>
            <SchemaComponentOptions>
              <NocoBaseRecursionField
                onlyRenderProperties
                basePath={field?.address}
                schema={fieldSchema}
                filterProperties={filterProperties}
              />
            </SchemaComponentOptions>
          </CollectionProvider>
          <a onClick={handleClick}>
            <WrappedComponent {...props} />
          </a>
        </ActionContextProvider>
      </PopupVisibleProvider>
    ) : (
      <WrappedComponent {...props} />
    );
  };
}

export { withPopupWrapper };
