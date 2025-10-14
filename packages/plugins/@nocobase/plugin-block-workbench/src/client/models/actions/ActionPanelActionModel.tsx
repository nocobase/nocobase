/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, Icon } from '@nocobase/client';
import React from 'react';
import { escapeT } from '@nocobase/flow-engine';
import { Avatar } from 'antd';
import { List } from 'antd-mobile';
import { css } from '@emotion/css';
import { WorkbenchLayout } from '../ActionPanelBlockModel';

function Button(props) {
  const { icon, iconColor: backgroundColor, layout, ellipsis = true, title, onlyIcon, token, ...others } = props;
  if (layout === WorkbenchLayout.Grid) {
    return (
      <div
        title={title}
        className={css`
          width: 6em;
          padding: 0 10px;
          text-align: center;
          cursor: pointer;
        `}
        {...others}
      >
        <Avatar style={{ backgroundColor }} size={48} icon={<Icon type={icon} />} />
        <div
          style={{
            whiteSpace: ellipsis ? 'nowrap' : 'normal',
            textOverflow: ellipsis ? 'ellipsis' : 'clip',
            overflow: ellipsis ? 'hidden' : 'visible',
            marginTop: `${token.marginSM}px`,
            width: '100%',
          }}
        >
          {!onlyIcon && title}
        </div>
      </div>
    );
  }
  return (
    <List.Item
      prefix={(<Avatar style={{ backgroundColor }} icon={<Icon type={icon} />} />) as any}
      style={{ marginTop: '5px', fontSize: 14 }}
      {...others}
    >
      <span>{!onlyIcon && title}</span>
    </List.Item>
  );
}

export class ActionPanelActionModel extends ActionModel {
  render() {
    return (
      <Button
        {...this.parent.props}
        {...this.props}
        token={this.context.themeToken}
        onClick={this.onClick.bind(this)}
      />
    );
  }
  // 设置态隐藏时的占位渲染（与真实按钮外观一致，去除 onClick 并降低透明度）
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    return <Button {...this.props} disabled />;
  }
}

ActionPanelActionModel.registerFlow({
  key: 'buttonSettings',
  title: escapeT('General settings', { ns: 'block-workbench' }),
  steps: {
    general: {
      use: 'addAction',
      title: escapeT('Action setting', { ns: 'block-workbench' }),
      preset: true,
    },
    linkageRules: {
      use: 'actionLinkageRules',
    },
  },
});
