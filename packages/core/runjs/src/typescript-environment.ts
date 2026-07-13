/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const RUNJS_TYPESCRIPT_ES_LIB_FILE_NAMES = [
  'lib.es2020.d.ts',
  'lib.es2019.d.ts',
  'lib.es2018.d.ts',
  'lib.es2017.d.ts',
  'lib.es2016.d.ts',
  'lib.es2015.d.ts',
  'lib.es5.d.ts',
  'lib.decorators.d.ts',
  'lib.decorators.legacy.d.ts',
  'lib.es2015.core.d.ts',
  'lib.es2015.collection.d.ts',
  'lib.es2015.iterable.d.ts',
  'lib.es2015.symbol.d.ts',
  'lib.es2015.generator.d.ts',
  'lib.es2015.promise.d.ts',
  'lib.es2015.proxy.d.ts',
  'lib.es2015.reflect.d.ts',
  'lib.es2015.symbol.wellknown.d.ts',
  'lib.es2016.array.include.d.ts',
  'lib.es2017.object.d.ts',
  'lib.es2017.sharedmemory.d.ts',
  'lib.es2017.string.d.ts',
  'lib.es2017.intl.d.ts',
  'lib.es2017.typedarrays.d.ts',
  'lib.es2018.asynciterable.d.ts',
  'lib.es2018.asyncgenerator.d.ts',
  'lib.es2018.promise.d.ts',
  'lib.es2018.regexp.d.ts',
  'lib.es2018.intl.d.ts',
  'lib.es2019.array.d.ts',
  'lib.es2019.object.d.ts',
  'lib.es2019.string.d.ts',
  'lib.es2019.symbol.d.ts',
  'lib.es2019.intl.d.ts',
  'lib.es2020.bigint.d.ts',
  'lib.es2020.intl.d.ts',
  'lib.es2020.date.d.ts',
  'lib.es2020.number.d.ts',
  'lib.es2020.promise.d.ts',
  'lib.es2020.sharedmemory.d.ts',
  'lib.es2020.string.d.ts',
  'lib.es2020.symbol.wellknown.d.ts',
] as const;

export const RUNJS_TYPESCRIPT_DOM_LIB_FILE_NAMES = ['lib.dom.d.ts', 'lib.dom.iterable.d.ts'] as const;

export const RUNJS_TYPESCRIPT_LIB_FILE_NAMES = [
  ...RUNJS_TYPESCRIPT_ES_LIB_FILE_NAMES,
  ...RUNJS_TYPESCRIPT_DOM_LIB_FILE_NAMES,
] as const;

export type RunJSTypeScriptLibFileName = (typeof RUNJS_TYPESCRIPT_LIB_FILE_NAMES)[number];

export interface RunJSTypeScriptLibSource {
  fileName: RunJSTypeScriptLibFileName;
  content: string;
}

export interface RunJSTypeScriptEnvironmentFile {
  path: string;
  content: string;
}

export const RUNJS_TYPESCRIPT_ES_LIB_PATH = '/__runjs__/lib.es2020.d.ts';
export const RUNJS_TYPESCRIPT_DOM_LIB_PATH = '/__runjs__/lib.dom.d.ts';
export const RUNJS_TYPESCRIPT_BROWSER_GLOBALS_PATH = '/__runjs__/browser-globals.d.ts';

const libReferenceDirective = /^\/\/\/\s*<reference\b[^>]*\/>\s*$/gmu;

