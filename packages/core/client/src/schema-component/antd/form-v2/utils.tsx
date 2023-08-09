import { Field } from '@formily/core';
import { evaluators } from '@nocobase/evaluators/client';
import { cloneDeep } from 'lodash';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { VariableOption, VariablesContextType } from '../../../variables/types';
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
        field._display = field._display || field.display;
        field.display = operator;
      } else {
        field.display = field._display;
      }
      break;
    case ActionType.Editable:
    case ActionType.ReadOnly:
    case ActionType.ReadPretty:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field._pattern = field._pattern || field.pattern;
        field.pattern = operator;
      } else {
        field.pattern = field._pattern;
      }
      break;
    case ActionType.Value:
      {
        if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
          let result = null;
          if (value?.mode === 'express') {
            const scope = cloneDeep(values);
            try {
              result = evaluate(value.result || value.value, { ...scope, now: () => new Date().toString() });
            } catch (error) {
              if (process.env.NODE_ENV !== 'production') {
                throw error;
              }
            }
          } else if (value?.mode === 'constant') {
            result = value?.value || value;
          } else {
            result = null;
          }
          field._value = field._value || field.value;
          field.value = result === undefined ? field.value : result;
        } else {
          field.value = field._value;
        }
      }
      break;
    default:
      return null;
  }
};
