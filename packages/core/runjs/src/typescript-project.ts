/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CompilerOptions } from 'typescript';

type TypeScriptModule = typeof import('typescript');

export const RUNJS_TYPESCRIPT_CONTEXT_PATH = '/__runjs__/runjs-env.d.ts';

export function createRunJSTypeScriptCompilerOptions(ts: TypeScriptModule): CompilerOptions {
  return {
    allowJs: true,
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    allowUmdGlobalAccess: false,
    checkJs: false,
    esModuleInterop: true,
    jsx: ts.JsxEmit.React,
    jsxFactory: 'ctx.React.createElement',
    jsxFragmentFactory: 'ctx.React.Fragment',
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    noLib: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
}

const runJSEnvDeclaration = `
interface RunJSLogger {
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  child(bindings: Record<string, unknown>): RunJSLogger;
}
interface RunJSUnknownObject {
  [key: string]: unknown;
}
interface RunJSRecord extends RunJSUnknownObject {
  id?: string | number;
}
interface RunJSCollection extends RunJSUnknownObject {
  name?: string;
  dataSourceKey?: string;
}
interface RunJSCollectionField extends RunJSUnknownObject {
  name?: string;
  type?: string;
  interface?: string;
}
interface RunJSRef<T> {
  readonly current: T | null;
}
interface RunJSModel extends RunJSUnknownObject {
  readonly uid: string;
  readonly use?: string;
  readonly props?: RunJSUnknownObject;
}
interface RunJSForm extends RunJSUnknownObject {
  getFieldValue(name: string | Array<string | number>): unknown;
  getFieldsValue(): Record<string, unknown>;
  setFieldValue(name: string | Array<string | number>, value: unknown): void;
  setFieldsValue(values: Record<string, unknown>): void;
}
interface RunJSI18n {
  readonly language?: string;
  t(key: string, options?: Record<string, unknown>): string;
  exists(key: string, options?: Record<string, unknown>): boolean;
}
interface RunJSMessage {
  info(content: unknown, duration?: number): void;
  success(content: unknown, duration?: number): void;
  error(content: unknown, duration?: number): void;
  warning(content: unknown, duration?: number): void;
  loading(content: unknown, duration?: number): void;
  open(config: Record<string, unknown>): void;
  destroy(key?: string): void;
}
interface RunJSNotification {
  open(config: Record<string, unknown>): void;
  success(config: Record<string, unknown>): void;
  info(config: Record<string, unknown>): void;
  warning(config: Record<string, unknown>): void;
  error(config: Record<string, unknown>): void;
  destroy(key?: string): void;
}
interface RunJSModal {
  info(config: Record<string, unknown>): unknown;
  success(config: Record<string, unknown>): unknown;
  error(config: Record<string, unknown>): unknown;
  warning(config: Record<string, unknown>): unknown;
  confirm(config: Record<string, unknown>): unknown;
}
interface RunJSResource extends RunJSUnknownObject {
  readonly selectedRows?: RunJSRecord[];
  readonly pagination?: RunJSUnknownObject;
  getData?(): unknown;
  setData?(value: unknown): RunJSResource;
  getSelectedRows?(): RunJSRecord[];
  setResourceName?(resourceName: string): RunJSResource;
  setFilterByTk?(filterByTk: unknown): RunJSResource;
  runAction?(action: string, options?: Record<string, unknown>): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  off?(event: string, callback: (...args: unknown[]) => void): void;
  refresh?: () => Promise<unknown>;
}
interface RunJSApi {
  readonly auth?: {
    readonly locale?: string;
    readonly role?: string;
    readonly token?: string;
  };
  request<T = unknown>(options: Record<string, unknown>): Promise<T>;
  resource(name: string): RunJSResource;
}
interface RunJSAuth {
  readonly roleName?: string;
  readonly locale?: string;
  readonly token?: string;
  readonly user?: RunJSRecord;
}
interface RunJSViewer {
  dialog(props: Record<string, unknown>): unknown;
  drawer(props: Record<string, unknown>): unknown;
  popover(props: Record<string, unknown>): unknown;
  embed(props: Record<string, unknown>): unknown;
}
interface RunJSPopup extends RunJSUnknownObject {
  readonly uid?: string;
  readonly record?: RunJSRecord;
  readonly sourceRecord?: RunJSRecord;
  readonly parent?: RunJSPopup;
  readonly resource?: RunJSUnknownObject;
}
interface RunJSSQL {
  run(sql: string, options?: Record<string, unknown>): Promise<unknown>;
  save(data: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;
  runById(uid: string, options?: Record<string, unknown>): Promise<unknown>;
  destroy(uid: string): Promise<void>;
}
interface RunJSURLSearchParams {
  readonly [name: string]: string | string[] | undefined;
}
interface RunJSPermissiveLibrary {
  [name: string]: any;
  (...args: any[]): any;
  new (...args: any[]): any;
}
type RunJSSetStateAction<S> = S | ((previousState: S) => S);
type RunJSStateDispatch<S> = (value: RunJSSetStateAction<S>) => void;
interface RunJSReactLibrary extends RunJSPermissiveLibrary {
  useState<S>(initialState: S | (() => S)): [S, RunJSStateDispatch<S>];
  useState<S = undefined>(): [S | undefined, RunJSStateDispatch<S | undefined>];
  useCallback<T extends (...args: never[]) => unknown>(callback: T, dependencies: readonly unknown[]): T;
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  useRef<T>(initialValue: T): { current: T };
}
interface RunJSReactDOMLibrary extends RunJSPermissiveLibrary {}
interface RunJSDayjsLibrary extends RunJSPermissiveLibrary {}
interface RunJSLodashLibrary extends RunJSPermissiveLibrary {}
interface RunJSMathLibrary extends RunJSPermissiveLibrary {}
interface RunJSFormulaLibrary extends RunJSPermissiveLibrary {}
interface RunJSAntdLibrary extends RunJSPermissiveLibrary {}
interface RunJSAntd extends RunJSAntdLibrary {}
interface RunJSAntdIconsLibrary extends RunJSPermissiveLibrary {}
interface RunJSAntdIcons extends RunJSAntdIconsLibrary {}
interface RunJSLibraries {
  React: RunJSReactLibrary;
  ReactDOM: RunJSReactDOMLibrary;
  antd: RunJSAntd;
  antdIcons: RunJSAntdIcons;
  dayjs: RunJSDayjsLibrary;
  lodash: RunJSLodashLibrary;
  math: RunJSMathLibrary;
  formula: RunJSFormulaLibrary;
  [libraryName: string]: unknown;
}
interface RunJSSourceInfo {
  readonly sourceMode: string;
  readonly sourceBinding?: RunJSUnknownObject;
  readonly sourceMap?: string;
  readonly context?: RunJSUnknownObject;
}
interface RunJSPageFacade {
  readonly uid: string;
  readonly active: boolean;
  refresh(): Promise<void>;
  setDocumentTitle(title: string): void;
}
interface RunJSExecutionResult<T = unknown> {
  readonly success: boolean;
  readonly value?: T;
  readonly error?: unknown;
  readonly timeout?: boolean;
}
interface RunJSSafeElement extends RunJSUnknownObject {
  readonly __el: unknown;
  addEventListener(type: string, listener: (event: RunJSUnknownObject) => void): void;
  removeEventListener(type: string, listener: (event: RunJSUnknownObject) => void): void;
}
interface PointerEvent {
  readonly clientX: number;
  readonly clientY: number;
  preventDefault(): void;
  stopPropagation(): void;
}
declare namespace JSX {
  interface IntrinsicAttributes {
    key?: string | number;
  }
}
interface RunJSContext {
  logger: RunJSLogger;
  api: RunJSApi;
  React: RunJSReactLibrary;
  ReactDOM: RunJSReactDOMLibrary;
  antd: RunJSAntd;
  dayjs: RunJSDayjsLibrary;
  i18n: RunJSI18n;
  message: RunJSMessage;
  notification: RunJSNotification;
  modal: RunJSModal;
  viewer: RunJSViewer;
  popup?: RunJSPopup;
  resource?: RunJSResource;
  sql: RunJSSQL;
  auth?: RunJSAuth;
  role?: string | string[];
  token?: string;
  urlSearchParams?: RunJSURLSearchParams;
  libs: RunJSLibraries;
  locale?: string;
  user?: RunJSRecord;
  themeToken?: RunJSUnknownObject;
  ref: RunJSRef<RunJSSafeElement>;
  model: RunJSModel;
  render(value: unknown, container?: RunJSSafeElement): void;
  onRefReady(ref: RunJSRef<RunJSSafeElement>, callback: (element: RunJSSafeElement) => void, timeout?: number): void;
  getVar<T = unknown>(path: string): Promise<T>;
  getVarInfos(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  getApiInfos(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  getEnvInfos(): Promise<Record<string, unknown>>;
  getModel(uid: string, searchInPreviousEngines?: boolean): RunJSUnknownObject | undefined;
  request<T = unknown>(options: Record<string, unknown>): Promise<T>;
  runjs<T = unknown>(
    code: string,
    variables?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<RunJSExecutionResult<T>>;
  loadCSS(href: string): Promise<void>;
  openView(uid: string, options?: Record<string, unknown>): Promise<unknown>;
  requireAsync(url: string): Promise<unknown>;
  importAsync(url: string): Promise<unknown>;
  makeResource(type: unknown): RunJSResource;
  createResource(type: unknown): RunJSResource;
  initResource(type: string): RunJSResource;
  resolveJsonTemplate<T = unknown>(template: T): Promise<T>;
  runAction(name: string, params?: Record<string, unknown>): Promise<unknown> | unknown;
  previewRunJS(code: string, version?: string): Promise<{ success: boolean; message: string }>;
  t(key: string, options?: Record<string, unknown>): string;
  view?: RunJSUnknownObject;
  data?: RunJSUnknownObject;
  app?: RunJSUnknownObject;
  event?: RunJSUnknownObject;
}
declare const ctx: RunJSContext;
declare const console: RunJSLogger;
`;

const runJSSourceRuntimeDeclaration = `
interface RunJSContext {
  settings: Record<string, unknown>;
  runJsSource: RunJSSourceInfo;
}
`;

const genericRunJSContextDeclaration = `
interface RunJSContext {
  element?: RunJSSafeElement;
  value?: unknown;
  record?: RunJSRecord;
  collection?: RunJSCollection;
  collectionField?: RunJSCollectionField;
  form?: RunJSForm;
  formValues?: Record<string, unknown>;
  namePath?: Array<string | number>;
  disabled?: boolean;
  readOnly?: boolean;
  item?: RunJSUnknownObject;
  filterByTk?: string | number;
  recordIndex?: number;
  settings?: Record<string, unknown>;
  runJsSource?: RunJSSourceInfo;
  getValue?(): unknown;
  setValue?(value: unknown): void;
  setProps?(fieldModel: unknown, props: Record<string, unknown>): void;
  refresh?(): Promise<void>;
}
`;

const runJSContextModelDeclarations: Record<string, string> = {
  JSPageModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  page: RunJSPageFacade;
}
`,
  JSBlockModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value?: unknown;
  record?: RunJSRecord;
}
`,
  JSFieldModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  collection?: RunJSCollection;
  collectionField?: RunJSCollectionField;
}
`,
  JSEditableFieldModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  collectionField?: RunJSCollectionField;
  form?: RunJSForm;
  formValues?: Record<string, unknown>;
  namePath?: Array<string | number>;
  disabled: boolean;
  readOnly: boolean;
  getValue(): unknown;
  setValue(value: unknown): void;
}
`,
  JSItemModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  record?: RunJSRecord;
  resource?: RunJSResource;
  formValues?: Record<string, unknown>;
  item?: RunJSUnknownObject;
}
`,
  JSItemActionModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  record?: RunJSRecord;
  resource?: RunJSResource;
  formValues?: Record<string, unknown>;
  item?: RunJSUnknownObject;
}
`,
  JSColumnModel: `
interface RunJSContext {
  element: RunJSSafeElement;
  value: unknown;
  record?: RunJSRecord;
  recordIndex: number;
  collection?: RunJSCollection;
  collectionField?: RunJSCollectionField;
}
`,
  JSRecordActionModel: `
interface RunJSContext {
  record: RunJSRecord;
  filterByTk: string | number;
}
`,
  JSCollectionActionModel: `
interface RunJSContext {}
`,
  JSFormActionModel: `
interface RunJSContext {
  form?: RunJSForm;
  resource?: RunJSResource;
  refresh(): Promise<void>;
}
`,
  FilterFormJSActionModel: `
interface RunJSContext {
  form?: RunJSForm;
  formValues?: Record<string, unknown>;
}
`,
  JSActionModel: `
interface RunJSContext {}
`,
};

const runJSSourceRuntimeModelUses = new Set([
  'FilterFormJSActionModel',
  'JSActionModel',
  'JSBlockModel',
  'JSCollectionActionModel',
  'JSColumnModel',
  'JSEditableFieldModel',
  'JSFieldModel',
  'JSFormActionModel',
  'JSItemActionModel',
  'JSItemModel',
  'JSPageModel',
  'JSRecordActionModel',
]);

export function buildRunJSTypeScriptContextDeclaration(
  modelUse?: string,
  options: { globalContextType?: string } = {},
): string {
  const modelDeclaration = (modelUse && runJSContextModelDeclarations[modelUse]) || genericRunJSContextDeclaration;
  const sourceRuntimeDeclaration =
    modelUse && runJSSourceRuntimeModelUses.has(modelUse) ? runJSSourceRuntimeDeclaration : '';
  const environmentDeclaration = options.globalContextType
    ? runJSEnvDeclaration.replace(
        'declare const ctx: RunJSContext;',
        `declare const ctx: ${options.globalContextType};`,
      )
    : runJSEnvDeclaration;
  return [environmentDeclaration, sourceRuntimeDeclaration, modelDeclaration].filter(Boolean).join('\n');
}
