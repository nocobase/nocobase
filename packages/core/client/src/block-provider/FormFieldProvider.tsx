/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, onFormValuesChange } from '@formily/core';
import { useField } from '@formily/react';
import { autorun } from '@formily/reactive';
import { forEach } from '@nocobase/utils/client';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCollectionParentRecordData } from '../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';

/**
 * @internal
 */
export const FormFieldContext = createContext<any>({});
FormFieldContext.displayName = 'FormFieldContext';

const InternalFormFieldProvider = (props) => {
  const { action, readPretty, fieldName } = props;
  const formBlockCtx = useFormBlockContext();
  const parentRecordData = useCollectionParentRecordData();

  if (!formBlockCtx?.updateAssociationValues?.includes(fieldName)) {
    formBlockCtx?.updateAssociationValues?.push(fieldName);
  }

  const field = useField();

  const form = useMemo(
    () =>
      createForm({
        effects() {
          onFormValuesChange((form) => {
            formBlockCtx?.form?.setValuesIn(fieldName, form.values);
          });
        },
        readPretty,
      }),
    [],
  );

  // 当使用数据模板时，会 formBlockCtx.form.values 会被整体赋值，这时候需要同步到 form.values
  useEffect(() => {
    const dispose = autorun(() => {
      const data = formBlockCtx?.form?.values[fieldName] || {};
      // 先清空表单值，再赋值，避免当值为空时，表单未被清空
      form.reset();
      forEach(data, (value, key) => {
        if (value) {
          form.values[key] = value;
        }
      });
    });

    return dispose;
  }, []);

  const { resource, service } = useBlockRequestContext();
  if (service.loading) {
    return <Spin />;
  }

  return (
    <RecordProvider record={service?.data?.data} parent={parentRecordData}>
      <FormFieldContext.Provider
        value={{
          action,
          form,
          field,
          service,
          resource,
          fieldName,
        }}
      >
        {props.children}
      </FormFieldContext.Provider>
    </RecordProvider>
  );
};

/**
 * @internal
 */
export const WithoutFormFieldResource = createContext(null);
WithoutFormFieldResource.displayName = 'WithoutFormFieldResource';

/**
 * @internal
 */
export const FormFieldProvider = (props) => {
  return (
    <WithoutFormFieldResource.Provider value={false}>
      <BlockProvider name="form-field" block={'FormField'} {...props}>
        <InternalFormFieldProvider {...props} />
      </BlockProvider>
    </WithoutFormFieldResource.Provider>
  );
};

/**
 * @internal
 */
export const useFormFieldContext = () => {
  return useContext(FormFieldContext);
};

/**
 * @internal
 */
export const useFormFieldProps = () => {
  const ctx = useFormFieldContext();
  useEffect(() => {
    ctx?.form?.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };
};
