/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cloneDeep } from 'lodash';
import { createForm } from '@formily/core';
import { useForm } from '@formily/react';

import { ActionContextProvider, FormProvider } from '@nocobase/client';

export function useFormProviderProps() {
  return { form: useForm() };
}

export function DrawerFormProvider(props) {
  const { values, disabled, visible, setVisible } = props;
  const [formValueChanged, setFormValueChanged] = useState(false);

  const form = useMemo(() => {
    const v = cloneDeep(values);
    return createForm({
      values: v,
      initialValues: v,
      disabled: disabled,
    });
  }, [disabled, values]);

  const resetForm = useCallback(
    (editing) => {
      setVisible(editing);
      if (!editing) {
        form.reset();
      }
    },
    [form],
  );

  return (
    <ActionContextProvider
      value={{
        visible,
        setVisible: resetForm,
        formValueChanged,
        setFormValueChanged,
      }}
    >
      <FormProvider form={form}>{props.children}</FormProvider>
    </ActionContextProvider>
  );
}
