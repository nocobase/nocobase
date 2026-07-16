/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class extends Instruction {
  type = 'destroy';
  title = t('Delete record');
  group = 'collection';
  description = t(
    'Delete records of a collection. Could use variables in workflow context as filter. All records match the filter will be deleted.',
  );
  icon = (<DeleteOutlined />);

  FieldsetLoader = () => import('./components/destroy').then((m) => ({ default: m.DestroyFieldset }));
  PresetFieldsetLoader = () => import('./components/destroy').then((m) => ({ default: m.DestroyPresetFieldset }));

  useTempAssociationSource() {
    return null;
  }
}
