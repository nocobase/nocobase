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
  escapeT,
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
  renderConfiguireActions() {
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
    console.log(ellipsis);
    const token = this.context.themeToken;

    return (
      <div id={`model-${this.uid}`} className="action-panel-block">
        <ConfigProvider wave={{ disabled: true }}>
          <DndProvider>
            <div className="nb-action-panel-warp">
              {layout === WorkbenchLayout.Grid ? (
                <ResponsiveSpace>
                  {this.mapSubModels('actions', (action: ActionModel) => {
                    const { icon, color = '#1677FF', title } = action.props;
                    action.enableEditDanger = false;
                    action.enableEditType = false;
                    action.renderHiddenInConfig = () => {
                      return (
                        <Tooltip
                          title={this.context.t(
                            'The current button is hidden and cannot be clicked (this message is only visible when the UI Editor is active).',
                          )}
                        >
                          <Button disabled style={{ display: 'block' }}>
                            <Avatar
                              style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.25)' }}
                              size={48}
                              icon={<LockOutlined />}
                            />
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
                              .ant-btn-icon {
                                display: ${action.hidden ? 'block' : ' none'};
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
                    const { icon, color = '#1677FF', title } = action.props;
                    action.enableEditDanger = false;
                    action.enableEditType = false;
                    action.renderHiddenInConfig = () => {
                      return (
                        <Button disabled>
                          <List.Item
                            disabled
                            prefix={
                              (
                                <Avatar
                                  style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.25)' }}
                                  icon={<LockOutlined />}
                                />
                              ) as any
                            }
                          >
                            <div style={{ fontSize: '14px' }}>
                              {this.context.t(
                                'The current button is hidden and cannot be clicked (this message is only visible when the UI Editor is active).',
                              )}
                            </div>
                          </List.Item>
                        </Button>
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
                    );
                    return (
                      <Droppable model={action} key={action.uid}>
                        <div
                          className={css`
                            .ant-btn {
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
        <div style={{ marginTop: '10px' }}>{this.renderConfiguireActions()}</div>
      </div>
    );
  }
}

ActionPanelBlockModel.define({
  label: escapeT('Action panel'),
  createModelOptions: {
    use: 'ActionPanelBlockModel',
  },
});

ActionPanelBlockModel.registerFlow({
  key: 'actionPanelBlockSetting',
  title: escapeT('Action panel settings', { ns: 'block-workbench' }),
  steps: {
    layout: {
      title: escapeT('Layout', { ns: 'block-workbench' }),
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          layout: {
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            enum: [
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
      title: escapeT('Ellipsis action title', { ns: 'block-workbench' }),
      uiSchema(ctx) {
        return {
          ellipsis: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            'x-component-props': {
              checkedChildren: escapeT('Yes'),
              unCheckedChildren: escapeT('No'),
            },
          },
        };
      },
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
