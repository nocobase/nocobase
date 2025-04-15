/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Space } from 'antd';
import { HourglassOutlined } from '@ant-design/icons';

import { Instruction, JOB_STATUS, WorkflowVariableInput } from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';

const UnitOptions = [
  { value: 1_000, label: `{{t('Seconds', { ns: "workflow" })}}` },
  { value: 60_000, label: `{{t('Minutes', { ns: "workflow" })}}` },
  { value: 3600_000, label: `{{t('Hours', { ns: "workflow" })}}` },
  { value: 86400_000, label: `{{t('Days', { ns: "workflow" })}}` },
  { value: 604800_000, label: `{{t('Weeks', { ns: "workflow" })}}` },
];

export default class extends Instruction {
  title = `{{t("Delay", { ns: "${NAMESPACE}" })}}`;
  type = 'delay';
  group = 'control';
  description = `{{t("Delay a period of time and then continue or exit the process. Can be used to set wait or timeout times in parallel branches.", { ns: "${NAMESPACE}" })}}`;
  icon = (<HourglassOutlined style={{}} />);
  fieldset = {
    duration: {
      type: 'void',
      title: `{{t("Duration", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Space.Compact',
      required: true,
      properties: {
        unit: {
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            placeholder: `{{t("Unit", { ns: "${NAMESPACE}" })}}`,
            className: 'auto-width',
            allowClear: false,
          },
          enum: UnitOptions,
          default: 60_000,
        },
        duration: {
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'WorkflowVariableInput',
          'x-component-props': {
            placeholder: `{{t("Duration", { ns: "${NAMESPACE}" })}}`,
            useTypedConstant: [['number', { min: 1 }]],
            nullable: false,
            parseOptions: {
              defaultTypeOnNull: 'number',
            },
          },
          default: 1,
          required: true,
        },
      },
    },
    endStatus: {
      type: 'number',
      title: `{{t("End status", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: `{{t("Succeed and continue", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.RESOLVED },
        { label: `{{t("Fail and exit", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.FAILED },
      ],
      required: true,
      default: JOB_STATUS.RESOLVED,
    },
  };
  components = {
    WorkflowVariableInput,
    Space,
  };
  isAvailable({ engine, workflow, upstream, branchIndex }) {
    return !engine.isWorkflowSync(workflow);
  }
}
