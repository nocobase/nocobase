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
import { commonConditionHandler, ConditionBuilder } from '../../../components/ConditionBuilder';
import { TextAreaWithContextSelector } from '../../../components/TextAreaWithContextSelector';
import { confirmUnsavedChangesHandler } from './closeGuard';
import { BasePageTabModel } from './PageTabModel';
import { FilteredPageTabBar, NO_ACTIVE_PAGE_TAB_KEY } from './PageModelTabBar';

type PageModelStructure = {
  subModels: {
    tabs: BasePageTabModel[];
  };
};

type CurrentRouteWithTabs = {
  id?: string | number | null;
  enableTabs?: boolean;
};

type PageModelContextWithRoute = {
  currentRoute?: CurrentRouteWithTabs | null;
};

type RequestedTabKey = {
  key?: string;
  source: 'url' | 'local' | 'props' | 'none';
};

type TabActiveResolution = RequestedTabKey & {
  status: 'unspecified' | 'visible' | 'hidden' | 'unknown';
  effectiveKey?: string;
  allTabs: BasePageTabModel[];
  visibleTabs: BasePageTabModel[];
};

type TabActiveKeySyncState = {
  previousEffectiveActiveKey?: string;
  effectiveActiveKey?: string;
  previousAllHidden: boolean;
  lastCorrectionSignature?: string;
};

type TabActiveKeySyncProps = {
  dependencyKey: string;
  onSync: (state: TabActiveKeySyncState) => TabActiveKeySyncState;
};

function TabActiveKeySync({ dependencyKey, onSync }: TabActiveKeySyncProps) {
  const previousEffectiveActiveKey = React.useRef<string>();
  const previousAllHidden = React.useRef(false);
  const lastCorrectionSignature = React.useRef<string>();

  React.useEffect(() => {
    const nextState = onSync({
      previousEffectiveActiveKey: previousEffectiveActiveKey.current,
      previousAllHidden: previousAllHidden.current,
      lastCorrectionSignature: lastCorrectionSignature.current,
    });
    previousEffectiveActiveKey.current = nextState.effectiveActiveKey;
    previousAllHidden.current = nextState.previousAllHidden;
    lastCorrectionSignature.current = nextState.lastCorrectionSignature;
  }, [dependencyKey, onSync]);

  return null;
}

export class PageModel extends FlowModel<PageModelStructure> {
  tabBarExtraContent: { left?: ReactNode; right?: ReactNode } = {};
  private viewActivatedListener?: (_payload?: unknown) => void;
  private dataSourceDirtyListener?: (_payload?: unknown) => void;
  private lastSeenEmitterViewActivatedVersion = 0;
  private dirtyRefreshScheduled = false;
  private unmounted = false;
  private documentTitleUpdateVersion = 0;
  private preferImplicitLocalActiveKey = false;

  /**
   * 根页面标签页开关以路由表为准，避免 flow model 里的旧配置覆盖路由管理设置。
   */
  private getEnableTabs(): boolean {
    const currentRoute = (this.context as PageModelContextWithRoute).currentRoute;
    const routeId = this.props.routeId;
    if (
      routeId != null &&
      currentRoute?.id != null &&
      String(currentRoute.id) === String(routeId) &&
      typeof currentRoute.enableTabs === 'boolean'
    ) {
      return currentRoute.enableTabs;
    }
    return !!this.props.enableTabs;
  }

  private getAllTabs(): BasePageTabModel[] {
    return this.subModels?.tabs || [];
  }

  private getRuntimeVisibleTabs(): BasePageTabModel[] {
    const tabs = this.getAllTabs();
    return this.context.flowSettingsEnabled ? tabs : tabs.filter((tab) => !tab.hidden);
  }

  private getRequestedTabKey(): RequestedTabKey {
    const viewParams = this.context.view?.navigation?.viewParams;
    if (viewParams) {
      const urlKey = typeof viewParams.tabUid === 'string' && viewParams.tabUid ? viewParams.tabUid : undefined;
      if (urlKey) {
        this.preferImplicitLocalActiveKey = false;
        return { key: urlKey, source: 'url' };
      }

      const localKey =
        typeof this.props.tabActiveKey === 'string' && this.props.tabActiveKey ? this.props.tabActiveKey : undefined;
      if (this.preferImplicitLocalActiveKey && localKey) {
        return { key: localKey, source: 'local' };
      }
      return { source: 'none' };
    }

    const localKey =
      typeof this.props.tabActiveKey === 'string' && this.props.tabActiveKey ? this.props.tabActiveKey : undefined;
    return localKey ? { key: localKey, source: 'props' } : { source: 'none' };
  }

