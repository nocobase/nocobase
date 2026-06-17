/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FileAddOutlined } from '@ant-design/icons';
import { Instruction } from '../canvas/Instruction';
import { NAMESPACE } from '../locale';
import {
  getSingleRecordCreateModelMenuItem,
  getSingleRecordTempAssociationSource,
  type CollectionResultNodeLike,
  useCollectionNodeVariables,
} from './collectionNode';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class extends Instruction {
  type = 'create';
  title = t('Create record');
  group = 'collection';
  description = t(
    'Add new record to a collection. You can use variables from upstream nodes to assign values to fields.',
  );
  icon = (<FileAddOutlined />);

  FieldsetLoader = () => import('./components/create').then((m) => ({ default: m.CreateFieldset }));
  PresetFieldsetLoader = () => import('./components/create').then((m) => ({ default: m.CreatePresetFieldset }));

  createDefaultConfig() {
    return {
      usingAssignFormSchema: true,
      assignFormSchema: {},
    };
  }

  useVariables = useCollectionNodeVariables;

  getCreateModelMenuItem({ node }: { node: CollectionResultNodeLike }) {
    return getSingleRecordCreateModelMenuItem({ node, title: t('Create record') });
  }

  useTempAssociationSource(node: CollectionResultNodeLike) {
    return getSingleRecordTempAssociationSource(node);
  }
}
