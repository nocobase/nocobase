import { FormItem } from '@formily/antd-v5';
import { CronSet, FormProvider, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const schema = {
  type: 'object',
  properties: {
    cronSet: {
      type: 'string',
      title: 'CronSet',
      'x-decorator': 'FormItem',
      'x-component': 'CronSet',
      'x-component-props': 'allowClear',
      enum: [
        {
          label: '{{t("Daily")}}',
          value: '0 0 0 * * ?',
        },
        {
          label: '{{t("Weekly")}}',
          value: 'every_week',
        },
        {
          label: '{{t("Monthly")}}',
          value: 'every_month',
        },
        {
          label: '{{t("Yearly")}}',
          value: 'every_year',
        },
      ],
    },
  },
};

export default () => {
  const { t } = useTranslation();

  return (
    <FormProvider>
      <SchemaComponent components={{ CronSet, FormItem }} scope={{ t }} schema={schema} />
    </FormProvider>
  );
};