  private resolveTabActiveState(): TabActiveResolution {
    const allTabs = this.getAllTabs();
    const visibleTabs = this.getRuntimeVisibleTabs();
    const requested = this.getRequestedTabKey();

    if (!requested.key) {
      return {
        ...requested,
        status: 'unspecified',
        effectiveKey: visibleTabs[0]?.uid,
        allTabs,
        visibleTabs,
      };
    }

    const requestedTab = allTabs.find((tab) => tab.uid === requested.key);
    if (!requestedTab) {
      return {
        ...requested,
        status: 'unknown',
        effectiveKey: requested.key,
        allTabs,
        visibleTabs,
      };
    }

    if (visibleTabs.some((tab) => tab.uid === requested.key)) {
      return {
        ...requested,
        status: 'visible',
        effectiveKey: requested.key,
        allTabs,
        visibleTabs,
      };
    }

    return {
      ...requested,
      status: 'hidden',
      effectiveKey: requested.key,
      allTabs,
      visibleTabs,
    };
  }

  private getActiveTabKey(): string | undefined {
    if (!this.getEnableTabs()) {
      const firstTabKey = this.getFirstTab()?.uid;
      if (firstTabKey) {
        return firstTabKey;
      }
    }
    return this.resolveTabActiveState().effectiveKey;
  }

  private getTabActiveKeySyncDependency() {
    const allTabs = this.getAllTabs();
    const visibleTabs = this.getRuntimeVisibleTabs();
    const viewParams = this.context.view?.navigation?.viewParams;
    return JSON.stringify([
      !!this.context.flowSettingsEnabled,
      viewParams ? viewParams.tabUid || null : null,
      this.props.tabActiveKey || null,
      allTabs.map((tab) => tab.uid),
      visibleTabs.map((tab) => tab.uid),
      this.preferImplicitLocalActiveKey,
    ]);
  }

  private requestDocumentTitleUpdate(preferredActiveTabKey?: string, retryCount = 0) {
    this.updateDocumentTitle(preferredActiveTabKey, retryCount).catch((error) => {
      console.warn('[PageModel] Failed to update document title', error);
    });
  }

  private rememberImplicitActiveKey(activeKey: string) {
    this.preferImplicitLocalActiveKey = true;
    if (this.props.tabActiveKey !== activeKey) {
      this.setProps('tabActiveKey', activeKey);
    }
  }

  private commitTabActiveKey(
    activeKey: string | undefined,
    options: {
      previousActiveKey?: string;
      navigate: boolean;
      preserveImplicitLocalKey?: boolean;
    },
  ) {
    const { previousActiveKey, navigate, preserveImplicitLocalKey = false } = options;
    if (preserveImplicitLocalKey && activeKey) {
      this.preferImplicitLocalActiveKey = true;
    } else if (navigate || !activeKey) {
      this.preferImplicitLocalActiveKey = false;
    }

    if (navigate) {
      this.context.view?.navigation?.changeTo?.({ tabUid: activeKey });
    }

    if (activeKey && activeKey !== previousActiveKey) {
      this.invokeTabModelLifecycleMethod(activeKey, 'onActive');
    }
    if (previousActiveKey && previousActiveKey !== activeKey) {
      this.invokeTabModelLifecycleMethod(previousActiveKey, 'onInactive');
    }
    this.setProps('tabActiveKey', activeKey);

    if (!activeKey) {
      this.requestDocumentTitleUpdate();
    }
  }

