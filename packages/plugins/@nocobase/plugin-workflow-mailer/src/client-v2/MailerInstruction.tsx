/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MailOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import React from 'react';

import { tExpr } from './locale';

export default class MailerInstruction extends Instruction {
  type = 'mailer';
  title = tExpr('Mailer');
  group = 'extended';
  description = tExpr(
    'Send email. You can use the variables in the upstream nodes as receivers, subject and content of the email.',
  );
  icon = (<MailOutlined />);
  FieldsetLoader = () => import('./components/MailerFieldset').then((module) => ({ default: module.MailerFieldset }));
}
