import { IGeneralFieldState } from '@formily/core';
import type { ISchema } from '@formily/react';
import { Schema } from '@formily/react';
import { hasCollected, untracked } from '@formily/reactive';
import { each, FormPath, isArr, isFn, isPlainObj, isStr, reduce, toArr } from '@formily/shared';
import { SchemaNestedMap, SchemaStateMap, SchemaValidatorMap } from './utils';

const hasOwnProperty = Object.prototype.hasOwnProperty;

const REVA_ACTIONS_KEY = Symbol.for('__REVA_ACTIONS');
const ProxyRaw = new WeakMap();
const isNoNeedCompileObject = (source: any) => {
  if ('$$typeof' in source && '_owner' in source) {
    return true;
  }
  if (source['_isAMomentObject']) {
    return true;
  }
  if (Schema.isSchemaInstance(source)) {
    return true;
  }
  if (source[REVA_ACTIONS_KEY]) {
    return true;
  }
  if (isFn(source['toJS'])) {
    return true;
  }
  if (isFn(source['toJSON'])) {
    return true;
  }
  if (ProxyRaw.has(source)) {
    return true;
  }
  return false;
};

const patchStateFormSchema = (targetState: any, pattern: any[], compiled: any) => {
  untracked(() => {
    const path = FormPath.parse(pattern);
    const segments = path.segments;
    const key = segments[0];
    const isEnum = key === 'enum' && isArr(compiled);
    const schemaMapKey = SchemaStateMap[key];
    if (schemaMapKey) {
      FormPath.setIn(
        targetState,
        [schemaMapKey].concat(segments.slice(1)),
        isEnum ? createDataSource(compiled) : compiled,
      );
    } else {
      const isValidatorKey = SchemaValidatorMap[key];
      if (isValidatorKey) {
        targetState['setValidatorRule']?.(key, compiled);
      }
    }
  });
};

const createDataSource = (source: any[]) => {
  return toArr(source).map((item) => {
    if (typeof item === 'object') {
      return item;
    } else {
      return {
        label: item,
        value: item,
      };
    }
  });
};

const traverse = (target: any, visitor: (value: any, path: Array<string | number>) => void) => {
  const seenObjects = [];
  const root = target;
  const traverse = (target: any, path = []) => {
    if (isPlainObj(target)) {
      const seenIndex = seenObjects.indexOf(target);
      if (seenIndex > -1) {
        return;
      }
      const addIndex = seenObjects.length;
      seenObjects.push(target);
      if (isNoNeedCompileObject(target) && root !== target) {
        visitor(target, path);
        return;
      }
      each(target, (value, key) => {
        traverse(value, path.concat(key));
      });
      seenObjects.splice(addIndex, 1);
    } else {
      visitor(target, path);
    }
  };
  traverse(target);
};

const traverseSchema = (schema: ISchema, visitor: (value: any, path: any[]) => void) => {
  if (schema['x-validator'] !== undefined) {
    visitor(schema['x-validator'], ['x-validator']);
  }
  const seenObjects = [];
  const root = schema;
  const traverse = (target: any, path = []) => {
    if (path[0] === 'x-validator' || path[0] === 'version' || path[0] === '_isJSONSchemaObject') return;
    if (String(path[0]).indexOf('x-') == -1 && isFn(target)) return;
    if (SchemaNestedMap[path[0]]) return;
    if (isPlainObj(target)) {
      if (path[0] === 'default' || path[0] === 'x-value') {
        visitor(target, path);
        return;
      }
      const seenIndex = seenObjects.indexOf(target);
      if (seenIndex > -1) {
        return;
      }
      const addIndex = seenObjects.length;
      seenObjects.push(target);
      if (isNoNeedCompileObject(target) && root !== target) {
        visitor(target, path);
        return;
      }
      each(target, (value, key) => {
        traverse(value, path.concat(key));
      });
      seenObjects.splice(addIndex, 1);
    } else {
      visitor(target, path);
    }
  };
  traverse(schema);
};

const ExpRE = /\{\{([\s\S]*?)\}\}/;
const Registry = {
  silent: false,
  compile(expression: string, scope = {}) {
    if (Registry.silent) {
      try {
        return new Function('$root', `with($root) { return (${expression}); }`)(scope);
      } catch {}
    } else {
      return new Function('$root', `with($root) { return (${expression}); }`)(scope);
    }
  },
};

export const silent = (value = true) => {
  Registry.silent = !!value;
};

export const registerCompiler = (compiler: (expression: string, scope: any) => any) => {
  if (isFn(compiler)) {
    Registry.compile = compiler;
  }
};

export const shallowCompile = <Source = any, Scope = any>(source: Source, scope?: Scope) => {
  if (isStr(source)) {
    const matched = source.match(ExpRE);
    if (!matched) {
      return source;
    }
    const value = Registry.compile(matched[1], scope);
    const newSource = source.replace(ExpRE, value);
    return shallowCompile(newSource, scope);
  }
  return source;
};

export const compile = <Source = any, Scope = any>(source: Source, scope?: Scope): any => {
  const seenObjects = [];
  const compile = (source: any) => {
    if (isStr(source)) {
      return shallowCompile(source, scope);
    } else if (isArr(source)) {
      return source.map((value: any) => compile(value));
    } else if (isPlainObj(source)) {
      if (isNoNeedCompileObject(source)) return source;
      const seenIndex = seenObjects.indexOf(source);
      if (seenIndex > -1) {
        return source;
      }
      const addIndex = seenObjects.length;
      seenObjects.push(source);
      const results = reduce(
        source,
        (buf, value, key) => {
          buf[key] = compile(value);
          return buf;
        },
        {},
      );
      seenObjects.splice(addIndex, 1);
      return results;
    }
    return source;
  };
  return compile(source);
};

export const patchCompile = (targetState: IGeneralFieldState, sourceState: any, scope: any) => {
  traverse(sourceState, (value, pattern) => {
    const path = FormPath.parse(pattern);
    const compiled = compile(value, scope);
    const key = path.segments[0];
    if (compiled === undefined) return;
    if (hasOwnProperty.call(targetState, key)) {
      untracked(() => FormPath.setIn(targetState, path, compiled));
    }
  });
};

export const patchSchemaCompile = (
  targetState: IGeneralFieldState,
  sourceSchema: ISchema,
  scope: any,
  demand = false,
) => {
  traverseSchema(sourceSchema, (value, path) => {
    let compiled = value;
    let collected = hasCollected(() => {
      compiled = compile(value, scope);
    });
    if (compiled === undefined) return;
    if (demand) {
      if (collected || !targetState.initialized) {
        patchStateFormSchema(targetState, path, compiled);
      }
    } else {
      patchStateFormSchema(targetState, path, compiled);
    }
  });
};