  private synchronizeTabActiveKey = (state: TabActiveKeySyncState): TabActiveKeySyncState => {
    const resolution = this.resolveTabActiveState();
    const allHidden = resolution.allTabs.length > 0 && resolution.visibleTabs.length === 0;
    const createNextState = (effectiveActiveKey: string | undefined, lastCorrectionSignature?: string) => ({
      previousEffectiveActiveKey: effectiveActiveKey,
      effectiveActiveKey,
      previousAllHidden: allHidden,
      lastCorrectionSignature,
    });

    if (this.context.flowSettingsEnabled) {
      return createNextState(resolution.effectiveKey);
    }

    if (resolution.status === 'unknown') {
      return createNextState(resolution.effectiveKey);
    }

    if (resolution.status === 'visible') {
      const activeKey = resolution.effectiveKey;
      const shouldActivateAfterRestore = state.previousAllHidden && resolution.source !== 'url';
      const shouldSyncChangedVisibleKey =
        !!state.previousEffectiveActiveKey && state.previousEffectiveActiveKey !== activeKey;
      if ((shouldActivateAfterRestore || shouldSyncChangedVisibleKey) && activeKey) {
        const signature = `visible:${resolution.source}:${state.previousEffectiveActiveKey || ''}->${activeKey}`;
        if (signature !== state.lastCorrectionSignature) {
          this.commitTabActiveKey(activeKey, {
            previousActiveKey: state.previousEffectiveActiveKey,
            navigate: false,
            preserveImplicitLocalKey: resolution.source !== 'url',
          });
        }
        return createNextState(activeKey, signature);
      }
      return createNextState(activeKey);
    }

    if (resolution.status === 'hidden') {
      return createNextState(resolution.effectiveKey);
    }

    const activeKey = resolution.effectiveKey;
    if (!activeKey) {
      if (!allHidden) {
        return createNextState(undefined);
      }
      const signature = `all-hidden:${state.previousEffectiveActiveKey || ''}`;
      if (!state.previousAllHidden && signature !== state.lastCorrectionSignature) {
        this.preferImplicitLocalActiveKey = false;
        if (this.props.tabActiveKey || state.previousEffectiveActiveKey) {
          this.commitTabActiveKey(undefined, {
            previousActiveKey: state.previousEffectiveActiveKey,
            navigate: false,
          });
        } else {
          this.requestDocumentTitleUpdate();
        }
      }
      return createNextState(undefined, signature);
    }

    const shouldSwitchImplicitActiveKey =
      state.previousAllHidden || (!!state.previousEffectiveActiveKey && state.previousEffectiveActiveKey !== activeKey);
    const signature = `implicit:${state.previousEffectiveActiveKey || ''}->${activeKey}`;
    if (shouldSwitchImplicitActiveKey && signature !== state.lastCorrectionSignature) {
      this.commitTabActiveKey(activeKey, {
        previousActiveKey: state.previousEffectiveActiveKey,
        navigate: false,
        preserveImplicitLocalKey: true,
      });
    } else {
      this.rememberImplicitActiveKey(activeKey);
    }
    return createNextState(activeKey, shouldSwitchImplicitActiveKey ? signature : undefined);
  };

  private scheduleActiveLifecycleRefresh(forceRefresh = false): void {
    if (this.dirtyRefreshScheduled) return;
    this.dirtyRefreshScheduled = true;
    Promise.resolve()
      .then(() => {
        this.dirtyRefreshScheduled = false;
        if (this.unmounted) return;
        // Only skip when explicitly inactive; treat "unknown" (undefined) as active for backward compatibility.
        if (getPageActive(this.context) === false) return;
        this.activateCurrentTab(forceRefresh);
      })
      .catch(() => {
        // ignore
      });
  }

  activateCurrentTab(forceRefresh = false) {
    const activeKey = this.getActiveTabKey();
    if (activeKey) {
      this.invokeTabModelLifecycleMethod(activeKey, 'onActive', forceRefresh);
    }
  }

  deactivateCurrentTab() {
    const activeKey = this.getActiveTabKey();
    if (activeKey) {
      this.invokeTabModelLifecycleMethod(activeKey, 'onInactive');
    }
  }

