/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useT } from '../locale';
import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { ResetSetting } from '../components/ResetSetting';

export const resetSettingItem = {
  name: 'template-reset',
  title: 'Reset to template',
  Component: ResetSetting,
  useVisible() {
    const fieldSchema = useFieldSchema();
    const templateBlock = _.get(fieldSchema, 'x-template-uid');
    if (!templateBlock) {
      return false;
    }
    return true;
  },
};
