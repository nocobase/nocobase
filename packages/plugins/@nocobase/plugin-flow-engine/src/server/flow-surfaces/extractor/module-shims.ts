/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceExtractionRecorder } from './recorder';
import {
  createFlowSurfaceMockClientPluginContext,
  createFlowSurfaceMockFieldBindingModelClass,
  createFlowSurfaceMockModelClass,
  type FlowSurfaceMockClientApp,
  type FlowSurfaceMockDataSourceManager,
  type FlowSurfaceMockFlowContext,
  type FlowSurfaceMockFlowEngine,
  type FlowSurfaceMockPluginManager,
  type FlowSurfaceMockPluginSettingsManager,
} from './runtime';

const CLIENT_V2_MODEL_EXPORTS = [
  'ActionGroupModel',
  'ActionModel',
  'AddChildActionModel',
  'AddNewActionModel',
  'AssignFormModel',
  'BaseLayoutModel',
  'BlockGridModel',
  'BlockModel',
  'ChildPageModel',
  'ChildPageTabModel',
  'ClickableFieldModel',
  'CollectionActionGroupModel',
  'CollectionActionModel',
  'CollectionBlockModel',
  'CommonItemModel',
  'CreateFormModel',
  'DataBlockModel',
  'DetailsGridModel',
  'DetailsItemModel',
  'DisplayTextFieldModel',
  'DisplayTitleFieldModel',
  'EditFormModel',
  'FieldModel',
  'FilterBlockModel',
  'FilterFormBlockModel',
  'FormBlockModel',
  'FormActionGroupModel',
  'FormActionModel',
  'FormGridModel',
  'FormItemModel',
  'FormSubmitActionModel',
  'JSActionModel',
  'LinkActionModel',
  'PasswordFieldModel',
  'PopupActionModel',
  'RecordActionGroupModel',
  'RecordSelectFieldModel',
  'RootPageModel',
  'RouteModel',
  'TableActionsColumnModel',
  'TableBlockModel',
  'TableColumnModel',
  'TableCustomColumnModel',
  'TopbarActionModel',
  'UserCenterActionItemModel',
  'UserCenterSelectItemModel',
  'UserCenterTextItemModel',
  'ViewActionModel',
] as const;

const CLIENT_V2_COMPONENT_EXPORTS = [
  'ACLRolesCheckProvider',
  'CodeEditor',
  'CollectionFilter',
  'CollectionFilterPanel',
  'CompiledFilter',
  'DialogFormLayout',
  'DrawerFormLayout',
  'EnvVariableInput',
  'ExtendCollectionsProvider',
  'FileSizeInput',
  'FilterContent',
  'FilterGroup',
  'FormBlockContent',
  'FormComponent',
  'Icon',
  'JsonTextArea',
  'PasswordInput',
  'PoweredBy',
  'RecordPickerContent',
  'RemoteSelect',
  'SkeletonFallback',
  'SwitchLanguage',
  'Table',
  'TextAreaWithContextSelector',
  'TypedVariableInput',
  'VariableFilterItem',
  'VariableInput',
  'VariableTextArea',
] as const;

const CLIENT_V2_HELPER_EXPORTS = [
  'applyMobilePaginationProps',
  'compatOldTheme',
  'createAclSnippetAllow',
  'createAssignFieldValuesStep',
  'createAssignFormSubModelOptions',
  'createCompactSimpleItemRender',
  'createTypedFilterable',
  'dateTimeFormatConfigureItems',
  'dispatchEventDeep',
  'evaluateFieldConfigureExpression',
  'fieldValidationConfigureRegistry',
  'getAssignFieldValuesDefaultParams',
  'getCoreFieldConfigureState',
  'getDisplayNumber',
  'getLayoutModel',
  'getSimpleModePaginationClassName',
  'getUnknownCountPaginationTotal',
  'isTitleField',
  'joinUrlSearch',
  'mergePaginationClassName',
  'normalizeCollectionTemplateFields',
  'redirectToV2Signin',
  'resolveAssignFieldValues',
  'resolveDynamicNamePath',
  'resolveFilterOperators',
  'resolveV2SigninRedirect',
  'runCoreFieldConfigureEffects',
  'stripModernClientPrefix',
  'useACLRoleContext',
  'useCurrentAppInfo',
  'useCurrentRoles',
  'useCurrentUserContext',
  'useGlobalTheme',
  'useMobileLayout',
  'usePlugin',
  'useSystemSettings',
] as const;

const FLOW_ENGINE_MODEL_EXPORTS = ['CollectionFieldModel', 'FlowModel', 'ForkFlowModel'] as const;

const FLOW_ENGINE_RESOURCE_EXPORTS = [
  'BaseRecordResource',
  'DataSource',
  'DataSourceManager',
  'MultiRecordResource',
  'SingleRecordResource',
  'SQLResource',
] as const;

