/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceExtractionRecorder } from './recorder';
import { types as nodeUtilTypes } from 'util';
import { createFlowSurfaceExtractorNoopBridgeReturn } from './guards';
import type {
  FlowSurfaceExtractorCreateModelOptionsStatus,
  FlowSurfaceExtractorFlowStaticStatus,
  FlowSurfaceExtractorLabelFields,
  FlowSurfaceFieldBindingRole,
} from './types';

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

type FlowSurfaceMockApiClient = {
  storage: FlowSurfaceMockApiStorage;
  storagePrefix: string;
  createStorage(storageType: unknown): FlowSurfaceMockApiStorage;
  request(options: unknown): Promise<{
    data: {
      data: unknown[];
    };
  }>;
  resource(resourceName: unknown): FlowSurfaceMockApiResource;
  auth: {
    locale: string;
    getLocale(): string;
    setAuthenticator(authenticator: unknown): void;
    setLocale(locale: unknown): void;
    setRole(role: unknown): void;
    setToken(token: unknown): void;
  };
  axios: {
    interceptors: {
      request: FlowSurfaceMockAxiosInterceptor;
      response: FlowSurfaceMockAxiosInterceptor;
    };
  };
};

type FlowSurfaceMockApiStorage = {
  getItem(key: unknown): null;
  removeItem(key: unknown): void;
  setItem(key: unknown, value: unknown): void;
};

type FlowSurfaceMockAxiosInterceptor = {
  handlers: unknown[];
  use(fulfilled: unknown, rejected?: unknown): number;
  eject(id: unknown): void;
};

type FlowSurfaceMockApiResource = {
  clearCache(): Promise<void>;
  restart(): Promise<void>;
};

type FlowSurfaceMockRouter = {
  router: {
    state: {
      location: {
        pathname: string;
      };
    };
  };
  add(routeName: unknown, options: unknown): void;
  isSkippedAuthCheckRoute(pathname: unknown): boolean;
  navigate(path: unknown, options?: unknown): void;
};

type FlowSurfaceMockLayoutManager = {
  registerLayout(layout: unknown): void;
  getLayout(routeName: unknown): undefined;
  listLayouts(): unknown[];
};

type FlowSurfaceMockJsonLogic = {
  addOperation(name: unknown, operation: unknown): void;
};

export type FlowSurfaceMockFlowContext = {
  app?: FlowSurfaceMockClientApp;
  api: FlowSurfaceMockApiClient;
  dataSourceManager: FlowSurfaceMockDataSourceManager;
  systemSettings: {
    load(): Promise<Record<string, never>>;
  };
  defineProperty(property: unknown, descriptor: unknown): void;
};

export type FlowSurfaceMockCollectionFieldInterfaceManager = {
  registerFieldInterfaceConfigure(options: unknown): void;
  registerFieldValidationConfigure(item: unknown): void;
  registerFieldValidationConfigureGroup(name: unknown, items?: unknown[]): void;
  addFieldValidationConfiguresToGroup(name: unknown, items?: unknown[]): void;
};

export type FlowSurfaceMockDataSourceManager = {
  collectionFieldInterfaceManager: FlowSurfaceMockCollectionFieldInterfaceManager;
  registerLoader(name: unknown, loader: unknown): void;
  addFieldInterfaces(fieldInterfaces: unknown[]): void;
  addFieldInterfaceGroups(groups: unknown): void;
  addFieldInterfaceComponentOption(fieldName: unknown, componentOption: unknown): void;
  addFieldInterfaceOperator(name: unknown, operatorOption: unknown): void;
  registerFieldFilterOperator(operator: unknown): void;
  registerFieldFilterOperatorGroup(name: unknown, operators?: unknown[]): void;
  addFieldFilterOperatorsToGroup(name: unknown, operators?: unknown[]): void;
};

export type FlowSurfaceMockPluginManager = {
  get(pluginName: unknown): ReturnType<typeof createFlowSurfaceExtractorNoopBridgeReturn>;
};

export type FlowSurfaceMockPluginSettingsManager = {
  addMenuItem(item: unknown): void;
  addPageTabItem(item: unknown): void;
  has(key: unknown): boolean;
};

export type FlowSurfaceMockFlowEngine = {
  context: FlowSurfaceMockFlowContext;
  registerModels(models: Record<string, unknown>): void;
  registerModelLoaders(loaders: Record<string, unknown>): void;
  registerActions(actions: Record<string, unknown>): void;
  registerFlow(
    keyOrDefinition: string | FlowSurfaceUnknownFlowDefinition,
    flow?: FlowSurfaceUnknownFlowDefinition,
  ): void;
  flowSettings: {
    registerComponents(components: Record<string, unknown>): void;
  };
};

