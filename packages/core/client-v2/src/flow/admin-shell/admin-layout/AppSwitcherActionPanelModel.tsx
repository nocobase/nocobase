/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Icon } from '../../../components';
import { ActionModel } from '../../models/base';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
} from '@nocobase/flow-engine';
import { Avatar, Button, Card, Empty, Typography } from 'antd';
import React from 'react';

const defaultIconColors = ['#3d8bff', '#00a8b5', '#35b26b', '#f5a623', '#ff7a45', '#e85d75', '#9254de', '#597ef7'];

function getDefaultIconColor(title?: React.ReactNode) {
  const source = typeof title === 'string' ? title : '';
  const hash = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return defaultIconColors[hash % defaultIconColors.length];
}

export class AppSwitcherActionPanelModel extends FlowModel {
  renderConfigureActions() {
    return (
      <AddSubModelButton
        key="app-switcher-add-actions"
        model={this}
        items={this.context.app.entryActionManager.getItems('app-switcher')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.context.t('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  hasActions() {
    return (this.subModels.actions || []).length > 0;
  }

  renderContent() {
    const token = this.context.themeToken;
    const actions = this.mapSubModels('actions', (action) => action) as ActionModel[];
    const designable = !!this.context.flowSettingsEnabled;
    const columnCount = Math.min(Math.max(actions.length || 1, 1), 2);
    const buttonResetClass = css`
      &.ant-btn {
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        border: none;
        box-shadow: none;
        background: none;
        color: ${token.colorText};
        text-align: left;
      }
      &.ant-btn > span {
        display: block;
        width: 100%;
        height: 100%;
      }
      .ant-btn-icon {
        display: none;
      }
    `;
    const contentClass = css`
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 48px);
      overflow: auto;
      padding: ${token.paddingXS}px;
    `;
    const listClass = css`
      display: grid;
      grid-template-columns: repeat(${columnCount}, 260px);
      gap: ${token.marginXXS}px;
      margin: 0;
      padding: 0;
      list-style: none;
    `;

    return (
      <div className={contentClass}>
        {actions.length ? (
          <DndProvider>
            <ul className={listClass}>
              {actions.map((action) => {
                const { icon = 'AppstoreOutlined' } = action.props;
                const title = action.getTitle();
                action.enableEditDanger = false;
                action.enableEditType = false;
                action.renderButton = () => (
                  <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                    <Card
                      bordered={false}
                      className={css`
                        height: 56px;
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
                      styles={{ body: { background: 'transparent' } }}
                    >
                      <Avatar
                        size={32}
                        shape="square"
                        icon={<Icon type={icon as string} />}
                        style={{
                          flex: '0 0 auto',
                          borderRadius: 6,
                          background: getDefaultIconColor(title),
                        }}
                      />
                      <Typography.Text
                        ellipsis
                        title={typeof title === 'string' ? title : undefined}
                        style={{
                          minWidth: 0,
                          color: token.colorText,
                          fontSize: token.fontSize,
                          lineHeight: token.lineHeight,
                        }}
                      >
                        {title}
                      </Typography.Text>
                    </Card>
                  </Button>
                );

                return (
                  <li key={action.uid} style={{ width: 260, height: 56, listStyle: 'none' }}>
                    <Droppable model={action}>
                      <FlowModelRenderer
                        model={action}
                        showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                        extraToolbarItems={
                          designable
                            ? [
                                {
                                  key: 'drag-handler',
                                  component: DragHandler,
                                  sort: 1,
                                },
                              ]
                            : []
                        }
                      />
                    </Droppable>
                  </li>
                );
              })}
            </ul>
          </DndProvider>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={this.context.t('No configured applications')}
            style={{ width: 260, margin: `${token.marginXS}px 0` }}
          />
        )}
        {designable && <div style={{ marginTop: token.marginXS }}>{this.renderConfigureActions()}</div>}
      </div>
    );
  }
}

AppSwitcherActionPanelModel.define({
  label: 'App switcher actions',
  children: false,
  createModelOptions: {
    use: 'AppSwitcherActionPanelModel',
  },
});
