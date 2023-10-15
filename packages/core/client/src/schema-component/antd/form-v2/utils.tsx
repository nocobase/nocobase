import { Field } from '@formily/core';
import { evaluators } from '@nocobase/evaluators/client';
import { uid } from '@nocobase/utils';
import _, { cloneDeep } from 'lodash';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { VariableOption, VariablesContextType } from '../../../variables/types';
import { REGEX_OF_VARIABLE } from '../../../variables/utils/isVariable';
import { conditionAnalyses } from '../../common/utils/uitls';

interface Props {
  operator;
  value;
  field: Field & {
    [key: string]: any;
  };
  condition;
  values;
  variables: VariablesContextType;
  localVariables: VariableOption[];
}

export const linkageMergeAction = async ({
  operator,
  value,
  field,
  condition,
  values,
  variables,
  localVariables,
}: Props) => {
  const { evaluate } = evaluators.get('formula.js');

  switch (operator) {
    case ActionType.Required:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field.required = true;
      } else {
        field.required = false;
      }
      break;
    case ActionType.InRequired:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field.required = false;
      } else {
        field.required = true;
      }
      break;
    case ActionType.Visible:
    case ActionType.None:
    case ActionType.Hidden:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field._display = '_display' in field ? field._display : field.display;
        field.display = operator;
      }
      break;
    case ActionType.Editable:
    case ActionType.ReadOnly:
    case ActionType.ReadPretty:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field._pattern = '_pattern' in field ? field._pattern : field.pattern;
        field.pattern = operator;
      } else {
        field.pattern = field._pattern;
      }
      break;
    case ActionType.Value:
      if (
        isConditionEmpty(condition) ||
        (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables }))
      ) {
        let result = null;
        if (value?.mode === 'express') {
          const scope = cloneDeep(values);

          // 1. 解析如 `{{$user.name}}` 之类的变量
          const { exp, scope: expScope } = await replaceVariables(value.value || value.result, {
            variables,
            localVariables,
          });

          try {
            // 2. TODO: 需要把里面解析变量的逻辑删除，因为在上一步已经解析过了
            result = evaluate(exp, { ...scope, now: () => new Date().toString(), ...expScope });
          } catch (error) {
            console.error(error);
          }
        } else if (value?.mode === 'constant') {
          result = value?.value || value;
        } else {
          result = null;
        }
        field._value = '_value' in field ? field._value : field.value;
        field.value = result === undefined ? field.value : result;
      } else {
        field.value = field._value;
      }
      break;
    default:
      return null;
  }
};

async function replaceVariables(
  value: string,
  {
    variables,
    localVariables,
  }: {
    variables: VariablesContextType;
    localVariables: VariableOption[];
  },
) {
  const store = {};
  const scope = {};

  const waitForParsing = value.match(REGEX_OF_VARIABLE)?.map(async (item) => {
    const result = await variables.parseVariable(item, localVariables);

    // 在开头加 `_` 是为了保证 id 不能以数字开头，否则在解析表达式的时候（不是解析变量）会报错
    const id = `_${uid()}`;

    scope[id] = result;
    store[item] = id;
    return result;
  });

  if (waitForParsing) {
    await Promise.all(waitForParsing);
  }

  return {
    exp: value.replace(REGEX_OF_VARIABLE, (match) => {
      return store[match] || match;
    }),
    scope,
  };
}

function isConditionEmpty(rules: { $and?: any; $or?: any }) {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];

  return _.isEmpty(conditions);
}
