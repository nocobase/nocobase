/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Script, createContext, type Context } from 'vm';
import { randomUUID } from 'crypto';
import { types as nodeUtilTypes } from 'util';
import type { FlowSurfaceCapabilityWarning } from '../types';

export class FlowSurfaceExtractorGuardError extends Error {
  readonly code = 'extractor-runtime-error';

  constructor(readonly blockedGlobal: string) {
    super(`Flow surface extractor blocked access to ${blockedGlobal}`);
    this.name = 'FlowSurfaceExtractorGuardError';
  }
}

export type FlowSurfaceExtractorGuardOptions = {
  bridges?: Record<string, FlowSurfaceExtractorBridgeValue>;
  globals?: Record<string, unknown>;
  maxTimerDelayMs?: number;
  timeoutMs?: number;
};

export type FlowSurfaceExtractorBridgeHandler = (...args: unknown[]) => unknown;

export type FlowSurfaceExtractorBridgeValue =
  | FlowSurfaceExtractorBridgeHandler
  | { readonly [key: string]: FlowSurfaceExtractorBridgeValue };

type FlowSurfaceExtractorVmContext = Context & Record<string, unknown>;

type FlowSurfaceGuardedGlobalKind = 'constructor' | 'function' | 'promise' | 'proxy' | 'timer';

type FlowSurfaceGuardedGlobalSpec = {
  key: string;
  kind: FlowSurfaceGuardedGlobalKind;
};

const FLOW_SURFACE_EXTRACTOR_THROWER_KEY = '__flowSurfaceExtractorThrow';
const FLOW_SURFACE_EXTRACTOR_BRIDGE_KEY = '__flowSurfaceExtractorBridge';
const FLOW_SURFACE_EXTRACTOR_ASSERT_SYNC_KEY = '__flowSurfaceExtractorAssertSync';
type FlowSurfaceExtractorNoopBridgeReturn = ((...args: unknown[]) => undefined) & {
  readonly [key: string]: FlowSurfaceExtractorNoopBridgeReturn;
};

const FLOW_SURFACE_EXTRACTOR_NOOP_BRIDGE_RETURN = createHostNoopBridgeReturn();

const FLOW_SURFACE_GUARDED_GLOBALS: FlowSurfaceGuardedGlobalSpec[] = [
  { key: 'fetch', kind: 'function' },
  { key: 'Promise', kind: 'promise' },
  { key: 'XMLHttpRequest', kind: 'constructor' },
  { key: 'WebSocket', kind: 'constructor' },
  { key: 'EventSource', kind: 'constructor' },
  { key: 'window', kind: 'proxy' },
  { key: 'document', kind: 'proxy' },
  { key: 'localStorage', kind: 'proxy' },
  { key: 'sessionStorage', kind: 'proxy' },
  { key: 'indexedDB', kind: 'proxy' },
  { key: 'setTimeout', kind: 'timer' },
  { key: 'setInterval', kind: 'timer' },
  { key: 'setImmediate', kind: 'function' },
  { key: 'queueMicrotask', kind: 'function' },
];

export function createFlowSurfaceExtractorGuardedGlobals(options: FlowSurfaceExtractorGuardOptions = {}) {
  const maxTimerDelayMs = options.maxTimerDelayMs ?? 1000;
  return {
    fetch: createBlockedFunction('fetch'),
    Promise: createBlockedPromise(),
    XMLHttpRequest: createBlockedConstructor('XMLHttpRequest'),
    WebSocket: createBlockedConstructor('WebSocket'),
    EventSource: createBlockedConstructor('EventSource'),
    window: createBlockedProxy('window'),
    document: createBlockedProxy('document'),
    localStorage: createBlockedProxy('localStorage'),
    sessionStorage: createBlockedProxy('sessionStorage'),
    indexedDB: createBlockedProxy('indexedDB'),
    setTimeout: createTimerGuard('setTimeout', maxTimerDelayMs),
    setInterval: createTimerGuard('setInterval', maxTimerDelayMs),
    setImmediate: createBlockedFunction('setImmediate'),
    queueMicrotask: createBlockedFunction('queueMicrotask'),
  } satisfies Record<string, unknown>;
}

