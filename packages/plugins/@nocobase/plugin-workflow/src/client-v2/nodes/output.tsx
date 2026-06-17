/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ProfileOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';
import { BaseTypeSets } from '../canvas/collectionFieldOptions';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class extends Instruction {
  type = 'output';
  title = t('Output');
  group = 'control';
  description = t(
    'Set output data of this workflow. When this one is executed as a subflow, the output could be used as variables in downstream nodes of super workflow. You can also use this node in an AI employee workflow, to define what to output. If this node is added multiple times, the value of the last executed node prevails.',
  );
  icon = (<ProfileOutlined />);
  FieldsetLoader = () => import('./components/output').then((m) => ({ default: m.OutputFieldset }));

  useVariables({ key, title }, { types }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return {
      value: key,
      label: title,
    };
  }
}
