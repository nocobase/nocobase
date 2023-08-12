import { Form } from '@formily/core';
// @ts-ignore
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../collection-manager';
import { Variable, useVariableScope } from '../../schema-component';
import { VariableOption, VariablesContextType } from '../../variables/types';
import { isVariable } from '../../variables/utils/isVariable';
import { useContextAssociationFields } from './hooks/useContextAssociationFields';
import { compatOldVariables, useVariableOptions } from './hooks/useVariableOptions';

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
  onChange: (value: any) => void;
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
  shouldChange?: (value: any) => Promise<boolean>;
  /**
   * 当前所在的区块的 collectionName
   */
  blockCollectionName: string;
  form?: Form;
  /**
   * 当前表单的记录，数据来自数据库
   */
  record?: Record<string, any>;
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
  } = props;
  const { t } = useTranslation();
  const scope = useVariableScope();
  const variableOptions = compatOldVariables(
    useVariableOptions({ collectionField, blockCollectionName, form, record }),
    {
      value,
      collectionName: blockCollectionName,
      t,
    },
  ).concat(scope);
  const contextVariable = useContextAssociationFields({ schema, maxDepth: 2, contextCollectionName, collectionField });

  useEffect(() => {
    if (contextCollectionName) {
      variableOptions.unshift(contextVariable);
    }
  }, []);

  const handleChange = (value: any) => {
    if (!shouldChange) {
      return onChange(value);
    }

    // `shouldChange` 这个函数的运算量比较大，会导致展开变量列表时有明显的卡顿感，在这里加个延迟能有效解决这个问题
    setTimeout(async () => {
      if (await shouldChange(value)) {
        onChange(value);
      }
    });
  };

  return (
    <Variable.Input
      className={className}
      value={value}
      onChange={handleChange}
      scope={variableOptions}
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
  return async (value: any) => {
    if (!isVariable(value) || !variables) {
      return true;
    }
    const collectionFieldOfVariable = await variables.getCollectionField(value, localVariables);

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
