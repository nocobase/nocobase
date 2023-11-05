import { Field } from '@formily/core';
import { evaluators } from '@nocobase/evaluators/client';
import { uid } from '@nocobase/utils';
import _, { cloneDeep, last } from 'lodash';
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
  const requiredResult = field?.linkageProperty?.required || [field?.initProperty?.required || false];
  const displayResult = field?.linkageProperty?.display || [field?.initProperty?.display];
  const patternResult = field?.linkageProperty?.pattern || [field?.initProperty?.pattern];
  const valueResult = field?.linkageProperty?.value || [field?.initProperty?.value];
  const { evaluate } = evaluators.get('formula.js');

  switch (operator) {
    case ActionType.Required:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        requiredResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      return new Promise((resolve) => {
        setTimeout(() => {
          field.required = last(field.linkageProperty.required);
        });
        resolve(void 0);
      });
    case ActionType.InRequired:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        requiredResult.push(false);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      return new Promise((resolve) => {
        setTimeout(() => {
          field.required = last(field.linkageProperty.required);
        });
        resolve(void 0);
      });
    case ActionType.Visible:
    case ActionType.None:
    case ActionType.Hidden:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        displayResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        display: displayResult,
      };
      return new Promise((resolve) => {
        setTimeout(() => {
          field.display = last(displayResult);
        });
        resolve(void 0);
      });
    case ActionType.Editable:
    case ActionType.ReadOnly:
    case ActionType.ReadPretty:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        patternResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        pattern: patternResult,
      };
      return new Promise((resolve) => {
        setTimeout(() => {
          field.pattern = last(patternResult);
        });
        resolve(void 0);
      });
    case ActionType.Value:
      if (
        isConditionEmpty(condition) ||
        (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables }))
      ) {
        if (value?.mode === 'express') {
          if ((value.value || value.result) == null) {
            return;
          }

          const scope = cloneDeep(values);

          // 1. 解析如 `{{$user.name}}` 之类的变量
          const { exp, scope: expScope } = await replaceVariables(value.value || value.result, {
            variables,
            localVariables,
          });

          try {
            // 2. TODO: 需要把里面解析变量的逻辑删除，因为在上一步已经解析过了
            const result = evaluate(exp, { ...scope, now: () => new Date().toString(), ...expScope });
            valueResult.push(result);
          } catch (error) {
            console.error(error);
          }
        } else if (value?.mode === 'constant') {
          valueResult.push(value?.value || value);
        } else {
          valueResult.push(null);
        }

        field.linkageProperty = {
          ...field.linkageProperty,
          value: valueResult,
        };

        if (last(valueResult) !== undefined) {
          field.value = last(valueResult);
        }
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

  if (value == null) {
    return;
  }

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
