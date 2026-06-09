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
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class extends Instruction {
  type = 'end';
  title = t('End process');
  group = 'control';
  icon = (<StopOutlined />);
  end = true;
}
