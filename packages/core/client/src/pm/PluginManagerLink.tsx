import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Button, Card, Popover, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../application';
import { ActionContextProvider, useCompile } from '../schema-component';
import { useToken } from '../style';

export const PluginManagerLink = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useToken();
  return (
    <Tooltip title={t('Plugin manager')}>
      <Button
        data-testid={'plugin-manager-button'}
        icon={<ApiOutlined style={{ color: token.colorTextHeaderMenu }} />}
        title={t('Plugin manager')}
        onClick={() => {
          navigate('/admin/pm/list');
        }}
      />
    </Tooltip>
  );
};

export const SettingsCenterDropdown = () => {
  const [visible, setVisible] = useState(false);
  const compile = useCompile();
  const { t } = useTranslation();
  const { token } = useToken();
  const navigate = useNavigate();
  const app = useApp();
  const settings = app.settingsCenter.getList();
  const [open, setOpen] = useState(false);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Popover
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
        }}
        arrow={false}
        content={
          <div style={{ maxWidth: '23rem' }}>
            <Card
              bordered={false}
              className={css`
                box-shadow: none;
              `}
              style={{ boxShadow: 'none' }}
            >
              {settings.map((setting) => (
                <Card.Grid
                  className={css`
                    cursor: pointer;
                    padding: 0 !important;
                    box-shadow: none !important;
                    &:hover {
                      border-radius: ${token.borderRadius}px;
                      background: rgba(0, 0, 0, 0.045);
                    }
                  `}
                  key={setting.pluginName}
                >
                  <a
                    role="button"
                    aria-label={setting.name}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      navigate(setting.path);
                    }}
                    title={compile(setting.title)}
                    style={{ display: 'block', color: 'inherit', padding: token.margin }}
                    href={setting.path}
                  >
                    <div style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.3rem' }}>
                      {setting.icon || <SettingOutlined />}
                    </div>
                    <div
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {compile(setting.title)}
                    </div>
                  </a>
                </Card.Grid>
              ))}
            </Card>
          </div>
        }
      >
        <Button
          data-testid="settings-center-button"
          icon={<SettingOutlined style={{ color: token.colorTextHeaderMenu }} />}
          // title={t('All plugin settings')}
        />
      </Popover>
    </ActionContextProvider>
  );
};
