import { Field } from '@formily/core';
import { evaluators } from '@nocobase/evaluators/client';
import { uid } from '@nocobase/utils/client';
import _ from 'lodash';
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
  variables: VariablesContextType;
  localVariables: VariableOption[];
}

/**
 * 获取字段临时状态对象
 */
export async function getTempFieldState(condition: boolean | Promise<boolean>, value: any) {
  [condition, value] = await Promise.all([condition, value]);

  return {
    condition,
    value,
  };
}

export const collectFieldStateOfLinkageRules = ({
  operator,
  value,
  field,
  condition,
  variables,
  localVariables,
}: Props) => {
  const requiredResult = field?.stateOfLinkageRules?.required || [field?.initStateOfLinkageRules?.required];
  const displayResult = field?.stateOfLinkageRules?.display || [field?.initStateOfLinkageRules?.display];
  const patternResult = field?.stateOfLinkageRules?.pattern || [field?.initStateOfLinkageRules?.pattern];
  const valueResult = field?.stateOfLinkageRules?.value || [field?.initStateOfLinkageRules?.value];
  const { evaluate } = evaluators.get('formula.js');

  switch (operator) {
    case ActionType.Required:
      requiredResult.push(
        getTempFieldState(conditionAnalyses({ ruleGroup: condition, variables, localVariables }), true),
      );
      field.stateOfLinkageRules = {
        ...field.stateOfLinkageRules,
        required: requiredResult,
      };
      break;
    case ActionType.InRequired:
      requiredResult.push(
        getTempFieldState(conditionAnalyses({ ruleGroup: condition, variables, localVariables }), false),
      );
      field.stateOfLinkageRules = {
        ...field.stateOfLinkageRules,
        required: requiredResult,
      };
      break;
    case ActionType.Visible:
    case ActionType.None:
    case ActionType.Hidden:
      displayResult.push(
        getTempFieldState(conditionAnalyses({ ruleGroup: condition, variables, localVariables }), operator),
      );
      field.stateOfLinkageRules = {
        ...field.stateOfLinkageRules,
        display: displayResult,
      };
      break;
    case ActionType.Editable:
    case ActionType.ReadOnly:
    case ActionType.ReadPretty:
      patternResult.push(
        getTempFieldState(conditionAnalyses({ ruleGroup: condition, variables, localVariables }), operator),
      );
      field.stateOfLinkageRules = {
        ...field.stateOfLinkageRules,
        pattern: patternResult,
      };
      break;
    case ActionType.Value:
      {
        const getValue = async () => {
          if (value?.mode === 'express') {
            if ((value.value || value.result) == null) {
              return;
            }

            // 解析如 `{{$user.name}}` 之类的变量
            const { exp, scope: expScope } = await replaceVariables(value.value || value.result, {
              variables,
              localVariables,
            });

            try {
              const result = evaluate(exp, { now: () => new Date().toString(), ...expScope });
              return result;
            } catch (error) {
              console.error(error);
            }
          } else if (value?.mode === 'constant') {
            return value?.value || value;
          } else {
            return null;
          }
        };
        if (isConditionEmpty(condition)) {
          valueResult.push(getTempFieldState(true, getValue()));
        } else {
          valueResult.push(
            getTempFieldState(conditionAnalyses({ ruleGroup: condition, variables, localVariables }), getValue()),
          );
        }
        field.stateOfLinkageRules = {
          ...field.stateOfLinkageRules,
          value: valueResult,
        };
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
      return `{{${store[match] || match}}}`;
    }),
    scope,
  };
}

function isConditionEmpty(rules: { $and?: any; $or?: any }) {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];

  return _.isEmpty(conditions);
}