export function createFlowSurfaceExtractorNoopBridgeReturn() {
  return FLOW_SURFACE_EXTRACTOR_NOOP_BRIDGE_RETURN;
}

export async function runWithFlowSurfaceExtractorGuards<T = unknown>(
  fn: string | (() => T),
  options: FlowSurfaceExtractorGuardOptions = {},
): Promise<T> {
  const context = createFlowSurfaceExtractorVmContext(options);
  const source = typeof fn === 'string' ? fn : `return (${fn.toString()})();`;
  const bridgeRuntime = createFlowSurfaceExtractorBridgeRuntime(options.bridges);
  const globalObject = getVmGlobalObject(context);
  if (bridgeRuntime.handlers.size) {
    Object.defineProperty(globalObject, FLOW_SURFACE_EXTRACTOR_BRIDGE_KEY, {
      configurable: true,
      value(path: string, args: unknown[]) {
        const handler = bridgeRuntime.handlers.get(path);
        if (!handler) {
          throw new FlowSurfaceExtractorGuardError(`bridge:${path}`);
        }
        const result = handler(...args);
        return toVmBridgeReturnValue(result, bridgeRuntime.noopReturnToken);
      },
    });
  }
  try {
    const script = new Script(`
      ((${bridgeRuntime.bridgeIdentifier}) => {
        Reflect.deleteProperty(globalThis, ${JSON.stringify(FLOW_SURFACE_EXTRACTOR_BRIDGE_KEY)});
        let ${bridgeRuntime.activeIdentifier} = true;
        ${bridgeRuntime.declarations}
        try {
          return globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_ASSERT_SYNC_KEY)}]((() => {
${source}
          })());
        } finally {
          ${bridgeRuntime.activeIdentifier} = false;
        }
      })(globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_BRIDGE_KEY)}]);
    `);
    const result = script.runInContext(context, {
      timeout: options.timeoutMs ?? 1000,
    }) as T;
    return result;
  } finally {
    Reflect.deleteProperty(globalObject, FLOW_SURFACE_EXTRACTOR_BRIDGE_KEY);
  }
}

export function createFlowSurfaceExtractorRuntimeWarning(error: unknown): FlowSurfaceCapabilityWarning {
  if (error instanceof FlowSurfaceExtractorGuardError) {
    return {
      code: 'extractor-runtime-error',
      message: error.message,
    };
  }
  return {
    code: 'extractor-runtime-error',
    message: error instanceof Error ? error.message : 'Extractor runtime failed.',
  };
}

function createFlowSurfaceExtractorVmContext(
  options: FlowSurfaceExtractorGuardOptions = {},
): FlowSurfaceExtractorVmContext {
  const context = createContext(Object.create(null), {
    microtaskMode: 'afterEvaluate',
    name: 'flow-surface-extractor',
  }) as FlowSurfaceExtractorVmContext;

  installVmThrower(context);
  installVmSyncAssertion(context);
  installVmProcessGuard(context);
  installVmGuardedGlobals(context, options);
  installVmUserGlobals(context, options.globals);
  installVmObjectGuards(context);
  removeVmThrower(context);

  return context;
}

function installVmThrower(context: FlowSurfaceExtractorVmContext) {
  const globalObject = getVmGlobalObject(context);
  Object.defineProperty(globalObject, FLOW_SURFACE_EXTRACTOR_THROWER_KEY, {
    configurable: true,
    value(blockedGlobal: string): never {
      throw new FlowSurfaceExtractorGuardError(blockedGlobal);
    },
  });
}

function removeVmThrower(context: FlowSurfaceExtractorVmContext) {
  Reflect.deleteProperty(getVmGlobalObject(context), FLOW_SURFACE_EXTRACTOR_THROWER_KEY);
}

