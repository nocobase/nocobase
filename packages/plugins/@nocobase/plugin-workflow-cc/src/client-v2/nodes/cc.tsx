/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import React from 'react';

import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class CCInstruction extends Instruction {
  title = t('CC');
  type = 'cc';
  group = 'manual';
  description = t(
    'Provide a CC (carbon copy) feature in workflows to send approvals, or any other type of information to specified users.',
  );
  icon = (<EyeOutlined />);

  FieldsetLoader = () => import('./components/cc').then((module) => ({ default: module.CCFieldset }));

  createDefaultConfig() {
    return {};
  }
}
