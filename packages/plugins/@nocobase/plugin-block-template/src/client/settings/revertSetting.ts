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
import { useIsInTemplate } from '../hooks/useIsInTemplate';

export const revertSettingItem = {
  name: 'template-revertSettingItem',
  title: tStr('Revert to template'),
  Component: RevertSetting,
  useVisible: () => {
    const fieldSchema = useFieldSchema();
    const isInTemplate = useIsInTemplate();
    // in steps form, the schema is not the one saved in server side, so we need to hide the revert setting item
    return isInTemplate && fieldSchema['x-settings'] !== 'settings:stepsFormStepTitleSettings';
  },
};
