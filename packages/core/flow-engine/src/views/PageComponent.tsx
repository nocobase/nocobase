/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useFlowEngine } from '../provider';

export const PageComponent = forwardRef((props: any, ref) => {
  const [newConfig, setNewConfig] = React.useState<any>({});
  const mergedProps: any = { ...props, ...newConfig };
  const {
    visible = true,
    footer: _footer = null,
    header: _header = null,
    children,
    hidden,
    title: _title,
    styles = {},
    zIndex = 4, // 这个默认值是为了防止表格的阴影显示到子页面上面
  } = mergedProps;
  const closedRef = useRef(false);
  const flowEngine = useFlowEngine();
  const [footer, setFooter] = useState(() => _footer);
  const [header, setHeader] = useState(_header);

  // 提供 destroy 和 update 能力
  useImperativeHandle(ref, () => ({
    destroy: () => {
      if (!closedRef.current) {
        closedRef.current = true;
      }
    },
    update: (newConfig: any) => {
      setNewConfig(newConfig);
    },
    setFooter: (newFooter) => {
      setFooter(newFooter);
    },
    setHeader: (newHeader) => {
      if (Object.values(newHeader || {}).length === 0) {
        setHeader(null);
      } else {
        setHeader(newHeader);
      }
    },
  }));

  const style: React.CSSProperties = useMemo(
    () => ({
      display: hidden ? 'none' : 'flex',
      flexDirection: 'column',
      height: '100%',
      zIndex,
    }),
    [hidden, zIndex],
  );

  // Header 组件
  const HeaderComponent = useMemo(() => {
    if (!header && !_title) return null;

    const { title = _title, extra } = header || {};
    const token = flowEngine.context.themeToken;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${token.paddingSM}px ${token.padding}px`,
          borderBottom: `1px solid ${token.colorSplit}`,
          backgroundColor: token.colorBgContainer,
          ...styles.header,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              if (!closedRef.current) {
                closedRef.current = true;
                props.onClose?.();
              }
            }}
            style={{
              color: token.colorTextTertiary,
            }}
          />
          {title && (
            <div
              style={{
                fontSize: token.fontSizeLG,
                fontWeight: token.fontWeightStrong,
                color: token.colorText,
              }}
            >
              {title}
            </div>
          )}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    );
  }, [header, _title, flowEngine.context.themeToken, styles.header, props.onClose]);

  // Footer 组件
  const FooterComponent = useMemo(() => {
    if (!footer) return null;

    const token = flowEngine.context.themeToken;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: `${token.paddingXS}px ${token.padding}px`,
          borderTop: `1px solid ${token.colorSplit}`,
          backgroundColor: token.colorBgContainer,
          ...styles.footer,
        }}
      >
        {footer}
      </div>
    );
  }, [footer, flowEngine.context.themeToken, styles.footer]);

  if (!visible) return null;

  return (
    <div style={{ ...style, ...styles.content }}>
      {HeaderComponent}
      <div style={{ flex: 1, overflowY: 'auto', ...styles.body }}>{children}</div>
      {FooterComponent}
    </div>
  );
});
