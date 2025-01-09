/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { RevertSetting } from '../components/RevertSetting';
import { tStr } from '../locale';

export const revertSettingItem = {
  name: 'template-revert',
  title: tStr('Revert to template'),
  Component: RevertSetting,
  useVisible() {
    const fieldSchema = useFieldSchema();
    const templateBlock = _.get(fieldSchema, 'x-template-uid');
    // const isBlock = _.get(fieldSchema, 'x-toolbar') === 'BlockSchemaToolbar';
    if (!templateBlock) {
      return false;
    }
    return true;
  },
};
