/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer, observable, type ParamObject, tExpr } from '@nocobase/flow-engine';
import { Icon, type NocoBaseDesktopRoute } from '../../../../flow-compat';
import type { RouteRepository } from '../../../../RouteRepository';
import { useRequest } from 'ahooks';
import _ from 'lodash';
import React from 'react';
import { SkeletonFallback } from '../../../components/SkeletonFallback';
import { TextAreaWithContextSelector } from '../../../components/TextAreaWithContextSelector';
import { BlockGridModel } from '../BlockGridModel';

function PageTabChildrenRenderer({ ctx, options }) {
  const { data, loading } = useRequest(
    async () => {
      const model: FlowModel = await ctx.engine.loadOrCreateModel(options, { skipSave: !ctx.flowSettingsEnabled });
      model.context.addDelegate(ctx);
      return model;
    },
    {
      refreshDeps: [ctx.model.uid],
    },
  );
  const margin = ctx?.isMobileLayout ? 8 : ctx?.themeToken.marginBlock;
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin }} />} />;
}

/**
 * 统一归一化 `desktopRoutes:updateOrCreate` 的返回值。
 *
 * 该接口在 create/update 场景下可能分别返回对象或数组，
 * 这里始终抽出第一条 route 记录，便于把持久化 id 回填到前端模型。
 *
 * @param payload - 接口返回的 data 节点
 * @returns 可用于回填的 route 记录
 */
function normalizePersistedRoute(payload: unknown): Partial<NocoBaseDesktopRoute> | undefined {
  if (Array.isArray(payload)) {
    return payload.find((item): item is Partial<NocoBaseDesktopRoute> => !!item && typeof item === 'object');
  }
  if (payload && typeof payload === 'object') {
    return payload as Partial<NocoBaseDesktopRoute>;
  }
  return undefined;
}

type PersistedFlowModelAnchor = Record<string, unknown> & {
  uid?: unknown;
  stepParams?: unknown;
  subModels?: unknown;
};

type LinkageRulesStepParams = ParamObject & {
  value?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isLinkageRulesStepParams(value: unknown): value is LinkageRulesStepParams {
  return isRecord(value);
}

type RefreshableRouteRepository = Pick<RouteRepository, 'refreshAccessible'>;

const routeRefreshQueues = new WeakMap<RefreshableRouteRepository, Promise<unknown>>();

async function refreshRouteRepository(repository: RefreshableRouteRepository) {
  const previous = routeRefreshQueues.get(repository) || Promise.resolve();
  const current = previous.catch(() => undefined).then(() => repository.refreshAccessible());

  routeRefreshQueues.set(repository, current);

  try {
    await current;
  } finally {
    if (routeRefreshQueues.get(repository) === current) {
      routeRefreshQueues.delete(repository);
    }
  }
}

export class BasePageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('tabActive', {
      value: observable.ref(true), // TODO: 默认值应该是 false，且需要在 onMount 中设置为 true。但现在 onMount 有 BUG，会在每次切换 tab 时触发
      info: {
        description: 'Whether current tab is active (observable.ref).',
        detail: 'observable.ref<boolean>',
      },
    });
  }

  getTabTitle(defaultTitle = 'Untitled') {
    const translatedDefaultTitle = this.context.t(defaultTitle, { ns: 'client' });
    const translatedTitle = this.context.t(this.stepParams.pageTabSettings?.tab?.title, { ns: 'lm-desktop-routes' });
    return translatedTitle || translatedDefaultTitle;
  }

  getTabIcon() {
    return this.stepParams.pageTabSettings?.tab?.icon;
  }

  renderChildren() {
    return null;
  }

  renderHiddenInConfig() {
    return (
      <span style={{ display: 'inline-block', opacity: 0.5 }}>
        <Icon style={{ marginRight: 8 }} type={this.getTabIcon()} />
        {this.getTabTitle()}
      </span>
    );
  }

  render() {
    return (
      <span style={{ display: 'inline-block' }}>
        <Icon style={{ marginRight: 8 }} type={this.getTabIcon()} />
        {this.getTabTitle()}
      </span>
    );
  }
}