function installVmProcessGuard(context: FlowSurfaceExtractorVmContext) {
  runVmSetup(
    context,
    `
      ((thrower) => {
        const blockedNextTick = function nextTick() {
          return thrower('process.nextTick');
        };
        const processObject = Object.create(null);
        Object.defineProperty(processObject, 'nextTick', {
          configurable: false,
          enumerable: true,
          get() {
            return blockedNextTick;
          },
          set() {
            return thrower('process.nextTick');
          },
        });
        Object.defineProperty(processObject, 'env', {
          configurable: false,
          enumerable: true,
          value: Object.create(null),
        });
        Object.defineProperty(globalThis, 'process', {
          configurable: false,
          enumerable: false,
          get() {
            return processObject;
          },
          set() {
            return thrower('process');
          },
        });
      })(globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_THROWER_KEY)}]);
    `,
  );
}

function installVmSyncAssertion(context: FlowSurfaceExtractorVmContext) {
  runVmSetup(
    context,
    `
      ((thrower) => {
        const assertSyncResult = (value) => {
          if (!value) {
            return value;
          }
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
          }
          return thrower('result');
        };
        Object.defineProperty(globalThis, ${JSON.stringify(FLOW_SURFACE_EXTRACTOR_ASSERT_SYNC_KEY)}, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: assertSyncResult,
        });
      })(globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_THROWER_KEY)}]);
    `,
  );
}

function installVmGuardedGlobals(context: FlowSurfaceExtractorVmContext, options: FlowSurfaceExtractorGuardOptions) {
  const existingHostKeys = FLOW_SURFACE_GUARDED_GLOBALS.filter((spec) =>
    Object.prototype.hasOwnProperty.call(globalThis, spec.key),
  ).map((spec) => spec.key);
  runVmSetup(
    context,
    `
      ((thrower) => {
        const existingHostKeys = new Set(${JSON.stringify(existingHostKeys)});
        const maxTimerDelayMs = ${JSON.stringify(options.maxTimerDelayMs ?? 1000)};
        const specs = ${JSON.stringify(FLOW_SURFACE_GUARDED_GLOBALS)};
        const createBlockedFunction = (name) => function blockedGlobal() {
          return thrower(name);
        };
        const createBlockedConstructor = (name) => class FlowSurfaceBlockedGlobal {
          constructor() {
            return thrower(name);
          }
        };
        const createBlockedPromise = () => class FlowSurfaceBlockedPromise {
          constructor() {
            return thrower('Promise');
          }

          static all() {
            return thrower('Promise.all');
          }

          static allSettled() {
            return thrower('Promise.allSettled');
          }

          static any() {
            return thrower('Promise.any');
          }

          static race() {
            return thrower('Promise.race');
          }

          static reject() {
            return thrower('Promise.reject');
          }

          static resolve() {
            return thrower('Promise.resolve');
          }
        };
        const createBlockedProxy = (name) => new Proxy(Object.create(null), {
          get(_target, property) {
            return thrower(name + '.' + String(property));
          },
          set(_target, property) {
            return thrower(name + '.' + String(property));
          },
          has(_target, property) {
            return thrower(name + '.' + String(property));
          },
        });
        const createTimerGuard = (name) => function guardedTimer(_handler, timeout) {
          const delay = typeof timeout === 'number' ? timeout : 0;
          if (delay > maxTimerDelayMs) {
            return thrower(name + ':' + String(delay));
          }
          return thrower(name);
        };
        const createGuardedValue = (spec) => {
          if (!existingHostKeys.has(spec.key)) {
            return undefined;
          }
          if (spec.kind === 'constructor') {
            return createBlockedConstructor(spec.key);
          }
          if (spec.kind === 'promise') {
            return createBlockedPromise();
          }
          if (spec.kind === 'proxy') {
            return createBlockedProxy(spec.key);
          }
          if (spec.kind === 'timer') {
            return createTimerGuard(spec.key);
          }
          return createBlockedFunction(spec.key);
        };

        specs.forEach((spec) => {
          const value = createGuardedValue(spec);
          Object.defineProperty(globalThis, spec.key, {
            configurable: false,
            enumerable: false,
            get() {
              return value;
            },
            set() {
              return thrower(spec.key);
            },
          });
        });
      })(globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_THROWER_KEY)}]);
    `,
  );
}

