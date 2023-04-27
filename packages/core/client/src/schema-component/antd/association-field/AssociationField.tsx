import { Field } from '@formily/core';
import { merge } from '@formily/shared';
import { concat } from 'lodash';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingOutlined } from '@ant-design/icons';
import { mapProps, mapReadPretty, connect, useField, useFieldSchema } from '@formily/react';
import { Input as AntdInput } from 'antd';

import { SubForm } from './components/SubForm';
import { TableField } from './components/TableField';
import { AssociationSelect } from '../association-select';

import {
  useActionContext,
  useCompile,
  useComponent,
  useFormBlockContext,
  useRecord,
  useCollectionField,
} from '../../../';
import { CollectionFieldProvider } from '../../../collection-manager/CollectionFieldProvider';

const AssociationComs = {
  Select: AssociationSelect,
  SubForm: SubForm,
  SubTable: TableField,
  SubList: SubForm,
};

const InternalAssociationField: any = connect(
  (props: any) => {
    const fieldSchema = useFieldSchema();
    const field = fieldSchema?.['x-component-props']?.['field'];
    const { snapshot } = useActionContext();
    const { objectValue, value, ...others } = props;
    let mode: any = props.multiple ? 'multiple' : props.mode;
    if (mode && !['multiple', 'tags'].includes(mode)) {
      mode = undefined;
    }
    const Com = AssociationComs[props.component || 'Select'];
    return <Com />;
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: { ...props.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
);

export const AssociationField: any = InternalAssociationField as unknown;
