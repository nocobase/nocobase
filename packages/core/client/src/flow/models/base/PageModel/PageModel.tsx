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
import { DragEndEvent } from '@dnd-kit/core';
import { uid } from '@formily/shared';
import {
  AddSubModelButton,
  CreateModelOptions,
  DATA_SOURCE_DIRTY_EVENT,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  getEmitterViewActivatedVersion,
  getPageActive,
  parsePathnameToViewParams,
  tExpr,
  VIEW_ACTIVATED_EVENT,
} from '@nocobase/flow-engine';
import { Tabs } from 'antd';
import React, { ReactNode } from 'react';
import { TextAreaWithContextSelector } from '../../../components/TextAreaWithContextSelector';
import { BasePageTabModel } from './PageTabModel';

type PageModelStructure = {
  subModels: {
    tabs: BasePageTabModel[];
  };
};

export class PageModel extends FlowModel<PageModelStructure> {
  tabBarExtraContent: { left?: ReactNode; right?: ReactNode } = {};
  private viewActivatedListener?: (_payload?: unknown) => void;
  private dataSourceDirtyListener?: (_payload?: unknown) => void;
  private lastSeenEmitterViewActivatedVersion = 0;
  private dirtyRefreshScheduled = false;
  private unmounted = false;
  private documentTitleUpdateVersion = 0;

  private getActiveTabKey(): string | undefined {
    const viewParams = this.context.view?.navigation?.viewParams;
    if (viewParams) {
      return viewParams.tabUid || this.getFirstTab()?.uid;
    }
    return this.props.tabActiveKey || this.getFirstTab()?.uid;
  }

  private scheduleActiveLifecycleRefresh(): void {
    if (this.dirtyRefreshScheduled) return;
    this.dirtyRefreshScheduled = true;
    Promise.resolve()
      .then(() => {
        this.dirtyRefreshScheduled = false;
        if (this.unmounted) return;
        // Only skip when explicitly inactive; treat "unknown" (undefined) as active for backward compatibility.
        if (getPageActive(this.context) === false) return;
        const activeKey = this.getActiveTabKey();
        if (activeKey) {
          this.invokeTabModelLifecycleMethod(activeKey, 'onActive');
        }
      })
      .catch(() => {
        // ignore
      });
  }

  onMount(): void {
    super.onMount();
    this.unmounted = false;
    this.setProps('tabActiveKey', this.context.view.inputArgs?.tabUid);
    if (this.context?.pageInfo) this.context.pageInfo.version = 'v2';
    void this.updateDocumentTitle();

    // When a nested view (popup/page) is closed, the opener view becomes active again.
    // We align this with the existing tab lifecycle by invoking `onActive` for the current tab blocks.
    if (!this.viewActivatedListener) {
      this.viewActivatedListener = (_payload?: unknown) => {
        const activeKey = this.getActiveTabKey();
        if (activeKey) {
          this.invokeTabModelLifecycleMethod(activeKey, 'onActive');
        }
      };
      this.flowEngine?.emitter?.on?.(VIEW_ACTIVATED_EVENT, this.viewActivatedListener);
    }

    // Handle activation events that occurred before PageModel was mounted (e.g. hidden views opened by router replay).
    // view:activated increments a version on the emitter, so we can catch up once on mount.
    const emitterActivatedVersion = getEmitterViewActivatedVersion(this.flowEngine?.emitter);
    const shouldCatchUp =
      emitterActivatedVersion > 0 && emitterActivatedVersion !== this.lastSeenEmitterViewActivatedVersion;
    this.lastSeenEmitterViewActivatedVersion = emitterActivatedVersion;
    if (shouldCatchUp && getPageActive(this.context) !== false) {
      const activeKey = this.getActiveTabKey();
      if (activeKey) {
        this.invokeTabModelLifecycleMethod(activeKey, 'onActive');
      }
    }

    // When data is written within the same view, trigger an "active" lifecycle pass so blocks can refresh based on dirty.
    if (!this.dataSourceDirtyListener) {
      this.dataSourceDirtyListener = (_payload?: unknown) => {
        this.scheduleActiveLifecycleRefresh();
      };
      this.flowEngine?.emitter?.on?.(DATA_SOURCE_DIRTY_EVENT, this.dataSourceDirtyListener);
    }
  }