function createFlowSurfaceExtractorBridgeRuntime(bridges: Record<string, FlowSurfaceExtractorBridgeValue> = {}) {
  const handlers = new Map<string, FlowSurfaceExtractorBridgeHandler>();
  const bridgeIdentifier = createVmIdentifier('bridge');
  const activeIdentifier = createVmIdentifier('bridgeActive');
  const noopFactoryIdentifier = createVmIdentifier('bridgeNoop');
  const noopReturnToken = createVmIdentifier('bridgeNoopReturn');
  const definitions = Object.entries(bridges)
    .map(([key, value]) => {
      const literal = toVmBridgeLiteral(value, key, handlers, {
        activeIdentifier,
        bridgeIdentifier,
        noopFactoryIdentifier,
        noopReturnToken,
      });
      if (isVmIdentifier(key)) {
        return `const ${key} = ${literal};`;
      }
      return `Object.defineProperty(globalThis, ${JSON.stringify(key)}, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: ${literal},
        });`;
    })
    .join('\n');
  return {
    activeIdentifier,
    bridgeIdentifier,
    declarations: `${createVmNoopFactoryDeclaration(noopFactoryIdentifier)}\n${definitions}`,
    handlers,
    noopReturnToken,
  };
}

function installVmUserGlobals(context: FlowSurfaceExtractorVmContext, globals: Record<string, unknown> = {}) {
  const guardedKeys = new Set(FLOW_SURFACE_GUARDED_GLOBALS.map((spec) => spec.key));
  const entries = Object.entries(globals).filter(
    ([key]) => key !== FLOW_SURFACE_EXTRACTOR_THROWER_KEY && !guardedKeys.has(key) && key !== 'process',
  );
  if (!entries.length) {
    return;
  }
  const definitions = entries
    .map(([key, value]) => {
      return `Object.defineProperty(globalThis, ${JSON.stringify(key)}, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: ${toVmLiteral(value, `globals.${key}`)},
      });`;
    })
    .join('\n');

  runVmSetup(
    context,
    `
      ((thrower) => {
        const createBlocked = (name) => function blockedGlobal() {
          return thrower(name);
        };
        const createBlockedProxy = (name) => new Proxy(Object.create(null), {
          get(_target, property) {
            return thrower(name + '.' + String(property));
          },
          set(_target, property) {
            return thrower(name + '.' + String(property));
          },
          has(_target, property) {
            return thrower(name + '.' + String(property));
          },
        });
        ${definitions}
      })(globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_THROWER_KEY)}]);
    `,
  );
}

