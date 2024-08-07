/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';

import { ArrayItems } from '@formily/antd-v5';

import { SchemaComponentContext, css } from '@nocobase/client';
import {
  Instruction,
  WorkflowVariableInput,
  WorkflowVariableRawTextArea,
  WorkflowVariableTextArea,
  useWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client';
import {
  createMessageFormSchema,
  NotificationVariableContext,
  useNotificationVariableOptions,
  NotificationVariableProvider,
} from '@nocobase/plugin-notification-manager/client';

import { NAMESPACE } from '../locale';

const emailsClass = css`
  width: 100%;

  .ant-space-item:nth-child(2) {
    flex-grow: 1;
  }
`;
const useVariableDecoratorProps = () => {
  const scope = useWorkflowVariableOptions();
  return { value: scope };
};

const LocalProvider = ({ children }) => {
  const scope = useWorkflowVariableOptions();
  return <NotificationVariableProvider value={scope}>{children}</NotificationVariableProvider>;
};

export default class extends Instruction {
  title = `{{t("Notification", { ns: "${NAMESPACE}" })}}`;
  type = 'notification';
  group = 'extended';
  description = `{{t("Send email. You can use the variables in the upstream nodes as receivers, subject and content of the email.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    message: {
      type: 'object',
      properties: {
        provider: {
          type: 'void',
          'x-component': 'LocalProvider',
          properties: createMessageFormSchema,
        },
      },
    },
  };
  components = {
    ArrayItems,
    SchemaComponentContext,
    LocalProvider,
    NotificationVariableProvider,
  };
  scope = { useNotificationVariableOptions };
}
