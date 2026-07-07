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
  tExpr,
  createSafeDocument,
  createSafeWindow,
  createSafeNavigator,
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
  RunJSSourceResolverRegistry,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
  type RunJSSourceSettingsDescriptor,
} from '../../../components/runjs-source';
import { JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD } from './JSBlockSourceModeField';

const NAMESPACE = 'client';
const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

type JSBlockSourceMode = typeof INLINE_SOURCE_MODE | typeof LIGHT_EXTENSION_SOURCE_MODE;
type JSBlockSourceModeParams = {
  sourceMode?: string;
};
type JSBlockLightExtensionSourceBinding = {
  repoId?: unknown;
  repoTitle?: unknown;
  entryId?: unknown;
  entryTitle?: unknown;
  entryName?: unknown;
};

type JSBlockRuntimeError = {
  title: string;
  hint: string;
  message: string;
  code?: string;
  status?: number;
};

type JSBlockRuntimeState = {
  loading: boolean;
  error: JSBlockRuntimeError | null;
  runId: number;
};

type JsonSchemaLike = Record<string, unknown>;

type SettingsValidationError = {
  label: string;
  message: string;
};

type RunJSExecutionResult = {
  success?: boolean;
  error?: unknown;
};

type ServerErrorShape = {
  code?: string;
  status?: number;
  message?: string;
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

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 8);
}

function sanitizeSettingFieldName(fieldName: string): string {
  const sanitized = fieldName
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (sanitized || 'field').slice(0, 48);
}

function getLightExtensionSettingStepKey(fieldName: string, schemaHash: string): string {
  return `leSetting__${sanitizeSettingFieldName(fieldName)}__${shortHash(`${fieldName}:${schemaHash}`)}`;
}

function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  const schemaType = schema.type;
  if (Array.isArray(schemaType)) {
    return schemaType.find((item): item is string => typeof item === 'string' && item !== 'null');
  }
  if (typeof schemaType === 'string') {
    return schemaType;
  }
  if (isRecord(schema.properties) || Array.isArray(schema.required)) {
    return 'object';
  }
  if (isRecord(schema.items)) {
    return 'array';
  }
  return undefined;
}

function getSettingsSchemaProperties(schema: unknown): Record<string, JsonSchemaLike> {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(schema.properties).filter(([, childSchema]) => isRecord(childSchema)),
  ) as Record<string, JsonSchemaLike>;
}

function getSettingsSchemaRequired(schema: unknown): Set<string> {
  if (!isRecord(schema) || !Array.isArray(schema.required)) {
    return new Set();
  }
  return new Set(schema.required.filter((item): item is string => typeof item === 'string'));
}

function getSchemaTitle(schema: JsonSchemaLike, fallback: string): string {
  return toNonEmptyString(schema.title) || fallback;
}

function getDescriptorSchemaHash(descriptor: RunJSSourceSettingsDescriptor): string {
  return toNonEmptyString(descriptor.schemaHash) || shortHash(stableSerialize(descriptor.schema || null));
}

function cloneRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? cloneJsonValue(value) : {};
}

function validateSettingValue(
  schema: JsonSchemaLike,
  value: unknown,
  required: boolean,
  label: string,
): SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];
  const type = normalizeSchemaType(schema);

  if (required && value === undefined) {
    errors.push({ label, message: 'Required' });
    return errors;
  }

  if (value === undefined) {
    return errors;
  }

  if (type === 'string' && typeof value !== 'string') {
    errors.push({ label, message: 'Must be a string' });
  }
  if ((type === 'number' || type === 'integer') && typeof value !== 'number') {
    errors.push({ label, message: 'Must be a number' });
  }
  if (type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
    errors.push({ label, message: 'Must be an integer' });
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    errors.push({ label, message: 'Must be a boolean' });
  }
  if (type === 'array' && !Array.isArray(value)) {
    errors.push({ label, message: 'Must be an array' });
  }
  if (type === 'object' && !isRecord(value)) {
    errors.push({ label, message: 'Must be an object' });
  }
  if (type === 'object' && isRecord(value)) {
    errors.push(...validateObjectSettingValue(schema, value, label));
  }

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null;
  if (enumValues && !enumValues.some((item) => stableSerialize(item) === stableSerialize(value))) {
    errors.push({ label, message: 'Must be one of the allowed values' });
  }

  if (typeof value === 'string') {
    const minLength = typeof schema.minLength === 'number' ? schema.minLength : undefined;
    const maxLength = typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
    if (typeof minLength === 'number' && value.length < minLength) {
      errors.push({ label, message: 'Too short' });
    }
    if (typeof maxLength === 'number' && value.length > maxLength) {
      errors.push({ label, message: 'Too long' });
    }
    if (!isValidSettingStringFormat(toNonEmptyString(schema.format), value)) {
      errors.push({ label, message: 'Must match the required format' });
    }
  }

  if (typeof value === 'number') {
    const minimum = typeof schema.minimum === 'number' ? schema.minimum : undefined;
    const maximum = typeof schema.maximum === 'number' ? schema.maximum : undefined;
    if (typeof minimum === 'number' && value < minimum) {
      errors.push({ label, message: 'Too small' });
    }
    if (typeof maximum === 'number' && value > maximum) {
      errors.push({ label, message: 'Too large' });
    }
  }

  if (Array.isArray(value) && isRecord(schema.items)) {
    value.forEach((item, index) => {
      const itemLabel = `${label}[${index}]`;
      if (normalizeSchemaType(schema.items as JsonSchemaLike) === 'object') {
        if (!isRecord(item)) {
          errors.push({ label: itemLabel, message: 'Must be an object' });
          return;
        }
        errors.push(...validateObjectSettingValue(schema.items as JsonSchemaLike, item, itemLabel));
        return;
      }
      errors.push(...validateSettingValue(schema.items as JsonSchemaLike, item, false, itemLabel));
    });
  }

  return errors;
}

