/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SendOutlined } from '@ant-design/icons';
import { Instruction, WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client';

const NAMESPACE = 'workflow-url-trigger';

export default class extends Instruction {
  title = `{{t("HTTP Response", { ns: "${NAMESPACE}" })}}`;
  type = 'url-response';
  group = 'extended';
  description = `{{t("Set the HTTP response for URL trigger workflows: redirect, block, or return data.", { ns: "${NAMESPACE}" })}}`;
  icon = (<SendOutlined />);
  end = true;
  fieldset = {
    type: {
      type: 'string',
      title: `{{t("Response type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': { optionType: 'button' },
      enum: [
        { label: `{{t("Redirect", { ns: "${NAMESPACE}" })}}`, value: 'redirect' },
        { label: `{{t("Block", { ns: "${NAMESPACE}" })}}`, value: 'block' },
        { label: `{{t("Data", { ns: "${NAMESPACE}" })}}`, value: 'data' },
      ],
      required: true,
      default: 'redirect',
    },
    url: {
      type: 'string',
      title: `{{t("Redirect URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': { changeOnSelect: true, autoSize: { minRows: 1, maxRows: 3 } },
      required: true,
      'x-reactions': [{ dependencies: ['type'], fulfill: { state: { visible: '{{$deps[0] === "redirect"}}' } } }],
    },
    status: {
      type: 'number',
      title: `{{t("Status code", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        useTypedConstant: [['number', { min: 100, max: 599 }]],
        nullable: false,
      },
      default: 403,
      'x-reactions': [{ dependencies: ['type'], fulfill: { state: { visible: '{{$deps[0] === "block"}}' } } }],
    },
    body: {
      type: 'string',
      title: `{{t("Response body", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': { changeOnSelect: true, autoSize: { minRows: 2, maxRows: 6 } },
      'x-reactions': [{ dependencies: ['type'], fulfill: { state: { visible: '{{$deps[0] === "block"}}' } } }],
    },
    data: {
      type: 'string',
      title: `{{t("Response data", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': { changeOnSelect: true, autoSize: { minRows: 2, maxRows: 6 } },
      'x-reactions': [{ dependencies: ['type'], fulfill: { state: { visible: '{{$deps[0] === "data"}}' } } }],
    },
  };

  components = {
    WorkflowVariableInput,
    WorkflowVariableTextArea,
  };
}
