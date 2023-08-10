import { Form } from '@formily/core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  compatOldVariables,
  useVariableOptions,
} from '../../../schema-settings/VariableInput/hooks/useVariableOptions';
import { useCompile } from '../../hooks';
import { Variable } from '../variable';

interface Props {
  value: any;
  onChange: (value: any) => void;
  renderSchemaComponent: () => React.ReactNode;
  collectionField: any;
  blockCollectionName: string;
  form?: Form;
  /**
   * 当前表单的记录，数据来自数据库
   */
  record?: Record<string, any>;
}

export function FilterDynamicComponent(props: Props) {
  const { value, onChange, renderSchemaComponent, collectionField, blockCollectionName, form, record } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const options = compatOldVariables(useVariableOptions({ collectionField, blockCollectionName, form, record }), {
    value,
    collectionName: blockCollectionName,
    t,
    compile,
  });

  return (
    <Variable.Input value={value} onChange={onChange} scope={options}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
