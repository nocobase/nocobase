/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
import { useRecordIndex } from '../../../../../src/record-provider';
import { useOperators } from '../../../../block-provider/CollectOperators';
import { useFormBlockContext } from '../../../../block-provider/FormBlockProvider';
import { InheritanceCollectionMixin } from '../../../../collection-manager';
import { useCollectionRecord } from '../../../../data-source/collection-record/CollectionRecordProvider';
import { useCollection } from '../../../../data-source/collection/CollectionProvider';
import { DataSourceManager } from '../../../../data-source/data-source/DataSourceManager';
import { useDataSourceManager } from '../../../../data-source/data-source/DataSourceManagerProvider';
import { useFlag } from '../../../../flag-provider';
import { DEBOUNCE_WAIT, useLocalVariables, useVariables } from '../../../../variables';
import { getPath } from '../../../../variables/utils/getPath';
import { getVariableName } from '../../../../variables/utils/getVariableName';
import { isVariable } from '../../../../variables/utils/isVariable';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';
import { isSubMode } from '../../association-field/util';
import { useSpecialCase } from './useSpecialCase';

/**
 * 用于解析并设置 FormItem 的默认值
 */
const useParseDefaultValue = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const record = useCollectionRecord();
  const { isInAssignFieldValues, isInSetDefaultValueDialog, isInFormDataTemplate, isInSubTable, isInSubForm } =
    useFlag() || {};
  const collection = useCollection();
  const { isSpecialCase, setDefaultValue } = useSpecialCase();
  const index = useRecordIndex();
  const { type, form } = useFormBlockContext();
  const { getOperator } = useOperators();
  const dm = useDataSourceManager();

  /**
   * name: 如 $user
   */
  const findVariable = useCallback(
    (name: string) => {
      let result = variables?.getVariable(name);
      if (!result) {
        result = localVariables.find((item) => item.name === name);
      }
      return result;
    },
    [localVariables, variables],
  );

  useEffect(() => {
    // fix https://tasks.aliyun.nocobase.com/admin/ugmnj2ycfgg/popups/1qlw5c38t3b/puid/dz42x7ffr7i/filterbytk/182
    // to clear the default value of the field
    if (type === 'update' && fieldSchema.default && field.form === form) {
      field.setValue?.(record?.data?.[fieldSchema.name]);
    }

    if (
      fieldSchema.default == null ||
      isInSetDefaultValueDialog ||
      isInFormDataTemplate ||
      isSubMode(fieldSchema) ||
      (!record?.isNew && !isInAssignFieldValues)
    ) {
      return;
    }

    const _run = async ({ forceUpdate = false } = {}) => {
      // 如果默认值是一个变量，则需要解析之后再显示出来
      if (
        variables &&
        field &&
        ((isVariable(fieldSchema.default) && field.value == null) || field.value === fieldSchema.default || forceUpdate)
      ) {
        field.loading = true;
        const collectionField = !fieldSchema.name.toString().includes('.') && collection?.getField(fieldSchema.name);

        if (process.env.NODE_ENV !== 'production') {
          if (!collectionField) {
            console.error(`useParseDefaultValue: can not find field ${fieldSchema.name}`);
          }
        }

        const {
          value: parsedValue,
          collectionName: collectionNameOfVariable,
          dataSource = 'main',
        } = await variables.parseVariable(fieldSchema.default, localVariables, {
          fieldOperator: getOperator(fieldSchema.name),
        });

        if (
          collectionField?.target &&
          collectionNameOfVariable &&
          collectionField.target !== collectionNameOfVariable &&
          !isInherit({
            collectionName: collectionField.target,
            targetCollectionName: collectionNameOfVariable,
            dm,
            dataSource,
          })
        ) {
          field.loading = false;
          return;
        }

        const value = transformVariableValue(parsedValue, {
          targetCollectionField: collectionField,
        });

        if (value == null || value === '') {
          // 如果 field.mounted 为 false，说明 field 已经被卸载了，不需要再设置默认值
          if (field.mounted) {
            field.setInitialValue(null);
          }
        } else if (isSpecialCase()) {
          // 只需要设置一次就可以了
          if (index === 0) {
            setDefaultValue(value);
          }
        } else {
          field.setInitialValue(value);
        }

        field.loading = false;

        // 如果不是一个有效的变量字符串（如：`{{ $user.name }}`）却依然包含 `{{` 和 `}}`，
        // 则可以断定是一个需要 compile（`useCompile` 返回的函数） 的字符串，这样的字符串会由 formily 自动解析，无需在这里赋值
      } else if (!/\{\{.+\}\}/g.test(fieldSchema.default) && field.setInitialValue) {
        field.setInitialValue(fieldSchema.default);
      }
    };

    // 使用防抖，提高性能和用户体验
    const run = _.debounce(_run, DEBOUNCE_WAIT);

    if (isVariable(fieldSchema.default)) {
      const variableName = getVariableName(fieldSchema.default);
      const variable = findVariable(variableName);

      if (!variable) {
        return console.error(`useParseDefaultValue: can not find variable ${variableName}`);
      }

      _run({ forceUpdate: true });

      // 实现联动的效果，当依赖的变量变化时（如 `$nForm` 变量），重新解析默认值
      const dispose = reaction(
        () => {
          const obj = { [variableName]: variable?.ctx || {} };
          const path = getPath(fieldSchema.default);
          const value = getValuesByPath(obj, path);
          // fix https://nocobase.height.app/T-2212
          if (value === undefined) {
            // 返回一个随机值，确保能触发 run 函数
            return Math.random();
          }

          return value;
        },
        () => run({ forceUpdate: true }),
        {
          equals: _.isEqual,
        },
      );

      return dispose;
    } else if (field.value == null && (isInSubTable || isInSubForm)) {
      // 解决子表格（或子表单）中新增一行数据时，默认值不生效的问题
      field.setValue(fieldSchema.default);
    }
  }, [fieldSchema.default, localVariables, type, getOperator, dm, collection]);
};

export default useParseDefaultValue;

/**
 * Determine if there is an inheritance relationship between two data tables
 * @param param0
 * @returns
 */
const isInherit = ({
  collectionName,
  targetCollectionName,
  dm,
  dataSource,
}: {
  collectionName: string;
  targetCollectionName: string;
  dm: DataSourceManager;
  dataSource: string;
}) => {
  const cm = dm?.getDataSource(dataSource)?.collectionManager;
  return cm
    ?.getCollection<InheritanceCollectionMixin>(collectionName)
    ?.getAllCollectionsInheritChain()
    ?.includes(targetCollectionName);
};