  protected onUnmount(): void {
    this.unmounted = true;
    if (this.viewActivatedListener) {
      this.flowEngine?.emitter?.off?.(VIEW_ACTIVATED_EVENT, this.viewActivatedListener);
      this.viewActivatedListener = undefined;
    }
    if (this.dataSourceDirtyListener) {
      this.flowEngine?.emitter?.off?.(DATA_SOURCE_DIRTY_EVENT, this.dataSourceDirtyListener);
      this.dataSourceDirtyListener = undefined;
    }
    super.onUnmount();
  }

  invokeTabModelLifecycleMethod(tabActiveKey: string, method: 'onActive' | 'onInactive') {
    if (method === 'onActive' && this.context?.pageInfo) {
      this.context.pageInfo.version = 'v2';
    }
    const tabModel = this.flowEngine.getModel(tabActiveKey) as BasePageTabModel | undefined;

    if (tabModel) {
      if (tabModel.context.tabActive) {
        const pageActive = getPageActive(tabModel.context);
        const isPageActive = pageActive !== false;
        tabModel.context.tabActive.value = isPageActive && method === 'onActive';
      }
      tabModel.subModels.grid?.mapSubModels('items', (item) => {
        item[method]?.();
      });
    }

    if (method === 'onActive') {
      void this.updateDocumentTitle(tabActiveKey);
    }
  }

  /**
   * Resolve configured document title template and update browser tab title.
   * Priority:
   * 1) page without tabs: page.documentTitle > page title
   * 2) page with tabs: activeTab.documentTitle > active tab name
   */
  async updateDocumentTitle(preferredActiveTabKey?: string, retryCount = 0) {
    // Guard against updates after unmount
    if (this.unmounted) {
      return;
    }
    if (getPageActive(this.context) === false) {
      return;
    }

    const hasRouteNavigation = !!this.context?.view?.navigation;
    const currentViewUid = this.context?.view?.inputArgs?.viewUid;
    const routePathname = this.flowEngine?.context?.route?.pathname;
    // In route-managed multi-view mode, only the top view in URL should mutate document.title.
    if (hasRouteNavigation && currentViewUid && typeof routePathname === 'string') {
      const topViewUid = parsePathnameToViewParams(routePathname).at(-1)?.viewUid;
      if (topViewUid && topViewUid !== currentViewUid) {
        return;
      }
    }

    const updateVersion = ++this.documentTitleUpdateVersion;

    const resolveTemplate = async (template?: string) => {
      if (!template || typeof template !== 'string') {
        return '';
      }
      try {
        const resolved = await this.context.resolveJsonTemplate?.(template);
        return resolved == null ? '' : String(resolved);
      } catch (error) {
        return template;
      }
    };

    let nextTitle = '';
    if (this.props.enableTabs) {
      const activeTabKey = preferredActiveTabKey || this.getActiveTabKey();
      const activeTabModel = activeTabKey
        ? (this.flowEngine.getModel(activeTabKey) as BasePageTabModel | undefined)
        : this.getFirstTab();
      if (!activeTabModel && retryCount < 5) {
        window.setTimeout(() => {
          // Guard against updates after unmount or from stale retries.
          if (this.unmounted) {
            return;
          }
          if (updateVersion !== this.documentTitleUpdateVersion) {
            return;
          }
          void this.updateDocumentTitle(activeTabKey, retryCount + 1);
        }, 0);
        return;
      }
      const tabDocumentTitle = await resolveTemplate(activeTabModel?.stepParams?.pageTabSettings?.tab?.documentTitle);
      nextTitle = tabDocumentTitle || activeTabModel?.getTabTitle?.() || '';
    } else {
      const pageDocumentTitle = await resolveTemplate(this.stepParams?.pageSettings?.general?.documentTitle);
      nextTitle = pageDocumentTitle || this.props.title || '';
    }

    // Skip stale async updates (for quick tab/page switches).
    if (updateVersion !== this.documentTitleUpdateVersion) {
      return;
    }

    if (typeof nextTitle === 'string' && nextTitle !== '') {
      document.title = nextTitle;
    }
  }

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
      return !this.context.flowSettingsEnabled && model.hidden
        ? null
        : {
            key: model.uid,
            label: (
              <Droppable model={model}>
                <FlowModelRenderer
                  model={model}
                  showFlowSettings={{
                    showBackground: true,
                    showBorder: false,
                    toolbarPosition: 'above',
                    style: { transform: 'translateY(8px)' },
                  }}
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
    }).filter(Boolean);
  }

  getFirstTab() {
    return this.subModels.tabs?.[0];
  }

  renderFirstTab() {
    const firstTab = this.getFirstTab();
    return firstTab?.renderChildren?.();
  }

  async handleDragEnd(event: DragEndEvent) {
    throw new Error('Method not implemented.');
  }

  renderTabs() {
    return (
      <DndProvider onDragEnd={this.handleDragEnd.bind(this)}>
        <Tabs
          activeKey={
            this.context.view?.navigation?.viewParams
              ? this.context.view.navigation.viewParams.tabUid || this.getFirstTab()?.uid
              : this.props.tabActiveKey
          }
          tabBarStyle={this.props.tabBarStyle}
          items={this.mapTabs()}
          onChange={(activeKey) => {
            this.context.view.navigation?.changeTo?.({
              tabUid: activeKey,
            });

            this.invokeTabModelLifecycleMethod(activeKey, 'onActive');
            this.invokeTabModelLifecycleMethod(this.props.tabActiveKey, 'onInactive');
            this.setProps('tabActiveKey', activeKey);
          }}
          // destroyInactiveTabPane
          tabBarExtraContent={{
            right: (
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
            ),
            ...this.tabBarExtraContent,
          }}
        />
      </DndProvider>
    );
  }

  render() {
    const token = this.context.themeToken;
    const headerStyle = { ...this.props.headerStyle } as Record<string, any>;
    if (token) {
      headerStyle.paddingBlock = token.paddingSM;
      headerStyle.paddingInline = token.paddingLG;
    }
    if (this.props.enableTabs) {
      headerStyle.paddingBottom = 0;
    }
    return (
      <>
        {this.props.displayTitle && <PageHeader title={this.props.title} style={headerStyle} />}
        {this.props.enableTabs ? this.renderTabs() : this.renderFirstTab()}
      </>
    );
  }
}

