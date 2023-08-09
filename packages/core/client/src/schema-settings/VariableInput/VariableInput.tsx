import { Form } from '@formily/core';
import React, { useEffect } from 'react';
import { CollectionFieldOptions } from '../../collection-manager';
import { Variable } from '../../schema-component';
import { useContextAssociationFields, useIsSameOrChildCollection } from './hooks/useContextAssociationFields';
import { useVariableOptions } from './hooks/useVariableOptions';

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
  const variableOptions = useVariableOptions({ collectionField, blockCollectionName, form, record });
  const contextVariable = useContextAssociationFields({ schema, maxDepth: 2, contextCollectionName, collectionField });
  const getIsSameOrChildCollection = useIsSameOrChildCollection();
  const isAllowTableContext = getIsSameOrChildCollection(contextCollectionName, collectionField?.target);

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
      changeOnSelect={isAllowTableContext}
    >
      <RenderSchemaComponent value={value} onChange={onChange} />
    </Variable.Input>
  );
};
