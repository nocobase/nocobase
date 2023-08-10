import { Form } from '@formily/core';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../collection-manager';
import { Variable, useCompile } from '../../schema-component';
import { useContextAssociationFields } from './hooks/useContextAssociationFields';
import { compatOldVariables, useVariableOptions } from './hooks/useVariableOptions';

type Props = {
  value: any;
  onChange: (value: any) => void;
  collectionName: string;
  renderSchemaComponent?: (props: any) => any;
  schema: any;
  operator: any;
  children?: any;
  className?: string;
  style?: React.CSSProperties;
  collectionField?: CollectionFieldOptions;
  contextCollectionName?: string;
  /**
   * 根据 `onChange` 的第一个参数，判断是否需要触发 `onChange`
   * @param value `onChange` 的第一个参数
   * @returns 返回为 `true` 时，才会触发 `onChange`
   */
  shouldChange?: (value: any) => boolean;
  /**
   * 当前所在的区块的 collectionName
   */
  blockCollectionName?: string;
  form?: Form;
  /**
   * 当前表单的记录，数据来自数据库
   */
  record?: Record<string, any>;
};

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
  const compile = useCompile();
  const variableOptions = compatOldVariables(
    useVariableOptions({ collectionField, blockCollectionName, form, record }),
    {
      value,
      collectionName: blockCollectionName,
      t,
      compile,
    },
  );
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
    if (shouldChange(value)) {
      onChange(value);
    }
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
