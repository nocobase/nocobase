import React, { forwardRef } from 'react';
import { Tooltip, Button } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { getPopupContainer, useGCMTranslation } from '../utils';
import { useFullscreen } from 'ahooks';

export const FullscreenAction = forwardRef(() => {
  const { t } = useGCMTranslation();

  const [isFullscreen, { toggleFullscreen }] = useFullscreen(document.getElementById('graph_container'));
  return (
    <Tooltip title={t('Full Screen')} getPopupContainer={getPopupContainer}>
      <Button
        onClick={() => {
          toggleFullscreen();
        }}
      >
        {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      </Button>
    </Tooltip>
  );
});
FullscreenAction.displayName = 'FullscreenAction';
