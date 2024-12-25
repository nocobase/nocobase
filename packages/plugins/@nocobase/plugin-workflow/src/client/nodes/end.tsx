/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { StopOutlined } from '@ant-design/icons';

import { Instruction } from '.';
import { NAMESPACE } from '../locale';
import { JOB_STATUS } from '../constants';

export default class extends Instruction {
  title = `{{t("End process", { ns: "${NAMESPACE}" })}}`;
  type = 'end';
  group = 'control';
  description = `{{t("End the process immediately, with set status.", { ns: "${NAMESPACE}" })}}`;
  icon = (<StopOutlined style={{}} />);
  fieldset = {
    endStatus: {
      type: 'number',
      title: `{{t("End status", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: `{{t("Succeeded", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.RESOLVED },
        { label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.FAILED },
      ],
      required: true,
      default: JOB_STATUS.RESOLVED,
    },
  };
  end = true;
}
