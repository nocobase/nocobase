/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { ConvertToNormalBlockSetting } from '../components/ConvertToNormalBlockSetting';
import { tStr } from '../locale';

export const convertToNormalBlockSettingItem = {
  name: 'template-convertToNormalBlockSettingItem',
  title: tStr('Convert to normal block'),
  Component: ConvertToNormalBlockSetting,
  useVisible: () => {
    const fieldSchema = useFieldSchema();
    return fieldSchema?.['x-template-root-uid'];
  },
};
