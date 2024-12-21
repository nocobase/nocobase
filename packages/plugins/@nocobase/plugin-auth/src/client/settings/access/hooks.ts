/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo, useEffect } from 'react';
import { App as AntdApp, Table as AntdTable, Typography, Button } from 'antd';
import { useForm } from '@formily/react';
import { createForm } from '@formily/core';
import { useAPIClient } from '@nocobase/client';
import { secAccessCtrlConfigCollName, secAccessCtrlConfigKey } from '../../../constants';
import { useAuthTranslation } from '../../locale';

const useEditForm = () => {
  const apiClient = useAPIClient();
  const form = useMemo(() => createForm(), []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await apiClient
          .resource(secAccessCtrlConfigCollName)
          .get({ filterByTk: secAccessCtrlConfigKey });
        if (data?.data?.config) form.setValues(data.data.config);
      } catch (error) {
        console.error(error);
      }
    };
    fetch();
  }, [form, apiClient]);
  return { form };
};

export const useSubmitActionProps = () => {
  const { message } = AntdApp.useApp();
  const apiClient = useAPIClient();
  const form = useForm();
  const { t } = useAuthTranslation();
  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      await apiClient.resource(secAccessCtrlConfigCollName).update({
        values: { config: form.values },
        filterByTk: secAccessCtrlConfigKey,
      });
      message.success(t('Saved successfully!'));
    },
  };
};
export const hooksNameMap = {
  useSubmitActionProps: 'useSubmitActionProps',
  useEditForm: 'useEditForm',
};

export const hooksMap = {
  [hooksNameMap.useEditForm]: useEditForm,
  [hooksNameMap.useSubmitActionProps]: useSubmitActionProps,
};
