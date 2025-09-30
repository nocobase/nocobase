/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions, useFlowContext } from '@nocobase/flow-engine';
import { PageModel } from './PageModel';
import { DragEndEvent } from '@dnd-kit/core';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';

export class ChildPageModel extends PageModel {
  tabBarExtraContent = {
    left: <BackButtonUsedInSubPage />,
  };

  createPageTabModelOptions = (): CreateModelOptions => {
    return {
      use: 'ChildPageTabModel',
    };
  };

  async handleDragEnd(event: DragEndEvent) {
    if (!event.active?.id || !event.over?.id) {
      throw new Error('Invalid drag event');
    }

    this.flowEngine.moveModel(event.active.id, event.over.id);
  }
}

/**
 * Used for the back button in subpages
 * @returns
 */
const BackButtonUsedInSubPage = () => {
  const ctx = useFlowContext<any>();
  const token = ctx.themeToken;
  // tab item gutter, this is fixed value in antd
  const horizontalItemGutter = 32;

  const resetStyle = useMemo(() => {
    return {
      width: 'auto',
      height: 'auto',
      lineHeight: 1,
      padding: token.paddingXS,
      marginRight: horizontalItemGutter - token.paddingXS,
    };
  }, [token.paddingXS]);

  // 只有子页面需要返回按钮
  if (ctx.view.type !== 'embed') {
    return null;
  }

  return (
    <Button
      aria-label="back-button"
      type="text"
      icon={<ArrowLeftOutlined />}
      style={resetStyle}
      onClick={ctx.view.destroy}
    />
  );
};