export const RUNJS_TYPESCRIPT_DECLARED_GLOBAL_NAMES = new Set([
  'Array',
  'ArrayBuffer',
  'Atomics',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Blob',
  'Boolean',
  'BroadcastChannel',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'EventSource',
  'Float32Array',
  'Float64Array',
  'Function',
  'Infinity',
  'Int16Array',
  'Int32Array',
  'Int8Array',
  'Intl',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'ServiceWorker',
  'Set',
  'SharedArrayBuffer',
  'SharedWorker',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'URL',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'WeakMap',
  'WeakSet',
  'WebSocket',
  'Worker',
  'XMLHttpRequest',
  'caches',
  'clearInterval',
  'clearTimeout',
  'console',
  'ctx',
  'decodeURI',
  'decodeURIComponent',
  'document',
  'encodeURI',
  'encodeURIComponent',
  'escape',
  'eval',
  'fetch',
  'globalThis',
  'indexedDB',
  'isFinite',
  'isNaN',
  'localStorage',
  'location',
  'navigator',
  'parseFloat',
  'parseInt',
  'sessionStorage',
  'setInterval',
  'setTimeout',
  'undefined',
  'unescape',
  'window',
]);

export const RUNJS_TYPESCRIPT_BROWSER_GLOBALS_DECLARATION = `
declare var window: RunJSDOM.Window & typeof RunJSDOM & typeof globalThis;
declare var document: RunJSDOM.Document;
declare var navigator: RunJSDOM.Navigator;
declare var fetch: typeof RunJSDOM.fetch;
declare var localStorage: RunJSDOM.Storage;
declare var sessionStorage: RunJSDOM.Storage;
declare var XMLHttpRequest: typeof RunJSDOM.XMLHttpRequest;
declare var WebSocket: typeof RunJSDOM.WebSocket;
declare var Worker: typeof RunJSDOM.Worker;
declare var SharedWorker: typeof RunJSDOM.SharedWorker;
declare var ServiceWorker: typeof RunJSDOM.ServiceWorker;
declare var BroadcastChannel: typeof RunJSDOM.BroadcastChannel;
declare var EventSource: typeof RunJSDOM.EventSource;
declare var indexedDB: RunJSDOM.IDBFactory;
declare var caches: RunJSDOM.CacheStorage;
declare var Blob: typeof RunJSDOM.Blob;
declare var URL: typeof RunJSDOM.URL;
declare var location: RunJSDOM.Location;
declare var setTimeout: typeof RunJSDOM.setTimeout;
declare var clearTimeout: typeof RunJSDOM.clearTimeout;
declare var setInterval: typeof RunJSDOM.setInterval;
declare var clearInterval: typeof RunJSDOM.clearInterval;
`;

function stripLibReferences(content: string): string {
  return content.replace(libReferenceDirective, '');
}

function namespaceDOMLib(content: string): string {
  return stripLibReferences(content)
    .replace(/^declare\s+/gmu, '')
    .replace(/\btypeof globalThis\b/gu, 'typeof RunJSDOM & typeof globalThis');
}

export function buildRunJSTypeScriptEnvironmentFiles(
  sources: readonly RunJSTypeScriptLibSource[],
): RunJSTypeScriptEnvironmentFile[] {
  const sourceByFileName = new Map(sources.map((source) => [source.fileName, source.content]));
  const readSource = (fileName: RunJSTypeScriptLibFileName): string => {
    const content = sourceByFileName.get(fileName);
    if (typeof content !== 'string') {
      throw new Error(`Missing RunJS TypeScript standard library: ${fileName}`);
    }
    return content;
  };

  const esDeclaration = RUNJS_TYPESCRIPT_ES_LIB_FILE_NAMES.map((fileName) =>
    stripLibReferences(readSource(fileName)),
  ).join('\n');
  const domDeclaration = RUNJS_TYPESCRIPT_DOM_LIB_FILE_NAMES.map((fileName) =>
    namespaceDOMLib(readSource(fileName)),
  ).join('\n');

  return [
    {
      path: RUNJS_TYPESCRIPT_ES_LIB_PATH,
      content: esDeclaration,
    },
    {
      path: RUNJS_TYPESCRIPT_DOM_LIB_PATH,
      content: `declare namespace RunJSDOM {\n${domDeclaration}\n}`,
    },
    {
      path: RUNJS_TYPESCRIPT_BROWSER_GLOBALS_PATH,
      content: RUNJS_TYPESCRIPT_BROWSER_GLOBALS_DECLARATION,
    },
  ];
}
