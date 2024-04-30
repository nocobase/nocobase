/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import { Cron, FormProvider, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const schema = {
  type: 'object',
  properties: {
    cron: {
      type: 'string',
      title: 'Cron',
      'x-decorator': 'FormItem',
      'x-component': 'Cron',
    },
  },
};

export default () => {
  const { t } = useTranslation();

  return (
    <FormProvider>
      <SchemaComponent components={{ Cron, FormItem }} scope={{ t }} schema={schema} />
    </FormProvider>
  );
};
