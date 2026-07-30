/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SearchOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@nocobase/flow-engine';
import { Empty, Input, Modal, theme as antdTheme } from 'antd';
import type { InputRef } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useSettingsSearch, type SettingsSearchItem } from '../settings-center/useSettingsSearch';
import { getSettingsHeaderColors } from './settingsTheme';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
const SHORTCUT_LABEL = isMac ? '⌘F' : 'Ctrl F';

const triggerClassName = css`
  align-items: center;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  transition: background 0.2s;
  white-space: nowrap;
`;

const resultListClassName = css`
  max-height: 320px;
  overflow-y: auto;
  margin: 0 -24px -12px;
  padding: 0 12px 12px;
`;

const resultItemClassName = css`
  align-items: baseline;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
`;

/**
 * 设置中心的搜索入口。
 *
 * 顶栏放一个轻量触发器，真正的搜索在弹层里进行；关键词为空时展示最近访问，
 * 这样分组化之后被收进左侧栏的深层页面仍然一步可达。支持 `Cmd/Ctrl + F` 唤起。
 */
export const SettingsSearch: React.FC = observer(() => {
  const { t } = useTranslation();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antdTheme.useToken();
  const headerColors = getSettingsHeaderColors(token);
  const { recentItems, search } = useSettingsSearch();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<InputRef>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // 登录 / 找回密码等免鉴权页面共用同一个 shell，这些页面上没有可搜索的配置项。
  const isAuthRoute = app.router.isSkippedAuthCheckRoute(location.pathname);

  const results = useMemo(() => (keyword.trim() ? search(keyword) : recentItems), [keyword, recentItems, search]);

  useEffect(() => {
    setActiveIndex(0);
  }, [keyword]);

  const restoreLastActiveElement = useCallback(() => {
    const lastActiveElement = lastActiveElementRef.current;
    lastActiveElementRef.current = null;
    if (lastActiveElement?.isConnected) {
      lastActiveElement.focus({ preventScroll: true });
    }
  }, []);

  const openPalette = useCallback(() => {
    setKeyword('');

    if (open) {
      inputRef.current?.focus();
      return;
    }

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    triggerRef.current?.focus();
    setOpen(true);
  }, [open]);

  const go = useCallback(
    (item?: SettingsSearchItem) => {
      if (!item) {
        return;
      }

      setOpen(false);

      if (item.link) {
        window.open(item.link, '_blank', 'noopener,noreferrer');
        return;
      }

      if (item.path !== location.pathname) {
        navigate(item.path);
      }
    },
    [location.pathname, navigate],
  );

  useEffect(() => {
    if (isAuthRoute) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      // 页面内组件可能自己就用 Cmd/Ctrl+F；它们 preventDefault 之后
      // 这个 window 级监听器不该再抢一次。
      if (event.defaultPrevented) {
        return;
      }

      const hasPlatformModifier = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;

      if (event.key?.toLowerCase() === 'f' && hasPlatformModifier && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        if (!event.repeat) {
          openPalette();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthRoute, openPalette]);

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        go(results[activeIndex]);
      }
    },
    [activeIndex, go, results],
  );

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={triggerClassName}
        role="button"
        tabIndex={0}
        title={t('Search settings')}
        style={{ color: headerColors.text }}
        onClick={openPalette}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            restoreLastActiveElement();
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPalette();
          }
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = headerColors.bgHover;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'transparent';
        }}
      >
        <SearchOutlined />
        <span style={{ fontSize: token.fontSizeSM, opacity: 0.75 }}>{SHORTCUT_LABEL}</span>
      </div>

      <Modal
        open={open}
        footer={null}
        closable={false}
        destroyOnClose
        focusTriggerAfterClose={false}
        width={520}
        styles={{ body: { paddingTop: 4 } }}
        afterOpenChange={(opened) => {
          if (opened) {
            inputRef.current?.focus();
            return;
          }

          restoreLastActiveElement();
        }}
        onCancel={() => setOpen(false)}
      >
        <Input
          ref={inputRef}
          allowClear
          bordered={false}
          placeholder={t('Search settings')}
          prefix={<SearchOutlined style={{ color: token.colorTextDescription }} />}
          size="large"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={onInputKeyDown}
        />
        <div style={{ borderTop: `${token.lineWidth}px solid ${token.colorSplit}`, margin: '8px -24px 0' }} />

        {!keyword.trim() && recentItems.length ? (
          <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM, padding: '12px 12px 4px' }}>
            {t('Recently visited')}
          </div>
        ) : null}

        <div className={resultListClassName}>
          {results.length ? (
            results.map((item, index) => (
              <div
                key={item.name}
                className={resultItemClassName}
                style={{ background: index === activeIndex ? token.colorFillQuaternary : 'transparent' }}
                onClick={() => go(item)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span style={{ color: token.colorText }}>{item.title}</span>
                <span style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>{item.breadcrumb}</span>
              </div>
            ))
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={keyword.trim() ? t('No matching settings') : t('Search settings')}
              style={{ margin: '24px 0' }}
            />
          )}
        </div>
      </Modal>
    </>
  );
});

SettingsSearch.displayName = 'SettingsSearch';

export default SettingsSearch;
