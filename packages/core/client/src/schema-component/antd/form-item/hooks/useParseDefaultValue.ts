import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
import { useRecordIndex } from '../../../../../src/record-provider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useCollectionRecord } from '../../../../data-source/collection-record/CollectionRecordProvider';
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
  const recordV2 = useCollectionRecord();
  const { isInAssignFieldValues, isInSetDefaultValueDialog, isInFormDataTemplate, isInSubTable, isInSubForm } =
    useFlag() || {};
  const { getField } = useCollection_deprecated();
  const { isSpecialCase, setDefaultValue } = useSpecialCase();
  const index = useRecordIndex();

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
    if (
      fieldSchema.default == null ||
      isInSetDefaultValueDialog ||
      isInFormDataTemplate ||
      isSubMode(fieldSchema) ||
      (!recordV2?.isNew && !isInAssignFieldValues)
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
        // 一个变量字符串如果显示出来会比较奇怪
        if (isVariable(field.value)) {
          await field.reset({ forceClear: true });
        }

        field.loading = true;
        const collectionField = !fieldSchema.name.toString().includes('.') && getField(fieldSchema.name);

        if (process.env.NODE_ENV !== 'production') {
          if (!collectionField) {
            console.error(`useParseDefaultValue: can not find field ${fieldSchema.name}`);
          }
        }

        const value = transformVariableValue(await variables.parseVariable(fieldSchema.default, localVariables), {
          targetCollectionField: collectionField,
        });

        if (value == null || value === '') {
          // fix https://nocobase.height.app/T-2805
          field.setInitialValue(null);
          await field.reset({ forceClear: true });
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

      _run();

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
      );

      return dispose;
    } else if (field.value == null && (isInSubTable || isInSubForm)) {
      // 解决子表格（或子表单）中新增一行数据时，默认值不生效的问题
      field.setValue(fieldSchema.default);
    }
  }, [fieldSchema.default, localVariables]);
};

export default useParseDefaultValue;
