import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import _ from 'lodash';
import { useEffect, useRef } from 'react';
import { useRecord } from '../../../../../src/record-provider';
import { useCollection } from '../../../../collection-manager';
import { DEBOUNCE_WAIT, useLocalVariables, useVariables } from '../../../../variables';
import { getPath } from '../../../../variables/utils/getPath';
import { getVariableName } from '../../../../variables/utils/getVariableName';
import { isVariable } from '../../../../variables/utils/isVariable';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';

/**
 * 用于解析并设置 FormItem 的默认值
 */
const useParseDefaultValue = () => {
  const field = useField<Field>();
  const schema = useFieldSchema();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const record = useRecord();

  // 需要保存 record 的初始值，因为设置默认值的时候 record 会被修改，导致初始值丢失
  const recordRef = useRef(_.omit(record, '__parent'));

  const { getField } = useCollection();

  useEffect(() => {
    // 根据 record 是否为空，判断当前是否是新建状态，编辑状态下不需要设置默认值，否则会覆盖用户输入的值，只有新建状态下才需要设置默认值
    if (schema.default == null || !_.isEmpty(recordRef.current)) {
      return;
    }

    const variableName = getVariableName(schema.default);
    const variableValue = localVariables.find((item) => item.name === variableName);
    const _run = async () => {
      // 如果默认值是一个变量，则需要解析之后再显示出来
      if (isVariable(schema.default) && variables && field) {
        // 一个变量字符串如果显示出来会比较奇怪
        if (isVariable(field.value)) {
          field.setValue(null);
        }

        field.loading = true;
        const collectionField = !schema.name.toString().includes('.') && getField(schema.name);

        if (process.env.NODE_ENV !== 'production') {
          if (!collectionField) {
            throw new Error(`useParseDefaultValue: can not find field ${schema.name}`);
          }
        }

        const value = transformVariableValue(await variables.parseVariable(schema.default, localVariables), {
          targetCollectionField: collectionField,
        });

        if (value == null || value === '') {
          field.setValue(null);
        } else {
          field.setInitialValue(value);
        }

        field.loading = false;

        // 如果不是一个有效的变量字符串（如：`{{ $user.name }}`）却依然包含 `{{` 和 `}}`，
        // 则可以断定是一个需要 compile（`useCompile` 返回的函数） 的字符串，这样的字符串会由 formily 自动解析，无需在这里赋值
      } else if (!/\{\{.+\}\}/g.test(schema.default) && field.setInitialValue) {
        field.setInitialValue(schema.default);
      }
    };

    // 使用防抖，提高性能和用户体验
    const run = _.debounce(_run, DEBOUNCE_WAIT);

    _run();

    // 实现联动的效果，当依赖的变量变化时（如 `$nForm` 变量），重新解析默认值
    const dispose = reaction(() => {
      if (isVariable(schema.default)) {
        return _.get({ [variableName]: variableValue?.ctx }, getPath(schema.default));
      }
    }, run);

    return dispose;
  }, [schema.default]);
};

export default useParseDefaultValue;
