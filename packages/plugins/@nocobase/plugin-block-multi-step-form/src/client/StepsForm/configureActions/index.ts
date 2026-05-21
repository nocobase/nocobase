/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '@nocobase/client';
import { StepsFormName } from '../../constants';
import { tStr } from '../../locale';
import {
  nextActionInitializerItem,
  previousActionInitializerItem,
  submitActionInitializerItem,
  customActionInitializerItem,
} from './items';

export const configureActionsInitializer: any = new SchemaInitializer({
  name: `${StepsFormName}:configureActions`,
  icon: 'SettingOutlined',
  title: tStr('Configure actions'),
  style: {
    marginLeft: 8,
  },
  items: [
    previousActionInitializerItem,
    nextActionInitializerItem,
    submitActionInitializerItem,
    customActionInitializerItem,
    // {
    //   name: 'customRequest',
    //   title: tStr('Custom request'),
    //   Component: 'CustomRequestInitializer',
    // },
  ],
});