function validateObjectSettingValue(
  schema: JsonSchemaLike,
  value: Record<string, unknown>,
  labelPrefix: string,
): SettingsValidationError[] {
  const properties = getSettingsSchemaProperties(schema);
  const requiredFields = getSettingsSchemaRequired(schema);
  return Object.entries(properties).flatMap(([childName, childSchema]) => {
    const childLabel = getSchemaTitle(childSchema, `${labelPrefix}.${childName}`);
    const childValue = Object.prototype.hasOwnProperty.call(value, childName) ? value[childName] : undefined;
    return validateSettingValue(childSchema, childValue, requiredFields.has(childName), childLabel);
  });
}

function isValidSettingStringFormat(format: string | undefined, value: string): boolean {
  if (!format) {
    return true;
  }
  if (format === 'date') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
  }
  if (format === 'date-time') {
    return !Number.isNaN(Date.parse(value));
  }
  if (format === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (format === 'time') {
    return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(value);
  }
  if (format === 'uri' || format === 'url') {
    try {
      const url = new URL(value);
      return Boolean(url.protocol && url.hostname);
    } catch {
      return false;
    }
  }
  return true;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getFirstServerError(value: unknown): ServerErrorShape | null {
  if (!isRecord(value)) {
    return null;
  }

  if (Array.isArray(value.errors)) {
    const first = value.errors.find((item) => isRecord(item));
    return isRecord(first) ? first : null;
  }

  return isRecord(value.error) ? value.error : null;
}

function getRuntimeErrorSource(error: unknown): ServerErrorShape {
  if (isRecord(error)) {
    const response = isRecord(error.response) ? error.response : null;
    const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
    if (serverError) {
      return {
        code: toNonEmptyString(serverError.code),
        status: toNumber(serverError.status) ?? toNumber(response?.status),
        message: toNonEmptyString(serverError.message),
      };
    }

    return {
      code: toNonEmptyString(error.code),
      status: toNumber(error.status) ?? toNumber(response?.status),
      message: toNonEmptyString(error.message),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: typeof error === 'string' ? error : undefined,
  };
}

function normalizeRuntimeError(error: unknown): JSBlockRuntimeError {
  const source = getRuntimeErrorSource(error);
  const code = source.code;
  const normalizedCode = code?.toLowerCase() || '';
  const status = source.status;

  let title = 'JavaScript block runtime error';
  let hint = 'Check the JavaScript block configuration and retry.';
  if (status === 403 || normalizedCode.includes('permission') || normalizedCode.includes('forbidden')) {
    title = 'Light extension access denied';
    hint = 'Ask an administrator for permission to use this light extension publication.';
  } else if (status === 404 || normalizedCode.includes('publication_not_found') || normalizedCode.includes('missing')) {
    title = 'Light extension publication missing';
    hint = 'Choose an available publication or publish this entry again.';
  } else if (normalizedCode.includes('binding_outdated') || normalizedCode.includes('outdated')) {
    title = 'Light extension binding is outdated';
    hint = 'Refresh the block settings and choose the current active publication.';
  } else if (normalizedCode.includes('settings_invalid')) {
    title = 'Light extension settings are invalid';
    hint = 'Open the block settings and fix the light extension settings.';
  } else if (normalizedCode.includes('repo_archived') || normalizedCode.includes('repository_archived')) {
    title = 'Light extension repository is archived';
    hint = 'Restore the repository or choose a publication from another repository.';
  }

  return {
    title,
    hint,
    message: source.message || 'Failed to run JavaScript block',
    ...(code ? { code } : {}),
    ...(typeof status === 'number' ? { status } : {}),
  };
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
  contentRef: React.RefObject<HTMLDivElement>;
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
            gap: 8,
            padding: 12,
          }}
        >
          <Spin size="small" />
          <span>{this.context.t('Resolving JavaScript source')}</span>
        </div>
      );
    }

    if (this.runtimeState.error) {
      const { title, hint, message, code, status } = this.runtimeState.error;
      const description = [
        this.context.t(hint),
        this.context.t(message),
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
    return <div ref={this.context.ref} />;
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
          contentRef={this.context.ref}
          marginBlock={this.context.themeToken?.marginBlock ?? 0}
        />
      );
    }

    const cardProps = {
      ...rest,
      height,
      style,
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
        <div ref={this.context.ref} />
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

async function getLightExtensionSettingsDescriptor(
  model: JSBlockModel,
  params: Record<string, unknown>,
): Promise<RunJSSourceSettingsDescriptor | null> {
  if (
    normalizeJSBlockSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE ||
    !isRecord(params.sourceBinding)
  ) {
    return null;
  }

  const resolver = RunJSSourceResolverRegistry.getResolver(LIGHT_EXTENSION_SOURCE_MODE);
  if (typeof resolver?.getSettingsDescriptor !== 'function') {
    return null;
  }

  const descriptor = await resolver.getSettingsDescriptor({
    sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
    sourceBinding: params.sourceBinding as RunJSSourceBinding,
    settings: isRecord(params.settings) ? (params.settings as RunJSSourceSettings) : undefined,
    context: {
      modelUid: model.uid,
    },
  });

  if (!descriptor || !isRecord(descriptor)) {
    return null;
  }

  return descriptor;
}

function getLightExtensionSettingDefaultValue(
  fieldName: string,
  fieldSchema: JsonSchemaLike,
  descriptorDefaults: Record<string, unknown>,
  legacySettings: Record<string, unknown>,
): unknown {
  if (Object.prototype.hasOwnProperty.call(legacySettings, fieldName)) {
    return cloneJsonValue(legacySettings[fieldName]);
  }
  if (Object.prototype.hasOwnProperty.call(descriptorDefaults, fieldName)) {
    return cloneJsonValue(descriptorDefaults[fieldName]);
  }
  if (Object.prototype.hasOwnProperty.call(fieldSchema, 'default')) {
    return cloneJsonValue(fieldSchema.default);
  }
  return undefined;
}

function createLightExtensionSettingStep(options: {
  fieldName: string;
  fieldSchema: JsonSchemaLike;
  required: boolean;
  schemaHash: string;
  defaultValue: unknown;
  sort: number;
}): [string, StepDefinition] {
  const { fieldName, fieldSchema, required, schemaHash, defaultValue, sort } = options;
  const stepKey = getLightExtensionSettingStepKey(fieldName, schemaHash);
  const title = getSchemaTitle(fieldSchema, fieldName);
  const fieldType = normalizeSchemaType(fieldSchema);

  return [
    stepKey,
    {
      key: stepKey,
      title,
      sort,
      uiSchema: {
        value: {
          type: fieldType || 'string',
          title,
          'x-decorator': 'FormItem',
          'x-component': JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
          'x-component-props': {
            fieldName,
            fieldSchema,
            required,
          },
        },
      },
      defaultParams() {
        return {
          value: cloneJsonValue(defaultValue),
        };
      },
      beforeParamsSave(ctx: FlowSettingsContext<JSBlockModel>, params: Record<string, unknown>) {
        const errors = validateSettingValue(fieldSchema, params?.value, required, title);
        if (errors.length === 0) {
          return;
        }
        ctx.model.context?.message?.error?.(ctx.model.context.t('Settings validation failed'));
        throw new FlowCancelSaveException('Light extension settings validation failed.');
      },
      afterParamsSave: refreshJSBlockAfterSettingsSave,
    },
  ];
}

async function getLightExtensionRuntimeSettingSteps(
  model: JSBlockModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getRunJsStepParams(model);
  const descriptor = await getLightExtensionSettingsDescriptor(model, params);
  if (!descriptor?.schema) {
    return undefined;
  }

  const properties = getSettingsSchemaProperties(descriptor.schema);
  if (Object.keys(properties).length === 0) {
    return undefined;
  }

  const requiredFields = getSettingsSchemaRequired(descriptor.schema);
  const schemaHash = getDescriptorSchemaHash(descriptor);
  const descriptorDefaults = cloneRecord(descriptor.defaults);
  const legacySettings = isRecord(params.settings) ? params.settings : {};

  return Object.fromEntries(
    Object.entries(properties).map(([fieldName, fieldSchema], index) =>
      createLightExtensionSettingStep({
        fieldName,
        fieldSchema,
        required: requiredFields.has(fieldName),
        schemaHash,
        defaultValue: getLightExtensionSettingDefaultValue(fieldName, fieldSchema, descriptorDefaults, legacySettings),
        sort: 700 + index,
      }),
    ),
  );
}

async function resolveLightExtensionRuntimeSettings(
  model: JSBlockModel,
  params: Record<string, unknown>,
): Promise<RunJSSourceSettings> {
  const legacySettings = isRecord(params.settings) ? params.settings : {};
  if (normalizeJSBlockSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE) {
    return cloneRecord(legacySettings);
  }

  const descriptor = await getLightExtensionSettingsDescriptor(model, params);
  if (!descriptor?.schema) {
    return cloneRecord(legacySettings);
  }

  const properties = getSettingsSchemaProperties(descriptor.schema);
  const schemaHash = getDescriptorSchemaHash(descriptor);
  const resolvedSettings: Record<string, unknown> = {
    ...cloneRecord(descriptor.defaults),
    ...cloneRecord(legacySettings),
  };

  for (const fieldName of Object.keys(properties)) {
    const stepKey = getLightExtensionSettingStepKey(fieldName, schemaHash);
    const paramsForStep = model.getStepParams('jsSettings', stepKey);
    if (isRecord(paramsForStep) && Object.prototype.hasOwnProperty.call(paramsForStep, 'value')) {
      resolvedSettings[fieldName] = cloneJsonValue(paramsForStep.value);
    }
  }

  return resolvedSettings;
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
  if (!isRecord(params.sourceBinding)) {
    return undefined;
  }

  const resolver = RunJSSourceResolverRegistry.getResolver(LIGHT_EXTENSION_SOURCE_MODE);
  if (typeof resolver?.getBindingTitle !== 'function') {
    return undefined;
  }

  try {
    const title = await resolver.getBindingTitle({
      sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
      sourceBinding: params.sourceBinding as RunJSSourceBinding,
      settings: isRecord(params.settings) ? (params.settings as RunJSSourceSettings) : undefined,
      context: {
        modelUid: ctx.model.uid,
      },
    });
    return toNonEmptyString(title);
  } catch (error) {
    console.warn('[NocoBase] Failed to resolve RunJS source binding title:', error);
    return undefined;
  }
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
  return {
    sourceMode: normalizeJSBlockSourceMode(getRunJsStepParams(ctx.model).sourceMode),
  };
}

function syncSourceModeToRunJs(ctx: FlowSettingsContext<JSBlockModel>, params: JSBlockSourceModeParams) {
  const sourceMode = normalizeJSBlockSourceMode(params?.sourceMode);
  ctx.model.setStepParams('jsSettings', 'runJs', {
    ...getRunJsStepParams(ctx.model),
    sourceMode,
  });
}

async function refreshJSBlockAfterSettingsSave(ctx: FlowSettingsContext<JSBlockModel>) {
  ctx.model.invalidateFlowCache('beforeRender', true);
  await ctx.model.rerender();
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
      uiMode: {
        type: 'select',
        key: 'sourceMode',
        props: {
          options: [
            { label: 'Light extension', value: LIGHT_EXTENSION_SOURCE_MODE },
            { label: 'Inline Code', value: INLINE_SOURCE_MODE },
          ],
        },
      },
      defaultParams: getSourceModeDefaultParams,
      beforeParamsSave: syncSourceModeToRunJs,
      afterParamsSave: refreshJSBlockAfterSettingsSave,
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
            surfaceStyle: 'render',
            scene: 'block',
            minHeight: 'calc(100vh - 42px)',
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
      uiMode: async (ctx: FlowRuntimeContext<JSBlockModel>) => ({
        type: 'embed',
        props: {
          title: await getRunJsEditorTitle(ctx),
          footer: null,
          maxWidth: '960px',
          minWidth: '720px',
          width: '45%',
          styles: {
            body: {
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              transform: 'translateX(0)',
            },
          },
        },
      }),
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
            element.innerHTML = '';
            ctx.defineProperty('element', {
              get: () => new ElementProxy(element),
              info: {
                deprecated: {
                  replacedBy: 'ctx.render',
                },
              },
            });
            const runtimeSettings = await resolveLightExtensionRuntimeSettings(model, params || {});
            const resolved = await resolveRuntimeRunJS({
              runJs: inlineRunJs,
              sourceMode: params?.sourceMode,
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

            const navigator = createSafeNavigator();
            const result = (await ctx.runjs(
              resolved.code,
              { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
              { version: resolved.version },
            )) as RunJSExecutionResult;

            if (result?.success === false) {
              throw result.error || new Error('RunJS execution failed');
            }

            model.finishRuntimeRun(runId);
          };

          run().catch((error) => {
            if (model.isCurrentRuntimeRun(runId)) {
              element.innerHTML = '';
            }
            model.failRuntimeRun(runId, error);
          });
        });
      },
    },
  },
});