function installVmObjectGuards(context: FlowSurfaceExtractorVmContext) {
  const guardedGlobalKeys = [...FLOW_SURFACE_GUARDED_GLOBALS.map((spec) => spec.key), 'process'];
  runVmSetup(
    context,
    `
      ((thrower) => {
        const guardedGlobalKeys = new Set(${JSON.stringify(guardedGlobalKeys)});
        const originalObjectDefineProperty = Object.defineProperty;
        const originalObjectDefineProperties = Object.defineProperties;
        const originalObjectFreeze = Object.freeze;
        const originalObjectPreventExtensions = Object.preventExtensions;
        const originalObjectSeal = Object.seal;
        const originalReflectDefineProperty = Reflect.defineProperty;
        const originalReflectPreventExtensions = Reflect.preventExtensions;
        const definePropertyDescriptor = Object.getOwnPropertyDescriptor(Object, 'defineProperty');
        const definePropertiesDescriptor = Object.getOwnPropertyDescriptor(Object, 'defineProperties');
        const freezeDescriptor = Object.getOwnPropertyDescriptor(Object, 'freeze');
        const preventExtensionsDescriptor = Object.getOwnPropertyDescriptor(Object, 'preventExtensions');
        const sealDescriptor = Object.getOwnPropertyDescriptor(Object, 'seal');
        const reflectDefinePropertyDescriptor = Object.getOwnPropertyDescriptor(Reflect, 'defineProperty');
        const reflectPreventExtensionsDescriptor = Object.getOwnPropertyDescriptor(Reflect, 'preventExtensions');

        if (
          !definePropertyDescriptor ||
          !definePropertiesDescriptor ||
          !freezeDescriptor ||
          !preventExtensionsDescriptor ||
          !sealDescriptor ||
          !reflectDefinePropertyDescriptor ||
          !reflectPreventExtensionsDescriptor
        ) {
          return thrower('Object.defineProperty');
        }

        const assertAllowedDefinition = (target, property, source) => {
          if (target === globalThis && typeof property === 'string' && guardedGlobalKeys.has(property)) {
            return thrower(source + ':' + property);
          }
          if (target === process && property === 'nextTick') {
            return thrower(source + ':process.nextTick');
          }
          return undefined;
        };
        const assertAllowedHardening = (target, source) => {
          if (target === globalThis) {
            return thrower(source + ':globalThis');
          }
          if (target === process) {
            return thrower(source + ':process');
          }
          return undefined;
        };

        originalObjectDefineProperty(Object, 'defineProperty', {
          ...definePropertyDescriptor,
          value(target, property, attributes) {
            assertAllowedDefinition(target, property, 'Object.defineProperty');
            return originalObjectDefineProperty(target, property, attributes);
          },
        });
        originalObjectDefineProperty(Object, 'defineProperties', {
          ...definePropertiesDescriptor,
          value(target, properties) {
            Object.getOwnPropertyNames(properties).forEach((property) => {
              assertAllowedDefinition(target, property, 'Object.defineProperties');
            });
            return originalObjectDefineProperties(target, properties);
          },
        });
        originalObjectDefineProperty(Reflect, 'defineProperty', {
          ...reflectDefinePropertyDescriptor,
          value(target, property, attributes) {
            assertAllowedDefinition(target, property, 'Reflect.defineProperty');
            return originalReflectDefineProperty(target, property, attributes);
          },
        });
        originalObjectDefineProperty(Object, 'freeze', {
          ...freezeDescriptor,
          value(target) {
            assertAllowedHardening(target, 'Object.freeze');
            return originalObjectFreeze(target);
          },
        });
        originalObjectDefineProperty(Object, 'preventExtensions', {
          ...preventExtensionsDescriptor,
          value(target) {
            assertAllowedHardening(target, 'Object.preventExtensions');
            return originalObjectPreventExtensions(target);
          },
        });
        originalObjectDefineProperty(Object, 'seal', {
          ...sealDescriptor,
          value(target) {
            assertAllowedHardening(target, 'Object.seal');
            return originalObjectSeal(target);
          },
        });
        originalObjectDefineProperty(Reflect, 'preventExtensions', {
          ...reflectPreventExtensionsDescriptor,
          value(target) {
            assertAllowedHardening(target, 'Reflect.preventExtensions');
            return originalReflectPreventExtensions(target);
          },
        });
      })(globalThis[${JSON.stringify(FLOW_SURFACE_EXTRACTOR_THROWER_KEY)}]);
    `,
  );
}

function getVmGlobalObject(context: FlowSurfaceExtractorVmContext) {
  return new Script('globalThis').runInContext(context) as Record<string, unknown>;
}

function runVmSetup(context: FlowSurfaceExtractorVmContext, source: string) {
  new Script(source).runInContext(context);
}