  onMount(): void {
    super.onMount();
    this.unmounted = false;
    this.setProps('tabActiveKey', this.context.view.inputArgs?.tabUid);
    if (this.context?.pageInfo) this.context.pageInfo.version = 'v2';
    this.requestDocumentTitleUpdate();

    // When a nested view (popup/page) is closed, the opener view becomes active again.
    // We align this with the existing tab lifecycle by invoking `onActive` for the current tab blocks.
    if (!this.viewActivatedListener) {
      this.viewActivatedListener = (_payload?: unknown) => {
        this.activateCurrentTab();
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
      this.activateCurrentTab();
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

  invokeTabModelLifecycleMethod(
    tabActiveKey: string | undefined,
    method: 'onActive' | 'onInactive',
    forceRefresh = false,
  ) {
    if (!tabActiveKey) {
      return;
    }

    if (method === 'onActive' && this.context?.pageInfo) {
      this.context.pageInfo.version = 'v2';
    }
    const tabModel =
      this.findSubModel('tabs', (model) => model.uid === tabActiveKey) ||
      (this.flowEngine.getModel(tabActiveKey) as BasePageTabModel | undefined);

    if (tabModel) {
      if (tabModel.context.tabActive) {
        const pageActive = getPageActive(tabModel.context);
        const isPageActive = pageActive !== false;
        tabModel.context.tabActive.value = isPageActive && method === 'onActive';
      }
      tabModel.subModels.grid?.mapSubModels('items', (item) => {
        item[method]?.(forceRefresh);
      });
    }

    if (method === 'onActive') {
      this.requestDocumentTitleUpdate(tabActiveKey);
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
      const layoutRoutePath = this.context?.layout?.routePath;
      const topViewUid = parsePathnameToViewParams(routePathname, {
        basePath: this.context?.layoutRoute?.basePathname || (layoutRoutePath?.startsWith('/') ? layoutRoutePath : ''),
      }).at(-1)?.viewUid;
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

    const allTabs = this.getAllTabs();
    const visibleTabs = this.getRuntimeVisibleTabs();
    const activeTabKey = preferredActiveTabKey || this.getActiveTabKey();
    const shouldUsePageTitle =
      !this.getEnableTabs() ||
      (!activeTabKey && !this.context.flowSettingsEnabled && allTabs.length > 0 && visibleTabs.length === 0);

    let nextTitle = '';
    if (!shouldUsePageTitle) {
      const activeTabModel = activeTabKey
        ? this.findSubModel('tabs', (model) => model.uid === activeTabKey) ||
          (this.flowEngine.getModel(activeTabKey) as BasePageTabModel | undefined)
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
          this.requestDocumentTitleUpdate(activeTabKey, retryCount + 1);
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
      return {
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
    });
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
    const activeState = this.resolveTabActiveState();
    const hiddenTabKeys = new Set(
      this.context.flowSettingsEnabled ? [] : activeState.allTabs.filter((tab) => tab.hidden).map((tab) => tab.uid),
    );
    const tabsActiveKey =
      activeState.effectiveKey || (activeState.allTabs.length > 0 ? NO_ACTIVE_PAGE_TAB_KEY : undefined);
    const tabNavPaddingInlineStart = this.context.themeToken?.paddingLG ?? 16;
    const leftExtraContent =
      this.tabBarExtraContent.left !== undefined ? (
        this.tabBarExtraContent.left
      ) : (
        <span aria-hidden="true" style={{ display: 'inline-block', width: tabNavPaddingInlineStart, height: 1 }} />
      );
    const rightExtraContent =
      this.tabBarExtraContent.right !== undefined ? (
        this.tabBarExtraContent.right
      ) : (
        <span style={{ display: 'inline-flex', marginInlineEnd: tabNavPaddingInlineStart }}>
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
        </span>
      );

    return (
      <DndProvider onDragEnd={this.handleDragEnd.bind(this)}>
        <TabActiveKeySync dependencyKey={this.getTabActiveKeySyncDependency()} onSync={this.synchronizeTabActiveKey} />
        <Tabs
          activeKey={tabsActiveKey}
          tabBarStyle={this.props.tabBarStyle}
          items={this.mapTabs()}
          renderTabBar={
            hiddenTabKeys.size > 0
              ? (tabBarProps, DefaultTabBar) => (
                  <FilteredPageTabBar
                    hiddenTabKeys={hiddenTabKeys}
                    tabBarProps={tabBarProps}
                    DefaultTabBar={DefaultTabBar}
                  />
                )
              : undefined
          }
          onChange={(activeKey) => {
            const previousActiveKey = this.getActiveTabKey();
            this.preferImplicitLocalActiveKey = false;
            this.commitTabActiveKey(activeKey, {
              previousActiveKey,
              navigate: !!this.context.view?.navigation,
            });
          }}
          // destroyInactiveTabPane
          tabBarExtraContent={{
            left: leftExtraContent,
            right: rightExtraContent,
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
    const enableTabs = this.getEnableTabs();
    if (enableTabs) {
      headerStyle.paddingBottom = 0;
    }
    return (
      <>
        {this.props.displayTitle && <PageHeader title={this.props.title} style={headerStyle} />}
        {enableTabs ? this.renderTabs() : this.renderFirstTab()}
      </>
    );
  }
}

PageModel.registerEvents({
  close: {
    title: tExpr('Close'),
    name: 'close',
    hideInSettings(ctx) {
      return !!ctx.view?.preventClose;
    },
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': ConditionBuilder,
      },
    },
    handler: commonConditionHandler,
  },
});

PageModel.registerFlow({
  key: 'closeGuard',
  title: tExpr('Close guard'),
  on: 'close',
  steps: {
    confirmUnsavedChanges: {
      title: tExpr('Unsaved changes confirmation'),
      handler: confirmUnsavedChangesHandler as any,
    },
  },
});

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
            marginBottom: 0,
          });
        } else {
          ctx.model.setProps('headerStyle', {
            backgroundColor: 'var(--colorBgLayout)',
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: 'var(--colorBgLayout)',
            marginBottom: 0,
          });
        }
        await (ctx.model as PageModel).updateDocumentTitle();
      },
    },
  },
});