const FLOW_ENGINE_COMPONENT_EXPORTS = [
  'AddSubModelButton',
  'DndProvider',
  'DragHandler',
  'Droppable',
  'FieldModelRenderer',
  'FlowContextSelector',
  'FlowEngineProvider',
  'FlowModelRenderer',
  'FlowSettingsButton',
  'FlowSettingsContextProvider',
  'FlowViewContextProvider',
  'FlowsFloatContextMenu',
  'FormItem',
  'SlateVariableEditor',
  'VariableHybridInput',
] as const;

const FLOW_ENGINE_HELPER_EXPORTS = [
  'autorun',
  'buildItems',
  'buildSubModelItem',
  'buildSubModelItems',
  'collectContextParamsForTemplate',
  'compileUiSchema',
  'createBlockScopedEngine',
  'createCollectionContextMeta',
  'createEphemeralContext',
  'createRecordMetaFactory',
  'createRecordResolveOnServerWithLocal',
  'define',
  'defineAction',
  'defineFlow',
  'isInheritedFrom',
  'largeField',
  'observable',
  'observer',
  'randomId',
  'replaceUidInGridLayout',
  'reaction',
  'resolveExpressions',
  'useFlowContext',
  'useFlowEngine',
  'useFlowModel',
  'useFlowSettingsContext',
  'useFlowStep',
  'useFlowView',
  'useFlowViewContext',
  'useFlowViewer',
] as const;

type FlowSurfaceUnknownFlowDefinition = {
  key?: unknown;
  title?: unknown;
  sort?: unknown;
  steps?: unknown;
  [key: string]: unknown;
};

type FlowSurfaceUnknownModelDefinition = {
  label?: unknown;
  title?: unknown;
  group?: unknown;
  createModelOptions?: unknown;
  [key: string]: unknown;
};

type FlowSurfaceExtractorModelConstructor = {
  new (): object;
  readonly name?: string;
};

export type FlowSurfaceExtractorFlowModelClass = FlowSurfaceExtractorModelConstructor & {
  readonly modelName?: string;
  define(definition: FlowSurfaceUnknownModelDefinition): void;
  registerFlow(flow: FlowSurfaceUnknownFlowDefinition): void;
  registerFlow(key: string, flow: FlowSurfaceUnknownFlowDefinition): void;
  bindModelToInterface(modelUse: unknown, interfaceName: unknown): void;
  getBindingsByField(context?: unknown, field?: unknown): FlowSurfaceExtractorFieldBinding[];
  getDefaultBindingByField(context?: unknown, field?: unknown): FlowSurfaceExtractorFieldBinding;
  _isScene(scene: unknown): boolean;
};

type FlowSurfaceExtractorFieldBinding = {
  modelName: string;
  defaultProps: Record<string, never>;
};

export type FlowSurfaceExtractorFieldBindingModelClass = FlowSurfaceExtractorModelConstructor & {
  bindModelToInterface(modelUse: unknown, interfaceName: unknown): void;
  getBindingsByField(context?: unknown, field?: unknown): FlowSurfaceExtractorFieldBinding[];
  getDefaultBindingByField(context?: unknown, field?: unknown): FlowSurfaceExtractorFieldBinding;
};

export type FlowSurfaceExtractorPluginClass = {
  new (
    contextOrOptions?: FlowSurfaceExtractorPluginConstructorContext | FlowSurfaceExtractorPluginOptions,
    app?: FlowSurfaceMockClientApp,
  ): {
    app: FlowSurfaceMockClientApp;
    ai: ReturnType<typeof createFlowSurfaceMockClientPluginContext>['app']['aiManager'];
    context: FlowSurfaceMockFlowContext;
    dataSourceManager: FlowSurfaceMockDataSourceManager;
    engine: FlowSurfaceMockFlowEngine;
    flowEngine: FlowSurfaceMockFlowEngine;
    options: { packageName: string };
    pluginManager: FlowSurfaceMockPluginManager;
    pluginSettingsManager: FlowSurfaceMockPluginSettingsManager;
    pm: FlowSurfaceMockPluginManager;
    router: FlowSurfaceMockClientApp['router'];
    schemaInitializerManager: ReturnType<
      typeof createFlowSurfaceMockClientPluginContext
    >['app']['schemaInitializerManager'];
    schemaSettingsManager: ReturnType<typeof createFlowSurfaceMockClientPluginContext>['app']['schemaSettingsManager'];
    t(key: unknown, options?: unknown): string;
  };
};

type FlowSurfaceExtractorInertClass = new (...args: unknown[]) => object;
type FlowSurfaceExtractorInertComponent = ((...args: unknown[]) => null) & Record<string, unknown>;
type FlowSurfaceExtractorObservable = (<T>(value: T) => T) & {
  computed<T>(getter: () => T): { readonly value: T };
};