export type FlowSurfaceMockClientApp = {
  flowEngine: FlowSurfaceMockFlowEngine;
  context: FlowSurfaceMockFlowContext;
  apiClient: FlowSurfaceMockApiClient;
  dataSourceManager: FlowSurfaceMockDataSourceManager;
  pluginManager: FlowSurfaceMockPluginManager;
  pluginSettingsManager: FlowSurfaceMockPluginSettingsManager;
  layoutManager: FlowSurfaceMockLayoutManager;
  jsonLogic: FlowSurfaceMockJsonLogic;
  schemaInitializerManager: ReturnType<typeof createFlowSurfaceExtractorNoopBridgeReturn>;
  schemaSettingsManager: ReturnType<typeof createFlowSurfaceExtractorNoopBridgeReturn>;
  aiManager: ReturnType<typeof createFlowSurfaceExtractorNoopBridgeReturn>;
  providers: unknown[];
  router: FlowSurfaceMockRouter;
  addComponents(components: Record<string, unknown>): void;
  addFieldInterfaces(fieldInterfaces: unknown[]): void;
  addFieldInterfaceGroups(groups: unknown): void;
  addFieldInterfaceComponentOption(fieldName: unknown, componentOption: unknown): void;
  addFieldInterfaceOperator(name: unknown, operatorOption: unknown): void;
  registerFieldFilterOperator(operator: unknown): void;
  registerFieldFilterOperatorGroup(name: unknown, operators?: unknown[]): void;
  addFieldFilterOperatorsToGroup(name: unknown, operators?: unknown[]): void;
  registerFieldValidationConfigure(item: unknown): void;
  registerFieldValidationConfigureGroup(name: unknown, items?: unknown[]): void;
  addFieldValidationConfiguresToGroup(name: unknown, items?: unknown[]): void;
  getPublicPath(): string;
  use(provider: unknown): void;
  eventBus: {
    addEventListener(eventName: unknown, listener: unknown): void;
    removeEventListener(eventName: unknown, listener: unknown): void;
  };
  i18n: {
    addResources(lang: string, namespace: string, resource: unknown): void;
    t(key: unknown, options?: unknown): string;
  };
  pm: FlowSurfaceMockPluginManager;
};

export type FlowSurfaceMockClientPluginContext = {
  app: FlowSurfaceMockClientApp;
  flowEngine: FlowSurfaceMockFlowEngine;
  options: {
    packageName: string;
  };
};

export function createFlowSurfaceMockFlowEngine(input: {
  recorder: FlowSurfaceExtractionRecorder;
  source?: string;
}): FlowSurfaceMockFlowEngine {
  const source = input.source || 'runtime';
  const apiClient = createFlowSurfaceMockApiClient();
  const dataSourceManager = createFlowSurfaceMockDataSourceManager();
  const context = createFlowSurfaceMockFlowContext({
    apiClient,
    dataSourceManager,
  });
  return {
    context,
    registerModels: (models) => {
      input.recorder.recordModels(models, source, 'high', 'runtime');
    },
    registerModelLoaders: (loaders) => {
      input.recorder.recordModelLoaders(loaders, source, 'high', 'runtime');
    },
    registerActions() {
      // Action registration is intentionally ignored by the extractor runtime.
    },
    flowSettings: {
      registerComponents() {
        // Flow setting component registration is intentionally ignored by the extractor runtime.
      },
    },
    registerFlow: (keyOrDefinition, flowDefinition) => {
      const flow = normalizeFlowRegistration(keyOrDefinition, flowDefinition);
      input.recorder.recordFlow({
        flowKey: flow.flowKey,
        title: normalizeTitle(getOwnDataPropertyValue(flow.definition, 'title')),
        sort: normalizeNumber(getOwnDataPropertyValue(flow.definition, 'sort')),
        staticStatus: getFlowStaticStatus(flow.definition),
        source,
        evidenceSource: 'runtime',
        confidence: 'medium',
      });
    },
  };
}

