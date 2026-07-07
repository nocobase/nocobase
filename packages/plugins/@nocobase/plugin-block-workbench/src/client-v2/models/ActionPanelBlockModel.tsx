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
  Droppable,
  AddSubModelButton,
  buildItems,
  DragHandler,
  FlowModelRenderer,
  DndProvider,
  observer,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { Space, Avatar, Badge, Button, Tooltip, ConfigProvider } from 'antd';
import { Grid, List } from 'antd-mobile';
import React from 'react';
import { BlockModel, Icon, ActionModel } from '@nocobase/client-v2';
import { SettingOutlined } from '@ant-design/icons';
import { tExpr } from '../locale';

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function isRenderableActionModel(action: unknown): action is ActionModel {
  if (!action || typeof action !== 'object') {
    return false;
  }

  const candidate = action as Partial<ActionModel>;
  return typeof candidate.onClick === 'function' && !!candidate.props;
}

type EntryActionAvailability = {
  isEntryActionAvailable?: () => boolean;
  getEntryActionUnavailableMessage?: () => string | undefined;
};

export type ActionPanelBadgeOptions = {
  count?: number | string;
  dot?: boolean;
  overflowCount?: number;
  showZero?: boolean;
  title?: string;
};

export type ActionPanelBadgeAction = {
  actionPanelBadge?: ActionPanelBadgeOptions | null;
};

function getActionPanelBadge(action: ActionModel) {
  return (action as ActionModel & ActionPanelBadgeAction).actionPanelBadge || null;
}

export function ActionPanelBadge({
  badge,
  children,
}: {
  badge?: ActionPanelBadgeOptions | null;
  children: React.ReactNode;
}) {
  if (!badge) {
    return <>{children}</>;
  }
  return (
    <Badge
      count={badge.count}
      dot={badge.dot}
      overflowCount={badge.overflowCount}
      showZero={badge.showZero}
      title={badge.title}
    >
      {children}
    </Badge>
  );
}

function isEntryActionUnavailable(action: ActionModel) {
  const candidate = action as ActionModel & EntryActionAvailability;
  return typeof candidate.isEntryActionAvailable === 'function' && !candidate.isEntryActionAvailable();
}

function getEntryActionUnavailableMessage(action: ActionModel) {
  const candidate = action as ActionModel & EntryActionAvailability;
  return candidate.getEntryActionUnavailableMessage?.();
}

export const WorkbenchLayout = {
  Grid: 'grid',
  List: 'list',
};

export const WorkbenchItemLayout = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
};

