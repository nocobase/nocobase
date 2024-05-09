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
import { FallOutlined } from '@ant-design/icons';
import { useCollectionManager_deprecated } from '@nocobase/client';
import { getPopupContainer, useGCMTranslation } from '../utils';

export const ConnectChildAction = (props) => {
  const { targetGraph, item } = props;
  const { t } = useGCMTranslation();
  const { getChildrenCollections } = useCollectionManager_deprecated();
  const childs = getChildrenCollections(item.name);

  const isShowChild = childs?.some(({ name }) => {
    return !targetGraph.hasCell(name);
  });
  return isShowChild ? (
    <Tooltip title={t('Show child')} getPopupContainer={getPopupContainer}>
      <FallOutlined
        className="btn-inheriedChild"
        onClick={() => {
          targetGraph.onConnectionChilds(childs.map((v) => v.name));
        }}
      />
    </Tooltip>
  ) : (
    ''
  );
};
