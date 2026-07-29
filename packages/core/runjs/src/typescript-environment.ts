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

export const RUNJS_TYPESCRIPT_DOM_LIB_FILE_NAMES = ['lib.dom.d.ts'] as const;

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
export const RUNJS_TYPESCRIPT_REACT_NAMESPACE_PATH = '/__runjs__/react-types.d.ts';

const runJSTypeScriptReactNamespaceDeclaration = `
export = React;
export as namespace React;

declare namespace React {
  type Key = string | number;
  type ReactText = string | number;
  type ReactNode = unknown;
  type ComponentType<P = Record<string, unknown>> =
    | ((props: P) => ReactNode)
    | (new (props: P) => unknown);
  type FC<P = Record<string, unknown>> = (props: P) => ReactNode;
  type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
  type SetStateAction<S> = S | ((previousState: S) => S);
  type Dispatch<A> = (value: A) => void;
  type CSSProperties = Record<string, string | number | undefined>;

  interface ReactElement<P = unknown, T = unknown> {
    readonly type: T;
    readonly props: P;
    readonly key: Key | null;
  }

  interface RefObject<T> {
    readonly current: T | null;
  }

  interface MutableRefObject<T> {
    current: T;
  }

  interface SyntheticEvent<T = unknown> {
    readonly currentTarget: T;
    readonly target: unknown;
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface ChangeEvent<T = unknown> extends SyntheticEvent<T> {}
  interface MouseEvent<T = unknown> extends SyntheticEvent<T> {}
  interface KeyboardEvent<T = unknown> extends SyntheticEvent<T> {
    readonly key: string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      key?: React.Key | null;
    }
  }
}
`;

const libReferenceDirective = /^\/\/\/\s*<reference\b[^>]*\/>\s*$/gmu;

export const RUNJS_TYPESCRIPT_DECLARED_GLOBAL_NAMES = new Set([
  'Array',
  'ArrayBuffer',
  'Atomics',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
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
  'Set',
  'SharedArrayBuffer',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'WeakMap',
  'WeakSet',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'escape',
  'eval',
  'globalThis',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'undefined',
  'unescape',
]);

function stripLibReferences(content: string): string {
  return content.replace(libReferenceDirective, '');
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
    stripLibReferences(readSource(fileName)),
  ).join('\n');
  return [
    {
      path: RUNJS_TYPESCRIPT_ES_LIB_PATH,
      content: esDeclaration,
    },
    {
      path: RUNJS_TYPESCRIPT_DOM_LIB_PATH,
      content: domDeclaration,
    },
    {
      path: RUNJS_TYPESCRIPT_REACT_NAMESPACE_PATH,
      content: runJSTypeScriptReactNamespaceDeclaration,
    },
  ];
}
