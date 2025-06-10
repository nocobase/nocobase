/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import {
  CollectionFieldProvider,
  useCollectionField_deprecated,
  useCollection_deprecated,
  useCompile,
  useComponent,
} from '@nocobase/client';
import { Checkbox, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const DeletedField = () => {
  const { t } = useTranslation();
  return <div style={{ color: '#ccc' }}>{t('The field has bee deleted')}</div>;
};
const InternalField: React.FC = (props) => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { uiSchema } = useCollectionField_deprecated();
  const component = useComponent(uiSchema?.['x-component']);
  const compile = useCompile();
  const setFieldProps = (key, value) => {
    field[key] = typeof field[key] === 'undefined' ? value : field[key];
  };

  useEffect(() => {
    if (!uiSchema) {
      return;
    }
    setFieldProps('content', uiSchema['x-content']);
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    // if (!field.validator && uiSchema['x-validator']) {
    //   field.validator = uiSchema['x-validator'];
    // }
    if (fieldSchema['x-disabled'] === true) {
      field.disabled = true;
    }
    if (fieldSchema['x-read-pretty'] === true) {
      field.readPretty = true;
    }
    field.required = true;
    // @ts-ignore
    const originalProps = compile(uiSchema['x-component-props']) || {};
    const componentProps = merge(originalProps, field.componentProps || {});
    field.componentProps = componentProps;
    // field.component = [component, componentProps];
  }, [JSON.stringify(uiSchema)]);
  if (!uiSchema) {
    return null;
  }
  return React.createElement(component, props, props.children);
};

const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export enum BulkEditFormItemValueType {
  RemainsTheSame = 1,
  ChangedTo,
  Clear,
  AddAttach,
}

export const BulkEditField = (props: any) => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const [type, setType] = useState<number>(BulkEditFormItemValueType.RemainsTheSame);
  const [value, setValue] = useState(null);
  const { getField } = useCollection_deprecated();
  const collectionField = getField(fieldSchema.name) || {};
  const { uiSchema } = collectionField;
  useEffect(() => {
    field.value = toFormFieldValue({ [type]: value });
    if (field.required) {
      if (field.value) {
        field.modify();
        field.form.clearErrors(field.address);
      } else if (field.modified) {
        field.form.validate(field.address);
      }
    }
  }, [field, type, value]);

  useEffect(() => {
    field.dataSource = field.dataSource || uiSchema.enum;
    field.data = field.data || {};
    field.data.dataSource = uiSchema.enum;
  }, [uiSchema]);

  useEffect(() => {
    if (field.value === null) {
      setValue(undefined);
    }
  }, [field.value]);

  const typeChangeHandler = (val) => {
    setType(val);
    field.required = val === BulkEditFormItemValueType.ChangedTo;
  };

  const valueChangeHandler = (val) => {
    setValue(val?.target?.value ?? val?.target?.checked ?? val);
  };

  return (
    <Space
      className={css`
        display: flex;
        > .ant-space-item {
          width: 100%;
        }
      `}
    >
      <Select defaultValue={type} value={type} onChange={typeChangeHandler}>
        <Select.Option value={BulkEditFormItemValueType.RemainsTheSame}>{t('Remains the same')}</Select.Option>
        <Select.Option value={BulkEditFormItemValueType.ChangedTo}>{t('Changed to')}</Select.Option>
        <Select.Option value={BulkEditFormItemValueType.Clear}>{t('Clear')}</Select.Option>
        {/* {['subTable', 'linkTo', 'm2m', 'o2m', 'o2o', 'oho', 'obo', 'm2o'].includes(collectionField?.interface) && ( */}
        {/*   <Select.Option value={BulkEditFormItemValueType.AddAttach}>{t('Add attach')}</Select.Option> */}
        {/* )} */}
      </Select>
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface !== 'checkbox' && (
          <CollectionField {...props} value={value} onChange={valueChangeHandler} style={{ minWidth: 150 }} />
        )}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface === 'checkbox' && <Checkbox checked={value} onChange={valueChangeHandler} />}
    </Space>
  );
};

function toFormFieldValue(value: any) {
  if (BulkEditFormItemValueType.Clear in value) {
    return null;
  } else if (BulkEditFormItemValueType.ChangedTo in value) {
    return value[BulkEditFormItemValueType.ChangedTo];
  } else if (BulkEditFormItemValueType.RemainsTheSame in value) {
    return;
  }
}
