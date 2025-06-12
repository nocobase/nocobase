/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { untracked } from '@formily/reactive';
import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAPIClient } from '../api-client';
import type { CollectionFieldOptions_deprecated } from '../collection-manager';
import { useCollectionManager_deprecated } from '../collection-manager';
import { getDataSourceHeaders } from '../data-source/utils';
import { useCompile } from '../schema-component';
import useBuiltInVariables from './hooks/useBuiltinVariables';
import { VariableOption, VariablesContextType } from './types';
import { filterEmptyValues } from './utils/filterEmptyValues';
import { getAction } from './utils/getAction';
import { getPath } from './utils/getPath';
import { clearRequested, getRequested, hasRequested, stashRequested } from './utils/hasRequested';
import { isVariable } from './utils/isVariable';
import { uniq } from './utils/uniq';

export const VariablesContext = createContext<VariablesContextType>(null);
VariablesContext.displayName = 'VariablesContext';

const variablesStore: Record<string, VariableOption> = {};

const getFieldPath = (variablePath: string, variablesStore: Record<string, VariableOption>) => {
  let dataSource;
  let variableOption: VariableOption;
  const list = variablePath.split('.');
  const result = list.map((item) => {
    if (variablesStore[item]) {
      dataSource = variablesStore[item].dataSource;
      variableOption = variablesStore[item];
      return variablesStore[item].collectionName;
    }
    return item;
  });
  return {
    fieldPath: result.join('.'),
    dataSource,
    variableOption,
  };
};

/**
 * @internal
 * Note: There can only be one VariablesProvider in the entire context. It cannot be used in plugins.
 */
