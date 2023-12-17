import React from 'react';
import { useTranslation } from '../locale';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@nocobase/client';
import { Button } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

export const OpenInNewTab = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const onOpenInNewTab = () => {
    let baseUrl = window.origin;
    if (window.location.pathname.startsWith('/apps')) {
      baseUrl = window.origin + window.location.pathname.split('/').slice(0, 3).join('/');
    }
    window.open(`${baseUrl}${location.pathname}${location.search}`);
  };

  return (
    <div
      className={css`
        position: absolute;
        top: -40px;
        right: 0;
      `}
    >
      <Button type="dashed" onClick={onOpenInNewTab} icon={<LinkOutlined />}>
        {t('Preview')}
      </Button>
    </div>
  );
};
