/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input, Select } from 'antd';
import { EventActionSetting } from '../../types';
import { useEvent } from '../../hooks/useEvent';
import React, { useCallback } from 'react';
import { VariableInput } from '../../../schema-settings/VariableInput';
import { getShouldChange } from '../../../schema-settings/VariableInput';
import { CollectionField } from '../../../data-source/collection-field';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { SchemaComponent } from '../../../schema-component';

export const ActionParamValueInput = (props) => {
  const renderSchemaComponent = useCallback(({ value, onChange }): React.JSX.Element => {
    return <Input value={value} onChange={onChange} style={{ minWidth: 100 }} />;
  }, []);

  // const renderSchemaComponent = useCallback(({ value, onChange }): React.JSX.Element => {
  //   console.log('renderSchemaComponent', value, onChange);
  //   return <CollectionField value={value} onChange={onChange} />;
  // }, []);

  return (
    <VariableInput
      {...props}
      // form={form}
      // record={record}
      shouldChange={getShouldChange({
        // collectionField,
        // variables,
        // localVariables,
        // getAllCollectionsInheritChain,
      })}
      renderSchemaComponent={renderSchemaComponent}
      // returnScope={(scope) => {
      //   return uniqBy([...scope, ...variableOptions], 'key');
      // }}
      style={{ minWidth: 200 }}
    />
  );
};
