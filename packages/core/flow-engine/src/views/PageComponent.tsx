/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import classNames from 'classnames';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useFlowEngine } from '../provider';

export const PageComponent = forwardRef((props: any, ref) => {
  const [newConfig, setNewConfig] = React.useState<any>({});
  const { visible = true, footer: _footer, header: _header, afterClose, children, hidden } = { ...props, ...newConfig };
  const closedRef = useRef(false);
  const flowEngine = useFlowEngine();
  const [footer, setFooter] = useState(_footer);
  const [header, setHeader] = useState(_header);

  // 提供 destroy 和 update 能力
  useImperativeHandle(ref, () => ({
    destroy: () => {
      if (!closedRef.current) {
        closedRef.current = true;
        afterClose?.();
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
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      backgroundColor: flowEngine.context.themeToken.colorBgLayout,
    }),
    [flowEngine.context.themeToken.colorBgLayout],
  );

  if (!visible) return null;

  return (
    <div className={classNames('nb-embed', hidden ? 'nb-hidden' : '')} style={style}>
      {header && <div></div>}
      {children}
      {footer && <div></div>}
    </div>
  );
});