const VariablesProvider = ({ children, filterVariables }: any) => {
  const ctxRef = useRef<Record<string, any>>({});
  const api = useAPIClient();
  const { getCollectionJoinField, getCollection } = useCollectionManager_deprecated();
  const compile = useCompile();
  const { builtinVariables } = useBuiltInVariables();
  const setCtx = useCallback((ctx: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    if (_.isFunction(ctx)) {
      ctxRef.current = ctx(ctxRef.current);
    } else {
      ctxRef.current = ctx;
    }
  }, []);

  /**
   * 1. Get value from `ctx` based on `path`
   * 2. If a `key` does not exist and is an association field, fetch data from api and cache it in `ctx`
   * 3. If a `key` does not exist and is not an association field, return the current value
   */
  const getResult = useCallback(
    async (
      variablePath: string,
      localVariables?: VariableOption[],
      options?: {
        /** Related fields that need to be included in the first request */
        appends?: string[];
        /** Do not request when the association field is empty */
        doNotRequest?: boolean;
        /**
         * The operator related to the current field, provided when parsing the default value of the field
         */
        fieldOperator?: string | void;
      },
    ) => {
      const list = variablePath.split('.');
      const variableName = list[0];
      const _variableToCollectionName = mergeVariableToCollectionNameWithLocalVariables(variablesStore, localVariables);
      let current = mergeCtxWithLocalVariables(ctxRef.current, localVariables);
      const { fieldPath, dataSource, variableOption } = getFieldPath(variableName, _variableToCollectionName);
      let collectionName = fieldPath;

      const { fieldPath: fieldPathOfVariable } = getFieldPath(variablePath, _variableToCollectionName);
      const collectionNameOfVariable =
        list.length === 1
          ? variableOption?.collectionName
          : getCollectionJoinField(fieldPathOfVariable, dataSource)?.target;

      if (!(variableName in current)) {
        throw new Error(`VariablesProvider: ${variableName} is not found`);
      }

      for (let index = 0; index < list.length; index++) {
        if (current == null) {
          return {
            value: current === undefined ? variableOption?.defaultValue : current,
            dataSource,
            collectionName: collectionNameOfVariable,
          };
        }

        const key = list[index];
        const currentVariablePath = list.slice(0, index + 1).join('.');
        const { fieldPath } = getFieldPath(currentVariablePath, _variableToCollectionName);
        const associationField: CollectionFieldOptions_deprecated = getCollectionJoinField(fieldPath, dataSource);
        const collectionPrimaryKey = getCollection(collectionName, dataSource)?.getPrimaryKey();
        if (Array.isArray(current)) {
          const result = current.map((item) => {
            if (
              !options?.doNotRequest &&
              shouldToRequest(item?.[key], item, currentVariablePath) &&
              item?.[collectionPrimaryKey] != null
            ) {
              if (associationField?.target) {
                const url = `/${collectionName}/${
                  item[associationField.sourceKey || collectionPrimaryKey]
                }/${key}:${getAction(associationField.type)}`;
                if (hasRequested(url)) {
                  return getRequested(url);
                }
                const result = api
                  .request({
                    headers: getDataSourceHeaders(dataSource),
                    url,
                    params: {
                      appends: options?.appends,
                    },
                  })
                  .then((data) => {
                    clearRequested(url);
                    const value = data.data.data;
                    return value;
                  });
                stashRequested(url, result);
                return result;
              }
            }
            return item?.[key];
          });
          current = removeThroughCollectionFields(_.flatten(await Promise.all(result)), associationField);
        } else if (
          !options?.doNotRequest &&
          shouldToRequest(current[key], current, currentVariablePath) &&
          current[collectionPrimaryKey] != null &&
          associationField?.target
        ) {
          const url = `/${collectionName}/${
            current[associationField.sourceKey || collectionPrimaryKey]
          }/${key}:${getAction(associationField.type)}`;
          let data = null;
          if (hasRequested(url)) {
            data = await getRequested(url);
          } else {
            const waitForData = api.request({
              headers: getDataSourceHeaders(dataSource),
              url,
              params: {
                appends: options?.appends,
              },
            });
            stashRequested(url, waitForData);
            data = await waitForData;
            clearRequested(url);
          }

          const value = data.data.data;
          current = removeThroughCollectionFields(value, associationField);
        } else {
          current = removeThroughCollectionFields(getValuesByPath(current, key), associationField);
        }

        if (associationField?.target) {
          collectionName = associationField.target;
        }
      }

      const _value = compile(
        _.isFunction(current) ? current({ fieldOperator: options?.fieldOperator, isParsingVariable: true }) : current,
      );
      return {
        value: _value === undefined ? variableOption.defaultValue : _value,
        dataSource,
        collectionName: collectionNameOfVariable,
      };
    },
    [getCollectionJoinField],
  );

  /**
   * Register a global variable
   */
  const registerVariable = useCallback(
    (variableOption: VariableOption) => {
      if (!isVariable(`{{${variableOption.name}}}`)) {
        throw new Error(`VariablesProvider: ${variableOption.name} is not a valid name`);
      }

      setCtx((prev) => {
        return {
          ...prev,
          [variableOption.name]: variableOption.ctx,
        };
      });
      variablesStore[variableOption.name] = {
        ...variableOption,
        defaultValue: _.has(variableOption, 'defaultValue') ? variableOption.defaultValue : null,
      };
    },
    [setCtx],
  );

  const getVariable = useCallback((variableName: string): VariableOption => {
    if (!ctxRef.current[variableName]) {
      return null;
    }

    return {
      ...variablesStore[variableName],
    };
  }, []);

  const removeVariable = useCallback(
    (variableName: string) => {
      setCtx((prev) => {
        const next = { ...prev };
        delete next[variableName];
        return next;
      });
      delete variablesStore[variableName];
    },
    [setCtx],
  );

  const parseVariable = useCallback(
    /**
     * Parse the variable string to the actual value
     * @param str Variable string
     * @param localVariables Local variables, will be cleared after parsing
     * @returns
     */
    async (
      str: string,
      localVariables?: VariableOption | VariableOption[],
      options?: {
        /** Related fields that need to be included in the first request */
        appends?: string[];
        /** Do not request when the association field is empty */
        doNotRequest?: boolean;
        /**
         * The operator related to the current field, provided when parsing the default value of the field
         */
        fieldOperator?: string | void;
      },
    ) => {
      if (!isVariable(str)) {
        return str;
      }

      if (localVariables) {
        localVariables = _.isArray(localVariables) ? localVariables : [localVariables];
      }

      const path = getPath(str);
      const result = await getResult(path, localVariables as VariableOption[], options);

      return {
        ...result,
        value: uniq(filterEmptyValues(result.value)),
      };
    },
    [getResult],
  );

  const getCollectionField = useCallback(
    async (variableString: string, localVariables?: VariableOption | VariableOption[]) => {
      if (!isVariable(variableString)) {
        throw new Error(`VariablesProvider: ${variableString} is not a variable string`);
      }

      if (localVariables) {
        localVariables = _.isArray(localVariables) ? localVariables : [localVariables];
      }

      const _variableToCollectionName = mergeVariableToCollectionNameWithLocalVariables(
        variablesStore,
        localVariables as VariableOption[],
      );
      const path = getPath(variableString);
      const { fieldPath, dataSource } = getFieldPath(path, _variableToCollectionName);
      let result = getCollectionJoinField(fieldPath, dataSource);

      // When there is only a string like `$user`, a fake `collectionField` needs to be returned
      if (!result && !path.includes('.')) {
        result = {
          target: _variableToCollectionName[path]?.collectionName,
        };
      }

      return result;
    },
    [getCollectionJoinField],
  );

  useEffect(() => {
    builtinVariables.forEach((variableOption) => {
      registerVariable({
        ...variableOption,
        defaultValue: _.has(variableOption, 'defaultValue') ? variableOption.defaultValue : null,
      });
    });
  }, [builtinVariables, registerVariable]);

  const value = useMemo(
    () =>
      ({
        ctxRef,
        setCtx,
        parseVariable,
        registerVariable,
        getVariable,
        getCollectionField,
        removeVariable,
        filterVariables,
      }) as VariablesContextType,
    [getCollectionField, getVariable, parseVariable, registerVariable, removeVariable, setCtx],
  );

  return <VariablesContext.Provider value={value}>{children}</VariablesContext.Provider>;
};

