/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { Alert, Spin } from 'antd';
import {
  ElementProxy,
  FlowCancelSaveException,
  resetRunJSRuntimeElement,
  tExpr,
  type FlowRuntimeContext,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';
import React from 'react';
import { BlockModel } from '../../base';
import { BlockItemCard } from '../../../components';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';
import { RunJSEditorField } from '../../../components/runjs-studio';
import {
  resolveRuntimeRunJS,
  createRunJSSourceCascadeMenuUIMode,
  shouldHideRunJSSourceMenu,
  type RunJSSourceSettings,
} from '../../../components/runjs-source';
import { JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD } from './JSBlockSourceModeField';
import {
  createRunJSEditorEmbedUIMode,
  createLightExtensionSettingSteps,
  getLightExtensionSettingsDescriptor as getSharedLightExtensionSettingsDescriptor,
  normalizeLightExtensionSourceSettingsForBinding,
  normalizeLightExtensionRuntimeError,
  rememberLightExtensionBindingSettings,
  resolveEffectiveRunJSSettings,
  resolveLightExtensionBindingTitle as resolveSharedLightExtensionBindingTitle,
  setCanonicalLightExtensionSetting,
  setCanonicalLightExtensionSource,
  showPendingLightExtensionRequiredSettings,
  type RuntimeErrorInfo,
} from '../../utils/runjsSourceRuntimeCommon';

const NAMESPACE = 'client';
const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

type JSBlockSourceMode = typeof INLINE_SOURCE_MODE | typeof LIGHT_EXTENSION_SOURCE_MODE;
type JSBlockSourceModeParams = {
  sourceMode?: string;
  sourceBinding?: unknown;
  settings?: unknown;
};
type JSBlockLightExtensionSourceBinding = {
  repoId?: unknown;
  repoTitle?: unknown;
  entryId?: unknown;
  entryTitle?: unknown;
  entryName?: unknown;
};

type JSBlockRuntimeError = RuntimeErrorInfo;

type JSBlockRuntimeState = {
  loading: boolean;
  error: JSBlockRuntimeError | null;
  runId: number;
};

type RunJSExecutionResult = {
  success?: boolean;
  error?: unknown;
};

const getRootElement = (element: HTMLElement | null) => {
  if (!element) return document.documentElement;
  return (
    (element.closest('.nb-block-grid') as HTMLElement | null) ||
    (element.closest('.nb-page-wrapper') as HTMLElement | null) ||
    (element.closest('.nb-page') as HTMLElement | null) ||
    document.documentElement
  );
};

const getOuterHeight = (element?: HTMLElement | null) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
};

const getPadding = (element: HTMLElement | null) => {
  if (!element || element === document.documentElement) {
    return { top: 0, bottom: 0 };
  }
  const style = window.getComputedStyle(element);
  return {
    top: parseFloat(style.paddingTop) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
  };
};

