import { Form } from '@formily/core';
// @ts-ignore
import _ from 'lodash';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../collection-manager';
import { Variable, useVariableScope } from '../../schema-component';
import { useValues } from '../../schema-component/antd/filter/useValues';
import { VariableOption, VariablesContextType } from '../../variables/types';
import { isVariable } from '../../variables/utils/isVariable';
import { useContextAssociationFields } from './hooks/useContextAssociationFields';
import { compatOldVariables, useVariableOptions } from './hooks/useVariableOptions';
import { Option } from './type';

interface GetShouldChangeProps {
  collectionField: CollectionFieldOptions;
  variables: VariablesContextType;
  localVariables: VariableOption | VariableOption[];
}

interface RenderSchemaComponentProps {
  value: any;
  onChange: (value: any) => void;
}

type Props = {
  value: any;
  onChange: (value: any, optionPath?: any[]) => void;
  renderSchemaComponent: (props: RenderSchemaComponentProps) => any;
  schema?: any;
  children?: any;
  className?: string;
  style?: React.CSSProperties;
  collectionField: CollectionFieldOptions;
  contextCollectionName?: string;
  /**
   * 根据 `onChange` 的第一个参数，判断是否需要触发 `onChange`
   * @param value `onChange` 的第一个参数
   * @returns 返回为 `true` 时，才会触发 `onChange`
   */
  shouldChange?: (value: any, optionPath?: any[]) => Promise<boolean>;
  /**
   * 当前所在的区块的 collectionName
   */
  blockCollectionName: string;
  form?: Form;
  /**
   * 当前表单的记录，数据来自数据库
   */
  record?: Record<string, any>;
  /**
   * 可以用该方法对内部的 scope 进行筛选和修改
   * @param scope
   * @returns
   */
  returnScope?: (scope: Option[]) => any[];
};

/**
 * 注意：该组件存在以下问题：
 * - 在选中选项的时候该组件不能触发重渲染
 * - 如果触发重渲染可能会导致无法展开子选项列表
 * @param props
 * @returns
 */
export const VariableInput = (props: Props) => {
  const {
    value,
    onChange,
    renderSchemaComponent: RenderSchemaComponent,
    style,
    schema,
    className,
    contextCollectionName,
    collectionField,
    shouldChange,
    blockCollectionName,
    form,
    record,
    returnScope = _.identity,
  } = props;
  const { t } = useTranslation();
  const scope = useVariableScope();
  const { operator, schema: uiSchema = collectionField?.uiSchema } = useValues();

  const variableOptions = compatOldVariables(
    useVariableOptions({ collectionField, blockCollectionName, form, record, operator, uiSchema }),
    {
      value,
      collectionName: blockCollectionName,
      t,
    },
  ).concat(scope);
  const contextVariable = useContextAssociationFields({ schema, maxDepth: 2, contextCollectionName, collectionField });

  if (contextCollectionName && variableOptions.every((item) => item.value !== contextVariable.value)) {
    variableOptions.push(contextVariable);
  }

  const handleChange = useCallback(
    (value: any, optionPath: any[]) => {
      if (!shouldChange) {
        return onChange(value);
      }

      // `shouldChange` 这个函数的运算量比较大，会导致展开变量列表时有明显的卡顿感，在这里加个延迟能有效解决这个问题
      setTimeout(async () => {
        if (await shouldChange(value, optionPath)) {
          onChange(value);
        }
      });
    },
    [onChange, shouldChange],
  );

  return (
    <Variable.Input
      className={className}
      value={value}
      onChange={handleChange}
      scope={returnScope(variableOptions)}
      style={style}
      changeOnSelect
    >
      <RenderSchemaComponent value={value} onChange={onChange} />
    </Variable.Input>
  );
};

/**
 * 通过限制用户的选择，来防止用户选择错误的变量
 */
export const getShouldChange = ({ collectionField, variables, localVariables }: GetShouldChangeProps) => {
  return async (value: any, optionPath: any[]) => {
    if (!isVariable(value) || !variables) {
      return true;
    }

    const lastOption = optionPath[optionPath.length - 1];

    // 点击叶子节点时，必须更新 value
    if (lastOption && _.isEmpty(lastOption.children) && !lastOption.loadChildren) {
      return true;
    }

    const collectionFieldOfVariable = await variables.getCollectionField(value, localVariables);

    // 工作流人工节点的 `自定义表单` 区块，会有这种情况，通过其区块的数据表名称是获取不到字段信息的
    if (!collectionFieldOfVariable && value.includes('$nForm.')) {
      return true;
    }

    // 像 `{{ $use }}` 这种的变量字符串是没有对应的 `collectionField` 的
    if (!collectionFieldOfVariable || !collectionField) {
      return false;
    }

    // `一对一` 和 `一对多` 的不能用于设置默认值，因为其具有唯一性
    if (['o2o', 'o2m', 'oho'].includes(collectionFieldOfVariable.interface)) {
      return false;
    }
    if (!collectionField.target && collectionFieldOfVariable.target) {
      return false;
    }
    if (collectionField.target && !collectionFieldOfVariable.target) {
      return false;
    }
    if (
      collectionField.target &&
      collectionFieldOfVariable.target &&
      collectionField.target !== collectionFieldOfVariable.target
    ) {
      return false;
    }

    return true;
  };
};

export interface FormatVariableScopeParam {
  children: any[];
  disabled: boolean;
  name: string;
  title: string;
}

export interface FormatVariableScopeReturn {
  value: string;
  key: string;
  label: string;
  disabled: boolean;
  children?: any[];
}
