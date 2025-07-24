/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import cls from 'classnames';
import { useToken, useUploadStyles } from '@nocobase/client';
import { css } from '@emotion/css';
import { useField } from '@formily/react';
import { Field } from '@formily/core';
import { avatars, avatarsMap } from '../avatars';
import { List, Avatar as AntdAvatar } from 'antd';

export const Avatar: React.FC<{
  srcs: [string, string][];
  size?: 'small' | 'large';
  selectable?: boolean;
  highlightItem?: string;
  onClick?: (name: string) => void;
}> = ({ srcs, size = 'large', selectable, highlightItem, onClick }) => {
  const { token } = useToken();
  const { wrapSSR, hashId, componentCls: prefixCls } = useUploadStyles();
  console.log(srcs);

  const list =
    srcs?.map(([src, name], index) => (
      <div key={index} className={`${prefixCls}-list-picture-card-container ${prefixCls}-list-item-container`}>
        <div
          onClick={() => onClick && onClick(name)}
          className={cls(
            `${prefixCls}-list-item`,
            `${prefixCls}-list-item-done`,
            `${prefixCls}-list-item-list-type-picture-card`,
            highlightItem === name
              ? css`
                  border-color: ${token.colorPrimary} !important;
                `
              : '',
            selectable
              ? css`
                  cursor: pointer;
                  &:hover {
                    border-color: ${token.colorPrimary} !important;
                  }
                `
              : '',
          )}
        >
          <div className={`${prefixCls}-list-item-info`}>
            <span key="thumbnail" className={`${prefixCls}-list-item-thumbnail`}>
              <img src={src} className={`${prefixCls}-list-item-image`} />
            </span>
          </div>
        </div>
      </div>
    )) || [];

  return (
    <List
      itemLayout="horizontal"
      dataSource={srcs}
      renderItem={([src, name]) => {
        return (
          <AntdAvatar
            size={size === 'small' ? 40 : 80}
            className={cls(
              css`
                margin: 2px;
                border-radius: ${size === 'small' ? '4px' : '8px'};
                border: 1px solid ${token.colorBorder};
                padding: 1px;
              `,
              highlightItem === name
                ? css`
                    border-color: ${token.colorPrimary} !important;
                  `
                : '',
              selectable
                ? css`
                    cursor: pointer;
                    &:hover {
                      border-color: ${token.colorPrimary} !important;
                    }
                  `
                : '',
            )}
            src={src}
            shape="square"
            onClick={() => onClick && onClick(name)}
          />
        );
      }}
    />
  );

  return wrapSSR(
    <div
      className={cls(
        `${prefixCls}-wrapper`,
        `${prefixCls}-picture-card-wrapper`,
        `nb-upload`,
        `nb-upload${size ? `-${size}` : ''}`,
        hashId,
      )}
    >
      <div className={cls(`${prefixCls}-list`, `${prefixCls}-list-picture-card`)}>{list}</div>
    </div>,
  );
};

export const AvatarSelect: React.FC = () => {
  const field = useField<Field>();
  const defaultAvatar = Object.keys(avatarsMap)[0];
  const [current, setCurrent] = React.useState(defaultAvatar);

  useEffect(() => {
    if (field.value) {
      return;
    }
    field.setInitialValue(defaultAvatar);
  }, [field]);

  useEffect(() => {
    if (!field.value) {
      return;
    }
    setCurrent(field.value);
  }, [field.value]);

  const avatarList = useMemo(() => {
    return Object.keys(avatarsMap).map((seed) => {
      return {
        seed,
        uri: avatars(seed),
      };
    });
  }, []);

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Avatar srcs={current ? [[avatars(current), current]] : []} />
      </div>
      <Avatar
        srcs={avatarList.map((a) => [a.uri, a.seed])}
        size="small"
        selectable
        highlightItem={current}
        onClick={(name) => (field.value = name)}
      />
    </>
  );
};
