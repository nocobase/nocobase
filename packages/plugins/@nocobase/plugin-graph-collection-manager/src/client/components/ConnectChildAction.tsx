import React from 'react';
import { Tooltip } from 'antd';
import { FallOutlined } from '@ant-design/icons';
import { getPopupContainer, useGCMTranslation } from '../utils';
import { InheritanceCollectionMixin, useCollectionManagerV2 } from '@nocobase/client';

export const ConnectChildAction = (props) => {
  const { targetGraph, item } = props;
  const { t } = useGCMTranslation();
  const cm = useCollectionManagerV2<InheritanceCollectionMixin>();
  const childs = cm.getCollection(item.name).getChildrenCollectionsName();
  const isShowChild = childs?.some((name) => {
    return !targetGraph.hasCell(name);
  });
  return isShowChild ? (
    <Tooltip title={t('Show child')} getPopupContainer={getPopupContainer}>
      <FallOutlined
        className="btn-inheriedChild"
        onClick={() => {
          targetGraph.onConnectionChilds(childs);
        }}
      />
    </Tooltip>
  ) : (
    ''
  );
};
