/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ThemeConfig } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { ConfigProvider, Grid, theme as antdTheme } from 'antd';
import React, { type PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { useOutlet } from 'react-router-dom';
import { EmbedAccessGuard } from './EmbedAccessGuard';
import EmbedEmptyPage from './EmbedEmptyPage';
import type { EmbedLayoutModelV2 } from './EmbedLayoutModel';

const embedContainerStyle: React.CSSProperties = { width: 'fit-content', position: 'relative' };

export const EmbedLayoutComponent = observer((props: PropsWithChildren<{ model: EmbedLayoutModelV2 }>) => {
  const { children, model } = props;
  const outlet = useOutlet();
  const content = children ?? outlet;
  const isRootRoute = model.currentLayoutRoute?.type === 'root';
  const { token } = antdTheme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobileLayout =
    screens.md === false || (screens.md === undefined && typeof window !== 'undefined' && window.innerWidth < 768);
  const theme = useMemo<ThemeConfig>(
    () => ({
      token: {
        paddingPageHorizontal: token.paddingLG,
        paddingPageVertical: token.paddingLG,
      },
    }),
    [token.paddingLG],
  );
  const handleLayoutContentElementChange = useCallback(
    (element: HTMLDivElement | null) => {
      model.setLayoutContentElement(element);
    },
    [model],
  );

  useEffect(() => {
    model.setIsMobileLayout(isMobileLayout);
  }, [isMobileLayout, model]);

  return (
    <ConfigProvider theme={theme}>
      <div
        ref={handleLayoutContentElementChange}
        style={
          {
            minHeight: '100vh',
            background: token.colorBgLayout,
            '--nb-header-height': '0px',
          } as React.CSSProperties
        }
      >
        {isRootRoute || !content ? <EmbedEmptyPage /> : <EmbedAccessGuard>{content}</EmbedAccessGuard>}
      </div>
      <div id="nocobase-embed-container" style={embedContainerStyle} />
    </ConfigProvider>
  );
});
