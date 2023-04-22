import JSON5 from 'json5';
import { uid } from '@formily/shared';
import isPlainObject from 'lodash/isPlainObject';
import type { Schema } from '@formily/react';

const SCHEMA_EXPRESSION_RE = /^\s*\{\{([\s\S]*)\}\}\s*$/

const validateArray = (value) => {
  try {
    value = JSON5.parse(value);
  } catch (e) {
    return 'Please input validate dataset';
  }
  if (Array.isArray(value)) {
    if (
      value.every((item) => {
        return typeof item === 'object' && Object.keys(item).length > 1;
      })
    )
      return true;
  }
  return 'Please input validate dataset';
};

const parseDataSetString = (str) => {
  const dataSetDataArray = JSON5.parse(str);
  if (Array.isArray(dataSetDataArray)) {
    if (
      dataSetDataArray.every((item) => {
        return typeof item === 'object' && Object.keys(item).length > 1;
      })
    )
      dataSetDataArray.map((item) => {
        if (!item?.id) {
          item.id = uid();
        }
        return item;
      });
  }
  return dataSetDataArray;
};

export function compileWithKeys(compiler: typeof Schema['compile']) {
  function compile (...params: Parameters<typeof Schema['compile']>) {
    const result = compiler(...params);

    compileKeys(result, params[1]);

    return result;
  }

  function compileKeys(source: any, scope: any) {
    const keys = Object.keys(source);

    keys.forEach((key) => {
      if (key.match(SCHEMA_EXPRESSION_RE)) {
        const compiledKey = compiler(key, scope);
        source[compiledKey] = source[key];
        delete source[key];
      } else if (Array.isArray(source[key])) {
        source[key].forEach((item) => {
          compileKeys(item, scope);
        });
      } else if (isPlainObject(source[key])) {
        compileKeys(source[key], scope);
      } else {
        // pass
      }
    });
  }

  return compile;
}

export { validateArray, parseDataSetString };