const getPageHeader = (root: HTMLElement) => {
  const page = root.closest('.nb-page') as HTMLElement | null;
  if (!page) return null;
  return (
    (page.querySelector('.ant-page-header') as HTMLElement | null) ||
    (page.querySelector('.pageHeaderCss') as HTMLElement | null)
  );
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeRuntimeError(error: unknown): JSBlockRuntimeError {
  return normalizeLightExtensionRuntimeError(error, {
    defaultTitle: 'JavaScript block runtime error',
    defaultHint: 'Check the JavaScript block configuration and retry.',
    defaultMessage: 'Failed to run JavaScript block',
    outdatedHint: 'Refresh the block settings and choose the current entry.',
    invalidSettingsHint: 'Open the block settings and fix the light extension settings.',
  });
}

const getAddBlockContainer = (root: HTMLElement) => {
  const button = root.querySelector('[data-flow-add-block]') as HTMLElement | null;
  if (!button) return null;
  return (button.parentElement as HTMLElement | null) || button;
};

function getValidPageTop(a: number, b: number) {
  const aValid = a > 0;
  const bValid = b > 0;

  if (aValid) return a;
  if (bValid) return b;
  return 0;
}

const usePlainHostHeight = ({
  height,
  heightMode,
  hostRef,
  marginBlock,
}: {
  height?: number;
  heightMode?: string;
  hostRef: React.RefObject<HTMLDivElement>;
  marginBlock: number;
}) => {
  const [fullHeight, setFullHeight] = React.useState<number>();
  const updateFullHeight = React.useCallback(() => {
    if (heightMode !== 'fullHeight' || typeof window === 'undefined') {
      setFullHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const root = getRootElement(hostEl);
    const hostRect = hostEl.getBoundingClientRect();
    const rootRect = root === document.documentElement ? { top: 0 } : root.getBoundingClientRect();
    const padding = getPadding(root);
    const addBlockContainer = getAddBlockContainer(root);
    const pageTop = rootRect.top + padding.top;
    const topOffset = Math.max(0, hostRect.top - pageTop);
    let bottomOffset = padding.bottom + marginBlock;
    if (addBlockContainer) {
      const gapBetween = marginBlock;
      bottomOffset = gapBetween + getOuterHeight(addBlockContainer) + padding.bottom;
    }
    const nextHeight = Math.max(
      0,
      Math.floor(window.innerHeight - getValidPageTop(pageTop, 110) - topOffset - bottomOffset - 1),
    );
    setFullHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, hostRef, marginBlock]);

  React.useLayoutEffect(() => {
    updateFullHeight();
  }, [updateFullHeight]);

  React.useEffect(() => {
    if (heightMode !== 'fullHeight' || typeof window === 'undefined') return;
    const hostEl = hostRef.current;
    if (!hostEl || typeof ResizeObserver === 'undefined') return;
    const root = getRootElement(hostEl);
    const pageHeader = getPageHeader(root);
    const addBlockContainer = getAddBlockContainer(root);
    const observer = new ResizeObserver(() => updateFullHeight());
    observer.observe(hostEl);
    if (root instanceof HTMLElement) {
      observer.observe(root);
    }
    if (pageHeader) observer.observe(pageHeader);
    if (addBlockContainer) observer.observe(addBlockContainer);
    window.addEventListener('resize', updateFullHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFullHeight);
    };
  }, [heightMode, hostRef, updateFullHeight]);

  if (heightMode === 'specifyValue') {
    return height;
  }
  if (heightMode === 'fullHeight') {
    return fullHeight;
  }
  return null;
};

const JSBlockPlainHost = ({
  uid,
  className,
  heightMode,
  height,
  style,
  beforeContent,
  afterContent,
  contentRef,
  marginBlock,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  uid: string;
  heightMode?: string;
  height?: number;
  beforeContent?: React.ReactNode;
  afterContent?: React.ReactNode;
  contentRef: React.Ref<HTMLDivElement>;
  marginBlock: number;
}) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const resolvedHeight = usePlainHostHeight({ height, heightMode, hostRef, marginBlock });

  return (
    <div
      {...rest}
      ref={hostRef}
      id={`model-${uid}`}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: resolvedHeight ?? undefined,
        minHeight: 0,
        overflow: 'auto',
        ...(style || {}),
      }}
    >
      {beforeContent}
      <div ref={contentRef} />
      {afterContent}
    </div>
  );
};

export class JSBlockModel extends BlockModel {
  // Avoid double-run on first mount; only rerun after remounts
  private _mountedOnce = false;
  private _runtimeElement: HTMLDivElement | null = null;
  private readonly runtimeElementRef = (element: HTMLDivElement | null) => {
    (this.context.ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
    if (element) {
      this._runtimeElement = element;
      return;
    }
    const previousElement = this._runtimeElement;
    this._runtimeElement = null;
    if (previousElement) {
      queueMicrotask(() => {
        if (this._runtimeElement !== previousElement) {
          resetRunJSRuntimeElement(previousElement);
        }
      });
    }
  };
  readonly runtimeState: JSBlockRuntimeState = observable({
    loading: false,
    error: null,
    runId: 0,
  });

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'jsSettings') {
      return undefined;
    }

