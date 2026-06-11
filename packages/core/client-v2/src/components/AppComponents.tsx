/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisconnectOutlined, LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@nocobase/flow-engine';
import { Button, Modal, Result, Spin } from 'antd';
import type { FC } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Application } from '../Application';

/** app.error 的运行时结构 */
interface AppErrorPayload {
  code?: string;
  message?: string;
  command?: { name: string };
  [key: string]: any;
}

export const AppSpin = () => {
  return (
    <Spin style={{ position: 'fixed', top: '50%', left: '50%', fontSize: 72, transform: 'translate(-50%, -50%)' }} />
  );
};

const getProps = (app: Application) => {
  if (app.ws.serverDown) {
    return {
      status: 'error' as const,
      icon: <DisconnectOutlined />,
      title: "You're offline",
      subTitle: 'Please check the server status or network connection status',
    };
  }

  const error = app.error as AppErrorPayload | undefined;

  if (!error) {
    return {};
  }

  if (error.code === 'APP_NOT_FOUND') {
    return {
      status: 'warning' as const,
      title: 'App not found',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_WARNING') {
    return {
      status: 'warning' as const,
      title: 'App warning',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_PREPARING') {
    return {
      status: 'info' as const,
      icon: <LoadingOutlined />,
      title: 'App preparing',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_INITIALIZING') {
    return {
      status: 'info' as const,
      icon: <LoadingOutlined />,
      title: 'App initializing',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_INITIALIZED') {
    return {
      status: 'info' as const,
      title: 'App initialized',
      subTitle: error?.message,
    };
  }

  if (['ENOENT', 'APP_ERROR', 'LOAD_ERROR'].includes(error.code)) {
    return {
      status: 'error' as const,
      title: 'App error',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_NOT_INSTALLED_ERROR') {
    return {
      status: 'warning' as const,
      title: 'App not installed',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_STOPPED') {
    return {
      status: 'warning' as const,
      title: 'App stopped',
      subTitle: error?.message,
    };
  }

  if (error.code === 'APP_COMMANDING') {
    const props = {
      status: 'info' as const,
      icon: <LoadingOutlined />,
      title: error?.command?.name,
      subTitle: error?.message,
    };
    const commands = {
      start: {
        title: 'App starting',
      },
      restart: {
        title: 'App restarting',
      },
      install: {
        title: 'App installing',
      },
      upgrade: {
        title: 'App upgrading',
      },
      'pm.add': {
        title: 'Adding plugin',
      },
      'pm.update': {
        title: 'Updating plugin',
      },
      'pm.enable': {
        title: 'Enabling plugin',
      },
      'pm.disable': {
        title: 'Disabling plugin',
      },
      'pm.remove': {
        title: 'Removing plugin',
      },
    };
    return { ...props, ...(error?.command?.name ? commands[error.command.name as keyof typeof commands] : {}) };
  }

  return {
    status: 'warning' as const,
    title: 'App warning',
    subTitle: error?.message,
  };
};

export const AppError: FC<{ error: Error & { title?: string }; app: Application }> = observer(
  ({ app, error }) => {
    const props = getProps(app);
    return (
      <div>
        <Result
          className={css`
            top: 50%;
            position: absolute;
            width: 100%;
            transform: translate(0, -50%);
          `}
          status="error"
          title={error?.title || app.i18n.t('App error', { ns: 'client' })}
          subTitle={app.i18n.t(error?.message)}
          extra={[
            <Button type="primary" key="try" onClick={() => window.location.reload()}>
              {app.i18n.t('Try again')}
            </Button>,
          ]}
          {...props}
        />
      </div>
    );
  },
  { displayName: 'AppError' },
);

export const AppMaintaining: FC<{ app: Application; error: Error }> = observer(
  ({ app }) => {
    const { icon, status, title, subTitle } = getProps(app);
    return (
      <div>
        <Result
          className={css`
            top: 50%;
            position: absolute;
            width: 100%;
            transform: translate(0, -50%);
          `}
          icon={icon}
          status={status}
          title={title && app.i18n.t(title)}
          subTitle={<div style={{ whiteSpace: 'pre-wrap' }}>{subTitle && app.i18n.t(subTitle)}</div>}
        />
      </div>
    );
  },
  { displayName: 'AppMaintaining' },
);

export const AppMaintainingDialog: FC<{ app: Application; error: Error }> = observer(
  ({ app }) => {
    const { icon, status, title, subTitle } = getProps(app);
    return (
      <Modal open={true} footer={null} closable={false}>
        <Result
          icon={icon}
          status={status}
          title={title && app.i18n.t(title)}
          subTitle={subTitle && app.i18n.t(subTitle)}
        />
      </Modal>
    );
  },
  { displayName: 'AppMaintainingDialog' },
);

export const AppNotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('Sorry, the page you visited does not exist.')}
      extra={
        <Button onClick={() => navigate('/', { replace: true })} type="primary">
          Back Home
        </Button>
      }
    />
  );
};
