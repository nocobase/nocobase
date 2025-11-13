/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import React, { FC, ReactNode, useMemo } from 'react';
import { CloseOutline } from 'antd-mobile-icons';
import { useMobileActionDrawerStyle } from './MobilePopup.style';
import { useFlowModelContext } from '../hooks';

interface MobilePopupProps {
  title?: string;
  visible: boolean;
  minHeight?: number | string;
  onClose: () => void;
  children: ReactNode;
}

export const MobilePopup: FC<MobilePopupProps> = (props) => {
  const { title, visible, onClose: closePopup, children, minHeight } = props;
  const t = useFlowModelContext().t;
  const { componentCls, hashId } = useMobileActionDrawerStyle();

  const style = useMemo(() => {
    return {
      minHeight,
    };
  }, [minHeight]);

  const theme = useMemo(() => {
    return {
      token: {
        paddingPageHorizontal: 8,
        paddingPageVertical: 8,
        marginBlock: 12,
        borderRadiusBlock: 8,
        fontSize: 14,
      },
    };
  }, []);

  return (
    <ConfigProvider theme={theme}>
      <Popup
        className={`${componentCls} ${hashId}`}
        visible={visible}
        onClose={closePopup}
        onMaskClick={closePopup}
        bodyClassName="nb-mobile-action-drawer-body"
        bodyStyle={style}
        maskStyle={style}
        style={style}
        destroyOnClose
      >
        <div className="nb-mobile-action-drawer-header">
          {/* used to make the title center */}
          <span className="nb-mobile-action-drawer-placeholder">
            <CloseOutline />
          </span>
          <span>{title}</span>
          <span
            className="nb-mobile-action-drawer-close-icon"
            onClick={closePopup}
            role="button"
            tabIndex={0}
            aria-label={t('Close')}
          >
            <CloseOutline />
          </span>
        </div>
        {children}
      </Popup>
    </ConfigProvider>
  );
};