export function createFlowSurfaceMockClientPluginContext(input: {
  packageName: string;
  recorder: FlowSurfaceExtractionRecorder;
  source?: string;
}): FlowSurfaceMockClientPluginContext {
  const flowEngine = createFlowSurfaceMockFlowEngine({
    recorder: input.recorder,
    source: input.source,
  });
  const pluginManager = createFlowSurfaceMockPluginManager();
  const app: FlowSurfaceMockClientApp = {
    flowEngine,
    context: flowEngine.context,
    apiClient: flowEngine.context.api,
    dataSourceManager: flowEngine.context.dataSourceManager,
    pluginManager,
    pluginSettingsManager: createFlowSurfaceMockPluginSettingsManager(),
    layoutManager: createFlowSurfaceMockLayoutManager(),
    jsonLogic: createFlowSurfaceMockJsonLogic(),
    schemaInitializerManager: createFlowSurfaceExtractorNoopBridgeReturn(),
    schemaSettingsManager: createFlowSurfaceExtractorNoopBridgeReturn(),
    aiManager: createFlowSurfaceExtractorNoopBridgeReturn(),
    providers: [],
    router: createFlowSurfaceMockRouter(),
    addComponents() {
      // Component registration is intentionally ignored by the extractor runtime.
    },
    addFieldInterfaces(fieldInterfaces) {
      this.dataSourceManager.addFieldInterfaces(fieldInterfaces);
    },
    addFieldInterfaceGroups(groups) {
      this.dataSourceManager.addFieldInterfaceGroups(groups);
    },
    addFieldInterfaceComponentOption(fieldName, componentOption) {
      this.dataSourceManager.addFieldInterfaceComponentOption(fieldName, componentOption);
    },
    addFieldInterfaceOperator(name, operatorOption) {
      this.dataSourceManager.addFieldInterfaceOperator(name, operatorOption);
    },
    registerFieldFilterOperator(operator) {
      this.dataSourceManager.registerFieldFilterOperator(operator);
    },
    registerFieldFilterOperatorGroup(name, operators) {
      this.dataSourceManager.registerFieldFilterOperatorGroup(name, operators);
    },
    addFieldFilterOperatorsToGroup(name, operators) {
      this.dataSourceManager.addFieldFilterOperatorsToGroup(name, operators);
    },
    registerFieldValidationConfigure(item) {
      this.dataSourceManager.collectionFieldInterfaceManager.registerFieldValidationConfigure(item);
    },
    registerFieldValidationConfigureGroup(name, items) {
      this.dataSourceManager.collectionFieldInterfaceManager.registerFieldValidationConfigureGroup(name, items);
    },
    addFieldValidationConfiguresToGroup(name, items) {
      this.dataSourceManager.collectionFieldInterfaceManager.addFieldValidationConfiguresToGroup(name, items);
    },
    getPublicPath() {
      return '';
    },
    use() {
      // App provider/component installation is intentionally ignored by the extractor runtime.
    },
    eventBus: {
      addEventListener() {
        // Event listener registration is intentionally ignored by the extractor runtime.
      },
      removeEventListener() {
        // Event listener removal is intentionally ignored by the extractor runtime.
      },
    },
    i18n: {
      addResources() {
        // Locale registration is intentionally ignored by the extractor runtime.
      },
      t(key) {
        return typeof key === 'string' ? key : '';
      },
    },
    pm: pluginManager,
  };
  flowEngine.context.app = app;
  return {
    app,
    flowEngine,
    options: {
      packageName: input.packageName,
    },
  };
}

function createFlowSurfaceMockApiClient(): FlowSurfaceMockApiClient {
  const storage = createFlowSurfaceMockApiStorage();
  return {
    storage,
    storagePrefix: '',
    createStorage() {
      return createFlowSurfaceMockApiStorage();
    },
    async request() {
      return {
        data: {
          data: [],
        },
      };
    },
    resource() {
      return {
        async clearCache() {
          // Resource cache clearing is intentionally ignored by the extractor runtime.
        },
        async restart() {
          // App restart requests are intentionally ignored by the extractor runtime.
        },
      };
    },
    auth: {
      locale: '',
      getLocale() {
        return '';
      },
      setAuthenticator() {
        // Auth state mutation is intentionally ignored by the extractor runtime.
      },
      setLocale() {
        // Auth state mutation is intentionally ignored by the extractor runtime.
      },
      setRole() {
        // Auth state mutation is intentionally ignored by the extractor runtime.
      },
      setToken() {
        // Auth state mutation is intentionally ignored by the extractor runtime.
      },
    },
    axios: {
      interceptors: {
        request: createFlowSurfaceMockAxiosInterceptor(),
        response: createFlowSurfaceMockAxiosInterceptor(),
      },
    },
  };
}