BasePageTabModel.registerFlow({
  key: 'pageTabSettings',
  title: tExpr('Tab settings'),
  steps: {
    tab: {
      title: tExpr('Edit tab'),
      preset: true,
      uiSchema: {
        title: {
          title: tExpr('Tab name'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        documentTitle: {
          type: 'string',
          title: tExpr('Document title'),
          description: tExpr(
            'Used as the browser tab title when this tab is active. Supports variables. Leave empty to use Tab name.',
          ),
          'x-decorator': 'FormItem',
          'x-component': TextAreaWithContextSelector,
          'x-component-props': {
            rows: 1,
            maxRows: 6,
          },
        },
        icon: {
          title: tExpr('Icon'),
          'x-decorator': 'FormItem',
          'x-component': 'IconPicker',
        },
      },
      async handler(ctx, params) {
        const translate = typeof ctx?.t === 'function' ? ctx.t.bind(ctx) : (value: string) => value;
        ctx.model.setProps('title', translate(params.title, { ns: 'lm-desktop-routes' }));
        ctx.model.setProps('icon', params.icon);
        const pageModel = ctx.engine.getModel(ctx.model.parentId) as { updateDocumentTitle?: () => Promise<void> };
        await pageModel?.updateDocumentTitle?.();
      },
    },
    linkageRules: {
      use: 'tabLinkageRules',
    },
  },
});

export class RootPageTabModel extends BasePageTabModel {
  private persistedLinkageRulesHydrated = false;
  private persistedLinkageRulesHydrating?: Promise<void>;

  onInit(options) {
    super.onInit(options);
    if (this.shouldHydratePersistedLinkageRules()) {
      this.hydratePersistedLinkageRules().catch((error) => {
        console.warn('[RootPageTabModel] Failed to hydrate tab linkage rules', error);
      });
    }
  }

  private hasExplicitLinkageRulesStep() {
    const pageTabSettings = this.stepParams?.pageTabSettings;
    return isRecord(pageTabSettings) && Object.prototype.hasOwnProperty.call(pageTabSettings, 'linkageRules');
  }

  private shouldHydratePersistedLinkageRules() {
    return !!this.context.flowSettingsEnabled || this.props.route?.options?.hasPersistedPageTabFlowModel === true;
  }

  private async fetchPersistedAnchor(): Promise<PersistedFlowModelAnchor | undefined> {
    const response = await this.context.api.request({
      url: 'flowModels:findOne',
      params: { uid: this.uid },
    });
    const anchor = response?.data?.data;
    return isRecord(anchor) ? anchor : undefined;
  }

  private async performPersistedLinkageRulesHydrate() {
    if (this.hasExplicitLinkageRulesStep()) {
      return;
    }

    const anchor = await this.fetchPersistedAnchor();
    if (this.hasExplicitLinkageRulesStep()) {
      return;
    }

    const stepParams = isRecord(anchor?.stepParams) ? anchor.stepParams : undefined;
    const pageTabSettings = isRecord(stepParams?.pageTabSettings) ? stepParams.pageTabSettings : undefined;
    const linkageRules = pageTabSettings?.linkageRules;
    if (!isLinkageRulesStepParams(linkageRules)) {
      return;
    }

    this.setStepParams('pageTabSettings', 'linkageRules', _.cloneDeep(linkageRules));
    this.invalidateFlowCache('beforeRender', true);
    await this.rerender();
  }

  private hydratePersistedLinkageRules(): Promise<void> {
    if (this.persistedLinkageRulesHydrated) {
      return Promise.resolve();
    }
    if (this.persistedLinkageRulesHydrating) {
      return this.persistedLinkageRulesHydrating;
    }

    const hydration = this.performPersistedLinkageRulesHydrate();
    this.persistedLinkageRulesHydrating = hydration;
    hydration
      .then(() => {
        if (this.persistedLinkageRulesHydrating === hydration) {
          this.persistedLinkageRulesHydrated = true;
          this.persistedLinkageRulesHydrating = undefined;
        }
      })
      .catch(() => {
        if (this.persistedLinkageRulesHydrating === hydration) {
          this.persistedLinkageRulesHydrating = undefined;
        }
      });
    return hydration;
  }

  async openFlowSettings(options?: Parameters<FlowModel['openFlowSettings']>[0]) {
    if (options?.flowKey === 'pageTabSettings' && options?.stepKey === 'linkageRules') {
      await this.hydratePersistedLinkageRules();
    }
    return super.openFlowSettings(options);
  }

  renderChildren() {
    return (
      <PageTabChildrenRenderer
        ctx={this.context}
        options={{
          parentId: this.uid,
          subKey: 'grid',
          async: true,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    );
  }

  async saveStepParams() {
    const hasExplicitLinkageRulesStep = this.hasExplicitLinkageRulesStep();
    const linkageRules = hasExplicitLinkageRulesStep
      ? (_.cloneDeep(this.stepParams.pageTabSettings.linkageRules) as LinkageRulesStepParams)
      : undefined;

    await this.save();
    if (hasExplicitLinkageRulesStep && linkageRules) {
      await this.persistLinkageRulesToAnchor(linkageRules);
    }
  }

  async save() {
    const json = this.serialize();
    const documentTitle = this.stepParams?.pageTabSettings?.tab?.documentTitle;
    const route = this.props.route || {};
    const persisted = route.id != null;
    const currentRoute =
      persisted && route.schemaUid ? this.context.routeRepository?.getRouteBySchemaUid?.(route.schemaUid) : undefined;
    const data = {
      ...(persisted ? { schemaUid: route.schemaUid } : route),
      title: this.getTabTitle(''),
      icon: this.getTabIcon(),
      options: {
        ...(currentRoute ? currentRoute.options : route.options),
        flowRegistry: json.flowRegistry,
        documentTitle,
      },
    };
    const response = await this.context.api.request(
      persisted
        ? {
            method: 'post',
            url: `desktopRoutes:update?filter[id]=${route.id}`,
            data,
          }
        : {
            method: 'post',
            url: 'desktopRoutes:updateOrCreate',
            params: {
              filterKeys: ['schemaUid'],
            },
            data,
          },
    );
    const persistedRoute = normalizePersistedRoute(response?.data?.data);

    // 新建 tab 首次保存后需要立即拿到持久化 route id，拖拽排序会直接依赖它。
    if (persistedRoute) {
      this.setProps('route', {
        ...this.props.route,
        ...persistedRoute,
        options: {
          ...this.props.route?.options,
          ...persistedRoute.options,
        },
      });
    }

    // 后续保存会从 RouteRepository 读取扩展 options，当前写入完成后必须先同步最新路由快照。
    try {
      if (this.context.routeRepository?.refreshAccessible) {
        await refreshRouteRepository(this.context.routeRepository);
      } else {
        await this.context.refreshDesktopRoutes?.();
      }
    } catch (error) {
      this.context.logger?.warn?.(
        { err: error },
        '[client-v2] Failed to refresh desktop routes after saving a page tab',
      );
    }
  }

  private buildAnchorPayload(latestAnchor: PersistedFlowModelAnchor | undefined, linkageRules: LinkageRulesStepParams) {
    const hasPersistedAnchor = typeof latestAnchor?.uid === 'string' && latestAnchor.uid.length > 0;
    const anchorRoot: PersistedFlowModelAnchor = hasPersistedAnchor
      ? _.cloneDeep(latestAnchor)
      : { uid: this.uid, use: 'RouteModel' };
    delete anchorRoot.subModels;

    const latestStepParams = isRecord(anchorRoot.stepParams) ? anchorRoot.stepParams : {};
    const latestPageTabSettings = isRecord(latestStepParams.pageTabSettings) ? latestStepParams.pageTabSettings : {};

    return {
      ...anchorRoot,
      stepParams: {
        ...latestStepParams,
        pageTabSettings: {
          ...latestPageTabSettings,
          linkageRules: _.cloneDeep(linkageRules),
        },
      },
    };
  }

  private async persistLinkageRulesToAnchor(linkageRules: LinkageRulesStepParams) {
    const latestAnchor = await this.fetchPersistedAnchor();
    const anchorPayload = this.buildAnchorPayload(latestAnchor, linkageRules);
    await this.context.api.request({
      method: 'post',
      url: 'flowModels:save',
      data: anchorPayload,
    });

    const hasRules = Array.isArray(linkageRules.value) && linkageRules.value.length > 0;
    await this.syncPersistedPageTabFlowModelMarker(hasRules);
    this.persistedLinkageRulesHydrated = true;
  }

  private async syncPersistedPageTabFlowModelMarker(hasRules: boolean) {
    const route = this.props.route;
    if (route?.id == null) {
      throw new Error('Cannot persist page tab FlowModel marker before the desktop route is saved.');
    }
    if (typeof this.context.routeRepository?.updateRoute !== 'function') {
      throw new Error('Route repository is unavailable while persisting the page tab FlowModel marker.');
    }

    const currentRoute = route.schemaUid
      ? this.context.routeRepository.getRouteBySchemaUid?.(route.schemaUid)
      : undefined;
    const nextOptions = {
      ...(currentRoute?.options || route.options || {}),
    };
    if (hasRules) {
      nextOptions.hasPersistedPageTabFlowModel = true;
    } else {
      delete nextOptions.hasPersistedPageTabFlowModel;
    }
    const persistedOptions = Object.keys(nextOptions).length > 0 ? nextOptions : undefined;

    await this.context.routeRepository.updateRoute(
      route.id,
      { options: persistedOptions },
      { refreshAfterMutation: false },
    );
    this.setProps('route', {
      ...route,
      options: persistedOptions,
    });
  }

  async destroy() {
    this.observerDispose();
    this.invalidateFlowCache('beforeRender', true);
    this.flowEngine.removeModel(this.uid);
    await this.context.api.request({
      method: 'post',
      url: 'desktopRoutes:destroy',
      params: {
        filter: {
          schemaUid: this.uid,
        },
      },
      data: this.props.route,
    });
    return true;
  }
}

export class ChildPageTabModel extends BasePageTabModel {
  renderChildren() {
    return (
      <PageTabChildrenRenderer
        ctx={this.context}
        options={{
          parentId: this.uid,
          subKey: 'grid',
          async: true,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    );
  }
}

/**
 * @deprecated Use `BasePageTabModel` instead.
 */
export class PageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  render() {
    return (
      <PageTabChildrenRenderer
        ctx={this.context}
        options={{
          parentId: this.uid,
          subKey: 'grid',
          async: true,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    );
  }
}
