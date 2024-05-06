/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'string',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'CronSet',
        'x-component-props': {
          options: [
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
    },
  },
});

export default App;
