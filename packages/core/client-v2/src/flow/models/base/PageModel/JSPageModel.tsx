/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ElementProxy,
  FlowCancelSaveException,
  FlowContext,
  getPageActive,
  getRunJSRuntimeReporting,
  setRunJSRuntimeReporting,
  tExpr,
  type CreateModelOptions,
  type ParamObject,
  type StepDefinition,
} from '@nocobase/flow-engine';
import { observable } from '@formily/reactive';
import React from 'react';
import {
  resolveRuntimeRunJS,
  resolveRunJSHostPreviewReporting,
  shouldHideRunJSSourceMenu,
  type ResolvedRuntimeRunJS,
} from '../../../components/runjs-source';
import {
  createLightExtensionRunJsUISchema,
  createRunJSEditorEmbedUIMode,
  createLightExtensionSettingSteps,
  getLightExtensionSettingsDescriptor,
  LIGHT_EXTENSION_SOURCE_MODE,
  normalizeLightExtensionSourceMode,
  normalizeLightExtensionSourceSettingsForBinding,
  rememberLightExtensionBindingSettings,
  setCanonicalLightExtensionSetting,
  setCanonicalLightExtensionSource,
  showPendingLightExtensionRequiredSettings,
} from '../../utils/runjsSourceRuntimeCommon';
import { RootPageModel } from './RootPageModel';
import {
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSPageSourceModeField';
import { createJSPageSourceLocator } from './jsPageContracts';
import { JSPageRuntimeController, type JSPageRuntimeRunContext, type JSPageRuntimeState } from './jsPageRuntime';

export const DEFAULT_JS_PAGE_CODE = `const { Card, Space, Typography } = ctx.libs.antd;

ctx.render(
  <Card variant="borderless">
    <Space direction="vertical" size={8}>
      <Typography.Title level={3}>{ctx.t('JavaScript page is ready')}</Typography.Title>
      <Typography.Text>{ctx.t('Page ID')}: {ctx.page.uid}</Typography.Text>
      <Typography.Text type="secondary">{ctx.t('Settings')}: {JSON.stringify(ctx.settings)}</Typography.Text>
    </Space>
  </Card>,
);`;

type JSPageRunParams = Record<string, unknown> & {
  code?: unknown;
  version?: unknown;
  sourceMode?: unknown;
  sourceBinding?: unknown;
  sourceRef?: unknown;
  settings?: unknown;
};

type ResolvedJSPageRun = {
  runtime: ResolvedRuntimeRunJS;
  sourceRef?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function readRunParams(model: JSPageModel): JSPageRunParams {
  const params = model.getStepParams('jsSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

function readRunJSFailure(result: unknown, fallbackMessage: string): Error | null {
  if (!isRecord(result) || result.success !== false) {
    return null;
  }
  return result.error instanceof Error ? result.error : new Error(fallbackMessage);
}

export class JSPageModel extends RootPageModel {
  private runtimeMounted = false;
  private readonly runtimeState: JSPageRuntimeState = observable({
    runId: 0,
    running: false,
    error: null,
  });
  private readonly runtimeController = new JSPageRuntimeController<ResolvedJSPageRun>({
    uid: this.uid,
    isActive: () => this.runtimeMounted && getPageActive(this.context) !== false,
    resolve: () => this.resolveRuntimeSource(),
    execute: (resolved, context) => this.executeRuntimeSource(resolved, context),
    setDocumentTitle: (title) => {
      document.title = title;
    },
    onStateChange: (state) => {
      Object.assign(this.runtimeState, state);
    },
  });

  static resolveUse(): void {}

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'jsSettings') {
      return undefined;
    }

    const params = readRunParams(this);
    const descriptor = await getJSPageLightExtensionSettingsDescriptor(this, params);
    if (!descriptor) {
      return undefined;
    }
    return createLightExtensionSettingSteps<JSPageModel>({
      descriptor,
      settings: isRecord(params.settings) ? params.settings : {},
      component: JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
      syncValue: (ctx, fieldName, value) =>
        setCanonicalLightExtensionSetting(ctx.model, 'jsSettings', fieldName, value),
      afterParamsSave: async (ctx) => {
        await ctx.model.rerender();
      },
    });
  }

  onInit(options: CreateModelOptions) {
    super.onInit(options);

    const general = isRecord(this.stepParams.pageSettings?.general) ? { ...this.stepParams.pageSettings.general } : {};
    if (!hasOwn(general, 'displayTitle')) general.displayTitle = false;
    if (!hasOwn(general, 'enableTabs')) general.enableTabs = false;
    this.setStepParams('pageSettings', 'general', general as unknown as ParamObject);

    const runJs = readRunParams(this);
    if (!hasOwn(runJs, 'version')) runJs.version = 'v2';
    if (!hasOwn(runJs, 'sourceMode')) runJs.sourceMode = 'inline';
    if (!hasOwn(runJs, 'settings')) runJs.settings = {};
    if (!hasOwn(runJs, 'code')) runJs.code = DEFAULT_JS_PAGE_CODE;
    this.setStepParams('jsSettings', 'runJs', runJs as unknown as ParamObject);
  }

  supportsPageTabs(): boolean {
    return false;
  }

  onMount(): void {
    super.onMount();
    this.runtimeMounted = true;
    this.refreshRuntime();
  }

  protected onUnmount(): void {
    this.runtimeMounted = false;
    queueMicrotask(() => this.runtimeController.dispose());
    super.onUnmount();
  }

  activateCurrentTab() {
    this.refreshRuntime();
  }

  deactivateCurrentTab() {
    this.runtimeController.deactivate();
  }

  async rerender() {
    await super.rerender();
    if (this.runtimeMounted) {
      await this.runtimeController.refresh().catch(() => undefined);
    }
  }

  renderPageContent() {
    const loadingLabel = this.context.t('Loading JavaScript page');
    const errorLabel = this.context.t('JavaScript page failed to run');

    return (
      <div className="nb-js-page-runtime">
        <div
          ref={this.setRuntimeHost}
          aria-busy={this.runtimeState.running}
          aria-label={this.context.t('JavaScript page content')}
          className="nb-js-page-runtime-host"
        />
        {this.runtimeState.running ? (
          <div role="status" aria-live="polite" className="nb-js-page-runtime-status">
            {loadingLabel}
          </div>
        ) : null}
        {this.runtimeState.error ? (
          <div role="alert" className="nb-js-page-runtime-error">
            <strong>{errorLabel}</strong>
            <div>{this.runtimeState.error.message}</div>
          </div>
        ) : null}
      </div>
    );
  }

  private setRuntimeHost = (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }
    this.runtimeController.setElement(element);
    if (this.runtimeMounted) {
      this.refreshRuntime();
    }
  };

  private refreshRuntime() {
    this.runtimeController.refresh().catch(() => undefined);
  }

  private async resolveRuntimeSource(): Promise<ResolvedJSPageRun> {
    const params = readRunParams(this);
    const runtime = await resolveRuntimeRunJS({
      runJs: {
        code: typeof params.code === 'string' ? params.code : '',
        version: typeof params.version === 'string' ? params.version : 'v2',
      },
      sourceMode: typeof params.sourceMode === 'string' ? params.sourceMode : undefined,
      sourceBinding: isRecord(params.sourceBinding) ? params.sourceBinding : undefined,
      settings: isRecord(params.settings) ? params.settings : undefined,
      context: {
        modelUid: this.uid,
      },
    });
    return { runtime, sourceRef: params.sourceRef };
  }

  private async executeRuntimeSource(resolved: ResolvedJSPageRun, run: JSPageRuntimeRunContext): Promise<void> {
    if (!run.isCurrent()) {
      return;
    }
    const runtimeContext = new FlowContext();
    runtimeContext.addDelegate(this.context);
    runtimeContext.defineProperty('element', {
      value: new ElementProxy(run.element),
    });
    runtimeContext.defineProperty('page', {
      value: run.page,
    });
    runtimeContext.defineProperty('settings', {
      value: resolved.runtime.settings,
    });
    runtimeContext.defineProperty('runJsSource', {
      value: {
        sourceMode: resolved.runtime.sourceMode,
        sourceBinding: resolved.runtime.sourceBinding,
        sourceMap: resolved.runtime.sourceMap,
        sourceRef: resolved.sourceRef,
        context: resolved.runtime.context,
      },
    });

    const reporting = resolveRunJSHostPreviewReporting(resolved.sourceRef);
    const previousReporting = reporting ? getRunJSRuntimeReporting(runtimeContext) : undefined;
    if (reporting) {
      setRunJSRuntimeReporting(runtimeContext, reporting);
    }
    let result: unknown;
    try {
      result = await runtimeContext.runjs(resolved.runtime.code, undefined, {
        runtimeReporting: reporting,
        version: resolved.runtime.version,
      });
    } finally {
      if (reporting) {
        setRunJSRuntimeReporting(runtimeContext, previousReporting);
      }
    }
    const failure = readRunJSFailure(result, this.context.t('RunJS execution failed'));
    if (failure) {
      throw failure;
    }
  }
}

async function getJSPageLightExtensionSettingsDescriptor(model: JSPageModel, params: Record<string, unknown>) {
  return getLightExtensionSettingsDescriptor({
    modelUid: model.uid,
    ownerKind: 'flowModel.pageSettings',
    ownerLocator: { modelUid: model.uid },
    params,
    sourceLocator: createJSPageSourceLocator(model.uid),
  });
}

JSPageModel.define({
  label: tExpr('JavaScript page'),
  createModelOptions: {
    use: 'JSPageModel',
  },
});

JSPageModel.registerFlow({
  key: 'jsSettings',
  title: tExpr('JavaScript settings'),
  steps: {
    sourceMode: {
      title: tExpr('Code source'),
      hideInSettings: shouldHideRunJSSourceMenu,
      persistParams: false,
      useRawParams: true,
      uiSchema: {
        sourceMode: {
          type: 'string',
          title: tExpr('Code source'),
          'x-decorator': 'FormItem',
          'x-component': JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
        },
        sourceBinding: { type: 'object', 'x-display': 'hidden' },
        settings: { type: 'object', 'x-display': 'hidden' },
      },
      defaultParams(ctx) {
        const params = readRunParams(ctx.model as JSPageModel);
        return {
          sourceMode: typeof params.sourceMode === 'string' ? params.sourceMode : 'inline',
          sourceBinding: params.sourceBinding,
          settings: isRecord(params.settings) ? params.settings : {},
        };
      },
      async beforeParamsSave(ctx, params) {
        const model = ctx.model as JSPageModel;
        const sourceMode = normalizeLightExtensionSourceMode(params.sourceMode);
        const sourceBinding = isRecord(params.sourceBinding) ? params.sourceBinding : undefined;
        if (sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !sourceBinding) {
          model.context?.message?.error?.(model.context.t('Select a light extension entry'));
          throw new FlowCancelSaveException('Light extension source binding is required.');
        }
        const current = readRunParams(model);
        const descriptor =
          sourceMode === LIGHT_EXTENSION_SOURCE_MODE
            ? await getJSPageLightExtensionSettingsDescriptor(model, { ...params, sourceMode, sourceBinding })
            : null;
        const normalized = normalizeLightExtensionSourceSettingsForBinding({
          currentRunJs: current,
          nextSourceMode: sourceMode,
          nextSourceBinding: sourceBinding,
          nextSettings: params.settings,
          descriptor,
        });
        setCanonicalLightExtensionSource(model, 'jsSettings', {
          sourceMode,
          sourceBinding,
          settings: normalized.settings,
        });
        rememberLightExtensionBindingSettings(model, descriptor, normalized.missingRequiredPaths);
      },
      async afterParamsSave(ctx) {
        await ctx.model.rerender();
        await showPendingLightExtensionRequiredSettings(ctx.model, 'jsSettings');
      },
    },
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: createLightExtensionRunJsUISchema({
        kind: 'js-page',
        scene: 'page',
        surfaceStyle: 'render',
        minHeight: 'calc(100vh - 42px)',
      }),
      uiMode: () => createRunJSEditorEmbedUIMode(),
      defaultParams: {
        version: 'v2',
        sourceMode: 'inline',
        settings: {},
        code: DEFAULT_JS_PAGE_CODE,
      },
      async afterParamsSave(ctx) {
        await ctx.model.rerender();
      },
    },
  },
});