function createFlowSurfaceMockApiStorage(): FlowSurfaceMockApiStorage {
  return {
    getItem() {
      return null;
    },
    removeItem() {
      // API client storage mutation is intentionally ignored by the extractor runtime.
    },
    setItem() {
      // API client storage mutation is intentionally ignored by the extractor runtime.
    },
  };
}

function createFlowSurfaceMockAxiosInterceptor(): FlowSurfaceMockAxiosInterceptor {
  return {
    handlers: [],
    use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled,
        rejected,
      });
      return this.handlers.length - 1;
    },
    eject() {
      // HTTP interceptor removal is intentionally ignored by the extractor runtime.
    },
  };
}

function createFlowSurfaceMockFlowContext(input: {
  apiClient: FlowSurfaceMockApiClient;
  dataSourceManager: FlowSurfaceMockDataSourceManager;
}): FlowSurfaceMockFlowContext {
  return {
    api: input.apiClient,
    dataSourceManager: input.dataSourceManager,
    systemSettings: {
      async load() {
        return {};
      },
    },
    defineProperty() {
      // Flow context property registration is intentionally ignored by the extractor runtime.
    },
  };
}

function createFlowSurfaceMockDataSourceManager(): FlowSurfaceMockDataSourceManager {
  return {
    collectionFieldInterfaceManager: {
      registerFieldInterfaceConfigure() {
        // Field interface configuration is intentionally ignored by the extractor runtime.
      },
      registerFieldValidationConfigure() {
        // Field validation configuration is intentionally ignored by the extractor runtime.
      },
      registerFieldValidationConfigureGroup() {
        // Field validation configuration is intentionally ignored by the extractor runtime.
      },
      addFieldValidationConfiguresToGroup() {
        // Field validation configuration is intentionally ignored by the extractor runtime.
      },
    },
    registerLoader() {
      // Data source loader registration is intentionally ignored by the extractor runtime.
    },
    addFieldInterfaces() {
      // Field interface registration is intentionally ignored by the extractor runtime.
    },
    addFieldInterfaceGroups() {
      // Field interface group registration is intentionally ignored by the extractor runtime.
    },
    addFieldInterfaceComponentOption() {
      // Field interface component option registration is intentionally ignored by the extractor runtime.
    },
    addFieldInterfaceOperator() {
      // Field interface operator registration is intentionally ignored by the extractor runtime.
    },
    registerFieldFilterOperator() {
      // Field filter operator registration is intentionally ignored by the extractor runtime.
    },
    registerFieldFilterOperatorGroup() {
      // Field filter operator group registration is intentionally ignored by the extractor runtime.
    },
    addFieldFilterOperatorsToGroup() {
      // Field filter operator group mutation is intentionally ignored by the extractor runtime.
    },
  };
}

function createFlowSurfaceMockPluginManager(): FlowSurfaceMockPluginManager {
  return {
    get() {
      return createFlowSurfaceExtractorNoopBridgeReturn();
    },
  };
}

function createFlowSurfaceMockPluginSettingsManager(): FlowSurfaceMockPluginSettingsManager {
  return {
    addMenuItem() {
      // Plugin settings menu registration is intentionally ignored by the extractor runtime.
    },
    addPageTabItem() {
      // Plugin settings page registration is intentionally ignored by the extractor runtime.
    },
    has() {
      return false;
    },
  };
}

function createFlowSurfaceMockRouter(): FlowSurfaceMockRouter {
  return {
    router: {
      state: {
        location: {
          pathname: '/',
        },
      },
    },
    add() {
      // Route registration is intentionally ignored by the extractor runtime.
    },
    isSkippedAuthCheckRoute() {
      return false;
    },
    navigate() {
      // Navigation is intentionally ignored by the extractor runtime.
    },
  };
}

function createFlowSurfaceMockLayoutManager(): FlowSurfaceMockLayoutManager {
  return {
    registerLayout() {
      // Layout registration is intentionally ignored by the extractor runtime.
    },
    getLayout() {
      return undefined;
    },
    listLayouts() {
      return [];
    },
  };
}

function createFlowSurfaceMockJsonLogic(): FlowSurfaceMockJsonLogic {
  return {
    addOperation() {
      // JSON logic extension registration is intentionally ignored by the extractor runtime.
    },
  };
}

