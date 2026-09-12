/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class extends Instruction {
  type = 'update';
  title = t('Update record');
  group = 'collection';
  description = t(
    'Update records of a collection. You can use variables from upstream nodes as query conditions and field values.',
  );
  icon = (<EditOutlined />);

  FieldsetLoader = () => import('./components/update').then((m) => ({ default: m.UpdateFieldset }));
  PresetFieldsetLoader = () => import('./components/update').then((m) => ({ default: m.UpdatePresetFieldset }));

  createDefaultConfig() {
    return {};
  }

  useTempAssociationSource() {
    return null;
  }
}