PageModel.registerFlow({
  key: 'pageSettings',
  title: tExpr('Page settings'),
  steps: {
    general: {
      title: tExpr('Edit page'),
      uiSchema: {
        title: {
          type: 'string',
          title: tExpr('Page title'),
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
        documentTitle: {
          type: 'string',
          title: tExpr('Document title'),
          description: tExpr(
            'Used as the browser tab title when tabs are disabled. Supports variables. Leave empty to use Page title.',
          ),
          'x-decorator': 'FormItem',
          'x-component': TextAreaWithContextSelector,
          'x-component-props': {
            rows: 1,
            maxRows: 6,
          },
        },
        displayTitle: {
          type: 'boolean',
          title: tExpr('Display page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        enableTabs: {
          type: 'boolean',
          title: tExpr('Enable tabs'),
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
        const token = ctx.themeToken;
        const tabPaddingInline = token?.paddingLG ?? 16;
        ctx.model.setProps('displayTitle', params.displayTitle);
        if (ctx.model.context.closable) {
          ctx.model.setProps('title', ctx.t(params.title, { ns: 'lm-desktop-routes' }));
        } else {
          const routeTitle = (ctx.model.context as any)?.currentRoute?.title;
          ctx.model.setProps('title', ctx.t(params.title || routeTitle, { ns: 'lm-desktop-routes' }));
        }
        ctx.model.setProps('enableTabs', params.enableTabs);

        if (ctx.view.type === 'embed') {
          ctx.model.setProps('headerStyle', {
            backgroundColor: 'var(--colorBgContainer)',
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: 'var(--colorBgContainer)',
            paddingInline: tabPaddingInline,
            marginBottom: 0,
          });
        } else {
          ctx.model.setProps('headerStyle', {
            backgroundColor: 'var(--colorBgLayout)',
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: 'var(--colorBgLayout)',
            paddingInline: tabPaddingInline,
            marginBottom: 0,
          });
        }
        void (ctx.model as PageModel).updateDocumentTitle();
      },
    },
  },
});