export function createFlowSurfaceMockModelClass(input: {
  modelUse: string;
  recorder: FlowSurfaceExtractionRecorder;
  fieldBindingRole?: FlowSurfaceFieldBindingRole;
  source?: string;
}) {
  const source = input.source || 'runtime';
  return class FlowSurfaceExtractorModel {
    static registerFlow(flow: FlowSurfaceUnknownFlowDefinition): void;
    static registerFlow(key: string, flow: FlowSurfaceUnknownFlowDefinition): void;
    static registerFlow(
      keyOrDefinition: string | FlowSurfaceUnknownFlowDefinition,
      flowDefinition?: FlowSurfaceUnknownFlowDefinition,
    ) {
      const flow = normalizeFlowRegistration(keyOrDefinition, flowDefinition);
      input.recorder.recordFlow({
        modelUse: input.modelUse,
        flowKey: flow.flowKey,
        title: normalizeTitle(getOwnDataPropertyValue(flow.definition, 'title')),
        sort: normalizeNumber(getOwnDataPropertyValue(flow.definition, 'sort')),
        staticStatus: getFlowStaticStatus(flow.definition),
        source,
        evidenceSource: 'runtime',
        confidence: 'high',
      });
    }

    static define(definition: FlowSurfaceUnknownModelDefinition) {
      const createModelOptions = getOwnDataPropertyValue(definition, 'createModelOptions');
      const createModelOptionsUse = normalizeString(getOwnDataPropertyValue(createModelOptions, 'use'));
      const labelFields = firstLabelFields(
        normalizeLabel(getOwnDataPropertyValue(definition, 'label')),
        normalizeLabel(getOwnDataPropertyValue(definition, 'title')),
      );
      input.recorder.recordMenuItem({
        ...labelFields,
        modelUse: input.modelUse,
        slot: inferSlotFromModelUse(input.modelUse),
        createModelOptionsStatus: getCreateModelOptionsStatus(createModelOptions),
        ...(createModelOptionsUse ? { createModelOptionsUse } : {}),
        ...normalizeCreateModelOptionsSubModels(createModelOptions),
        source,
        evidenceSource: 'runtime',
        confidence: 'medium',
      });
    }

    static bindModelToInterface(modelUse: unknown, interfaceName: unknown) {
      const modelUseValue = normalizeString(modelUse) || input.modelUse;
      normalizeStringList(interfaceName).forEach((fieldInterface) => {
        input.recorder.recordFieldBinding({
          fieldInterface,
          modelUse: modelUseValue,
          role: input.fieldBindingRole || 'wrapper',
          source,
          evidenceSource: 'runtime',
          confidence: 'medium',
        });
      });
    }
  };
}

export function createFlowSurfaceMockFieldBindingModelClass(input: {
  role: FlowSurfaceFieldBindingRole;
  recorder: FlowSurfaceExtractionRecorder;
  source?: string;
}) {
  const source = input.source || 'runtime';
  return class FlowSurfaceExtractorFieldBindingModel {
    static bindModelToInterface(modelUse: unknown, interfaceName: unknown) {
      const modelUseValue = normalizeString(modelUse);
      normalizeStringList(interfaceName).forEach((fieldInterface) => {
        input.recorder.recordFieldBinding({
          fieldInterface,
          ...(modelUseValue ? { modelUse: modelUseValue } : {}),
          role: input.role,
          source,
          evidenceSource: 'runtime',
          confidence: 'medium',
        });
      });
    }

    static getDefaultBindingByField() {
      return {
        modelName: normalizeString(this.name) || 'FlowSurfaceExtractorFieldBindingModel',
        defaultProps: {},
      };
    }

    static getBindingsByField() {
      return [this.getDefaultBindingByField()];
    }
  };
}

export function getFlowStaticStatus(value: unknown): FlowSurfaceExtractorFlowStaticStatus {
  if (!value || typeof value !== 'object') {
    return 'unresolved';
  }
  return containsFunction(value) ? 'dynamic' : 'static';
}

export function getCreateModelOptionsStatus(value: unknown): FlowSurfaceExtractorCreateModelOptionsStatus {
  if (typeof value === 'undefined') {
    return 'unresolved';
  }
  return containsFunction(value) ? 'dynamic' : 'static';
}

