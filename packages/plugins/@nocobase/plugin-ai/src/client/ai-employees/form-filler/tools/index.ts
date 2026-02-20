/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormBlockModel, ToolsOptions } from '@nocobase/client';

export const formFillerTool: [string, ToolsOptions] = [
  'formFiller',
  {
    invoke: (app, params) => {
      const { form: uid, data } = params;
      if (!uid || !data) {
        return;
      }
      const model = app.flowEngine.getModel(uid, true) as FormBlockModel;
      model?.form?.setFieldsValue(data);
    },
  },
];
