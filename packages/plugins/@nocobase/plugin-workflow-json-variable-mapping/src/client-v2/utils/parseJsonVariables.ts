/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import uniqBy from 'lodash/uniqBy';
import { randomId } from '@nocobase/flow-engine';

import { ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_TITLE } from '../../contants';

export type JsonVariablePath = {
  key: string;
  path: string;
  name: string;
  paths: string[];
};

type ParseOptions = {
  parseArray: boolean;
  keys: string[];
  key: string;
};

type KeyFactory = () => string;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createVariablePath(keyFactory: KeyFactory, path: string, name: string, paths: string[]): JsonVariablePath {
  return {
    key: keyFactory(),
    path,
    name,
    paths,
  };
}

function transformArray(
  arr: unknown[],
  prefix: string,
  paths: JsonVariablePath[],
  options: ParseOptions,
  keyFactory: KeyFactory,
) {
  const { parseArray, keys, key } = options;

  if (parseArray) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (key !== ARRAY_KEY_IN_PATH) {
      paths.push(createVariablePath(keyFactory, currentPath, key, [...keys, key]));
    }
    getObjPaths(arr, currentPath, paths, { ...options, parseArray, keys: [...keys, key] }, keyFactory);
  } else {
    const currentPath = `${prefix ? prefix + (key === ARRAY_KEY_IN_PATH ? '' : '.') : ''}${
      key ? (key === ARRAY_KEY_IN_PATH ? ARRAY_KEY_IN_TITLE : key + ARRAY_KEY_IN_TITLE) : ''
    }`;
    if (key !== ARRAY_KEY_IN_PATH) {
      paths.push(
        createVariablePath(
          keyFactory,
          `${prefix ? prefix + (key === ARRAY_KEY_IN_PATH ? '' : '.') : ''}${key ? key : ''}`,
          key,
          [...keys, key],
        ),
      );
    }

    arr.forEach((item) => {
      const newKeys = [...keys];
      if (key) {
        newKeys.push(key);
      }
      if (key !== ARRAY_KEY_IN_PATH) {
        newKeys.push(ARRAY_KEY_IN_PATH);
      }

      if (Array.isArray(item)) {
        transformArray(item, currentPath, paths, { ...options, key: ARRAY_KEY_IN_PATH, keys: newKeys }, keyFactory);
      } else if (isPlainRecord(item)) {
        getObjPaths(item, currentPath, paths, { ...options, keys: [...newKeys] }, keyFactory);
      }
    });
  }

  return paths;
}

export function getObjPaths(
  obj: Record<string, unknown> | unknown[],
  prefix = '',
  paths: JsonVariablePath[] = [],
  options: Omit<ParseOptions, 'key'> & { key?: string } = { parseArray: false, keys: [] },
  keyFactory: KeyFactory = randomId,
) {
  const { parseArray, keys } = options;
  Object.keys(obj).forEach((key) => {
    const value = obj[key as keyof typeof obj];
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      transformArray(value, prefix, paths, { parseArray, keys, key }, keyFactory);
    } else if (isPlainRecord(value)) {
      paths.push(createVariablePath(keyFactory, currentPath, key, [...keys, key]));
      getObjPaths(value, currentPath, paths, { parseArray, keys: [...keys, key] }, keyFactory);
    } else {
      paths.push(createVariablePath(keyFactory, currentPath, key, [...keys, key]));
    }
  });

  return paths;
}

export function parseJsonVariables(value: unknown, parseArray: boolean, keyFactory: KeyFactory = randomId) {
  let keyPaths: JsonVariablePath[] = [];

  if (Array.isArray(value)) {
    keyPaths = transformArray(
      value,
      '',
      [],
      {
        parseArray,
        keys: [],
        key: ARRAY_KEY_IN_PATH,
      },
      keyFactory,
    );
  } else if (isPlainRecord(value)) {
    keyPaths = getObjPaths(
      value,
      '',
      [],
      {
        parseArray,
        keys: [],
      },
      keyFactory,
    );
  }

  return uniqBy(keyPaths, 'path');
}
