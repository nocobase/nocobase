import { App, Card, Divider, Popconfirm, Space, Switch, Typography, message } from 'antd';
import classnames from 'classnames';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DeleteOutlined, ReadOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useAPIClient } from '../api-client';
import { useApp } from '../application';
import { PluginDetail } from './PluginDetail';
import { PluginUpgradeModal } from './PluginForm/modal/PluginUpgradeModal';
import { useStyles } from './style';
import type { IPluginData } from './types';

interface IPluginInfo extends IPluginCard {
  onClick: () => void;
}

function PluginInfo(props: IPluginInfo) {
  const { data, onClick } = props;
  const app = useApp();
  const { name, displayName, isCompatible, packageName, updatable, builtIn, enabled, description, error, homepage } =
    data;
  const { styles, theme } = useStyles();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const api = useAPIClient();
  const { modal } = App.useApp();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const reload = () => window.location.reload();
  const title = displayName || name || packageName;
  return (
    <>
      {showUploadForm && (
        <PluginUpgradeModal
          isShow={showUploadForm}
          pluginData={data}
          onClose={(isRefresh) => {
            setShowUploadForm(false);
          }}
        />
      )}
      <Card
        role="button"
        aria-label={title}
        size={'small'}
        bordered={false}
        onClick={() => {
          !error && onClick();
        }}
        headStyle={{ border: 'none', minHeight: 'inherit', paddingTop: 14 }}
        bodyStyle={{ paddingTop: 10 }}
        // style={{ marginBottom: theme.marginLG }}
        title={<div>{title}</div>}
        hoverable
        className={css`
          .ant-card-actions {
            li .ant-space {
              gap: 2px !important;
            }
            li a {
              .anticon {
                margin-right: 3px;
                /* display: none; */
              }
            }
            li:last-child {
              width: 20% !important;
            }
            li:first-child {
              width: 80% !important;
              border-inline-end: 0;
              text-align: left;
              padding-left: 16px;
            }
          }
        `}
        actions={[
          <Space split={<Divider type="vertical" />} key={'1'}>
            <a
              key={'5'}
              href={homepage}
              target="_blank"
              onClick={(event) => {
                event.stopPropagation();
              }}
              rel="noreferrer"
            >
              <ReadOutlined /> {t('Docs')}
            </a>
            {updatable && (
              <a
                key={'3'}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUploadForm(true);
                }}
              >
                <ReloadOutlined /> {t('Update')}
              </a>
            )}
            {enabled ? (
              app.pluginSettingsManager.has(name) && (
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(app.pluginSettingsManager.getRoutePath(name));
                  }}
                >
                  <SettingOutlined /> {t('Settings')}
                </a>
              )
            ) : (
              <Popconfirm
                key={'delete'}
                disabled={builtIn}
                title={t('Are you sure to delete this plugin?')}
                onConfirm={async (e) => {
                  e.stopPropagation();
                  api.request({
                    url: `pm:remove`,
                    params: {
                      filterByTk: name,
                    },
                  });
                }}
                onCancel={(e) => e.stopPropagation()}
                okText={t('Yes')}
                cancelText={t('No')}
              >
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={classnames({ [styles.cardActionDisabled]: builtIn })}
                >
                  <DeleteOutlined /> {t('Remove')}
                </a>
              </Popconfirm>
            )}
          </Space>,
          <Switch
            aria-label="enable"
            key={'enable'}
            size={'small'}
            disabled={builtIn || error}
            onChange={async (checked, e) => {
              e.stopPropagation();
              if (!isCompatible && checked) {
                message.error(t("Dependencies check failed, can't enable."));
                return;
              }
              if (!checked) {
                modal.confirm({
                  title: t('Are you sure to disable this plugin?'),
                  onOk: async () => {
                    await api.request({
                      url: `pm:disable`,
                      params: {
                        filterByTk: name,
                      },
                    });
                  },
                });
              } else {
                await api.request({
                  url: `pm:enable`,
                  params: {
                    filterByTk: name,
                  },
                });
              }
            }}
            checked={!!enabled}
          ></Switch>,
        ].filter(Boolean)}
      >
        <Card.Meta
          description={
            !error ? (
              <Typography.Paragraph
                style={{ height: theme.fontSize * theme.lineHeight * 3 }}
                type={isCompatible ? 'secondary' : 'danger'}
                ellipsis={{ rows: 3 }}
              >
                {isCompatible ? description : t('Plugin dependencies check failed')}
              </Typography.Paragraph>
            ) : (
              <Typography.Text type="danger">
                {t('Plugin loading failed. Please check the server logs.')}
              </Typography.Text>
            )
          }
        />
        {/* {!isCompatible && !error && (
          <Button style={{ padding: 0 }} type="link">
            <Typography.Text type="danger">{t('Dependencies check failed')}</Typography.Text>
          </Button>
        )} */}
        {/*
          <Col span={8}>
            <Space direction="vertical" align="end" style={{ display: 'flex', marginTop: -10 }}>
              {type && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUploadForm(true);
                  }}
                  ghost
                  type="primary"
                >
                  {t('Update plugin')}
                </Button>
              )}

              {!error && (
                <Button style={{ padding: 0 }} type="link">
                  {t('More details')}
                </Button>
              )}
            </Space>
          </Col> */}
      </Card>
    </>
  );
}

export interface IPluginCard {
  data: IPluginData;
}

export const PluginCard: FC<IPluginCard> = (props) => {
  const { data } = props;
  const [plugin, setPlugin] = useState<IPluginData>(undefined);

  return (
    <>
      {plugin && <PluginDetail plugin={plugin} onCancel={() => setPlugin(undefined)} />}
      <PluginInfo
        onClick={() => {
          setPlugin(data);
        }}
        data={data}
      />
    </>
  );
};
