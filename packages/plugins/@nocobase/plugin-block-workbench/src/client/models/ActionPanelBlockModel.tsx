/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowSettingsButton,
  tExpr,
  Droppable,
  AddSubModelButton,
  DragHandler,
  FlowModelRenderer,
  DndProvider,
} from '@nocobase/flow-engine';
import { LockOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Space, Avatar, Button, Tooltip, ConfigProvider } from 'antd';
import { Grid, List } from 'antd-mobile';
import React from 'react';
import { BlockModel, useOpenModeContext, Icon, ActionModel } from '@nocobase/client';
import { SettingOutlined } from '@ant-design/icons';

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export const WorkbenchLayout = {
  Grid: 'grid',
  List: 'list',
};

const ResponsiveSpace = (props) => {
  const isMobileMedia = isMobile();
  const { isMobile: underMobileCtx } = useOpenModeContext() || {};

  if (underMobileCtx || isMobileMedia) {
    return (
      <Grid columns={4} gap={8}>
        {props.children}
      </Grid>
    );
  }

  return (
    <Space wrap size={8} align="start">
      {props.children}
    </Space>
  );
};

export class ActionPanelBlockModel extends BlockModel {
  renderConfigureActions() {
    return (
      <AddSubModelButton
        key={'action-panel-add-actions'}
        model={this}
        subModelBaseClass={this.getModelClassName('ActionPanelGroupActionModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  renderComponent() {
    const { layout, ellipsis } = this.props;

    const token = this.context.themeToken;
    const isConfigMode = !!this.context.flowSettingsEnabled;

    return (
      <div id={`model-${this.uid}`} className="action-panel-block">
        <ConfigProvider wave={{ disabled: true }}>
          <DndProvider>
            <div className="nb-action-panel-warp">
              {layout === WorkbenchLayout.Grid ? (
                <ResponsiveSpace>
                  {this.mapSubModels('actions', (action: ActionModel) => {
                    if (action.hidden && !isConfigMode) {
                      return;
                    }
                    const { icon = 'SettingOutlined', color = '#1677FF', title } = action.props;

                    action.enableEditDanger = false;
                    action.enableEditType = false;
                    action.renderHiddenInConfig = () => {
                      return (
                        <Tooltip
                          title={this.context.t('The button is hidden and only visible when the UI Editor is active')}
                        >
                          <Button onClick={action.onClick.bind(action)}>
                            <div style={{ width: '5em', opacity: '0.3' }}>
                              <Avatar style={{ backgroundColor: color }} size={48} icon={<Icon type={icon as any} />} />
                              <div
                                style={
                                  ellipsis
                                    ? {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }
                                    : {
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                      }
                                }
                              >
                                {title}
                              </div>
                            </div>
                          </Button>
                        </Tooltip>
                      );
                    };
                    action.props.children = (
                      <div style={{ width: '5em' }}>
                        <Avatar style={{ backgroundColor: color }} size={48} icon={<Icon type={icon as any} />} />
                        <div
                          style={
                            ellipsis
                              ? {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }
                              : {
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                }
                          }
                        >
                          {title}
                        </div>
                      </div>
                    );

                    return (
                      <Droppable model={action} key={action.uid}>
                        <div
                          className={css`
                            padding: 10px 0px;
                            margin-bottom: 15px;
                            .ant-btn {
                              background: none;
                              border: none !important;
                              box-shadow: none;
                              .ant-btn-icon {
                                display: none;
                              }
                            }
                          `}
                        >
                          <FlowModelRenderer
                            model={action}
                            showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                            extraToolbarItems={[
                              {
                                key: 'drag-handler',
                                component: DragHandler,
                                sort: 1,
                              },
                            ]}
                          />
                        </div>
                      </Droppable>
                    );
                  })}
                </ResponsiveSpace>
              ) : (
                <List
                  style={
                    {
                      '--adm-color-background': token.colorBgContainer,
                      '--active-background-color': token.colorBorderSecondary,
                      '--border-inner': `solid 1px ${token.colorBorderSecondary}`,
                      '--border-bottom': `none`,
                      '--border-top': `none`,
                    } as any
                  }
                >
                  {this.mapSubModels('actions', (action: ActionModel) => {
                    const { icon = 'SettingOutlined', color = '#1677FF', title } = action.props;
                    action.enableEditDanger = false;
                    action.enableEditType = false;
                    action.renderHiddenInConfig = () => {
                      return (
                        <Tooltip
                          title={this.context.t('The button is hidden and only visible when the UI Editor is active')}
                        >
                          <Button style={{ opacity: '0.3' }} onClick={action.onClick.bind(action)}>
                            <List.Item
                              prefix={
                                (
                                  <Avatar style={{ backgroundColor: color }} icon={<Icon type={icon as any} />} />
                                ) as any
                              }
                            >
                              <div
                                style={
                                  ellipsis
                                    ? {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }
                                    : {
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                      }
                                }
                              >
                                {title}
                              </div>
                            </List.Item>
                          </Button>
                        </Tooltip>
                      );
                    };
                    action.props.children = (
                      <List.Item
                        prefix={
                          (<Avatar style={{ backgroundColor: color }} icon={<Icon type={icon as any} />} />) as any
                        }
                      >
                        <div
                          style={
                            ellipsis
                              ? {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minHeight: '21px',
                                }
                              : {
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  minHeight: '21px',
                                }
                          }
                        >
                          {title}
                        </div>
                      </List.Item>
                    );
                    return (
                      <Droppable model={action} key={action.uid}>
                        <div
                          className={css`
                            .ant-btn {
                              box-shadow: none;
                              border: none;
                              background: none;
                              display: block;
                              width: 100%;
                              text-align: justify;
                              height: 100%;
                              .ant-btn-icon {
                                display: ${action.hidden ? 'block' : ' none'};
                              }
                            }
                            .adm-list-item-content-main {
                              overflow: hidden;
                            }
                          `}
                        >
                          <FlowModelRenderer
                            model={action}
                            showFlowSettings={{ showBackground: false, showBorder: false }}
                            extraToolbarItems={[
                              {
                                key: 'drag-handler',
                                component: DragHandler,
                                sort: 1,
                              },
                            ]}
                          />
                        </div>
                      </Droppable>
                    );
                  })}
                </List>
              )}
            </div>
          </DndProvider>
        </ConfigProvider>
        {this.context.flowSettingsEnabled && <div style={{ marginTop: '10px' }}>{this.renderConfigureActions()}</div>}
      </div>
    );
  }
}

ActionPanelBlockModel.define({
  label: tExpr('Action panel'),
  createModelOptions: {
    use: 'ActionPanelBlockModel',
  },
});

ActionPanelBlockModel.registerFlow({
  key: 'actionPanelBlockSetting',
  title: tExpr('Action panel settings', { ns: 'block-workbench' }),
  steps: {
    layout: {
      title: tExpr('Layout', { ns: 'block-workbench' }),
      uiMode(ctx) {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'layout',
          props: {
            options: [
              { label: t('Grid', { ns: 'block-workbench' }), value: WorkbenchLayout.Grid },
              { label: t('List', { ns: 'block-workbench' }), value: WorkbenchLayout.List },
            ],
          },
        };
      },
      defaultParams: {
        layout: WorkbenchLayout.Grid,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          layout: params.layout,
        });
      },
    },
    ellipsis: {
      title: tExpr('Ellipsis action title', { ns: 'block-workbench' }),
      uiMode: { type: 'switch', key: 'ellipsis' },
      defaultParams: {
        ellipsis: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          ellipsis: params.ellipsis,
        });
      },
    },
  },
});
