/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { HourglassOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from './locale';

export default class DelayInstruction extends Instruction {
  title = tExpr('Delay');
  type = 'delay';
  group = 'control';
  async = true;
  description = tExpr(
    'Delay a period of time and then continue or exit the process. Can be used to set wait or timeout times in parallel branches.',
  );
  icon = (<HourglassOutlined />);
  FieldsetLoader = () => import('./components/DelayFieldset').then((module) => ({ default: module.DelayFieldset }));
}
