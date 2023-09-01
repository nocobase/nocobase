import React from 'react';
import { Tooltip } from 'antd';
import { FallOutlined } from '@ant-design/icons';
import { getPopupContainer, useGCMTranslation } from '../utils';

export const ConnectChildAction = (props) => {
  const { targetGraph, item } = props;
  const { t } = useGCMTranslation();

  return (
    <Tooltip title={t('Show child')} getPopupContainer={getPopupContainer}>
      <FallOutlined
        className="btn-inheriedChild"
        onClick={() => {
          targetGraph.onConnectionChild(item);
        }}
      />
    </Tooltip>
  );
};
