/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { uid } from '@formily/shared';
import {
  AddSubModelButton,
  CreateModelOptions,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  escapeT,
} from '@nocobase/flow-engine';
import { Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import { BasePageTabModel } from '../PageTabModel';

type PageModelStructure = {
  subModels: {
    tabs: BasePageTabModel[];
  };
};

export class PageModel extends FlowModel<PageModelStructure> {
  createPageTabModelOptions = (): CreateModelOptions => {
    const modeId = uid();
    return {
      uid: modeId,
      use: 'RootPageTabModel',
      props: {
        route: {
          parentId: this.props.routeId,
          type: 'tabs',
          schemaUid: modeId,
          tabSchemaName: uid(),
          params: [],
          hideInMenu: false,
          enableTabs: false,
        },
      },
    };
  };

  mapTabs() {
    return this.mapSubModels('tabs', (model) => {
      return {
        key: model.uid,
        label: (
          <Droppable model={model}>
            <FlowModelRenderer
              model={model}
              showFlowSettings={{ showBackground: true, showBorder: false }}
              extraToolbarItems={[
                {
                  key: 'drag-handler',
                  component: DragHandler,
                  sort: 1,
                },
              ]}
            />
          </Droppable>
        ),
        children: model.renderChildren(),
      };
    });
  }

  renderFirstTab() {
    const firstTab = this.subModels.tabs?.[0];
    return firstTab?.renderChildren();
  }

  renderTabs() {
    return (
      <DndProvider
        onDragEnd={async (event) => {
          const activeModel = this.flowEngine.getModel(event.active.id as string);
          const overModel = this.flowEngine.getModel(event.over.id as string);

          await this.context.api.request({
            url: `desktopRoutes:move`,
            method: 'post',
            params: {
              sourceId: activeModel?.props.route.id,
              targetId: overModel?.props.route.id,
              sortField: 'sort',
            },
          });

          this.flowEngine.moveModel(activeModel?.uid, overModel?.uid, { persist: false });
        }}
      >
        <Tabs
          tabBarStyle={this.props.tabBarStyle}
          items={this.mapTabs()}
          // destroyInactiveTabPane
          tabBarExtraContent={
            <AddSubModelButton
              model={this}
              subModelKey={'tabs'}
              items={[
                {
                  key: 'blank',
                  label: this.context.t('Blank tab'),
                  createModelOptions: this.createPageTabModelOptions,
                },
              ]}
            >
              <FlowSettingsButton icon={<PlusOutlined />}>{this.context.t('Add tab')}</FlowSettingsButton>
            </AddSubModelButton>
          }
        />
      </DndProvider>
    );
  }

  render() {
    return (
      <>
        {this.props.displayTitle && <PageHeader title={this.props.title} style={this.props.headerStyle} />}
        {this.props.enableTabs ? this.renderTabs() : this.renderFirstTab()}
      </>
    );
  }
}

PageModel.registerFlow({
  key: 'pageSettings',
  title: escapeT('Page settings'),
  steps: {
    general: {
      title: escapeT('General'),
      uiSchema: {
        title: {
          type: 'string',
          title: escapeT('Page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-reactions': {
            dependencies: ['displayTitle'],
            fulfill: {
              state: {
                visible: '{{$deps[0]}}',
              },
            },
          },
        },
        displayTitle: {
          type: 'boolean',
          title: escapeT('Display page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        enableTabs: {
          type: 'boolean',
          title: escapeT('Enable tabs'),
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      defaultParams(ctx) {
        return {
          displayTitle: true,
          enableTabs: false,
        };
      },
      async handler(ctx, params) {
        ctx.model.setProps('displayTitle', params.displayTitle);
        if (!ctx.model.context.closable) {
          ctx.model.setProps('title', ctx.t(params.title || ctx.model.context.currentFlow.currentRoute?.title));
        } else {
          ctx.model.setProps('title', params.title ? ctx.t(params.title) : null);
        }
        ctx.model.setProps('enableTabs', params.enableTabs);

        if (ctx.model.context.closable) {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgLayout,
            paddingInline: 16,
            marginBottom: 0,
          });
        } else {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
            paddingInline: 16,
            marginBottom: 0,
          });
        }
      },
    },
  },
});
