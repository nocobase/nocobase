/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { ArrayItems } from '@formily/antd-v5';
import { uid } from '@formily/shared';
import _ from 'lodash';
import { EyeOutlined } from '@ant-design/icons';

import { css } from '@nocobase/client';

import {
  Instruction,
  WorkflowVariableTextArea,
  UsersAddition,
  UsersSelect,
  useNodeContext,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../../common/constants';
// import NotificationFieldset from '../NotificationFieldset';
// import { SchemaConfig, SchemaConfigButton } from './SchemaConfig';
import { SchemaConfig, SchemaConfigButton } from './SchemaConfig';

export default class extends Instruction {
  title = `{{t("CC", { ns: "${NAMESPACE}" })}}`;
  type = 'cc';
  group = 'manual';
  description = `{{t("Provide a CC (carbon copy) feature in workflows to send approvals, or any other type of information to specified users.", { ns: "${NAMESPACE}" })}}`;
  icon = (<EyeOutlined />);
  fieldset = {
    users: {
      type: 'array',
      title: `{{t("Recipients", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      'x-component-props': {
        className: css`
          &[disabled] {
            > .ant-formily-array-base-addition {
              display: none;
            }
            > .ant-formily-array-items-item .ant-space-item:not(:nth-child(2)) {
              display: none;
            }
          }
        `,
      },
      items: {
        type: 'void',
        'x-component': 'Space',
        'x-component-props': {
          className: css`
            width: 100%;
            &.ant-space.ant-space-horizontal {
              flex-wrap: nowrap;
            }
            > .ant-space-item:nth-child(2) {
              flex-grow: 1;
            }
          `,
        },
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'UsersSelect',
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      required: true,
      properties: {
        add: {
          type: 'void',
          'x-component': 'UsersAddition',
        },
      },
    },
    ccDetail: {
      type: 'void',
      title: `{{t("User interface", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'SchemaConfigButton',
      properties: {
        ccDetail: {
          type: 'void',
          'x-component': 'SchemaConfig',
        },
      },
      required: true,
    },
    title: {
      type: 'string',
      title: `{{t("Task title", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
      description: `{{t("Title of each CC item in tasks center. Could use variables in string template. Default to node title.", { ns: "${NAMESPACE}" })}}`,
      default: '{{useNodeContext().title}}',
    },
    notifications: {
      type: 'void',
      'x-component': 'NotificationFieldset',
    },
  };
  createDefaultConfig() {
    return {
      ccDetail: uid(),
    };
  }
  scope = {
    useNodeContext,
  };
  components = {
    ArrayItems,
    UsersSelect,
    UsersAddition,
    SchemaConfigButton,
    SchemaConfig,
    WorkflowVariableTextArea,
  };
}