    return getLightExtensionRuntimeSettingSteps(this);
  }

  get showBlockCard() {
    return this.getStepParams('jsSettings', 'showBlockCard')?.showBlockCard !== false;
  }

  beginRuntimeRun() {
    const runId = this.runtimeState.runId + 1;
    this.runtimeState.runId = runId;
    this.runtimeState.loading = true;
    this.runtimeState.error = null;
    return runId;
  }

  isCurrentRuntimeRun(runId: number) {
    return this.runtimeState.runId === runId;
  }

  finishRuntimeRun(runId: number) {
    if (!this.isCurrentRuntimeRun(runId)) {
      return;
    }
    this.runtimeState.loading = false;
    this.runtimeState.error = null;
  }

  failRuntimeRun(runId: number, error: unknown) {
    if (!this.isCurrentRuntimeRun(runId)) {
      return;
    }
    this.runtimeState.loading = false;
    this.runtimeState.error = normalizeRuntimeError(error);
  }

  private renderRuntimeShell(): React.ReactNode {
    if (this.runtimeState.loading) {
      return (
        <div
          data-testid="js-block-runtime-loading"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
        >
          <Spin size="small" aria-label={this.context.t('Resolving JavaScript source')} />
        </div>
      );
    }

    if (this.runtimeState.error) {
      const { title, hint, message, code, status, paths } = this.runtimeState.error;
      const description = [
        this.context.t(hint),
        this.context.t(message),
        paths?.length ? `${this.context.t('Fields')}: ${paths.join(', ')}` : null,
        code ? `${this.context.t('Code')}: ${code}` : null,
        status ? `${this.context.t('Status')}: ${status}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      return (
        <Alert
          data-testid="js-block-runtime-error"
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={this.context.t(title)}
          description={description}
        />
      );
    }

    return null;
  }

  private mergeBeforeContent(beforeContent: React.ReactNode) {
    const runtimeShell = this.renderRuntimeShell();
    if (!runtimeShell) {
      return beforeContent;
    }
    return (
      <>
        {runtimeShell}
        {beforeContent}
      </>
    );
  }

  renderComponent(): React.ReactNode {
    return <div ref={this.runtimeElementRef} />;
  }
  render() {
    const decoratorProps = this.decoratorProps || {};
    const {
      className,
      id: _ignoredId,
      title,
      description,
      showCard: _ignoredShowCard,
      heightMode,
      height,
      style,
      beforeContent,
      afterContent,
      ...rest
    } = decoratorProps;
    const mergedClassName = ['code-block', className].filter(Boolean).join(' ');

    if (!this.showBlockCard) {
      return (
        <JSBlockPlainHost
          {...rest}
          uid={this.uid}
          className={mergedClassName}
          heightMode={heightMode}
          height={height}
          style={style}
          beforeContent={this.mergeBeforeContent(beforeContent)}
          afterContent={afterContent}
          contentRef={this.runtimeElementRef}
          marginBlock={this.context.themeToken?.marginBlock ?? 0}
        />
      );
    }

    const cardProps = {
      ...rest,
      height,
      ...(style === undefined ? {} : { style }),
      ...(beforeContent === undefined ? {} : { beforeContent }),
      ...(afterContent === undefined ? {} : { afterContent }),
    };

    return (
      <BlockItemCard
        id={`model-${this.uid}`}
        className={mergedClassName}
        title={title}
        description={description}
        heightMode={heightMode}
        {...cardProps}
      >
        {this.renderRuntimeShell()}
        <div ref={this.runtimeElementRef} />
      </BlockItemCard>
    );
  }
  protected onMount() {
    // Rerun only when remounting (e.g., after being hidden/unmounted)
    if (this._mountedOnce) {
      if (this.context.ref.current) {
        this.rerender();
      }
    }
    this._mountedOnce = true;
  }
}

function normalizeJSBlockSourceMode(value: unknown): JSBlockSourceMode {
  return value === LIGHT_EXTENSION_SOURCE_MODE ? LIGHT_EXTENSION_SOURCE_MODE : INLINE_SOURCE_MODE;
}

function getRunJsStepParams(model: JSBlockModel): Record<string, unknown> {
  const params = model.getStepParams('jsSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

async function getLightExtensionSettingsDescriptor(model: JSBlockModel, params: Record<string, unknown>) {
  return getSharedLightExtensionSettingsDescriptor({
    modelUid: model.uid,
    ownerKind: 'flowModel.blockSettings',
    ownerLocator: { modelUid: model.uid },
    params,
    sourceLocator: {
      kind: 'flowModel.step',
      modelUid: model.uid,
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    },
  });
}

async function getLightExtensionRuntimeSettingSteps(
  model: JSBlockModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getRunJsStepParams(model);
  const descriptor = await getLightExtensionSettingsDescriptor(model, params);
  if (!descriptor) {
    return undefined;
  }
  return createLightExtensionSettingSteps<JSBlockModel>({
    descriptor,
    settings: isRecord(params.settings) ? params.settings : {},
    component: JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    syncValue: (ctx, fieldName, value) => setCanonicalLightExtensionSetting(ctx.model, 'jsSettings', fieldName, value),
    afterParamsSave: refreshJSBlockAfterSettingsSave,
  });
}

function resolveLightExtensionRuntimeSettings(params: Record<string, unknown>): RunJSSourceSettings {
  return isRecord(params.settings) ? cloneJsonValue(params.settings) : {};
}

function getLightExtensionStoredBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }

  const sourceBinding = binding as JSBlockLightExtensionSourceBinding;
  return (
    toNonEmptyString(sourceBinding.entryTitle) ||
    toNonEmptyString(sourceBinding.entryName) ||
    toNonEmptyString(sourceBinding.repoTitle)
  );
}

function getLightExtensionFallbackBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }

  const sourceBinding = binding as JSBlockLightExtensionSourceBinding;
  return toNonEmptyString(sourceBinding.entryId) || toNonEmptyString(sourceBinding.repoId);
}

async function resolveLightExtensionBindingTitle(ctx: { model: JSBlockModel }, params: Record<string, unknown>) {
  return resolveSharedLightExtensionBindingTitle({
    modelUid: ctx.model.uid,
    ownerKind: 'flowModel.blockSettings',
    ownerLocator: { modelUid: ctx.model.uid },
    params,
  });
}

async function getRunJsEditorTitle(ctx: { model: JSBlockModel }): Promise<string> {
  const t = ctx.model.context.t.bind(ctx.model.context);
  const params = getRunJsStepParams(ctx.model);
  const baseTitle = t('Write JavaScript');
  if (normalizeJSBlockSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE) {
    return baseTitle;
  }

  const sourceTitle =
    getLightExtensionStoredBindingTitle(params.sourceBinding) ||
    (await resolveLightExtensionBindingTitle(ctx, params)) ||
    getLightExtensionFallbackBindingTitle(params.sourceBinding);
  return sourceTitle
    ? `${baseTitle} (${t('Light extension')}: ${sourceTitle})`
    : `${baseTitle} (${t('Light extension')})`;
}

function getSourceModeDefaultParams(ctx: FlowSettingsContext<JSBlockModel>): JSBlockSourceModeParams {
  const runJs = getRunJsStepParams(ctx.model);
  return {
    sourceMode: normalizeJSBlockSourceMode(runJs.sourceMode),
    sourceBinding: isRecord(runJs.sourceBinding) ? cloneJsonValue(runJs.sourceBinding) : undefined,
    settings: isRecord(runJs.settings) ? cloneJsonValue(runJs.settings) : {},
  };
}

async function syncSourceModeToRunJs(ctx: FlowSettingsContext<JSBlockModel>, params: JSBlockSourceModeParams) {
  const sourceMode = normalizeJSBlockSourceMode(params?.sourceMode);
  const sourceBinding = isRecord(params?.sourceBinding) ? cloneJsonValue(params.sourceBinding) : undefined;
  if (sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !sourceBinding) {
    ctx.model.context?.message?.error?.(ctx.model.context.t('Select a light extension entry'));
    throw new FlowCancelSaveException('Light extension source binding is required.');
  }
  const currentRunJs = getRunJsStepParams(ctx.model);
  const descriptor =
    sourceMode === LIGHT_EXTENSION_SOURCE_MODE
      ? await getLightExtensionSettingsDescriptor(ctx.model, { ...params, sourceMode, sourceBinding })
      : null;
  const normalized = normalizeLightExtensionSourceSettingsForBinding({
    currentRunJs,
    nextSourceMode: sourceMode,
    nextSourceBinding: sourceBinding,
    nextSettings: params.settings,
    descriptor,
  });
  setCanonicalLightExtensionSource(ctx.model, 'jsSettings', {
    sourceMode,
    sourceBinding,
    settings: normalized.settings,
  });
  rememberLightExtensionBindingSettings(ctx.model, descriptor, normalized.missingRequiredPaths);
}

async function refreshJSBlockAfterSettingsSave(ctx: FlowSettingsContext<JSBlockModel>) {
  ctx.model.invalidateFlowCache('beforeRender', true);
  await ctx.model.rerender();
}

async function refreshJSBlockAfterSourceSave(ctx: FlowSettingsContext<JSBlockModel>) {
  await refreshJSBlockAfterSettingsSave(ctx);
  await showPendingLightExtensionRequiredSettings(ctx.model, 'jsSettings');
}

JSBlockModel.define({
  label: tExpr('JS block'),
  createModelOptions: {
    use: 'JSBlockModel',
  },
});

JSBlockModel.registerFlow({
  key: 'jsSettings',
  title: 'JavaScript settings',
  steps: {
    showBlockCard: {
      title: tExpr('Show block card'),
      uiMode: { type: 'switch', key: 'showBlockCard' },
      defaultParams: {
        showBlockCard: true,
      },
    },
    sourceMode: {
      title: tExpr('Code source'),
      hideInSettings: shouldHideRunJSSourceMenu,
      persistParams: false,
      uiMode: createRunJSSourceCascadeMenuUIMode({
        kind: 'js-block',
      }),
      useRawParams: true,
      defaultParams: getSourceModeDefaultParams,
      beforeParamsSave: syncSourceModeToRunJs,
      afterParamsSave: refreshJSBlockAfterSourceSave,
    },
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: {
        sourceMode: {
          type: 'string',
          'x-display': 'hidden',
        },
        sourceBinding: {
          type: 'object',
          'x-display': 'hidden',
        },
        settings: {
          type: 'object',
          'x-display': 'hidden',
        },
        code: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': RunJSEditorField,
          'x-component-props': {
            locatorFactory: 'flowModel.step',
            sourceMetadata: {
              lightExtensionKind: 'js-block',
            },
            surfaceStyle: 'render',
            scene: 'block',
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            containerStyle: {
              height: '100%',
              minHeight: 0,
              minWidth: 0,
            },
          },
        },
      },
      uiMode: async (ctx: FlowRuntimeContext<JSBlockModel>) =>
        createRunJSEditorEmbedUIMode(await getRunJsEditorTitle(ctx)),
      defaultParams(ctx) {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code:
            `// Welcome to the JS block
// Create powerful interactive components with JavaScript
ctx.render(\`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 \${ctx.i18n.t('Welcome to JS block', { ns: '` +
            NAMESPACE +
            `' })}
    </h2>

    <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
      \${ctx.i18n.t('Build interactive components with JavaScript and external libraries', { ns: '` +
            NAMESPACE +
            `' })}
    </p>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">✨ \${ctx.i18n.t('Key Features', { ns: '` +
            NAMESPACE +
            `' })}</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">🎨 <strong>\${ctx.i18n.t('Custom JavaScript execution', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Full programming capabilities', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">📚 <strong>\${ctx.i18n.t('External library support', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Load any npm package or CDN library', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">🔗 <strong>\${ctx.i18n.t('NocoBase API integration', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Access your data and collections', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">💡 <strong>\${ctx.i18n.t('Async/await support', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Handle asynchronous operations', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">🎯 <strong>\${ctx.i18n.t('Direct DOM manipulation', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Full control over rendering', { ns: '` +
            NAMESPACE +
            `' })}</li>
      </ul>
    </div>

    <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        💡 <strong>\${ctx.i18n.t('Ready to start?', { ns: '` +
            NAMESPACE +
            `' })}</strong> \${ctx.i18n.t('Replace this code with your custom JavaScript to build amazing components!', { ns: '` +
            NAMESPACE +
            `' })}
      </p>
    </div>
  </div>
\`);`.trim(),
        };
      },
      async handler(ctx, params) {
        const model = ctx.model as JSBlockModel;
        const runId = model.beginRuntimeRun();
        const inlineRunJs = resolveRunJsParams(ctx, params);

        ctx.onRefReady(ctx.ref, (element) => {
          const run = async () => {
            if (!model.isCurrentRuntimeRun(runId)) {
              return;
            }
            resetRunJSRuntimeElement(element);
            ctx.defineProperty('element', {
              get: () => new ElementProxy(element),
              info: {
                deprecated: {
                  replacedBy: 'ctx.render',
                },
              },
            });
            const storedSettings = resolveLightExtensionRuntimeSettings(params || {});
            const sourceMode = normalizeJSBlockSourceMode(params?.sourceMode);
            const descriptor =
              sourceMode === INLINE_SOURCE_MODE ? await getLightExtensionSettingsDescriptor(model, params || {}) : null;
            const runtimeSettings = descriptor
              ? resolveEffectiveRunJSSettings(descriptor, storedSettings)
              : storedSettings;
            const resolved = await resolveRuntimeRunJS({
              runJs: inlineRunJs,
              sourceMode,
              sourceBinding: params?.sourceBinding,
              settings: runtimeSettings,
              context: {
                modelUid: ctx.model.uid,
              },
            });

            if (!model.isCurrentRuntimeRun(runId)) {
              return;
            }

            ctx.defineProperty('settings', {
              value: resolved.settings,
            });
            ctx.defineProperty('runJsSource', {
              value: {
                sourceMode: resolved.sourceMode,
                sourceBinding: resolved.sourceBinding,
                sourceMap: resolved.sourceMap,
                context: resolved.context,
              },
            });

            const result = (await ctx.runjs(resolved.code, undefined, {
              version: resolved.version,
            })) as RunJSExecutionResult;

            if (result?.success === false) {
              throw result.error || new Error('RunJS execution failed');
            }

            model.finishRuntimeRun(runId);
          };

          run().catch((error) => {
            if (model.isCurrentRuntimeRun(runId)) {
              resetRunJSRuntimeElement(element);
            }
            model.failRuntimeRun(runId, error);
          });
        });
      },
    },
  },
});