export type FlowSurfaceExtractorClientV2ModuleShim = Record<string, unknown> & {
  Application: new () => object;
  Plugin: FlowSurfaceExtractorPluginClass;
  CollectionFieldInterface: new () => object;
  InputFieldInterface: new () => object;
  FlowModel: FlowSurfaceExtractorFlowModelClass;
  ActionModel: FlowSurfaceExtractorFlowModelClass;
  BlockModel: FlowSurfaceExtractorFlowModelClass;
  DataBlockModel: FlowSurfaceExtractorFlowModelClass;
  FieldModel: FlowSurfaceExtractorFlowModelClass;
  DisplayItemModel: FlowSurfaceExtractorFieldBindingModelClass;
  DisplayTextFieldModel: FlowSurfaceExtractorFlowModelClass;
  EditableItemModel: FlowSurfaceExtractorFieldBindingModelClass;
  FilterableItemModel: FlowSurfaceExtractorFieldBindingModelClass;
  UserCenterActionItemModel: FlowSurfaceExtractorFlowModelClass;
  UserCenterSelectItemModel: FlowSurfaceExtractorFlowModelClass;
  UIEditorTopbarActionModel: FlowSurfaceExtractorFlowModelClass;
  FlowEngine: new () => FlowSurfaceMockFlowEngine;
  AddSubModelButton: FlowSurfaceExtractorInertComponent;
  ACLRolesCheckProvider: FlowSurfaceExtractorInertComponent;
  DialogFormLayout: FlowSurfaceExtractorInertComponent;
  DrawerFormLayout: FlowSurfaceExtractorInertComponent;
  EnvVariableInput: FlowSurfaceExtractorInertComponent;
  SchemaInitializer: new () => object;
  SchemaSettings: new () => object;
  DEFAULT_DATA_SOURCE_KEY: string;
  DEFAULT_PAGE_SIZE: number;
  BlockSceneEnum: Record<string, string>;
  ActionSceneEnum: Record<string, string>;
  getCurrentV2RedirectPath: () => string;
  languageCodes: Record<string, { label: string }>;
  openView: Record<string, unknown>;
  openViewFlow: Record<string, unknown>;
  titleField: Record<string, unknown>;
  useApp: () => FlowSurfaceMockClientApp;
  useFlowEngine: () => FlowSurfaceMockFlowEngine;
};

export type FlowSurfaceExtractorFlowEngineModuleShim = Record<string, unknown> & {
  FlowEngine: new () => FlowSurfaceMockFlowEngine;
  FlowModel: FlowSurfaceExtractorFlowModelClass;
  DefaultStructure: FlowSurfaceExtractorInertClass;
  DisplayItemModel: FlowSurfaceExtractorFieldBindingModelClass;
  EditableItemModel: FlowSurfaceExtractorFieldBindingModelClass;
  FilterableItemModel: FlowSurfaceExtractorFieldBindingModelClass;
  AddSubModelButton: FlowSurfaceExtractorInertComponent;
  FlowSettingsButton: FlowSurfaceExtractorInertComponent;
  FlowModelRenderer: FlowSurfaceExtractorInertComponent;
  FlowSettingsContextProvider: FlowSurfaceExtractorInertComponent;
  MultiRecordResource: FlowSurfaceExtractorInertClass;
  BaseRecordResource: FlowSurfaceExtractorInertClass;
  useFlowContext: () => FlowSurfaceMockFlowContext;
  useFlowEngine: () => FlowSurfaceMockFlowEngine;
  useFlowSettingsContext: () => FlowSurfaceExtractorFlowSettingsContext;
  useFlowStep: () => ReturnType<typeof createFlowSurfaceMockClientPluginContext>['app']['aiManager'];
  buildSubModelItem: (
    modelClass: FlowSurfaceExtractorModelConstructor,
    context?: unknown,
  ) => FlowSurfaceExtractorSubModelItem;
  buildSubModelItems: (
    modelClass: FlowSurfaceExtractorModelConstructor,
  ) => (context?: unknown) => FlowSurfaceExtractorSubModelItem[];
  define: (...args: unknown[]) => unknown;
  defineAction: <T>(definition: T) => T;
  defineFlow: <T>(definition: T) => T;
  largeField: () => <T>(target: T) => T;
  observable: FlowSurfaceExtractorObservable;
  randomId: (prefix?: unknown) => string;
  tExpr: (key: unknown) => unknown;
  escapeT: (key: unknown) => unknown;
  observer: <T>(value: T) => T;
};

