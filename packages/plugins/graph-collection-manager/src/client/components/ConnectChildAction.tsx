import React from 'react';
import { Tooltip } from 'antd';
import { FallOutlined } from '@ant-design/icons';
import { useCollectionManager } from '@nocobase/client';
import { getPopupContainer, useGCMTranslation } from '../utils';

export const ConnectChildAction = (props) => {
  const { targetGraph, item } = props;
  const { t } = useGCMTranslation();
  const { getChildrenCollections } = useCollectionManager();
  const childs = getChildrenCollections(item.name);
  const isShowChild = childs.length > 0;

  return isShowChild ? (
    <Tooltip title={t('Show child')} getPopupContainer={getPopupContainer}>
      <FallOutlined
        className="btn-inheriedChild"
        onClick={() => {
          console.log(childs);
          targetGraph.onConnectionChilds(childs.map((v) => v.name));
        }}
      />
    </Tooltip>
  ) : (
    ''
  );
};
