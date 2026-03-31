/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, MenuProps } from 'antd';
import classNames from 'classnames';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
import type { Theme } from './interface';
import makeStyle from './utils/makeStyle';

interface ThemeItem extends Theme {
  icon?: ReactNode;
  closable?: boolean;
  fixed?: boolean;
}

export type ThemeSelectProps = {
  onEnabledThemeChange: (themes: string[]) => void;
  onShownThemeChange: (themes: string[], selectTheme: string, info: { type: 'select' | 'deselect' }) => void;
  enabledThemes: string[];
  shownThemes: string[];
  themes: ThemeItem[];
  showAddTheme?: boolean;
};

const useStyle = makeStyle('ThemeSelect', (token) => ({
  '.previewer-theme-select': {
    padding: `${token.paddingXXS}px ${token.paddingXS}px`,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    height: token.controlHeight,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',

    [`${token.rootCls}-btn.previewer-theme-select-add-btn`]: {
      minWidth: 0,
      width: 16,
      height: 16,
      fontSize: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginInlineStart: token.marginSM,
      boxShadow: 'none',
    },

    '.previewer-theme-select-tag': {
      height: 22,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      borderRadius: 4,
      backgroundColor: token.colorBgContainer,
      border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
      paddingInline: 10,
      fontSize: token.fontSizeSM,
      position: 'relative',
      cursor: 'pointer',
      // transition: `all ${token.motionDurationMid}`,

      '&:not(:last-child)': {
        marginInlineEnd: token.marginXS,
      },

      '&.previewer-theme-select-tag-active': {
        border: `${token.lineWidth}px ${token.lineType} ${token['blue-1']}`,
        backgroundColor: 'rgba(22,119,255,0.10)',
        color: token.colorPrimary,

        '&::after': {
          content: '""',
          borderStartEndRadius: 2,
          position: 'absolute',
          insetInlineEnd: 2,
          top: 2,
          width: 6,
          height: 6,
          background: `linear-gradient(to right top, transparent, transparent 50%, ${token.colorPrimary} 50%, ${token.colorPrimary} 100%)`,
        },
      },

      '.previewer-theme-select-tag-close-btn': {
        position: 'absolute',
        top: -2,
        insetInlineEnd: -2,
        width: 12,
        height: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorBgContainer,
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05), 0 1px 4px -1px rgba(25,15,15,0.07), 0 0 1px 0 rgba(0,0,0,0.08)',
        borderRadius: '50%',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 2,
        color: token.colorIcon,

        '> .anticon': {
          fontSize: 6,
        },
      },

      '&:hover': {
        '.previewer-theme-select-tag-close-btn': {
          opacity: 1,
          pointerEvents: 'initial',
        },
      },
    },
  },

  '.previewer-theme-select-dropdown': {
    '.previewer-theme-select-dropdown-title': {
      [`${token.rootCls}-dropdown-menu-item-group-title`]: {
        fontSize: token.fontSizeSM,
        paddingBottom: token.padding,
        paddingTop: 10,
      },
    },
  },
}));

const ThemeSelect: FC<ThemeSelectProps> = (props) => {
  const { onEnabledThemeChange, onShownThemeChange, enabledThemes, shownThemes, themes, showAddTheme } = props;

  const [wrapSSR, hashId] = useStyle();

  const dropdownItems = useMemo(
    () => [
      {
        disabled: true,
        label: '添加主题即可预览',
        className: 'previewer-theme-select-dropdown-title',
        type: 'group',
        key: 'add-theme-to-preview',
      },
      ...themes
        .filter((theme) => !shownThemes.includes(theme.key))
        .map((theme) => ({
          icon: theme.icon,
          value: theme.key,
          label: theme.name,
          key: theme.key,
          onClick: () => {
            onShownThemeChange([...shownThemes, theme.key], theme.key, {
              type: 'select',
            });
          },
        })),
    ],
    [themes, shownThemes, onShownThemeChange],
  );

  const shownThemeEntities = useMemo(
    () => themes.filter((theme) => shownThemes.includes(theme.key)),
    [themes, shownThemes],
  );

  return wrapSSR(
    <div className={classNames('previewer-theme-select', hashId)}>
      {shownThemeEntities.map((theme) => (
        <span
          onClick={() => {
            if (theme.fixed) {
              return;
            }
            onEnabledThemeChange(
              enabledThemes.includes(theme.key)
                ? enabledThemes.filter((item) => item !== theme.key)
                : [...enabledThemes, theme.key],
            );
          }}
          key={theme.key}
          className={classNames('previewer-theme-select-tag', {
            'previewer-theme-select-tag-active': enabledThemes.includes(theme.key),
          })}
        >
          {theme.name}
          {theme.closable && (
            <span
              className="previewer-theme-select-tag-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEnabledThemeChange(enabledThemes.filter((item) => item !== theme.key));
                onShownThemeChange(
                  shownThemes.filter((item) => item !== theme.key),
                  theme.key,
                  { type: 'deselect' },
                );
              }}
            >
              <CloseOutlined />
            </span>
          )}
        </span>
      ))}
      {showAddTheme && (
        <Dropdown
          placement="bottomRight"
          trigger={['click']}
          overlay={<Menu items={dropdownItems as MenuProps['items']} />}
          overlayClassName={classNames('previewer-theme-select-dropdown', hashId)}
        >
          <Button type="primary" shape="circle" className="previewer-theme-select-add-btn" icon={<PlusOutlined />} />
        </Dropdown>
      )}
    </div>,
  );
};

export default ThemeSelect;