export type FlowSurfaceExtractorModuleShims = {
  '@nocobase/client-v2': FlowSurfaceExtractorClientV2ModuleShim;
  '@nocobase/flow-engine': FlowSurfaceExtractorFlowEngineModuleShim;
};

export type FlowSurfaceExtractorAssetStub = Record<string, never> | string;

type FlowSurfaceExtractorPluginConstructorContext = {
  app?: FlowSurfaceMockClientApp;
  flowEngine?: FlowSurfaceMockFlowEngine;
  options?: FlowSurfaceExtractorPluginOptions;
};

type FlowSurfaceExtractorPluginOptions = {
  packageName?: string;
} & Record<string, unknown>;

type FlowSurfaceExtractorFlowSettingsContext = {
  model: ReturnType<typeof createFlowSurfaceMockClientPluginContext>['app']['aiManager'];
};

type FlowSurfaceExtractorSubModelItem = {
  useModel: string;
};

const STYLE_ASSET_EXTENSIONS = new Set(['.css', '.less', '.scss']);
const URL_ASSET_EXTENSIONS = new Set(['.svg', '.png']);

export function createFlowSurfaceExtractorModuleShims(input: {
  packageName: string;
  recorder: FlowSurfaceExtractionRecorder;
  source?: string;
}): FlowSurfaceExtractorModuleShims {
  const context = createFlowSurfaceMockClientPluginContext({
    packageName: input.packageName,
    recorder: input.recorder,
    source: input.source,
  });
  const FlowModel = createFlowSurfaceExtractorFlowModelClass({
    modelUse: 'FlowModel',
    recorder: input.recorder,
    source: input.source,
  });
  const DisplayTextFieldModel = createFlowSurfaceExtractorFlowModelClass({
    modelUse: 'DisplayTextFieldModel',
    recorder: input.recorder,
    source: input.source,
  });
  const DisplayItemModel = createFlowSurfaceMockFieldBindingModelClass({
    role: 'display',
    recorder: input.recorder,
    source: input.source,
  });
  const EditableItemModel = createFlowSurfaceMockFieldBindingModelClass({
    role: 'editable',
    recorder: input.recorder,
    source: input.source,
  });
  const FilterableItemModel = createFlowSurfaceMockFieldBindingModelClass({
    role: 'filterable',
    recorder: input.recorder,
    source: input.source,
  });
  const UserCenterActionItemModel = createFlowSurfaceExtractorFlowModelClass({
    modelUse: 'UserCenterActionItemModel',
    recorder: input.recorder,
    source: input.source,
  });
  const UserCenterSelectItemModel = createFlowSurfaceExtractorFlowModelClass({
    modelUse: 'UserCenterSelectItemModel',
    recorder: input.recorder,
    source: input.source,
  });
  const UIEditorTopbarActionModel = createFlowSurfaceExtractorFlowModelClass({
    modelUse: 'UIEditorTopbarActionModel',
    recorder: input.recorder,
    source: input.source,
  });
  const Plugin = createFlowSurfaceExtractorPluginClass(context);
  const FlowEngine = createFlowSurfaceExtractorFlowEngineClass(context.flowEngine);
  const clientV2ModelExports = createFlowSurfaceExtractorModelExports(CLIENT_V2_MODEL_EXPORTS, {
    recorder: input.recorder,
    source: input.source,
  });
  const clientV2ComponentExports = createFlowSurfaceExtractorComponentExports(CLIENT_V2_COMPONENT_EXPORTS);
  const clientV2HelperExports = createFlowSurfaceExtractorClientV2HelperExports(context);
  const flowEngineModelExports = createFlowSurfaceExtractorModelExports(FLOW_ENGINE_MODEL_EXPORTS, {
    recorder: input.recorder,
    source: input.source,
  });
  const flowEngineResourceExports = createFlowSurfaceExtractorClassExports(FLOW_ENGINE_RESOURCE_EXPORTS);
  const flowEngineComponentExports = createFlowSurfaceExtractorComponentExports(FLOW_ENGINE_COMPONENT_EXPORTS);
  const flowEngineHelperExports = createFlowSurfaceExtractorFlowEngineHelperExports(context);
  const AddSubModelButton = createFlowSurfaceExtractorNamedComponent('AddSubModelButton');
  const ACLRolesCheckProvider = createFlowSurfaceExtractorNamedComponent('ACLRolesCheckProvider');
  const DialogFormLayout = createFlowSurfaceExtractorNamedComponent('DialogFormLayout');
  const DrawerFormLayout = createFlowSurfaceExtractorNamedComponent('DrawerFormLayout');
  const EnvVariableInput = createFlowSurfaceExtractorNamedComponent('EnvVariableInput');
  const FlowSettingsContextProvider = createFlowSurfaceExtractorNamedComponent('FlowSettingsContextProvider');

  return {
    '@nocobase/client-v2': {
      ...clientV2ModelExports,
      ...clientV2ComponentExports,
      ...clientV2HelperExports,
      Application: class FlowSurfaceExtractorApplication {},
      Plugin,
      CollectionFieldInterface: class FlowSurfaceExtractorCollectionFieldInterface {},
      InputFieldInterface: class FlowSurfaceExtractorInputFieldInterface {},
      FlowModel,
      ActionModel: clientV2ModelExports.ActionModel,
      BlockModel: clientV2ModelExports.BlockModel,
      DataBlockModel: clientV2ModelExports.DataBlockModel,
      FieldModel: clientV2ModelExports.FieldModel,
      DisplayItemModel,
      DisplayTextFieldModel,
      EditableItemModel,
      FilterableItemModel,
      UserCenterActionItemModel,
      UserCenterSelectItemModel,
      UIEditorTopbarActionModel,
      FlowEngine,
      AddSubModelButton,
      ACLRolesCheckProvider,
      DialogFormLayout,
      DrawerFormLayout,
      EnvVariableInput,
      SchemaInitializer: class FlowSurfaceExtractorSchemaInitializer {},
      SchemaSettings: class FlowSurfaceExtractorSchemaSettings {},
      DEFAULT_DATA_SOURCE_KEY: 'main',
      DEFAULT_PAGE_SIZE: 20,
      BlockSceneEnum: createFlowSurfaceExtractorEnum('block', 'data', 'form', 'table', 'details'),
      ActionSceneEnum: createFlowSurfaceExtractorEnum('collection', 'record', 'form', 'bulk'),
      getCurrentV2RedirectPath: () => '',
      languageCodes: {},
      openView: createFlowSurfaceExtractorActionStub('openView'),
      openViewFlow: createFlowSurfaceExtractorActionStub('openViewFlow'),
      titleField: createFlowSurfaceExtractorActionStub('titleField'),
      useApp: () => context.app,
      useFlowEngine: () => context.flowEngine,
    },
    '@nocobase/flow-engine': {
      ...flowEngineModelExports,
      ...flowEngineResourceExports,
      ...flowEngineComponentExports,
      ...flowEngineHelperExports,
      FlowEngine,
      FlowModel,
      DefaultStructure: class FlowSurfaceExtractorDefaultStructure {},
      DisplayItemModel,
      EditableItemModel,
      FilterableItemModel,
      AddSubModelButton,
      FlowSettingsButton: createFlowSurfaceExtractorNamedComponent('FlowSettingsButton'),
      FlowModelRenderer: createFlowSurfaceExtractorNamedComponent('FlowModelRenderer'),
      FlowSettingsContextProvider,
      MultiRecordResource: class FlowSurfaceExtractorMultiRecordResource {},
      BaseRecordResource: class FlowSurfaceExtractorBaseRecordResource {},
      useFlowContext: () => context.flowEngine.context,
      useFlowEngine: () => context.flowEngine,
      useFlowSettingsContext: () => ({
        model: context.app.aiManager,
      }),
      useFlowStep: () => context.app.aiManager,
      buildSubModelItem: createFlowSurfaceExtractorSubModelItem,
      buildSubModelItems: (modelClass) => () => [createFlowSurfaceExtractorSubModelItem(modelClass)],
      defineAction: passthrough,
      defineFlow: passthrough,
      largeField: () => passthrough,
      observable: createFlowSurfaceExtractorObservable(),
      randomId: createFlowSurfaceExtractorRandomId,
      tExpr: passthrough,
      escapeT: passthrough,
      observer: passthrough,
    },
  };
}

