/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo, useEffect } from 'react';
import { App as AntdApp } from 'antd';
import { useForm } from '@formily/react';
import { createForm } from '@formily/core';
import { useAPIClient, useCollectionRecordData, useActionContext } from '@nocobase/client';
import { uid } from '@formily/shared';
import { ipBlackListCollName } from '../../../constants';
import { useAuthTranslation } from '../../locale';

export const useCreateFormProps = () => {
  const form = useMemo(() => createForm(), []);
  const { visible } = useActionContext();
  useEffect(() => {
    if (!visible) form.reset();
  }, [visible, form]);

  return {
    form,
  };
};

export const useEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: recordData,
      }),
    [recordData],
  );
  const { visible } = useActionContext();
  useEffect(() => {
    if (!visible) form.reset();
  }, [visible, form]);

  return {
    form,
  };
};

export const useSubmitActionProps = () => {
  const { message } = AntdApp.useApp();
  const apiClient = useAPIClient();
  const form = useForm();
  const { t } = useAuthTranslation();
  const { setVisible, setSubmitted } = useActionContext();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      if (form.values.key) {
        await apiClient.resource(ipBlackListCollName).update({
          values: form.values,
          filterByTk: form.values.key,
        });
      } else {
        await apiClient.resource(ipBlackListCollName).create({
          values: { ...form.values, key: uid() },
        });
      }
      setSubmitted?.(true);
      setVisible?.(false);
      await form.reset();
      message.success(t('Saved successfully!'));
    },
  };
};

export const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

export const hooksNameMap = {
  useSubmitActionProps: 'useSubmitActionProps',
  useEditFormProps: 'useEditFormProps',
  useCreateFormProps: 'useCreateFormProps',
  useCloseActionProps: 'useCloseActionProps',
};

export const hooksMap = {
  [hooksNameMap.useEditFormProps]: useEditFormProps,
  [hooksNameMap.useSubmitActionProps]: useSubmitActionProps,
  [hooksNameMap.useCreateFormProps]: useCreateFormProps,
  [hooksNameMap.useCloseActionProps]: useCloseActionProps,
};