VariablesProvider.displayName = 'VariablesProvider';

export default VariablesProvider;

function shouldToRequest(value, variableCtx: Record<string, any>, variablePath: string) {
  if (
    variablePath.split('.').length === 2 &&
    (variablePath.startsWith('$nForm.') || variablePath.startsWith('$iteration.'))
  ) {
    return false;
  }

  let result = false;

  // value may be a reactive object, using untracked to avoid unexpected autorun
  untracked(() => {
    // Compatible with `xxx to many` and `xxx to one` subform fields and subtable fields
    if (JSON.stringify(value) === '[{}]' || JSON.stringify(value) === '{}') {
      result = true;
      return;
    }

    result = _.isEmpty(value);
  });

  return result;
}

function mergeCtxWithLocalVariables(ctx: Record<string, any>, localVariables?: VariableOption[]) {
  ctx = { ...ctx };

  localVariables?.forEach((item) => {
    ctx[item.name] = item.ctx;
  });

  return ctx;
}

function mergeVariableToCollectionNameWithLocalVariables(
  variablesStore: Record<string, VariableOption>,
  localVariables?: VariableOption[],
) {
  variablesStore = { ...variablesStore };

  localVariables?.forEach((item) => {
    variablesStore[item.name] = {
      ...item,
      defaultValue: _.has(item, 'defaultValue') ? item.defaultValue : null,
    };
  });

  return variablesStore;
}

/**
 * Remove `through collection fields` from association fields.
 * If `through collection fields` exist in association fields when creating new records,
 * it will cause errors during submission, so they need to be removed.
 * @param value
 * @param associationField
 * @returns
 */
export function removeThroughCollectionFields(
  value: Record<string, any> | Record<string, any>[],
  associationField: CollectionFieldOptions_deprecated,
) {
  if (!associationField?.through || !value) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      return _.omit(item, associationField.through);
    });
  }
  return _.omit(value, associationField.through);
}