export function resolveFlowSurfaceExtractorModuleShim(
  specifier: string,
  shims: FlowSurfaceExtractorModuleShims,
): FlowSurfaceExtractorClientV2ModuleShim | FlowSurfaceExtractorFlowEngineModuleShim | undefined {
  return specifier === '@nocobase/client-v2' || specifier === '@nocobase/flow-engine' ? shims[specifier] : undefined;
}

export function isFlowSurfaceExtractorAssetImport(specifier: string) {
  return !!getFlowSurfaceExtractorAssetExtension(specifier);
}

export function createFlowSurfaceExtractorAssetStub(specifier: string): FlowSurfaceExtractorAssetStub | undefined {
  const extension = getFlowSurfaceExtractorAssetExtension(specifier);
  if (!extension) {
    return undefined;
  }
  if (STYLE_ASSET_EXTENSIONS.has(extension)) {
    return {};
  }
  return `flow-surface-asset:${extension.slice(1)}`;
}

function createFlowSurfaceExtractorPluginClass(
  defaultContext: ReturnType<typeof createFlowSurfaceMockClientPluginContext>,
): FlowSurfaceExtractorPluginClass {
  return class FlowSurfaceExtractorPlugin {
    app: FlowSurfaceMockClientApp;
    options: { packageName: string };

    constructor(
      contextOrOptions: FlowSurfaceExtractorPluginConstructorContext | FlowSurfaceExtractorPluginOptions = {},
      app?: FlowSurfaceMockClientApp,
    ) {
      const context = normalizePluginConstructorContext(contextOrOptions, app);
      this.app = context.app || createFlowSurfacePluginAppWithEngine(defaultContext.app, context.flowEngine);
      this.options = {
        packageName: context.options?.packageName || defaultContext.options.packageName,
      };
    }

    get pluginManager() {
      return this.app.pluginManager;
    }

    get context() {
      return this.app.context;
    }

    get flowEngine() {
      return this.app.flowEngine;
    }

    get engine() {
      return this.app.flowEngine;
    }

    get pm() {
      return this.app.pm;
    }

    get router() {
      return this.app.router;
    }

    get pluginSettingsManager() {
      return this.app.pluginSettingsManager;
    }

    get schemaInitializerManager() {
      return this.app.schemaInitializerManager;
    }

    get schemaSettingsManager() {
      return this.app.schemaSettingsManager;
    }

    get dataSourceManager() {
      return this.app.dataSourceManager;
    }

    get ai() {
      return this.app.aiManager;
    }

    t(key: unknown, options?: unknown) {
      return this.app.i18n.t(key, options);
    }
  };
}

