import { ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Button, Card, Dropdown, Popover, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
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
  const settings = app.pluginSettingsManager.getList();
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      menu={{
        style: {
          maxHeight: '70vh',
          overflow: 'auto',
        },
        items: settings
          .filter((v) => v.isTopLevel !== false)
          .map((setting) => {
            return {
              key: setting.name,
              icon: setting.icon,
              label: <Link to={setting.path}>{compile(setting.title)}</Link>,
            };
          }),
      }}
    >
      <Button
        data-testid="plugin-settings-button"
        icon={<SettingOutlined style={{ color: token.colorTextHeaderMenu }} />}
        // title={t('All plugin settings')}
      />
    </Dropdown>
  );
  return (
    settings.length > 0 && (
      <ActionContextProvider value={{ visible, setVisible }}>
        <Popover
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
          }}
          arrow={false}
          content={
            <div style={{ maxWidth: '21rem', overflow: 'auto', maxHeight: '50vh' }}>
              <Card
                bordered={false}
                className={css`
                  box-shadow: none;
                `}
                style={{ boxShadow: 'none' }}
              >
                {settings
                  .filter((v) => v.isTopLevel !== false)
                  .map((setting) => (
                    <Card.Grid
                      style={{
                        width: settings.length === 1 ? '100%' : settings.length === 2 ? '50%' : '33.33%',
                      }}
                      className={css`
                        cursor: pointer;
                        padding: 0 !important;
                        box-shadow: none !important;
                        &:hover {
                          border-radius: ${token.borderRadius}px;
                          background: rgba(0, 0, 0, 0.045);
                        }
                      `}
                      key={setting.name}
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
                        style={{ display: 'block', color: 'inherit', minWidth: '4.5rem', padding: token.marginSM }}
                        href={setting.path}
                      >
                        <div style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.3rem' }}>
                          {setting.icon || <SettingOutlined />}
                        </div>
                        <div
                          style={{
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: token.fontSizeSM,
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
            data-testid="plugin-settings-button"
            icon={<SettingOutlined style={{ color: token.colorTextHeaderMenu }} />}
            // title={t('All plugin settings')}
          />
        </Popover>
      </ActionContextProvider>
    )
  );
};
