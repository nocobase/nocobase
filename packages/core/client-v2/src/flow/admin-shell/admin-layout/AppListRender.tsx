/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AppListProps } from '@ant-design/pro-layout/es/components/AppsLogoComponents/types';
import { css } from '@emotion/css';
import { Card, Typography, theme } from 'antd';
import React from 'react';

function renderIcon(icon: React.ReactNode | (() => React.ReactNode)) {
  return typeof icon === 'function' ? icon() : icon;
}

export function useAppListRender() {
  const { token } = theme.useToken();

  return React.useCallback(
    (appList: AppListProps) => {
      const columnCount = Math.min(Math.max(appList.length, 1), 2);

      return (
        <div
          className={css`
            max-width: calc(100vw - 48px);
            max-height: calc(100vh - 48px);
            overflow: auto;
            padding: ${token.paddingXS}px;
          `}
        >
          <ul
            className={css`
              display: grid;
              grid-template-columns: repeat(${columnCount}, 260px);
              gap: ${token.marginXXS}px;
              margin: 0;
              padding: 0;
              list-style: none;
            `}
          >
            {appList.map((app, index) => (
              <li
                key={`${app.url || ''}-${index}`}
                className={css`
                  width: 260px;
                  height: 56px;
                  list-style: none;
                `}
              >
                <a
                  href={app.url}
                  target={app.target}
                  rel="noreferrer"
                  className={css`
                    display: block;
                    height: 100%;
                    color: ${token.colorText};
                    text-decoration: none;

                    &:hover {
                      color: ${token.colorText};
                    }
                  `}
                >
                  <Card
                    bordered={false}
                    style={{
                      height: '100%',
                      borderRadius: token.borderRadius,
                      boxShadow: 'none',
                    }}
                    className={css`
                      height: 100%;
                      border-radius: ${token.borderRadius}px;
                      box-shadow: none;

                      &:hover {
                        background: ${token.colorBgTextHover};
                        box-shadow: none;
                      }

                      .ant-card-body {
                        height: 100%;
                        padding: ${token.paddingXS}px;
                        display: flex;
                        align-items: center;
                        gap: ${token.marginXS}px;
                      }
                    `}
                    styles={{
                      body: {
                        background: 'transparent',
                      },
                    }}
                  >
                    <span
                      className={css`
                        display: inline-flex;
                        flex: 0 0 auto;
                        width: 32px;
                        height: 32px;
                        align-items: center;
                        justify-content: center;

                        img {
                          max-width: 32px;
                          max-height: 32px;
                        }
                      `}
                    >
                      {renderIcon(app.icon)}
                    </span>
                    <Typography.Text
                      ellipsis
                      title={typeof app.title === 'string' ? app.title : undefined}
                      className={css`
                        min-width: 0;
                        color: ${token.colorText};
                        font-size: ${token.fontSize}px;
                        line-height: ${token.lineHeight};
                      `}
                    >
                      {app.title}
                    </Typography.Text>
                  </Card>
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    },
    [token],
  );
}
