/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel } from '@nocobase/client';
import React from 'react';
import { MultiRecordResource, escapeT, FlowModel } from '@nocobase/flow-engine';
import { ActionPanelPopupActionModel } from './ActionPanelPopupActionModel';
import { ButtonProps } from 'antd';
import { ActionSceneEnum, PopupActionModel, ColorPicker, Icon } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { Avatar } from 'antd';
import { css } from '@emotion/css';
import { WorkbenchLayout } from '../ActionPanelBlockModel';

function Button(props) {
  const { icon, iconColor: backgroundColor, layout, ellipsis = true, title, onlyIcon, token, ...others } = props;
  const { t } = useTranslation();
  if (layout === WorkbenchLayout.Grid) {
    return (
      <div
        title={title}
        className={css`
          width: 5em;
          padding: 0 11px;
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

  return <span>{!onlyIcon && title}</span>;
}

export class ActionPanelActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Popup'),
  };

  render() {
    return (
      <Button
        {...this.props}
        {...this.parent.props}
        token={this.context.themeToken}
        onClick={this.onClick.bind(this)}
      />
    );
  }
}
