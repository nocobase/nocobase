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
  mergeSubModelItems,
  observer,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import { Avatar, Badge, Button, Card, Tooltip, Typography } from 'antd';
import type { BadgeProps } from 'antd';
import React from 'react';

const defaultIconColors = ['#3d8bff', '#00a8b5', '#35b26b', '#f5a623', '#ff7a45', '#e85d75', '#9254de', '#597ef7'];

function getDefaultIconColor(title?: React.ReactNode) {
  const source = typeof title === 'string' ? title : '';
  const hash = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return defaultIconColors[hash % defaultIconColors.length];
}

type AppSwitcherActionPanelStructure = {
  subModels: {
    actions?: ActionModel[];
  };
};

function isRenderableActionModel(action: unknown): action is ActionModel {
  if (!action || typeof action !== 'object') {
    return false;
  }

  const candidate = action as Partial<ActionModel>;
  return typeof candidate.getTitle === 'function' && typeof candidate.onClick === 'function';
}

type EntryActionAvailability = {
  isEntryActionAvailable?: () => boolean;
  getEntryActionUnavailableMessage?: () => string | undefined;
};

function isEntryActionUnavailable(action: ActionModel) {
  const candidate = action as ActionModel & EntryActionAvailability;
  return typeof candidate.isEntryActionAvailable === 'function' && !candidate.isEntryActionAvailable();
}

function getEntryActionUnavailableMessage(action: ActionModel) {
  const candidate = action as ActionModel & EntryActionAvailability;
  return candidate.getEntryActionUnavailableMessage?.();
}

type ActionPanelBadgeProvider = {
  actionPanelBadge?: BadgeProps | null;
};

function getActionPanelBadge(action: ActionModel) {
  return (action as ActionModel & ActionPanelBadgeProvider).actionPanelBadge || null;
}

export class AppSwitcherActionPanelModel extends FlowModel<AppSwitcherActionPanelStructure> {
  getConfigureActionsItems(): SubModelItemsType {
    const linkAction: SubModelItem = {
      key: 'app-switcher:link',
      label: this.context.t('Link'),
      createModelOptions: {
        use: 'LinkActionModel',
      },
    };
    const jsAction: SubModelItem = {
      key: 'app-switcher:js-action',
      label: this.context.t('JS action'),
      createModelOptions: {
        use: 'JSActionModel',
      },
    };

    return mergeSubModelItems([[linkAction], this.context.app.entryActionManager.getItems('app-switcher'), [jsAction]]);
  }

  renderConfigureActions() {
    return <AppSwitcherConfigureActionsButton model={this} />;
  }

  private getRenderableActions(options: { includeHidden?: boolean; includeUnavailable?: boolean } = {}) {
    return this.mapSubModels('actions', (action) => action)
      .filter(isRenderableActionModel)
      .filter((action) => options.includeUnavailable || !isEntryActionUnavailable(action))
      .filter((action) => options.includeHidden || !action.hidden);
  }

  hasActions() {
    return this.getRenderableActions().length > 0;
  }

  renderContent() {
    const token = this.context.themeToken;
    const designable = !!this.context.flowSettingsEnabled;
    const actions = this.getRenderableActions({ includeHidden: designable, includeUnavailable: designable });
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
                const { icon = 'AppstoreOutlined', color } = action.props;
                const title = action.getTitle();
                const actionPanelBadge = getActionPanelBadge(action);
                const entryActionUnavailable = isEntryActionUnavailable(action);
                const iconContent = (
                  <Avatar
                    size={32}
                    shape="square"
                    icon={<Icon type={icon as string} />}
                    style={{
                      flex: '0 0 auto',
                      borderRadius: 6,
                      background: color || getDefaultIconColor(title),
                    }}
                  />
                );
                const renderActionContent = (compact = false) => (
                  <Card
                    bordered={false}
                    className={css`
                      height: 56px;
                      border-radius: ${token.borderRadius}px;
                      box-shadow: none !important;
                      opacity: ${compact ? token.opacityLoading : 1};

                      &:hover {
                        background: ${token.colorBgTextHover};
                        box-shadow: none !important;
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
                    <span style={{ display: 'inline-flex', flex: '0 0 auto' }}>
                      {actionPanelBadge ? (
                        <Badge {...actionPanelBadge} size={actionPanelBadge.size ?? 'small'}>
                          {iconContent}
                        </Badge>
                      ) : (
                        iconContent
                      )}
                    </span>
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
                action.renderHiddenInConfig = () => (
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
          <div style={{ width: 260, minHeight: token.marginXS }} />
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

const AppSwitcherConfigureActionsButton = observer(({ model }: { model: AppSwitcherActionPanelModel }) => {
  const entryActionsRevision = model.context.app.entryActionManager.revision;
  return (
    <AddSubModelButton
      key={`app-switcher-add-actions-${entryActionsRevision}`}
      model={model}
      items={model.getConfigureActionsItems()}
      subModelKey="actions"
      keepDropdownOpen
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.context.t('Actions')}</FlowSettingsButton>
    </AddSubModelButton>
  );
});
