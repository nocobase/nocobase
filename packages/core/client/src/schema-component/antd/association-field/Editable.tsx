/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import React from 'react';
import { SchemaComponentOptions } from '../../';
import { useAssociationCreateActionProps as useCAP } from '../../../block-provider/hooks';
import { useCollection_deprecated } from '../../../collection-manager';
import { useAssociationFieldModeContext } from './AssociationFieldModeProvider';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { CreateRecordAction } from './components/CreateRecordAction';
import { useAssociationFieldContext } from './hooks';

const EditableAssociationField = (props: any) => {
  const { multiple } = props;
  const field: Field = useField();
  const form = useForm();
  const { options: collectionField, currentMode } = useAssociationFieldContext();
  const { getComponent } = useAssociationFieldModeContext();

  const useCreateActionProps = () => {
    const { onClick } = useCAP();
    const actionField: any = useField();
    const { getPrimaryKey } = useCollection_deprecated();
    const primaryKey = getPrimaryKey();
    return {
      async onClick() {
        await onClick();
        const { data } = actionField.data?.data?.data || {};
        if (data) {
          if (['m2m', 'o2m'].includes(collectionField?.interface) && multiple !== false) {
            const values = form.getValuesIn(field.path) || [];
            if (!values.find((v) => v[primaryKey] === data[primaryKey])) {
              values.push(data);
              form.setValuesIn(field.path, values);
              field.onInput(values);
            }
          } else {
            form.setValuesIn(field.path, data);
            field.onInput(data);
          }
        }
      },
    };
  };

  const Component = getComponent(currentMode);

  return (
    <SchemaComponentOptions scope={{ useCreateActionProps }} components={{ CreateRecordAction }}>
      <Component {...props} />
    </SchemaComponentOptions>
  );
};

export const Editable = observer(
  (props) => {
    return (
      <AssociationFieldProvider>
        <EditableAssociationField {...props} />
      </AssociationFieldProvider>
    );
  },
  { displayName: 'Editable' },
);
