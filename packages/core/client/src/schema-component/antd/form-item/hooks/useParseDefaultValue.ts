import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
import { useRecord, useRecordIndex } from '../../../../../src/record-provider';
import { useFormBlockType } from '../../../../block-provider/FormBlockProvider';
import { useCollection } from '../../../../collection-manager';
import { useFlag } from '../../../../flag-provider';
import { DEBOUNCE_WAIT, useLocalVariables, useVariables } from '../../../../variables';
import { getPath } from '../../../../variables/utils/getPath';
import { getVariableName } from '../../../../variables/utils/getVariableName';
import { isVariable } from '../../../../variables/utils/isVariable';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';
import { isSubMode } from '../../association-field/util';
import { isFromDatabase, useSpecialCase } from './useSpecialCase';

/**
 * 用于解析并设置 FormItem 的默认值
 */
const useParseDefaultValue = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const record = useRecord();
  const { isInAssignFieldValues, isInSetDefaultValueDialog, isInFormDataTemplate } = useFlag() || {};
  const { getField } = useCollection();
  const { isSpecialCase, setDefaultValue } = useSpecialCase();
  const index = useRecordIndex();
  const { type: formBlockType } = useFormBlockType();

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
      // 编辑状态下不需要设置默认值，否则会覆盖用户输入的值，只有新建状态下才需要设置默认值
      (formBlockType === 'update' && isFromDatabase(record) && !isInAssignFieldValues)
    ) {
      return;
    }

    const _run = async () => {
      // 如果默认值是一个变量，则需要解析之后再显示出来
      if (isVariable(fieldSchema.default) && variables && field) {
        // 一个变量字符串如果显示出来会比较奇怪
        if (isVariable(field.value)) {
          field.setValue(null);
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
          field.setValue(null);
        } else if (isSpecialCase()) {
          // 只需要设置一次就可以了
          if (index === 0) {
            setDefaultValue(value);
          }
        } else {
          // eslint-disable-next-line promise/catch-or-return
          Promise.resolve().then(() => {
            field.setInitialValue(value);
          });
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
        _run,
        {
          equals: (oldValue, newValue) => {
            field.setValue(newValue);
            return oldValue === newValue;
          },
        },
      );

      return dispose;
    }
  }, [fieldSchema.default]);
};

export default useParseDefaultValue;
