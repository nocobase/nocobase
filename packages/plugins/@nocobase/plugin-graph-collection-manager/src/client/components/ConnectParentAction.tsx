/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tooltip } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { useCollectionManager_deprecated } from '@nocobase/client';
import { getPopupContainer, useGCMTranslation } from '../utils';

export const ConnectParentAction = (props) => {
  const { targetGraph, item } = props;
  const { t } = useGCMTranslation();
  const { getInheritCollections } = useCollectionManager_deprecated();
  const parents = getInheritCollections(item.name);
  const isShowParent = parents?.some((name) => {
    return !targetGraph.hasCell(name);
  });
  return isShowParent ? (
    <Tooltip title={t('Show parent')} getPopupContainer={getPopupContainer}>
      <RiseOutlined
        className="btn-inheriedParent"
        onClick={() => {
          targetGraph.onConnectionParents(parents);
        }}
      />
    </Tooltip>
  ) : (
    ''
  );
};
