/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageHeader } from '@ant-design/pro-layout';
import { uid } from '@formily/shared';
import { AddSubModelButton, CreateModelOptions, FlowModel, FlowModelRenderer, escapeT } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import { PageTabModel } from './PageTabModel';

type PageModelStructure = {
  subModels: {
    tabs: PageTabModel[];
  };
};

export class PageModel extends FlowModel<PageModelStructure> {
  createPageTabModelOptions = (): CreateModelOptions => {
    const modeId = uid();
    return {
      uid: modeId,
      use: 'MainPageTabModel',
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

  renderFirstTab() {
    const firstTab = this.subModels.tabs?.[0];
    return firstTab?.renderChildren();
  }

  mapTabs() {
    return this.mapSubModels('tabs', (model) => {
      return {
        key: model.uid,
        label: <FlowModelRenderer model={model} showFlowSettings={{ showBackground: true, showBorder: false }} />,
        children: model.renderChildren(),
      };
    });
  }

  renderTabs() {
    return (
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
            <Button>{this.context.t('Add tab')}</Button>
          </AddSubModelButton>
        }
      />
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

export class MainPageModel extends PageModel {}

MainPageModel.registerFlow({
  key: 'mainPageSettings',
  steps: {
    init: {
      async handler(ctx, params) {
        if (ctx.model.hasSubModel('tabs')) {
          return;
        }
        // TODO: 加载当前页面对应的路由及子节点
        const { data } = await ctx.api.request({
          url: `desktopRoutes:listAccessible?tree=true&sort=sort&filter[parent.schemaUid]=${ctx.model.parentId}`,
        });
        ctx.model.setProps('routeId', data?.data?.[0]?.id);
        const routes = _.castArray(data?.data?.[0]?.children);
        for (const route of routes) {
          const model = await ctx.engine.createModel({
            parentId: ctx.model.uid,
            uid: route.schemaUid,
            subKey: 'tabs',
            subType: 'array',
            use: 'MainPageTabModel',
            props: {
              route,
            },
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: route.title,
                },
              },
            },
          });
          ctx.model.addSubModel('tabs', model);
        }
      },
    },
  },
});

export class SubPageModel extends PageModel {
  createPageTabModelOptions = (): CreateModelOptions => {
    return {
      use: 'SubPageTabModel',
      subModels: {
        grid: {
          async: true,
          use: 'BlockGridModel',
        },
      },
    };
  };
}
