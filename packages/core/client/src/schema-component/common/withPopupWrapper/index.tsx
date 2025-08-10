/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { cloneDeep, debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionContextProvider, SchemaComponentOptions, useActionContext, useDesignable } from '../../';
import { PopupVisibleProvider } from '../../antd/page/PagePopups';
import { usePopupUtils } from '../../antd/page/pagePopupUtils';
import { popupSchema } from './schema';
import { CollectionProvider, useCollection } from '../../../data-source';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { VariablePopupRecordProvider } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';

const useInsertSchema = () => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback(
    (ss) => {
      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'Action.Container') {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [fieldSchema, insertAfterBegin],
  );
  return insert;
};

const filterProperties = (s) => {
  return s['x-component'] === 'Action.Container';
};

const FieldLink = (props: any) => {
  const { WrappedComponent, ...rest } = props;
  const fieldSchema = useFieldSchema();
  const { openPopup } = usePopupUtils();
  const needWaitForFieldSchemaUpdatedRef = useRef(false);
  const insertPopup = useInsertSchema();
  const fieldSchemaRef = useRef(fieldSchema);
  fieldSchemaRef.current = fieldSchema;
  const insertPopupRef = useRef(insertPopup);
  insertPopupRef.current = insertPopup;
  const openPopupRef = useRef(openPopup);
  openPopupRef.current = openPopup;

  const getCustomActionSchema = useCallback(() => {
    return fieldSchemaRef.current;
  }, []);

  const handleClick = useCallback(() => {
    if (!fieldSchemaRef.current.properties) {
      insertPopupRef.current(popupSchema);
      needWaitForFieldSchemaUpdatedRef.current = true;
    }

    if (needWaitForFieldSchemaUpdatedRef.current) {
      // When first inserting, the fieldSchema instance will be updated to a new instance.
      // We need to wait for the instance update before opening the popup to prevent configuration loss.
      setTimeout(() => {
        openPopupRef.current({ customActionSchema: getCustomActionSchema() });
      });
      needWaitForFieldSchemaUpdatedRef.current = false;

      // Only open the popup when the popup schema exists
    } else if (fieldSchemaRef.current.properties) {
      openPopupRef.current();
    }
  }, [getCustomActionSchema]);

  // Add debounce for handleClick
  const debouncedHandleClick = useMemo(
    () => debounce(handleClick, 300, { leading: true, trailing: false }),
    [handleClick],
  );

  useEffect(() => {
    // cancel on unmount to avoid memory leaks and stray executions
    return () => {
      debouncedHandleClick.cancel();
    };
  }, [debouncedHandleClick]);

  return (
    <a onClick={debouncedHandleClick}>
      <WrappedComponent {...rest} />
    </a>
  );
};

// 高阶组件：用来包装每个组件并添加弹窗功能
function withPopupWrapper<T>(WrappedComponent: React.ComponentType<T>) {
  return (props: T) => {
    const [visible, setVisible] = useState(false);
    const [formValueChanged, setFormValueChanged] = useState(false);
    const collection = useCollection();
    const ctx = useActionContext();
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const { enableLink, openMode, openSize } = fieldSchema?.['x-component-props'] || {};
    const { visibleWithURL, setVisibleWithURL } = usePopupUtils();
    const handleVisibleChange = useCallback(
      (value: boolean): void => {
        setVisible?.(value);
        setVisibleWithURL?.(value);
      },
      [setVisibleWithURL],
    );
    const fieldSchemaRef = useRef(fieldSchema);
    fieldSchemaRef.current = fieldSchema;

    const { setSubmitted } = ctx;

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
              <VariablePopupRecordProvider>
                <NocoBaseRecursionField
                  onlyRenderProperties
                  basePath={field?.address}
                  schema={fieldSchema}
                  filterProperties={filterProperties}
                />
              </VariablePopupRecordProvider>
            </SchemaComponentOptions>
          </CollectionProvider>
          <FieldLink {...props} WrappedComponent={WrappedComponent} />
        </ActionContextProvider>
      </PopupVisibleProvider>
    ) : (
      <WrappedComponent {...props} />
    );
  };
}

export { withPopupWrapper };