function createFlowSurfaceExtractorFlowEngineClass(
  flowEngine: FlowSurfaceMockFlowEngine,
): new () => FlowSurfaceMockFlowEngine {
  return class FlowSurfaceExtractorFlowEngine {
    registerModels = flowEngine.registerModels;
    registerModelLoaders = flowEngine.registerModelLoaders;
    registerActions = flowEngine.registerActions;
    registerFlow = flowEngine.registerFlow;
    flowSettings = flowEngine.flowSettings;
    context = flowEngine.context;
  };
}

function normalizePluginConstructorContext(
  contextOrOptions: FlowSurfaceExtractorPluginConstructorContext | FlowSurfaceExtractorPluginOptions,
  app?: FlowSurfaceMockClientApp,
): FlowSurfaceExtractorPluginConstructorContext {
  if (isPluginConstructorContext(contextOrOptions)) {
    return {
      ...contextOrOptions,
      ...(app ? { app } : {}),
    };
  }
  return {
    ...(app ? { app } : {}),
    options: contextOrOptions,
  };
}

function isPluginConstructorContext(
  value: FlowSurfaceExtractorPluginConstructorContext | FlowSurfaceExtractorPluginOptions,
): value is FlowSurfaceExtractorPluginConstructorContext {
  return (
    hasOwnDefinedDataProperty(value, 'app') ||
    hasOwnDefinedDataProperty(value, 'flowEngine') ||
    hasOwnDefinedDataProperty(value, 'options')
  );
}

function hasOwnDefinedDataProperty(value: object, property: string) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, property);
    return !!descriptor && 'value' in descriptor && descriptor.value !== undefined;
  } catch {
    return false;
  }
}

function createFlowSurfacePluginAppWithEngine(
  defaultApp: FlowSurfaceMockClientApp,
  flowEngine?: FlowSurfaceMockFlowEngine,
) {
  if (!flowEngine || flowEngine === defaultApp.flowEngine) {
    return defaultApp;
  }
  const app = {
    ...defaultApp,
    flowEngine,
    context: flowEngine.context,
    apiClient: flowEngine.context.api,
    dataSourceManager: flowEngine.context.dataSourceManager,
  };
  flowEngine.context.app = app;
  return app;
}

function createFlowSurfaceExtractorFlowModelClass(input: {
  modelUse: string;
  recorder: FlowSurfaceExtractionRecorder;
  source?: string;
}): FlowSurfaceExtractorFlowModelClass {
  class FlowSurfaceExtractorFlowModel {
    static define(definition: FlowSurfaceUnknownModelDefinition) {
      createRuntimeModelClass(this, input).define(definition);
    }

    static registerFlow(flow: FlowSurfaceUnknownFlowDefinition): void;
    static registerFlow(key: string, flow: FlowSurfaceUnknownFlowDefinition): void;
    static registerFlow(
      keyOrDefinition: string | FlowSurfaceUnknownFlowDefinition,
      flowDefinition?: FlowSurfaceUnknownFlowDefinition,
    ) {
      const runtimeModel = createRuntimeModelClass(this, input);
      if (typeof keyOrDefinition === 'string') {
        runtimeModel.registerFlow(keyOrDefinition, flowDefinition || {});
        return;
      }
      runtimeModel.registerFlow(keyOrDefinition);
    }

    static bindModelToInterface(modelUse: unknown, interfaceName: unknown) {
      createRuntimeModelClass(this, input).bindModelToInterface(modelUse, interfaceName);
    }

    static get modelName() {
      return normalizeModelUse(this.name, input.modelUse);
    }

    static getDefaultBindingByField() {
      return createFlowSurfaceExtractorFieldBinding(this);
    }

    static getBindingsByField() {
      return [createFlowSurfaceExtractorFieldBinding(this)];
    }

    static _isScene() {
      return true;
    }
  }
  Object.defineProperty(FlowSurfaceExtractorFlowModel, 'name', {
    value: input.modelUse,
  });
  return FlowSurfaceExtractorFlowModel;
}

