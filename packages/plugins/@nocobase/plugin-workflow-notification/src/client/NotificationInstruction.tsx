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
import { Instruction, useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client';
import { MessageConfigForm } from '@nocobase/plugin-notification-manager/client';

import { NAMESPACE } from '../locale';

const LocalProvider = () => {
  const variableOptions = useWorkflowVariableOptions();
  return <MessageConfigForm variableOptions={variableOptions} />;
};

export default class extends Instruction {
  title = `{{t("Notification", { ns: "${NAMESPACE}" })}}`;
  type = 'notification';
  group = 'extended';
  description = `{{t("Send notification. You can use the variables in the upstream nodes as content and ohter config.", { ns: "${NAMESPACE}" })}}`;
  icon = (<NotificationOutlined />);
  fieldset = {
    message: {
      type: 'void',
      'x-component': 'LocalProvider',
    },
  };
  components = {
    LocalProvider,
  };
}
