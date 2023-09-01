import React from 'react';
import { Tooltip } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { getPopupContainer, useGCMTranslation } from '../utils';

export const ConnectParentAction = (props) => {
  const { targetGraph, item } = props;
  const { t } = useGCMTranslation();
  return (
    <Tooltip title={t('Show parent')} getPopupContainer={getPopupContainer}>
      <RiseOutlined
        className="btn-inheriedParent"
        onClick={() => {
          targetGraph.onConnectionParent(item);
        }}
      />
    </Tooltip>
  );
};