function createRuntimeModelClass(
  constructor: FlowSurfaceExtractorModelConstructor,
  input: { modelUse: string; recorder: FlowSurfaceExtractionRecorder; source?: string },
) {
  return createFlowSurfaceMockModelClass({
    modelUse: normalizeModelUse(constructor.name, input.modelUse),
    recorder: input.recorder,
    source: input.source,
  });
}

function normalizeModelUse(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function createFlowSurfaceExtractorFieldBinding(
  modelClass: FlowSurfaceExtractorModelConstructor,
): FlowSurfaceExtractorFieldBinding {
  return {
    modelName: normalizeModelUse(modelClass.name, 'FlowSurfaceExtractorModel'),
    defaultProps: {},
  };
}

function createFlowSurfaceExtractorModelExports<const T extends readonly string[]>(
  names: T,
  input: { recorder: FlowSurfaceExtractionRecorder; source?: string },
) {
  const exports: Partial<Record<T[number], FlowSurfaceExtractorFlowModelClass>> = {};
  names.forEach((name) => {
    exports[name] = createFlowSurfaceExtractorFlowModelClass({
      modelUse: name,
      recorder: input.recorder,
      source: input.source,
    });
  });
  return exports as Record<T[number], FlowSurfaceExtractorFlowModelClass>;
}

function createFlowSurfaceExtractorComponentExports<const T extends readonly string[]>(names: T) {
  const exports: Partial<Record<T[number], FlowSurfaceExtractorInertComponent>> = {};
  names.forEach((name) => {
    exports[name] = createFlowSurfaceExtractorNamedComponent(name);
  });
  return exports as Record<T[number], FlowSurfaceExtractorInertComponent>;
}

function createFlowSurfaceExtractorClassExports<const T extends readonly string[]>(names: T) {
  const exports: Partial<Record<T[number], FlowSurfaceExtractorInertClass>> = {};
  names.forEach((name) => {
    exports[name] = createFlowSurfaceExtractorNamedClass(name);
  });
  return exports as Record<T[number], FlowSurfaceExtractorInertClass>;
}

function createFlowSurfaceExtractorClientV2HelperExports(
  context: ReturnType<typeof createFlowSurfaceMockClientPluginContext>,
) {
  const helpers: Partial<Record<(typeof CLIENT_V2_HELPER_EXPORTS)[number], unknown>> = {};
  CLIENT_V2_HELPER_EXPORTS.forEach((name) => {
    helpers[name] = createFlowSurfaceExtractorNamedNoop(name);
  });
  return {
    ...helpers,
    ACLContext: createFlowSurfaceExtractorContextStub('ACLContext'),
    CurrentUserContext: createFlowSurfaceExtractorContextStub('CurrentUserContext'),
    defaultTheme: {},
    editMarkdownFlow: createFlowSurfaceExtractorActionStub('editMarkdownFlow'),
    createMockClient: () => context.app,
    getCurrentV2RedirectPath: () => '',
    languageCodes: {},
    stripModernClientPrefix: (value: unknown) => (typeof value === 'string' ? value : ''),
    useApp: () => context.app,
    useFlowEngine: () => context.flowEngine,
    usePlugin: () => context.app.pm.get('plugin'),
  };
}

function createFlowSurfaceExtractorFlowEngineHelperExports(
  context: ReturnType<typeof createFlowSurfaceMockClientPluginContext>,
) {
  const helpers: Partial<Record<(typeof FLOW_ENGINE_HELPER_EXPORTS)[number], unknown>> = {};
  FLOW_ENGINE_HELPER_EXPORTS.forEach((name) => {
    helpers[name] = createFlowSurfaceExtractorNamedNoop(name);
  });
  return {
    ...helpers,
    ActionScene: createFlowSurfaceExtractorEnum('collection', 'record', 'form', 'bulk'),
    DefaultStructure: class FlowSurfaceExtractorDefaultStructure {},
    EMBED_REPLACING_DATA_KEY: '__flowSurfaceEmbedReplacingData',
    FlowContext: createFlowSurfaceExtractorContextStub('FlowContext'),
    FlowEngineContext: createFlowSurfaceExtractorContextStub('FlowEngineContext'),
    FlowModelContext: createFlowSurfaceExtractorContextStub('FlowModelContext'),
    GLOBAL_EMBED_CONTAINER_ID: 'flow-surface-embed-container',
    ParamObject: class FlowSurfaceExtractorParamObject {},
    PropertyMetaFactory: createFlowSurfaceExtractorNamedNoop('PropertyMetaFactory'),
    StepParams: class FlowSurfaceExtractorStepParams {},
    SubModelItem: class FlowSurfaceExtractorSubModelItem {},
    buildItems: () => [],
    buildSubModelItem: createFlowSurfaceExtractorSubModelItem,
    buildSubModelItems: (modelClass: FlowSurfaceExtractorModelConstructor) => () => [
      createFlowSurfaceExtractorSubModelItem(modelClass),
    ],
    collectContextParamsForTemplate: () => ({}),
    compileUiSchema: passthrough,
    createBlockScopedEngine: () => context.flowEngine,
    createCollectionContextMeta: () => ({}),
    createEphemeralContext: () => ({}),
    createRecordMetaFactory: () => ({}),
    createRecordResolveOnServerWithLocal: () => ({}),
    defineAction: passthrough,
    define: createFlowSurfaceExtractorNamedNoop('define'),
    defineFlow: passthrough,
    escapeT: passthrough,
    FlowExitException: class FlowSurfaceExtractorFlowExitException extends Error {},
    isInheritedFrom: () => false,
    largeField: () => passthrough,
    observable: createFlowSurfaceExtractorObservable(),
    observer: passthrough,
    randomId: createFlowSurfaceExtractorRandomId,
    replaceUidInGridLayout: passthrough,
    resolveExpressions: passthrough,
    tExpr: passthrough,
    useFlowContext: () => context.flowEngine.context,
    useFlowEngine: () => context.flowEngine,
    useFlowModel: () => context.app.aiManager,
    useFlowSettingsContext: () => ({
      model: context.app.aiManager,
    }),
    useFlowStep: () => context.app.aiManager,
    useFlowView: () => context.app.aiManager,
    useFlowViewContext: () => context.app.aiManager,
    useFlowViewer: () => context.app.aiManager,
  };
}

function createFlowSurfaceExtractorNamedComponent(name: string): FlowSurfaceExtractorInertComponent {
  const component = () => null;
  Object.defineProperty(component, 'name', {
    value: name,
  });
  return component as FlowSurfaceExtractorInertComponent;
}

function createFlowSurfaceExtractorNamedClass(name: string): FlowSurfaceExtractorInertClass {
  const namedClass = class FlowSurfaceExtractorInertClass {};
  Object.defineProperty(namedClass, 'name', {
    value: name,
  });
  return namedClass;
}

function createFlowSurfaceExtractorNamedNoop(name: string) {
  const noop = () => undefined;
  Object.defineProperty(noop, 'name', {
    value: name,
  });
  return noop;
}

function createFlowSurfaceExtractorEnum(...values: string[]) {
  return Object.fromEntries(values.map((value) => [value, value]));
}

function createFlowSurfaceExtractorContextStub(name: string) {
  return {
    displayName: name,
    Provider: createFlowSurfaceExtractorNamedComponent(`${name}Provider`),
    Consumer: createFlowSurfaceExtractorNamedComponent(`${name}Consumer`),
  };
}

function createFlowSurfaceExtractorActionStub(name: string) {
  return {
    name,
    defaultParams: {},
  };
}

function createFlowSurfaceExtractorSubModelItem(
  modelClass: FlowSurfaceExtractorModelConstructor,
): FlowSurfaceExtractorSubModelItem {
  return {
    useModel: normalizeModelUse(modelClass.name, 'FlowSurfaceExtractorModel'),
  };
}

function createFlowSurfaceExtractorObservable(): FlowSurfaceExtractorObservable {
  const observable = (<T>(value: T) => value) as FlowSurfaceExtractorObservable;
  observable.computed = (getter) => ({
    get value() {
      return getter();
    },
  });
  return observable;
}

function createFlowSurfaceExtractorRandomId(prefix?: unknown) {
  return `${typeof prefix === 'string' ? prefix : ''}flow-surface-id`;
}

function passthrough<T>(value: T): T {
  return value;
}

function getFlowSurfaceExtractorAssetExtension(specifier: string) {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0].toLowerCase();
  const match = cleanSpecifier.match(/\.[a-z0-9]+$/);
  const extension = match?.[0];
  return extension && (STYLE_ASSET_EXTENSIONS.has(extension) || URL_ASSET_EXTENSIONS.has(extension))
    ? extension
    : undefined;
}