function toVmBridgeLiteral(
  value: FlowSurfaceExtractorBridgeValue,
  path: string,
  handlers: Map<string, FlowSurfaceExtractorBridgeHandler>,
  input: {
    activeIdentifier: string;
    bridgeIdentifier: string;
    noopFactoryIdentifier: string;
    noopReturnToken: string;
  },
): string {
  if (typeof value === 'function') {
    handlers.set(path, value);
    return `function flowSurfaceExtractorBridgeMethod(...args) {
      if (!${input.activeIdentifier}) {
        return undefined;
      }
      const bridgeResult = ${input.bridgeIdentifier}(${JSON.stringify(path)}, args);
      if (bridgeResult === ${JSON.stringify(input.noopReturnToken)}) {
        return ${input.noopFactoryIdentifier}();
      }
      return bridgeResult;
    }`;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'undefined';
  }
  const definitions = Object.entries(value)
    .map(([key, child]) => {
      return `Object.defineProperty(result, ${JSON.stringify(key)}, {
        configurable: false,
        enumerable: true,
        writable: false,
        value: ${toVmBridgeLiteral(child, `${path}.${key}`, handlers, input)},
      });`;
    })
    .join('\n');
  return `(() => {
    const result = Object.create(null);
    ${definitions}
    return result;
  })()`;
}

function createVmIdentifier(prefix: string) {
  return `__flowSurfaceExtractor_${prefix}_${randomUUID().replace(/-/g, '_')}`;
}

function isVmIdentifier(value: string) {
  return /^[A-Za-z_$][\w$]*$/.test(value);
}

function createVmNoopFactoryDeclaration(identifier: string) {
  return `const ${identifier} = () => {
    const target = function flowSurfaceExtractorNoop() {
      return undefined;
    };
    const proxy = new Proxy(target, {
      apply() {
        return undefined;
      },
      construct() {
        return proxy;
      },
      get(_target, property) {
        if (property === 'then') {
          return undefined;
        }
        if (property === Symbol.toPrimitive) {
          return () => '';
        }
        if (property === 'toString' || property === 'valueOf') {
          return () => '';
        }
        return proxy;
      },
      has() {
        return false;
      },
      set() {
        return true;
      },
    });
    return proxy;
  };`;
}

function createHostNoopBridgeReturn(): FlowSurfaceExtractorNoopBridgeReturn {
  const target = function flowSurfaceExtractorNoopBridgeReturn() {
    return undefined;
  } as FlowSurfaceExtractorNoopBridgeReturn;

  Object.defineProperty(target, '__flowSurfaceExtractorNoopBridgeReturn', {
    configurable: false,
    enumerable: false,
    value: true,
  });

  const proxy = new Proxy(target, {
    apply() {
      return undefined;
    },
    construct() {
      return proxy;
    },
    get(_target, property) {
      if (property === '__flowSurfaceExtractorNoopBridgeReturn') {
        return true;
      }
      if (property === 'then') {
        return undefined;
      }
      if (property === Symbol.toPrimitive || property === 'toString' || property === 'valueOf') {
        return () => '';
      }
      return proxy;
    },
    has() {
      return false;
    },
    set() {
      return true;
    },
  });

  return proxy;
}

function toVmBridgeReturnValue(value: unknown, noopReturnToken: string) {
  if (value === FLOW_SURFACE_EXTRACTOR_NOOP_BRIDGE_RETURN) {
    return noopReturnToken;
  }
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }
  return undefined;
}

