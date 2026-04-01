/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { KeyOutlined } from '@ant-design/icons';
import { RemoteSelect } from '@nocobase/client';
import { Instruction, WorkflowVariableInput, WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client';

const NAMESPACE = 'workflow-auth-token';

export default class extends Instruction {
  title = `{{t("Sign Token", { ns: "${NAMESPACE}" })}}`;
  type = 'sign-token';
  group = 'extended';
  description = `{{t("Generate a NocoBase auth token for a user, with configurable role and expiry.", { ns: "${NAMESPACE}" })}}`;
  icon = (<KeyOutlined />);
  fieldset = {
    userId: {
      type: 'number',
      title: `{{t("User", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Select a user or use a workflow variable.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableWrapper',
      'x-component-props': {
        nullable: false,
        changeOnSelect: true,
        variableOptions: {
          types: [
            (field) => {
              if (field.isForeignKey) {
                return field.target === 'users';
              }
              return field.collectionName === 'users' && field.name === 'id';
            },
          ],
        },
        render(props) {
          return (
            <RemoteSelect
              fieldNames={{ label: 'nickname', value: 'id' }}
              service={{ resource: 'users' }}
              manual={false}
              {...props}
            />
          );
        },
      },
      required: true,
      default: null,
    },
    roleName: {
      type: 'string',
      title: `{{t("Role", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Optional. The role the token operates as. User must have this role.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableWrapper',
      'x-component-props': {
        nullable: false,
        changeOnSelect: true,
        variableOptions: {
          types: [
            (field) => {
              if (field.isForeignKey) {
                return field.target === 'roles';
              }
              return field.collectionName === 'roles' && field.name === 'name';
            },
          ],
        },
        render(props) {
          return (
            <RemoteSelect
              fieldNames={{ label: 'title', value: 'name' }}
              service={{ resource: 'roles' }}
              manual={false}
              {...props}
            />
          );
        },
      },
      default: null,
    },
    expiresIn: {
      type: 'string',
      title: `{{t("Expires in", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: '1 hour', value: '1h' },
        { label: '24 hours', value: '1d' },
        { label: '7 days', value: '7d' },
        { label: '30 days', value: '30d' },
        { label: '90 days', value: '90d' },
      ],
      default: '1d',
    },
  };

  components = {
    WorkflowVariableInput,
    WorkflowVariableWrapper,
    RemoteSelect,
  };
}
