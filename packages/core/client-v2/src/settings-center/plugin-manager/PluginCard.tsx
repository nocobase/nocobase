/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CloseCircleFilled,
  DeleteOutlined,
  LoadingOutlined,
  ReadOutlined,
  SettingOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useMemoizedFn } from 'ahooks';
import { App, Card, Divider, Modal, Popconfirm, Result, Space, Switch, Tooltip, Typography, theme } from 'antd';
import React, { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { PluginDetail } from './PluginDetail';
import type { IPluginData } from './types';

interface PluginCardProps {
  data: IPluginData;
}

export const PluginCard: FC<PluginCardProps> = ({ data }) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const app = useApp();
  const { modal } = App.useApp();
  const [detailOpen, setDetailOpen] = useState(false);

  const { name, displayName, isCompatible, packageName, builtIn, enabled, removable, description, error, homepage } =
    data;

  const title = displayName || name || packageName;

  const openDetail = useMemoizedFn(() => {
    if (!error) {
      setDetailOpen(true);
    }
  });

  const handleEnable = useMemoizedFn(async () => {
    await app.apiClient.request({
      url: 'pm:enable',
      params: { filterByTk: name },
    });
  });

  const handleDisable = useMemoizedFn(async () => {
    await app.apiClient.request({
      url: 'pm:disable',
      params: { filterByTk: name },
    });
  });

  const handleRemove = useMemoizedFn(async () => {
    await app.apiClient.request({
      url: 'pm:remove',
      params: { filterByTk: name },
    });
    modal.info({
      icon: null,
      width: 520,
      content: (
        <Result
          icon={<LoadingOutlined />}
          title={t('Plugin removing')}
          subTitle={t('Plugin is removing, please wait...')}
        />
      ),
      footer: null,
    });
    const checkHealth = () => {
      app.apiClient
        .request({ url: '__health_check', method: 'get', skipNotify: true })
        .then((response) => {
          if (response?.data === 'ok') {
            window.location.reload();
          }
        })
        .catch(() => {
          // health check still failing, keep polling
        });
    };
    setInterval(checkHealth, 1000);
  });

  const handleSwitchChange = useMemoizedFn(async (checked: boolean) => {
    if (!isCompatible && checked) {
      modal.confirm({
        title: t('Plugin dependency version mismatch'),
        content: t(
          'The current dependency version of the plugin does not match the version of the application and may not work properly. Are you sure you want to continue enabling the plugin?',
        ),
        onOk: handleEnable,
      });
      return;
    }
    if (!checked) {
      modal.confirm({
        title: t('Are you sure to disable this plugin?'),
        onOk: handleDisable,
      });
      return;
    }
    await handleEnable();
  });

  const openSettings = useMemoizedFn(() => {
    navigate(app.pluginSettingsManager.getRoutePath(name));
  });

  const cardClassName = useMemo(
    () => css`
      display: flex;
      flex-direction: column;
      height: 100%;

      .ant-card-body {
        flex-grow: 1;
      }

      .ant-card-actions {
        li .ant-space {
          gap: ${token.marginXXS}px !important;
        }
        li:first-child {
          width: 80% !important;
          border-inline-end: 0;
          text-align: left;
          padding-inline-start: ${token.padding}px;
        }
        li:last-child {
          width: 20% !important;
        }
      }
    `,
    [token.marginXXS, token.padding],
  );

  const cardTitle = (
    <Space>
      {error ? (
        <Tooltip title={t('Plugin loading failed. Please check the server logs.')}>
          <Typography.Text type="danger">
            <CloseCircleFilled />
          </Typography.Text>
        </Tooltip>
      ) : null}
      {!isCompatible ? (
        <Tooltip title={t('Plugin dependencies check failed')}>
          <Typography.Text type="warning">
            <WarningFilled />
          </Typography.Text>
        </Tooltip>
      ) : null}
      <span>{title}</span>
    </Space>
  );

  const linksAction = (
    <Space split={<Divider type="vertical" />} key="links" size={token.marginXXS}>
      {homepage && (
        <a
          href={homepage}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label={t('Docs')}
        >
          <ReadOutlined /> {t('Docs')}
        </a>
      )}
      {enabled && app.pluginSettingsManager.has(name) && (
        <a
          onClick={(e) => {
            e.stopPropagation();
            openSettings();
          }}
          aria-label={t('Settings')}
        >
          <SettingOutlined /> {t('Settings')}
        </a>
      )}
      {removable && (
        <Popconfirm
          key="delete"
          disabled={builtIn}
          title={t('Are you sure to delete this plugin?')}
          onConfirm={(e) => {
            e?.stopPropagation();
            handleRemove();
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText={t('Yes')}
          cancelText={t('No')}
        >
          <a
            onClick={(e) => e.stopPropagation()}
            aria-label={t('Remove')}
            style={builtIn ? { color: token.colorTextDisabled, cursor: 'not-allowed' } : undefined}
          >
            <DeleteOutlined /> {t('Remove')}
          </a>
        </Popconfirm>
      )}
    </Space>
  );

  const switchAction = (
    <Switch
      aria-label={t('Enable')}
      key="enable"
      size="small"
      disabled={builtIn || error}
      onChange={(checked, e) => {
        e.stopPropagation();
        handleSwitchChange(checked);
      }}
      checked={!!enabled}
    />
  );

  return (
    <>
      {detailOpen && <PluginDetail plugin={data} onCancel={() => setDetailOpen(false)} />}
      <Card
        role="button"
        aria-label={title}
        size="small"
        variant="borderless"
        hoverable
        onClick={openDetail}
        styles={{
          body: { paddingTop: token.paddingSM },
          header: { border: 'none', minHeight: 'inherit', paddingTop: token.padding },
        }}
        className={cardClassName}
        title={cardTitle}
        actions={[linksAction, switchAction]}
      >
        <Card.Meta
          description={
            <Typography.Paragraph
              type="secondary"
              className={css`
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                margin-bottom: 0;
              `}
            >
              {description}
            </Typography.Paragraph>
          }
        />
      </Card>
    </>
  );
};
