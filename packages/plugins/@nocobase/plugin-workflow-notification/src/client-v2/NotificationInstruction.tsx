/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { NotificationOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from './locale';

export default class NotificationInstruction extends Instruction {
  type = 'notification';
  title = tExpr('Notification');
  group = 'extended';
  description = tExpr(
    'Send notification. You can use the variables in the upstream nodes as content and ohter config.',
  );
  icon = (<NotificationOutlined />);
  testable = true;
  FieldsetLoader = () =>
    import('./components/NotificationFieldset').then((module) => ({ default: module.NotificationFieldset }));
}
