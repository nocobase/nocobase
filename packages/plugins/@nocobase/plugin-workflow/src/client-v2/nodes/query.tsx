/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FileSearchOutlined } from '@ant-design/icons';
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
  type = 'query';
  title = t('Query record');
  group = 'collection';
  description = t('Query records from a collection. You can use variables from upstream nodes as query conditions.');
  icon = (<FileSearchOutlined />);

  FieldsetLoader = () => import('./components/query').then((m) => ({ default: m.QueryFieldset }));
  PresetFieldsetLoader = () => import('./components/query').then((m) => ({ default: m.QueryPresetFieldset }));

  createDefaultConfig() {
    return {
      multiple: false,
    };
  }

  useVariables = useCollectionNodeVariables;

  getCreateModelMenuItem({ node }: { node: CollectionResultNodeLike }) {
    return getSingleRecordCreateModelMenuItem({ node, title: t('Query record') });
  }

  useTempAssociationSource(node: CollectionResultNodeLike) {
    return getSingleRecordTempAssociationSource(node);
  }
}