function normalizeFlowRegistration(
  keyOrDefinition: string | FlowSurfaceUnknownFlowDefinition,
  flowDefinition?: FlowSurfaceUnknownFlowDefinition,
) {
  if (typeof keyOrDefinition === 'string') {
    return {
      flowKey: normalizeString(keyOrDefinition),
      definition: flowDefinition,
    };
  }
  return {
    flowKey: normalizeString(getOwnDataPropertyValue(keyOrDefinition, 'key')),
    definition: keyOrDefinition,
  };
}

function containsFunction(value: unknown, seen: WeakSet<object> = new WeakSet()): boolean {
  if (typeof value === 'function') {
    return true;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (isProxy(value)) {
    return true;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  const descriptors = getOwnDataDescriptors(value);
  if (!descriptors) {
    return true;
  }
  return Object.values(descriptors).some((descriptor) => {
    if (!('value' in descriptor)) {
      return true;
    }
    return containsFunction(descriptor.value, seen);
  });
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function normalizeTitle(value: unknown) {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return (
    normalizeString(getOwnDataPropertyValue(value, 'fallback')) ||
    normalizeString(getOwnDataPropertyValue(value, 'title')) ||
    normalizeString(getOwnDataPropertyValue(value, 'key'))
  );
}

function normalizeLabel(value: unknown): FlowSurfaceExtractorLabelFields {
  if (typeof value === 'string') {
    const normalized = normalizeString(value);
    return normalized
      ? {
          label: normalized,
        }
      : {};
  }
  if (!value || typeof value !== 'object') {
    return {};
  }
  const labelText =
    normalizeString(getOwnDataPropertyValue(value, 'label')) ||
    normalizeString(getOwnDataPropertyValue(value, 'text')) ||
    normalizeString(getOwnDataPropertyValue(value, 'title'));
  const labelKey = normalizeString(getOwnDataPropertyValue(value, 'key'));
  const labelFallback =
    normalizeString(getOwnDataPropertyValue(value, 'fallback')) ||
    normalizeString(getOwnDataPropertyValue(value, 'defaultValue'));
  if (!labelText && !labelKey && !labelFallback) {
    return {};
  }
  return {
    label: labelText || labelFallback || labelKey,
    ...(labelText ? { labelText } : {}),
    ...(labelKey ? { labelKey } : {}),
    ...(labelFallback ? { labelFallback } : {}),
  };
}

function firstLabelFields(...items: FlowSurfaceExtractorLabelFields[]) {
  return items.find((item) => item.label || item.labelText || item.labelKey || item.labelFallback) || {};
}

function normalizeStringList(value: unknown): string[] {
  if (value && typeof value === 'object' && isProxy(value)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const normalized = normalizeString(item);
      return normalized ? [normalized] : [];
    });
  }
  const normalized = normalizeString(value);
  return normalized ? [normalized] : [];
}

function normalizeCreateModelOptionsSubModels(createModelOptions: unknown) {
  const subModels = getOwnDataPropertyValue(createModelOptions, 'subModels');
  if (!subModels || typeof subModels !== 'object' || isProxy(subModels)) {
    return {};
  }
  const createModelOptionsSubModels: Record<string, string[]> = {};
  Object.entries(Object.getOwnPropertyDescriptors(subModels)).forEach(([subModelKey, descriptor]) => {
    if (!('value' in descriptor) || !Array.isArray(descriptor.value)) {
      return;
    }
    const uses = descriptor.value.flatMap((item) => {
      const use = normalizeString(getOwnDataPropertyValue(item, 'use'));
      return use ? [use] : [];
    });
    createModelOptionsSubModels[subModelKey] = uses;
  });
  return Object.keys(createModelOptionsSubModels).length ? { createModelOptionsSubModels } : {};
}

function inferSlotFromModelUse(modelUse: string) {
  if (/(?:Action|ActionGroup)Model$/.test(modelUse)) {
    return 'actions';
  }
  if (/FieldModel$/.test(modelUse)) {
    return 'fields';
  }
  if (/(?:Item|Column|FieldGroup)Model$/.test(modelUse)) {
    return 'fields';
  }
  if (/BlockModel$/.test(modelUse)) {
    return 'blocks';
  }
  return undefined;
}

function getOwnDataPropertyValue(value: unknown, property: string) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  if (isProxy(value)) {
    return undefined;
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, property);
    return descriptor && 'value' in descriptor ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}

function getOwnDataDescriptors(value: object) {
  if (isProxy(value)) {
    return undefined;
  }
  try {
    return Object.getOwnPropertyDescriptors(value);
  } catch {
    return undefined;
  }
}

function isProxy(value: object) {
  return nodeUtilTypes.isProxy(value);
}
