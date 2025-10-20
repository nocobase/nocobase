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
import { css } from '@emotion/css';
import { Card, Space } from 'antd';
import { Grid, List } from 'antd-mobile';
import React from 'react';
import { BlockModel, useOpenModeContext } from '@nocobase/client';
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

  render() {
    const { layout } = this.props;
    const token = this.context.themeToken;
    return (
      <Card id={`model-${this.uid}`} className="action-panel-block">
        <DndProvider>
          <div className="nb-action-panel-warp">
            {layout === WorkbenchLayout.Grid ? (
              <ResponsiveSpace>
                {this.mapSubModels('actions', (action) => {
                  return (
                    <Droppable model={action} key={action.uid}>
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
                    </Droppable>
                  );
                })}
              </ResponsiveSpace>
            ) : (
              <Space
                className={css`
                  width: 100%;
                  .ant-space-item {
                    width: 100%;
                  }
                  .nb-toolbar-container > .nb-toolbar-container-icons {
                    top: 20px !important;
                  }
                `}
              >
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
                    return (
                      <Droppable model={action} key={action.uid}>
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
                      </Droppable>
                    );
                  })}
                </List>
              </Space>
            )}
          </div>
        </DndProvider>
        <div style={{ marginTop: '10px' }}>{this.renderConfiguireActions()}</div>
      </Card>
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
            'x-component': 'Select',
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
  },
});