const ResponsiveSpace = (props) => {
  const isMobileMedia = isMobile();
  const underMobileCtx = props.underMobileCtx;
  const columns = props.columns || 4;

  if (underMobileCtx || isMobileMedia) {
    return (
      <Grid columns={columns} gap={8}>
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
  getConfigureActionsItems(): SubModelItemsType {
    return async (ctx) => {
      const baseItems = await buildItems(this.getModelClassName('ActionPanelGroupActionModel'))(ctx);
      const entryItems = await this.context.app.entryActionManager.getItems('action-panel')(ctx);

      if (!entryItems.length) {
        return baseItems;
      }

      const jsActionIndex = baseItems.findIndex((item: SubModelItem) => item.useModel === 'JSActionModel');
      if (jsActionIndex === -1) {
        return [...baseItems, ...entryItems];
      }

      return [...baseItems.slice(0, jsActionIndex), ...entryItems, ...baseItems.slice(jsActionIndex)];
    };
  }

  renderConfigureActions() {
    return <ActionPanelConfigureActionsButton model={this} />;
  }

  renderComponent() {
    const { layout, ellipsis, itemLayout = WorkbenchItemLayout.Vertical } = this.props;

    const token = this.context.themeToken;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    const gridIconSize = token.controlHeightLG;
    const buttonResetClass = css`
      &.ant-btn {
        height: auto;
        width: ${this.context.isMobileLayout && itemLayout === WorkbenchItemLayout.Horizontal ? '100%' : 'auto'};
        padding: 0;
        border: none;
        box-shadow: none;
        background: none;
        color: ${token.colorText};
      }
      &.ant-btn > span {
        display: block;
        width: 100%;
      }
      .ant-btn-icon {
        display: none;
      }
    `;
    const gridContentClass = css`
      width: ${token.controlHeightLG * 2}px;
      text-align: center;
    `;
    const gridHorizontalContentClass = css`
      width: ${this.context.isMobileLayout ? '100%' : '198px'};
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: ${token.marginXS}px;
      text-align: left;
    `;
    const gridHorizontalCardClass = css`
      min-height: ${token.controlHeightLG + token.paddingSM * 2}px;
      padding: ${token.paddingSM}px ${token.padding}px;
      border-radius: ${token.borderRadiusLG}px;
      background: ${token.colorBgContainer};
      box-shadow: none;
      transition: background ${token.motionDurationMid};

      &:hover {
        background: ${token.colorBgTextHover};
        box-shadow: none;
      }
    `;
    const gridTitleClass = css`
      margin-top: ${token.marginSM}px;
      min-height: ${token.fontSize * token.lineHeight}px;
    `;
    const gridHorizontalTitleClass = css`
      margin-top: 0;
      min-width: 0;
      flex: 1;
    `;
    const textEllipsisClass = css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
    const textWrapClass = css`
      white-space: normal;
      word-break: break-word;
    `;
    const hiddenClass = css`
      opacity: ${token.opacityLoading};
    `;
    const listActionClass = css`
      .ant-btn {
        display: block;
        width: 100%;
        text-align: justify;
      }
      .adm-list-item-content-main {
        overflow: hidden;
      }
    `;
    const configActionsClass = css`
      margin-top: ${token.marginXS}px;
    `;

    return (
      <div id={`model-${this.uid}`} className="action-panel-block">
        <ConfigProvider wave={{ disabled: true }}>
          <DndProvider>
            <div className="nb-action-panel-warp">
              {layout === WorkbenchLayout.Grid ? (
                <ResponsiveSpace
                  underMobileCtx={this.context.isMobileLayout}
                  columns={this.context.isMobileLayout && itemLayout === WorkbenchItemLayout.Horizontal ? 1 : 4}
                >
                  {this.mapSubModels('actions', (action) => {
                    const entryActionUnavailable = isRenderableActionModel(action)
                      ? isEntryActionUnavailable(action)
                      : false;
                    if (
                      !isRenderableActionModel(action) ||
                      (entryActionUnavailable && !isConfigMode) ||
                      (action.hidden && !isConfigMode)
                    ) {
                      return;
                    }
                    const { icon = 'SettingOutlined', color = token.colorPrimary, title } = action.props;
                    const avatarClass = css`
                      background-color: ${color};
                    `;
                    const horizontal = itemLayout === WorkbenchItemLayout.Horizontal;
                    const badge = getActionPanelBadge(action);
                    const renderActionContent = (compact = false) => (
                      <div
                        className={`${
                          horizontal ? `${gridHorizontalContentClass} ${gridHorizontalCardClass}` : gridContentClass
                        } ${compact ? hiddenClass : ''}`}
                      >
                        <ActionPanelBadge badge={badge}>
                          <Avatar className={avatarClass} size={gridIconSize} icon={<Icon type={icon as any} />} />
                        </ActionPanelBadge>
                        <div
                          className={`${gridTitleClass} ${horizontal ? gridHorizontalTitleClass : ''} ${
                            ellipsis ? textEllipsisClass : textWrapClass
                          }`}
                        >
                          {title}
                        </div>
                      </div>
                    );

                    action.enableEditDanger = false;
                    action.enableEditType = false;
                    action.enableEditIconOnly = false;
                    action.enableEditColor = true;
                    action.renderButton = () => {
                      if (entryActionUnavailable) {
                        return (
                          <Tooltip title={getEntryActionUnavailableMessage(action)}>
                            <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                              {renderActionContent(true)}
                            </Button>
                          </Tooltip>
                        );
                      }
                      return (
                        <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                          {renderActionContent()}
                        </Button>
                      );
                    };
                    action.renderHiddenInConfig = () => {
                      return (
                        <Tooltip
                          title={
                            entryActionUnavailable
                              ? getEntryActionUnavailableMessage(action)
                              : this.context.t('The button is hidden and only visible when the UI Editor is active')
                          }
                        >
                          <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                            {renderActionContent(true)}
                          </Button>
                        </Tooltip>
                      );
                    };

                    return (
                      <Droppable model={action} key={action.uid}>
                        <div>
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
                  {this.mapSubModels('actions', (action) => {
                    const entryActionUnavailable = isRenderableActionModel(action)
                      ? isEntryActionUnavailable(action)
                      : false;
                    if (
                      !isRenderableActionModel(action) ||
                      (entryActionUnavailable && !isConfigMode) ||
                      (action.hidden && !isConfigMode)
                    ) {
                      return;
                    }
                    const { icon = 'SettingOutlined', color = token.colorPrimary, title } = action.props;
                    const avatarClass = css`
                      background-color: ${color};
                    `;
                    const badge = getActionPanelBadge(action);
                    const renderActionContent = (compact = false) => (
                      <List.Item
                        prefix={
                          (
                            <ActionPanelBadge badge={badge}>
                              <Avatar className={avatarClass} icon={<Icon type={icon as any} />} />
                            </ActionPanelBadge>
                          ) as any
                        }
                      >
                        <div
                          className={`${compact ? hiddenClass : ''} ${ellipsis ? textEllipsisClass : textWrapClass}`}
                        >
                          {title}
                        </div>
                      </List.Item>
                    );

                    action.enableEditDanger = false;
                    action.enableEditType = false;
                    action.enableEditIconOnly = false;
                    action.enableEditColor = true;
                    action.renderButton = () => {
                      if (entryActionUnavailable) {
                        return (
                          <Tooltip title={getEntryActionUnavailableMessage(action)}>
                            <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                              {renderActionContent(true)}
                            </Button>
                          </Tooltip>
                        );
                      }
                      return (
                        <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                          {renderActionContent()}
                        </Button>
                      );
                    };
                    action.renderHiddenInConfig = () => {
                      return (
                        <Tooltip
                          title={
                            entryActionUnavailable
                              ? getEntryActionUnavailableMessage(action)
                              : this.context.t('The button is hidden and only visible when the UI Editor is active')
                          }
                        >
                          <Button className={buttonResetClass} onClick={action.onClick.bind(action)}>
                            {renderActionContent(true)}
                          </Button>
                        </Tooltip>
                      );
                    };
                    return (
                      <Droppable model={action} key={action.uid}>
                        <div
                          className={css`
                            ${listActionClass}
                            .ant-btn-icon {
                              display: ${action.hidden ? 'block' : ' none'};
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
        {this.context.flowSettingsEnabled && <div className={configActionsClass}>{this.renderConfigureActions()}</div>}
      </div>
    );
  }
}

const ActionPanelConfigureActionsButton = observer(({ model }: { model: ActionPanelBlockModel }) => {
  const entryActionsRevision = model.context.app.entryActionManager.revision;
  return (
    <AddSubModelButton
      key={`action-panel-add-actions-${entryActionsRevision}`}
      model={model}
      items={model.getConfigureActionsItems()}
      subModelKey="actions"
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Actions')}</FlowSettingsButton>
    </AddSubModelButton>
  );
});

ActionPanelBlockModel.define({
  label: tExpr('Action panel'),
  children: false,
  sort: 350,
  createModelOptions: {
    use: 'ActionPanelBlockModel',
  },
});

ActionPanelBlockModel.registerFlow({
  key: 'actionPanelBlockSetting',
  title: tExpr('Action panel settings'),
  steps: {
    layout: {
      title: tExpr('Layout'),
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
      title: tExpr('Ellipsis action title'),
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
    itemLayout: {
      title: tExpr('Icon and label layout'),
      uiMode(ctx) {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'itemLayout',
          props: {
            options: [
              { label: t('Vertical', { ns: 'block-workbench' }), value: WorkbenchItemLayout.Vertical },
              { label: t('Horizontal', { ns: 'block-workbench' }), value: WorkbenchItemLayout.Horizontal },
            ],
          },
        };
      },
      defaultParams: {
        itemLayout: WorkbenchItemLayout.Vertical,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          itemLayout: params.itemLayout,
        });
      },
    },
  },
});