function toVmLiteral(value: unknown, label: string, seen: WeakSet<object> = new WeakSet()): string {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'function') {
    return `createBlocked(${JSON.stringify(label)})`;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? JSON.stringify(value) : 'undefined';
  }
  if (typeof value === 'bigint' || typeof value === 'symbol') {
    return 'undefined';
  }
  if (!value || typeof value !== 'object') {
    return 'undefined';
  }
  const objectValue = value;
  if (isHostProxy(objectValue)) {
    return `createBlockedProxy(${JSON.stringify(label)})`;
  }
  if (seen.has(objectValue)) {
    return 'undefined';
  }
  seen.add(objectValue);
  if (Array.isArray(objectValue)) {
    const descriptors = getHostDataDescriptors(objectValue);
    if (!descriptors) {
      return `createBlockedProxy(${JSON.stringify(label)})`;
    }
    const lengthDescriptor = descriptors.length;
    const length = typeof lengthDescriptor?.value === 'number' ? lengthDescriptor.value : 0;
    const items: string[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      items.push(
        descriptor && 'value' in descriptor ? toVmLiteral(descriptor.value, `${label}.${index}`, seen) : 'undefined',
      );
    }
    return `[${items.join(',')}]`;
  }
  const descriptors = getHostDataDescriptors(objectValue);
  if (!descriptors) {
    return `createBlockedProxy(${JSON.stringify(label)})`;
  }
  const definitions = Object.entries(descriptors)
    .filter((entry): entry is [string, PropertyDescriptor & { value: unknown }] => hasDescriptorValue(entry[1]))
    .map(([key, descriptor]) => {
      return `Object.defineProperty(result, ${JSON.stringify(key)}, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: ${toVmLiteral(descriptor.value, `${label}.${key}`, seen)},
      });`;
    })
    .join('\n');
  return `(() => {
    const result = Object.create(null);
    ${definitions}
    return result;
  })()`;
}

function createBlockedFunction(name: string) {
  return () => {
    throw new FlowSurfaceExtractorGuardError(name);
  };
}

function getHostDataDescriptors(value: object) {
  if (isHostProxy(value)) {
    return undefined;
  }
  try {
    return Object.getOwnPropertyDescriptors(value);
  } catch {
    return undefined;
  }
}

function hasDescriptorValue(descriptor: unknown): descriptor is PropertyDescriptor & { value: unknown } {
  return !!descriptor && typeof descriptor === 'object' && 'value' in descriptor;
}

function isHostProxy(value: unknown): value is object | Function {
  return Boolean(value) && (typeof value === 'object' || typeof value === 'function') && nodeUtilTypes.isProxy(value);
}

function createBlockedConstructor(name: string) {
  return class FlowSurfaceBlockedGlobal {
    constructor() {
      throw new FlowSurfaceExtractorGuardError(name);
    }
  };
}

function createBlockedPromise() {
  return class FlowSurfaceBlockedPromise {
    constructor() {
      throw new FlowSurfaceExtractorGuardError('Promise');
    }

    static all() {
      throw new FlowSurfaceExtractorGuardError('Promise.all');
    }

    static allSettled() {
      throw new FlowSurfaceExtractorGuardError('Promise.allSettled');
    }

    static any() {
      throw new FlowSurfaceExtractorGuardError('Promise.any');
    }

    static race() {
      throw new FlowSurfaceExtractorGuardError('Promise.race');
    }

    static reject() {
      throw new FlowSurfaceExtractorGuardError('Promise.reject');
    }

    static resolve() {
      throw new FlowSurfaceExtractorGuardError('Promise.resolve');
    }
  };
}

function createBlockedProxy(name: string) {
  return new Proxy(Object.create(null) as Record<PropertyKey, unknown>, {
    get(_target, property) {
      throw new FlowSurfaceExtractorGuardError(`${name}.${String(property)}`);
    },
    set(_target, property) {
      throw new FlowSurfaceExtractorGuardError(`${name}.${String(property)}`);
    },
    has(_target, property) {
      throw new FlowSurfaceExtractorGuardError(`${name}.${String(property)}`);
    },
  });
}

function createTimerGuard(name: string, maxTimerDelayMs: number) {
  return (_handler: unknown, timeout?: unknown) => {
    const delay = typeof timeout === 'number' ? timeout : 0;
    if (delay > maxTimerDelayMs) {
      throw new FlowSurfaceExtractorGuardError(`${name}:${delay}`);
    }
    throw new FlowSurfaceExtractorGuardError(name);
  };
}
